import { test } from "node:test";
import assert from "node:assert/strict";

import { SIMBOLI } from "../../storyboard/tipi.ts";
import { TRACCIATI } from "./tracciati.ts";

// solo comandi assoluti, cosi' ogni numero (coordinata, o raggio e bandiere di un arco) sta nel riquadro
const COMANDO = /^[MLHVCQAZ]$/;

test("ogni simbolo ha i suoi tracciati, e solo quelli", () => {
  assert.deepEqual(Object.keys(TRACCIATI).sort(), [...SIMBOLI].sort());
  for (const s of SIMBOLI) assert.ok(TRACCIATI[s].length >= 1, s);
});

test("ogni tracciato usa comandi SVG validi con le coordinate nel riquadro 100×100", () => {
  for (const s of SIMBOLI) {
    for (const d of TRACCIATI[s]) {
      const pezzi = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
      assert.equal(pezzi.join(""), d.replace(/[\s,]/g, ""), `${s}: caratteri estranei in «${d}»`);
      assert.match(pezzi[0], /^M$/, `${s}: un tracciato comincia con M`);
      for (const p of pezzi) {
        if (/[A-Za-z]/.test(p)) assert.match(p, COMANDO, `${s}: comando ${p}`);
        else assert.ok(Number(p) >= 0 && Number(p) <= 100, `${s}: coordinata ${p} fuori dal riquadro`);
      }
    }
  }
});
