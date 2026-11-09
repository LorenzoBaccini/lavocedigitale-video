import { test } from "node:test";
import assert from "node:assert/strict";

import { DURATA_SPINTA, frameScena, scartoSpinta } from "./transizione.ts";

const W = 1080;

test("la scena entra da destra, sta ferma, esce a sinistra", () => {
  assert.equal(scartoSpinta(0, 90, W, true, true), W);
  assert.equal(scartoSpinta(DURATA_SPINTA, 90, W, true, true), 0);
  assert.equal(scartoSpinta(45, 90, W, true, true), 0);
  assert.equal(scartoSpinta(90 + DURATA_SPINTA, 90, W, true, true), -W);
});

test("uscente ed entrante restano attaccate per tutta la spinta", () => {
  for (let k = 0; k <= DURATA_SPINTA; k++) {
    const uscente = scartoSpinta(90 + k, 90, W, true, true);
    const entrante = scartoSpinta(k, 60, W, true, true);
    assert.ok(Math.abs(entrante - uscente - W) < 1e-9, `frame ${k}`);
  }
});

test("la prima scena non entra, l'ultima non esce", () => {
  assert.equal(scartoSpinta(0, 90, W, false, true), 0);
  assert.equal(scartoSpinta(95, 90, W, true, false), 0);
});

test("la scena uscente non va oltre il suo ultimo frame", () => {
  assert.equal(frameScena(45, 90), 45);
  assert.equal(frameScena(89, 90), 89);
  for (let k = 0; k < DURATA_SPINTA; k++) assert.equal(frameScena(90 + k, 90), 89);
});
