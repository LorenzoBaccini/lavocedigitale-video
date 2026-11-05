import { test } from "node:test";
import assert from "node:assert/strict";

import { FOLEY, rumoreBianco, SR, wav } from "./foley.ts";

const dbfs = (x: Float64Array) => 20 * Math.log10(x.reduce((m, v) => Math.max(m, Math.abs(v)), 0));
const rmsDb = (x: Float64Array) => 10 * Math.log10(x.reduce((s, v) => s + v * v, 0) / x.length);

test("lo stesso seme da' lo stesso rumore", () => {
  const a = rumoreBianco(5);
  const b = rumoreBianco(5);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test("ogni foley e' stereo, breve e sotto la voce; nessuno supera il tonfo", () => {
  for (const [nome, genera] of Object.entries(FOLEY)) {
    if (nome === "stanza") continue;
    const [s, d] = genera();
    assert.equal(s.length, d.length, nome);
    assert.ok(s.length / SR < 1, `${nome}: ${s.length / SR} s`);
    const p = Math.max(dbfs(s), dbfs(d));
    assert.ok(p <= -13.9 && p > -31, `${nome}: picco ${p}`);
  }
});

test("il tono di stanza e' a -52 dBFS RMS e chiude il loop senza scalino", () => {
  const [s] = FOLEY.stanza();
  assert.ok(Math.abs(rmsDb(s) + 52) < 0.1, `rms ${rmsDb(s)}`);
  const salto = Math.abs(s[s.length - 1] - s[0]);
  const passo = s.slice(1, 2000).reduce((m, v, i) => Math.max(m, Math.abs(v - s[i])), 0);
  assert.ok(salto <= passo * 3, `salto ${salto}, passo tipico ${passo}`);
});

test("il wav ha la testata RIFF giusta", () => {
  const b = wav([new Float64Array([0, 1]), new Float64Array([0, -1])]);
  assert.equal(b.toString("ascii", 0, 4), "RIFF");
  assert.equal(b.readUInt32LE(24), SR);
  assert.equal(b.readUInt16LE(22), 2);
  assert.equal(b.readInt16LE(44 + 4), 32767);
  assert.equal(b.readInt16LE(44 + 6), -32767);
  assert.equal(b.length, 44 + 8);
});
