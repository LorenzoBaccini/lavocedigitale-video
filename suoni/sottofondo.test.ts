import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { wav } from "./foley.ts";
import { durataLoop, fileTema, NOMI_TEMI, RMS_DB, SR, sottofondo, TEMI } from "./sottofondo.ts";

const rmsDb = (x: Float64Array) => 10 * Math.log10(x.reduce((a, v) => a + v * v, 0) / x.length);
const generati = Object.fromEntries(NOMI_TEMI.map((nome) => [nome, sottofondo(TEMI[nome])]));

test("il tema del video approvato dura quattro battute a 96 BPM ed e' quello di default", () => {
  assert.equal(durataLoop(TEMI.caldo), 10);
  // impronta del sottofondo.wav del video approvato (windows10): se cambia, cambia l'audio approvato
  assert.equal(createHash("sha256").update(wav(sottofondo())).digest("hex"), "86d04b12d1e24baee3bb7d61cd6cda048d2fc18e8032a220369f6972b5325a8d");
  assert.equal(fileTema("caldo"), "sottofondo");
  assert.equal(fileTema("notturno"), "sottofondo-notturno");
});

for (const nome of NOMI_TEMI) {
  const [s, d] = generati[nome];

  test(`${nome}: quattro battute, stereo, al livello del sottofondo e senza picchi`, () => {
    assert.equal(s.length, Math.round(durataLoop(TEMI[nome]) * SR));
    assert.equal(d.length, s.length);
    assert.ok(Math.abs((rmsDb(s) + rmsDb(d)) / 2 - RMS_DB) < 0.6);
    assert.ok(s.reduce((m, v) => Math.max(m, Math.abs(v)), 0) < 10 ** (-12 / 20), "picco sotto -12 dBFS");
  });

  test(`${nome}: i due canali non sono uguali, c'e' larghezza stereo`, () => {
    let diff = 0;
    for (let i = 0; i < s.length; i += 7) diff += Math.abs(s[i] - d[i]);
    assert.ok(diff > 0);
  });

  test(`${nome}: la fine si attacca all'inizio senza scalino`, () => {
    const passo = s.slice(1, 4000).reduce((m, v, i) => Math.max(m, Math.abs(v - s[i])), 0);
    assert.ok(Math.abs(s[s.length - 1] - s[0]) <= passo * 2);
  });
}

test("i temi non sono lo stesso loop: tempo o tonalita' diversi", () => {
  const firme = NOMI_TEMI.map((n) => `${TEMI[n].bpm}:${TEMI[n].accordi[0].radice}`);
  assert.equal(new Set(firme).size, NOMI_TEMI.length);
});
