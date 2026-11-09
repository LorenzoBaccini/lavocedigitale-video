import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { caricaFaccia, FACCE } from "./caratteri.ts";

test("ogni carattere dell'elenco sta in public/fonts con la sua licenza OFL", () => {
  for (const f of FACCE) {
    assert.ok(existsSync(`public/fonts/${f.file}`), f.file);
    assert.ok(existsSync(`public/fonts/OFL-${f.famiglia.replace(/ /g, "")}.txt`), f.famiglia);
  }
});

test("il controllo d'impaginazione precarica ogni faccia, corsivi compresi", () => {
  assert.deepEqual(FACCE.map(caricaFaccia), ["900 100px Inter", "700 100px Lora", "italic 700 100px Lora"]);
});
