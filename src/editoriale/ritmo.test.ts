import { test } from "node:test";
import assert from "node:assert/strict";

import { ritmoFrase, SCALA_MAX, scalaRitmo, suoniRitmo, tagliZoom } from "./ritmo.ts";

test("sotto i 60 frame nessun taglio di zoom", () => {
  assert.deepEqual(tagliZoom(45, [0, 10, 20, 30]), []);
  assert.deepEqual(tagliZoom(59, [0, 10, 20, 30]), []);
});

test("il taglio cade sul confine di parola piu' vicino a meta' frase", () => {
  assert.deepEqual(tagliZoom(90, [0, 20, 40, 55, 70]), [40]);
  assert.deepEqual(tagliZoom(100, [0, 20, 52, 70]), [52]);
});

test("il taglio non cade sulla prima parola: una frase di una parola sola non ne ha", () => {
  assert.deepEqual(tagliZoom(90, [0]), []);
});

test("la scala non supera mai SCALA_MAX, gancio compreso", () => {
  for (const i of [0, 1, 2, 3]) {
    for (let f = 0; f < 120; f++) assert.ok(scalaRitmo(f, 120, 30, [40, 80], i) <= SCALA_MAX, `frase ${i}, frame ${f}`);
  }
  assert.ok(SCALA_MAX <= 1.07);
});

test("dopo un taglio la base cambia di colpo; le frasi pari e dispari partono da basi diverse", () => {
  const prima = scalaRitmo(39, 120, 200, [40], 1);
  const dopo = scalaRitmo(40, 120, 200, [40], 1);
  assert.ok(Math.abs(dopo - prima) >= 0.03, `${prima} → ${dopo}`);
  assert.notEqual(scalaRitmo(5, 120, 200, [], 1), scalaRitmo(5, 120, 200, [], 2));
});

test("lo scatto sulla chiave sale subito e si spegne in 10 frame", () => {
  const base = scalaRitmo(29, 120, 30, [], 2);
  assert.ok(scalaRitmo(31, 120, 30, [], 2) > base + 0.02);
  assert.equal(scalaRitmo(41, 120, 30, [], 2), base);
});

test("il gancio avanza piano e senza tagli", () => {
  assert.ok(scalaRitmo(0, 90, 200, [], 0) < scalaRitmo(89, 90, 200, [], 0));
  assert.deepEqual(ritmoFrase({ parole: [{ t: "a", da: 0, a: 10 }, { t: "b", da: 40, a: 50 }], chiave: 1, chiaveFine: 2 }, 120, 0).tagli, []);
});

test("ritmoFrase porta il frame della chiave e i tagli dalle parole dette", () => {
  const voce = { parole: [{ t: "a", da: 0, a: 10 }, { t: "b", da: 30, a: 40 }, { t: "c", da: 50, a: 60 }, { t: "d", da: 80, a: 90 }], chiave: 2, chiaveFine: 3 };
  assert.deepEqual(ritmoFrase(voce, 110, 3), { chiave: 50, tagli: [50] });
});

test("i suoni del ritmo: colpo sul primo fotogramma, whoosh a ogni stacco, tick sulla chiave; la chiusura niente tick", () => {
  assert.deepEqual(suoniRitmo(0, 12, false), [{ da: 0, suono: "colpo", volume: 0.5 }, { da: 12, suono: "tick", volume: 0.35 }]);
  assert.deepEqual(suoniRitmo(3, 20, false), [{ da: 0, suono: "whoosh", volume: 0.45 }, { da: 20, suono: "tick", volume: 0.35 }]);
  assert.deepEqual(suoniRitmo(5, 20, true), [{ da: 0, suono: "whoosh", volume: 0.45 }]);
});
