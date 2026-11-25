import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { Storyboard } from "../src/storyboard/tipi.ts";
import { xPostLength } from "./canali/testo-x.ts";
import { buildVideoPost } from "./post-video.ts";

const storyboard = JSON.parse(readFileSync(new URL("../fixtures/veloce.storyboard.json", import.meta.url), "utf8")) as Storyboard;
const SLUG = "installare-windows-10-usb-dopo-fine-supporto";
const URL_ARTICOLO = `https://lavocedigitale.it/software/${SLUG}`;
const articolo = {
  titolo: "Installare Windows 10 da USB dopo la fine del supporto",
  url: URL_ARTICOLO,
  tags: ["windows-10", "usb", "sicurezza"],
};

test("il post apre con il gancio in forma scritta, poi la domanda finale e gli hashtag; il link va nel primo commento", () => {
  const { testo, commento } = buildVideoPost(articolo, storyboard);
  const [gancio, domanda, tag] = testo.split("\n\n");
  assert.equal(gancio, "Reinstallare Windows 10 oggi ha una trappola.");
  assert.equal(domanda, "Tu lo reinstalleresti o lo terresti com'è?");
  assert.equal(tag, "#windows10 #usb #sicurezza");
  assert.ok(!testo.includes("https://"));
  assert.ok(commento.endsWith(URL_ARTICOLO));
});

test("il post del video non apre con il titolo, come fa il post dell'articolo", () => {
  assert.ok(!buildVideoPost(articolo, storyboard).testo.startsWith(articolo.titolo));
});

const conGancio = (n: number): Storyboard => ({ ...storyboard, frasi: [{ ...storyboard.frasi[0], testo: `${"parola ".repeat(n)}finale.` }, ...storyboard.frasi.slice(1)] });

test("sta nei 280 caratteri di X: prima via gli hashtag, poi la domanda, poi si accorcia il gancio", () => {
  const senzaTag = buildVideoPost(articolo, conGancio(30)).testo;
  assert.ok(xPostLength(senzaTag) <= 280);
  assert.ok(!senzaTag.includes("#"));
  assert.ok(senzaTag.includes("com'è?"), "la domanda resta finche' ci sta");
  const senzaDomanda = buildVideoPost(articolo, conGancio(37)).testo;
  assert.ok(xPostLength(senzaDomanda) <= 280);
  assert.ok(!senzaDomanda.includes("com'è?"));
  const tagliata = buildVideoPost(articolo, conGancio(60)).testo;
  assert.ok(xPostLength(tagliata) <= 280);
  assert.ok(tagliata.endsWith("…"));
});
