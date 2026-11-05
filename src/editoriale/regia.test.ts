import { test } from "node:test";
import assert from "node:assert/strict";

import { accentiMancanti, conPeso, fase, PAUSA_MAX, pausaPiuLunga } from "./regia.ts";

test("il movimento con peso parte da fermo, sfora appena e si assesta", () => {
  assert.ok(Math.abs(conPeso(0)) < 1e-9);
  assert.ok(Math.abs(conPeso(1) - 1) < 1e-9);
  assert.ok(conPeso(0.02) < 0.01);
  const massimo = Math.max(...Array.from({ length: 101 }, (_, i) => conPeso(i / 100)));
  assert.ok(massimo > 1 && massimo < 1.04, `sforo ${massimo}`);
});

test("la fase va da 0 a 1 e si ferma agli estremi, anche con durata nulla", () => {
  assert.equal(fase(5, 10, 20), 0);
  assert.equal(fase(15, 10, 20), 0.5);
  assert.equal(fase(25, 10, 20), 1);
  assert.equal(fase(9, 10, 10), 0);
  assert.equal(fase(10, 10, 10), 1);
});

test("nessun accento in piu' se i cambiamenti sono abbastanza fitti", () => {
  assert.deepEqual(accentiMancanti([20, 60, 110], 150), []);
});

test("un vuoto troppo lungo si spezza in parti uguali, fine scena compresa", () => {
  assert.deepEqual(accentiMancanti([10], 150), [80]);
  assert.deepEqual(accentiMancanti([10], 180), [67, 123]);
  assert.deepEqual(accentiMancanti([], 200), [67, 133]);
  for (const durata of [80, 150, 240, 400]) {
    const eventi = [12, 30];
    assert.ok(pausaPiuLunga([...eventi, ...accentiMancanti(eventi, durata)], durata) <= PAUSA_MAX, `durata ${durata}`);
  }
});

test("la pausa piu' lunga conta dall'inizio e fino alla fine della scena", () => {
  assert.equal(pausaPiuLunga([30, 50], 100), 50);
  assert.equal(pausaPiuLunga([], 60), 60);
  assert.equal(pausaPiuLunga([-5, 300], 60), 60);
});
