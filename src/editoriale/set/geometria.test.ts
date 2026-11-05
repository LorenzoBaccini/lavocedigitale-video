import { test } from "node:test";
import assert from "node:assert/strict";

import { Vector3 } from "three";

import { centroDi, distanzaPer, fraCamere, fraLeQuote, inAsse, sferica, NOTIFICA_PX, proietta, puntoSchermo, rettangoloInQuadro, SCHERMO, SCHERMO_PX, sopraLaQuota, sottoLaQuota } from "./geometria.ts";
import { larga } from "./inquadrature.ts";
import { opzionePx, rettangoloTelefono, sopraIlTelefono, TELEFONO_PX } from "./telefono.ts";

test("in asse con lo schermo, il punto scelto cade centrato alla quota chiesta", () => {
  for (const [d, quota] of [[5, 780], [3.2, 960], [8, 1200]]) {
    const c = proietta(centroDi(NOTIFICA_PX), inAsse(centroDi(NOTIFICA_PX), d, quota));
    assert.ok(Math.abs(c.x - 540) < 1, `x ${c.x}`);
    assert.ok(Math.abs(c.y - quota) < 2, `y ${c.y}`);
  }
});

test("alla distanza calcolata un tratto dello schermo occupa i pixel chiesti", () => {
  const largo = (NOTIFICA_PX.w / SCHERMO_PX.w) * SCHERMO.larghezza;
  const d = distanzaPer(largo, 880);
  const r = rettangoloInQuadro(NOTIFICA_PX, inAsse(centroDi(NOTIFICA_PX), d, 900));
  assert.ok(Math.abs(r.w - 880) < 12, `larghezza ${r.w}`);
});

test("pixel dello schermo e fotogramma vanno nello stesso verso", () => {
  const cam = inAsse(puntoSchermo(1280, 800), 6, 960);
  const a = proietta(puntoSchermo(200, 200), cam);
  const b = proietta(puntoSchermo(2300, 1400), cam);
  assert.ok(a.x < b.x && a.y < b.y);
});

test("fra due camere l'interpolazione parte dalla prima e arriva alla seconda", () => {
  const a = { pos: [0, 0, 10] as [number, number, number], look: [0, 0, 0] as [number, number, number] };
  const b = { pos: [2, 4, 6] as [number, number, number], look: [1, 1, 1] as [number, number, number] };
  assert.deepEqual(fraCamere(a, b, 0), a);
  assert.deepEqual(fraCamere(a, b, 1), b);
  assert.deepEqual(fraCamere(a, b, 0.5).pos, [1, 2, 8]);
});

test("sottoLaQuota alza la camera finche' il bordo alto dello schermo scende sotto il limite, e non la tocca se ci sta", () => {
  const bordo = [puntoSchermo(0, 0), puntoSchermo(SCHERMO_PX.w, 0)];
  const cam = larga("portatile");
  const alto = Math.min(...bordo.map((p) => proietta(p, cam).y));
  assert.deepEqual(sottoLaQuota(cam, bordo, alto - 50), cam);
  const spostata = sottoLaQuota(cam, bordo, alto + 120);
  const nuovo = Math.min(...bordo.map((p) => proietta(p, spostata).y));
  assert.ok(nuovo >= alto + 118 && nuovo < alto + 130, `bordo a ${nuovo}`);
  const basso = [puntoSchermo(0, SCHERMO_PX.h), puntoSchermo(SCHERMO_PX.w, SCHERMO_PX.h)];
  const fondo = Math.max(...basso.map((p) => proietta(p, cam).y));
  const su = sopraLaQuota(cam, basso, fondo - 100);
  const nuovoFondo = Math.max(...basso.map((p) => proietta(p, su).y));
  assert.ok(nuovoFondo <= fondo - 98 && nuovoFondo > fondo - 110, `fondo a ${nuovoFondo}`);
});

test("dall'alto sul telefono la schermata sta dritta: i pulsanti uno sotto l'altro, centrati", () => {
  const cam = sopraIlTelefono(TELEFONO_PX.w / 2, 700, 6, 1.16, 0);
  const [a, b] = [0, 1].map((i) => rettangoloTelefono(opzionePx(i), cam));
  assert.ok(b.y > a.y + a.h * 0.8, "il secondo pulsante e' sotto il primo");
  assert.ok(Math.abs(a.x + a.w / 2 - 540) < 25 && Math.abs(b.x + b.w / 2 - 540) < 25);
});

// La camera del rischio sul portatile, che si allontana: lo schermo deve stare fra sopratitolo e titolo in ogni frame.
test("fra le quote: lo schermo resta nella fascia per tutta la corsa della camera, senza scatti", () => {
  const centro = new Vector3(0.1, 1.35, -0.7);
  const alti = [puntoSchermo(0, 0), puntoSchermo(SCHERMO_PX.w / 2, 0), puntoSchermo(SCHERMO_PX.w, 0)];
  const bassi = [puntoSchermo(0, SCHERMO_PX.h), puntoSchermo(SCHERMO_PX.w / 2, SCHERMO_PX.h), puntoSchermo(SCHERMO_PX.w, SCHERMO_PX.h)];
  for (const [alto, basso] of [[490, 1220], [560, 1120], [700, 1000]]) {
    let prima: number | undefined;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const d = 10.5 + 3 * t;
      const cam = fraLeQuote({ pos: sferica(centro, d, -0.62, 0.17), look: centro.toArray() as [number, number, number] }, alti, bassi, alto, basso);
      const su = Math.min(...alti.map((p) => proietta(p, cam).y));
      const giu = Math.max(...bassi.map((p) => proietta(p, cam).y));
      assert.ok(su >= alto - 2, `fascia ${alto}-${basso}, t ${t.toFixed(2)}: bordo alto ${su}`);
      assert.ok(giu <= basso + 2, `fascia ${alto}-${basso}, t ${t.toFixed(2)}: bordo basso ${giu}`);
      if (prima !== undefined) assert.ok(Math.abs(su - prima) < 40, `salto di ${Math.abs(su - prima)} px a t ${t.toFixed(2)}`);
      prima = su;
    }
  }
});

test("fra le quote: se lo schermo ci sta gia', la camera non arretra", () => {
  const centro = new Vector3(0.1, 1.35, -0.7);
  const cam = { pos: sferica(centro, 30, -0.62, 0.17), look: centro.toArray() as [number, number, number] };
  const alti = [puntoSchermo(0, 0)];
  const bassi = [puntoSchermo(0, SCHERMO_PX.h)];
  const c = fraLeQuote(cam, alti, bassi, 200, 1700);
  const dist = (k: { pos: number[]; look: number[] }) => Math.hypot(...k.pos.map((v, i) => v - k.look[i]));
  assert.ok(Math.abs(dist(c) - dist(cam)) < 1e-9);
});
