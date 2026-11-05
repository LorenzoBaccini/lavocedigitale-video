import { test } from "node:test";
import assert from "node:assert/strict";

import { paginaMese } from "./calendario.ts";

test("la pagina di ottobre 2025 parte di mercoledi' e il 14 e' un martedi'", () => {
  const p = paginaMese("2025-10-14");
  assert.equal(p.mese, "ottobre");
  assert.equal(p.anno, 2025);
  assert.deepEqual(p.celle.slice(0, 3), [null, null, 1]);
  assert.equal(p.celle[p.casella], 14);
  assert.equal(p.casella % 7, 1);
  assert.equal(p.celle.length, 35);
});

test("le settimane sono intere: febbraio 2026 parte di domenica e occupa cinque righe", () => {
  const p = paginaMese("2026-02-01");
  assert.equal(p.casella, 6);
  assert.equal(p.celle.length % 7, 0);
  assert.equal(p.celle.filter((c) => c !== null).length, 28);
});

test("un mese che parte di domenica e ne ha 31 occupa sei righe", () => {
  assert.equal(paginaMese("2026-03-31").celle.length, 42);
});
