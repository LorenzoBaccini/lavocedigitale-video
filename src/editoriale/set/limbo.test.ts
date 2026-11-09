import { test } from "node:test";
import assert from "node:assert/strict";

import { LIMBO, profiloLimbo } from "./limbo.ts";

test("il limbo va dal pavimento alla parete senza spigoli: z sempre indietro, y sempre su, raccordo continuo", () => {
  const p = profiloLimbo();
  assert.deepEqual(p[0], [LIMBO.davanti, 0]);
  assert.deepEqual(p.at(-1), [LIMBO.piega - LIMBO.raggio, LIMBO.alto]);
  for (let i = 1; i < p.length; i++) {
    assert.ok(p[i][0] <= p[i - 1][0] + 1e-9, `z ${i}`);
    assert.ok(p[i][1] >= p[i - 1][1] - 1e-9, `y ${i}`);
  }
  // il portatile aperto (cerniera a z -1,5, coperchio inclinato all'indietro) non tocca la curva
  assert.ok(LIMBO.piega < -2.2);
});
