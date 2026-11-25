import { test } from "node:test";
import assert from "node:assert/strict";

import { SCALA_MAX, scalaRitmo, suoniRitmo } from "./ritmo.ts";

test("la camera si muove continua: fra due frame vicini la scala cambia di pochissimo, mai uno scatto", () => {
  for (const i of [0, 1, 2, 3]) {
    for (let f = 1; f < 120; f++) {
      const salto = Math.abs(scalaRitmo(f, 120, i) - scalaRitmo(f - 1, 120, i));
      assert.ok(salto < 0.002, `frase ${i}, frame ${f}: ${salto}`);
    }
  }
});

test("le frasi alternano avvicinamento e allontanamento, entro SCALA_MAX", () => {
  assert.ok(scalaRitmo(119, 120, 1) > scalaRitmo(0, 120, 1), "dispari: si avvicina");
  assert.ok(scalaRitmo(119, 120, 2) < scalaRitmo(0, 120, 2), "pari: si allontana");
  for (const i of [0, 1, 2]) for (let f = 0; f < 120; f++) assert.ok(scalaRitmo(f, 120, i) <= SCALA_MAX && scalaRitmo(f, 120, i) >= 1);
  assert.ok(SCALA_MAX <= 1.06);
});

test("il gancio si avvicina", () => {
  assert.ok(scalaRitmo(89, 90, 0) > scalaRitmo(0, 90, 0));
});

test("i suoni del ritmo: colpo sul primo fotogramma, whoosh a ogni stacco, tick sulla chiave; la chiusura niente tick", () => {
  assert.deepEqual(suoniRitmo(0, 12, false), [{ da: 0, suono: "colpo", volume: 0.5 }, { da: 12, suono: "tick", volume: 0.35 }]);
  assert.deepEqual(suoniRitmo(3, 20, false), [{ da: 0, suono: "whoosh", volume: 0.45 }, { da: 20, suono: "tick", volume: 0.35 }]);
  assert.deepEqual(suoniRitmo(5, 20, true), [{ da: 0, suono: "whoosh", volume: 0.45 }]);
});
