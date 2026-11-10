import { test } from "node:test";
import assert from "node:assert/strict";

import { inAsse, PIANTA, proietta, puntoSchermo, SCHERMO_PX, TAZZA } from "./geometria.ts";
import { FOGLIE, involucro, sagomaInQuadro, sagomaPianta, sagomaTazza } from "./sagome.ts";

const tazza = sagomaTazza(TAZZA.posizione, TAZZA.raggio, TAZZA.altezza, TAZZA.manico);
const pianta = sagomaPianta(PIANTA.posizione, PIANTA.raggio, PIANTA.vaso);
const centro = puntoSchermo(SCHERMO_PX.w / 2, SCHERMO_PX.h / 2);

test("la sagoma della pianta arriva alla punta della foglia piu' alta, non oltre", () => {
  const alta = Math.max(...FOGLIE.map(([, inclinazione, h]) => PIANTA.vaso + h * Math.cos(inclinazione)));
  const cima = Math.max(...pianta.map((p) => p.y));
  assert.ok(cima >= alta && cima < alta + 0.05, `${cima} contro ${alta}`);
});

test("in asse e vicino allo schermo una tazza dietro il portatile e' nascosta; quella vera, guardata, si vede", () => {
  const dietro = sagomaTazza([1, 0, -3.2], TAZZA.raggio, TAZZA.altezza, TAZZA.manico);
  assert.equal(sagomaInQuadro(dietro, inAsse(centro, 4, 960)), undefined);
  const vista = sagomaInQuadro(tazza, { pos: [-5.2, 6, 10], look: [-5.2, 0.5, 3] });
  assert.ok(vista && vista.length >= 3);
});

test("una sagoma alle spalle della camera non c'e'", () => {
  assert.equal(sagomaInQuadro(pianta, { pos: [-3.8, 2, 4], look: [-3.8, 2, 10] }), undefined);
});

// la pianta a cavallo del bordo sinistro: meta' dentro, meta' fuori
test("la parte fuori quadro si taglia: gli angoli restano dentro il fotogramma, alcuni sul bordo", () => {
  const cam = { pos: [-3, 6, 10] as [number, number, number], look: [-4, 1, -2] as [number, number, number] };
  const intera = involucro(pianta.map((p) => proietta(p, cam)));
  assert.ok(intera.some((a) => a.x < 0), "la sagoma intera esce dal fotogramma");
  const angoli = sagomaInQuadro(pianta, cam);
  assert.ok(angoli && angoli.length >= 3);
  for (const a of angoli) assert.ok(a.x >= -0.01 && a.x <= 1080.01 && a.y >= -0.01 && a.y <= 1920.01, JSON.stringify(a));
  assert.ok(angoli.filter((a) => Math.abs(a.x) < 0.01).length >= 2, "il taglio sul bordo sinistro");
});
