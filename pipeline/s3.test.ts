import { test } from "node:test";
import assert from "node:assert/strict";

import { argomentiElenco, chiavePresente } from "./s3.ts";

test("chiave presente solo se l'elenco ha la chiave esatta", () => {
  assert.equal(chiavePresente('["video/a.mp4"]\n', "video/a.mp4"), true);
  assert.equal(chiavePresente('["video/a.mp4.tmp"]', "video/a.mp4"), false);
  assert.equal(chiavePresente("null\n", "video/a.mp4"), false);
  assert.equal(chiavePresente("", "video/a.mp4"), false);
});

test("un output che non e' un elenco e' un errore, non un'assenza", () => {
  assert.throws(() => chiavePresente('{"x":1}', "a"), /risposta inattesa/);
  assert.throws(() => chiavePresente("An error occurred", "a"));
});

test("l'elenco chiede il solo prefisso della chiave", () => {
  const a = argomentiElenco("bucket", "video-storico.json");
  assert.equal(a[a.indexOf("--prefix") + 1], "video-storico.json");
  assert.equal(a[a.indexOf("--bucket") + 1], "bucket");
});
