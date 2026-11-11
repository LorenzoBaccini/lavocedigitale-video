import { test } from "node:test";
import assert from "node:assert/strict";

import { avanzamento, cerchiatura, freccia, lunghezza, percorso, riquadro, sottolineatura, spunta } from "./tratto.ts";

test("lo stesso seme da' lo stesso segno, un seme diverso un altro", () => {
  assert.deepEqual(sottolineatura(200, 3), sottolineatura(200, 3));
  assert.notDeepEqual(sottolineatura(200, 3), sottolineatura(200, 4));
});

test("la sottolineatura copre la parola e sborda poco, senza scostarsi dalla riga", () => {
  const punti = sottolineatura(300, 9);
  const xs = punti.map((p) => p[0]);
  assert.ok(Math.min(...xs) < 0 && Math.min(...xs) > -15);
  assert.ok(Math.max(...xs) > 300 && Math.max(...xs) < 315);
  assert.ok(punti.every((p) => Math.abs(p[1]) < 10));
});

test("la cerchiatura gira piu' di un giro intorno al centro e chiude scavalcando l'inizio", () => {
  const punti = cerchiatura(100, 50, 80, 30, 5);
  let angolo = 0;
  for (let i = 1; i < punti.length; i++) {
    const a0 = Math.atan2(punti[i - 1][1] - 50, punti[i - 1][0] - 100);
    const a1 = Math.atan2(punti[i][1] - 50, punti[i][0] - 100);
    angolo += Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
  }
  assert.ok(angolo > Math.PI * 2 && angolo < Math.PI * 2.5, `angolo ${angolo}`);
  punti.forEach(([x, y]) => assert.ok(((x - 100) / 80) ** 2 + ((y - 50) / 30) ** 2 < 1.4));
});

test("la spunta scende, tocca il fondo e risale oltre il quadrato", () => {
  const punti = spunta(100, 200, 60, 3);
  const basso = punti.reduce((i, p, k) => (p[1] > punti[i][1] ? k : i), 0);
  assert.ok(basso > 0 && basso < punti.length / 2, `fondo all'indice ${basso}`);
  assert.ok(punti[0][1] < punti[basso][1]);
  const fine = punti[punti.length - 1];
  assert.ok(fine[0] > 160 && fine[1] < 200, JSON.stringify(fine));
  assert.deepEqual(spunta(100, 200, 60, 3), punti);
});

test("lunghezza e percorso della polilinea", () => {
  assert.equal(lunghezza([[0, 0], [3, 4], [3, 10]]), 11);
  assert.equal(percorso([[0, 0], [3.25, 4]]), "M0.0 0.0 L3.3 4.0");
});

test("la mano parte decisa e rallenta: il tracciato va da 0 a 1 senza tornare indietro", () => {
  assert.equal(avanzamento(9, 10, 8), 0);
  assert.equal(avanzamento(18, 10, 8), 1);
  assert.ok(avanzamento(12, 10, 8) > 0.25 * 1.5);
  for (let f = 10; f < 18; f++) assert.ok(avanzamento(f + 1, 10, 8) >= avanzamento(f, 10, 8));
});

test("il riquadro gira intorno al rettangolo, a mano, e chiude scavalcando l'inizio", () => {
  const punti = riquadro(300, 120, 4);
  assert.deepEqual(riquadro(300, 120, 4), punti);
  assert.notDeepEqual(riquadro(300, 120, 5), punti);
  punti.forEach(([x, y]) => assert.ok(x > -12 && x < 312 && y > -12 && y < 132, `${x},${y}`));
  assert.ok(punti.some(([, y]) => y < 6) && punti.some(([, y]) => y > 114) && punti.some(([x]) => x < 6) && punti.some(([x]) => x > 294));
  assert.ok(lunghezza(punti) > 2 * (300 + 120));
  const [x0, y0] = punti[0];
  const [x1, y1] = punti[punti.length - 1];
  assert.ok(Math.hypot(x1 - x0, y1 - y0) > 3);
});

test("la freccia ha asta e punta: parte da a, arriva in z e le due alette tornano indietro", () => {
  const punti = freccia({ x: 100, y: 0 }, { x: 100, y: 120 }, 3);
  assert.ok(Math.hypot(punti[0][0] - 100, punti[0][1]) < 6);
  const vicino = (p: number[]) => Math.hypot(p[0] - 100, p[1] - 120);
  const punta = punti.reduce((i, p, k) => (vicino(p) < vicino(punti[i]) ? k : i), 0);
  assert.ok(vicino(punti[punta]) < 6);
  const dopo = punti.slice(punta + 1);
  assert.ok(dopo.length > 2);
  assert.ok(dopo.some(([x]) => x < 90) && dopo.some(([x]) => x > 110));
  assert.ok(dopo.every(([, y]) => y < 120 + 6));
  assert.deepEqual(freccia({ x: 100, y: 0 }, { x: 100, y: 120 }, 3), punti);
});
