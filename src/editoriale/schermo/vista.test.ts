import { test } from "node:test";
import assert from "node:assert/strict";

import { onda, posaPuntatore, VIAGGIO } from "./tocco.ts";
import { copri, fraRiprese, punto, rettangolo, vista } from "./vista.ts";

const QUADRO = { x: 0, y: 600, w: 1080, h: 1320 };
const PORTATILE = { w: 2560, h: 1600 };

test("la ripresa mette il punto scelto al centro del riquadro, alla quota chiesta", () => {
  const v = vista(PORTATILE, QUADRO, { u: 1280, v: 800, scala: 1 }, 1300);
  const c = punto(v, 1280, 800);
  assert.equal(c.x, 540);
  assert.equal(c.y, 1300);
});

test("vicino al bordo del disegno la vista si ferma: non si vede mai oltre", () => {
  const s = copri(PORTATILE, QUADRO);
  for (const [u, w] of [[0, 0], [2560, 1600], [2400, 100]]) {
    const v = vista(PORTATILE, QUADRO, { u, v: w, scala: s * 1.3 }, 1000);
    const r = rettangolo(v, { x: 0, y: 0, ...PORTATILE });
    assert.ok(r.x <= QUADRO.x + 1e-9 && r.x + r.w >= QUADRO.x + QUADRO.w - 1e-9, `x ${r.x} ${r.w}`);
    assert.ok(r.y <= QUADRO.y + 1e-9 && r.y + r.h >= QUADRO.y + QUADRO.h - 1e-9, `y ${r.y} ${r.h}`);
  }
});

test("un disegno piu' stretto del riquadro sta al centro", () => {
  const v = vista({ w: 720, h: 1480 }, QUADRO, { u: 0, v: 740, scala: 1.2 });
  assert.equal(v.x, (1080 - 720 * 1.2) / 2);
});

test("lo zoom fra due riprese e' uniforme: a meta' strada la scala e' la media geometrica", () => {
  const m = fraRiprese({ u: 0, v: 0, scala: 1 }, { u: 100, v: 50, scala: 4 }, 0.5);
  assert.deepEqual(m, { u: 50, v: 25, scala: 2 });
});

test("il puntatore parte invisibile, arriva sul bersaglio al tocco, e l'onda si allarga e si spegne", () => {
  const da = { x: 0, y: 0 };
  const a = { x: 100, y: 200 };
  assert.equal(posaPuntatore(40 - VIAGGIO - 10, 40, da, a).opacita, 0);
  const arrivato = posaPuntatore(40, 40, da, a);
  assert.equal(arrivato.x, 100);
  assert.equal(arrivato.y, 200);
  assert.equal(arrivato.premuto, 1);
  assert.equal(onda(39, 40), undefined);
  const prima = onda(42, 40)!;
  const poi = onda(50, 40)!;
  assert.ok(poi.raggio > prima.raggio && poi.opacita < prima.opacita);
});
