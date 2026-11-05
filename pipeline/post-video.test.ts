import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { Storyboard } from "../src/storyboard/tipi.ts";
import { xPostLength } from "./canali/testo-x.ts";
import { buildVideoPost } from "./post-video.ts";

const storyboard = JSON.parse(readFileSync(new URL("../fixtures/windows10.storyboard.json", import.meta.url), "utf8")) as Storyboard;
const SLUG = "installare-windows-10-usb-dopo-fine-supporto";
const URL_ARTICOLO = `https://lavocedigitale.it/software/${SLUG}`;
const articolo = {
  titolo: "Installare Windows 10 da USB dopo la fine del supporto",
  url: URL_ARTICOLO,
  tags: ["windows-10", "usb", "sicurezza"],
};

test("il post del video apre con la domanda del gancio in forma scritta, poi link e hashtag", () => {
  const post = buildVideoPost(articolo, storyboard);
  const [domanda, url, tag] = post.split("\n\n");
  assert.equal(url, URL_ARTICOLO);
  assert.equal(tag, "#windows10 #usb #sicurezza");
  assert.ok(domanda.endsWith("?"), domanda);
  assert.match(domanda, /Windows 10/);
  assert.doesNotMatch(domanda, /dieci/);
});

test("il post del video non apre con il titolo, come fa il post dell'articolo", () => {
  assert.ok(!buildVideoPost(articolo, storyboard).startsWith(articolo.titolo));
});

test("sta nei 280 caratteri di X: prima via gli hashtag, poi si accorcia la domanda", () => {
  const lunga = (n: number): Storyboard => ({ ...storyboard, frasi: [{ ...storyboard.frasi[0], testo: `${"parola ".repeat(n)}finale?` }, ...storyboard.frasi.slice(1)] });
  const senzaTag = buildVideoPost(articolo, lunga(34));
  assert.ok(xPostLength(senzaTag) <= 280);
  assert.ok(!senzaTag.includes("#"));
  assert.ok(senzaTag.endsWith(URL_ARTICOLO));
  const tagliata = buildVideoPost(articolo, lunga(60));
  assert.ok(xPostLength(tagliata) <= 280);
  assert.match(tagliata, /…\n\nhttps:/);
});
