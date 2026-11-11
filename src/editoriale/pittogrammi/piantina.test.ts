import { test } from "node:test";
import assert from "node:assert/strict";

import { piantina } from "./piantina.ts";

const tracciati = (p: ReturnType<typeof piantina>) => [...p.strade, ...p.isolati, ...p.fiume];

test("lo stesso seme da' la stessa piantina, due semi diversi due piantine diverse", () => {
  assert.deepEqual(piantina(42), piantina(42));
  assert.notDeepEqual(piantina(42), piantina(43));
  assert.notDeepEqual(piantina(1).isolati, piantina(2_000_000_000).isolati);
});

test("ogni coordinata sta nel riquadro 1000×1000, con soli comandi assoluti M, L, Z", () => {
  for (let seme = 1; seme < 60; seme++) {
    for (const d of tracciati(piantina(seme * 7919))) {
      const pezzi = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
      assert.equal(pezzi[0], "M", d);
      for (const p of pezzi) {
        if (/[A-Za-z]/.test(p)) assert.match(p, /^[MLZ]$/, d);
        else assert.ok(Number(p) >= 0 && Number(p) <= 1000, `seme ${seme}: ${p} fuori dal riquadro`);
      }
    }
  }
});

test("una piantina ha isolati a sufficienza per sembrare un quartiere, e la strada principale", () => {
  for (let seme = 1; seme < 60; seme++) {
    const p = piantina(seme * 104729);
    assert.ok(p.isolati.length >= 14, `seme ${seme}: ${p.isolati.length} isolati`);
    assert.ok(p.strade.length >= 2, `seme ${seme}: ${p.strade.length} strade`);
  }
});

test("su molti semi il fiume a volte c'e' e a volte no", () => {
  const conFiume = Array.from({ length: 40 }, (_, i) => piantina(i * 31 + 5).fiume.length > 0);
  assert.ok(conFiume.some(Boolean) && conFiume.some((x) => !x));
});
