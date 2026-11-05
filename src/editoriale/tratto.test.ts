import { test } from "node:test";
import assert from "node:assert/strict";

import { avanzamento, cerchiatura, lunghezza, percorso, sottolineatura, spunta } from "./tratto.ts";

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
