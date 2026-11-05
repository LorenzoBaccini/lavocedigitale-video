import { test } from "node:test";
import assert from "node:assert/strict";

import { inviluppo } from "./inviluppo.ts";

const SR = 300; // 10 campioni a frame a 30 fps

test("un valore per frame, normalizzato sul picco", () => {
  const parlato = [...Array(10).fill(0.5), ...Array(10).fill(-0.5).map((v, i) => (i % 2 ? -v : v)), ...Array(10).fill(0)];
  // media tolta: il primo frame ha +0,5 costante meno la media 1/6
  const v = inviluppo(parlato, SR, 0, 30);
  assert.equal(v.length, 3);
  assert.equal(Math.max(...v), 1);
  v.forEach((x) => assert.ok(x >= 0 && x <= 1));
});

test("la coda di silenzio resta a zero anche con un offset nel parlato", () => {
  const v = inviluppo(Array(20).fill(0.3).map((x, i) => x + (i % 2 ? 0.1 : -0.1)), SR, 10, 30);
  assert.deepEqual(v, [1, 1, 0]);
});

test("l'ultimo frame incompleto conta", () => {
  assert.equal(inviluppo(Array(25).fill(0).map((_, i) => (i % 2 ? 1 : -1)), SR, 0, 30).length, 3);
});

test("una clip costante resta tutta a zero", () => {
  assert.deepEqual(inviluppo(Array(20).fill(0.7), SR, 0, 30), [0, 0]);
});

test("una clip vuota non ha frame", () => {
  assert.deepEqual(inviluppo([], SR, 0, 30), []);
});
