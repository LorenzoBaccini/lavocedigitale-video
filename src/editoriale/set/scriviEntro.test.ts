import { test } from "node:test";
import assert from "node:assert/strict";

import { scriviEntro } from "./disegni.ts";

// contesto finto: ogni carattere largo mezzo corpo
const contesto = (font: string) => {
  const scritte: { testo: string; font: string }[] = [];
  const ctx = {
    font,
    measureText(t: string) {
      const corpo = Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)![1]);
      return { width: t.length * corpo * 0.5 } as TextMetrics;
    },
    fillText(testo: string) {
      scritte.push({ testo, font: ctx.font });
    },
  };
  return { ctx, scritte };
};

test("una riga che sta resta al suo corpo", () => {
  const { ctx, scritte } = contesto("650 52px Inter");
  assert.equal(scriviEntro(ctx, "Cerca", 0, 0, 500), 52);
  assert.equal(scritte[0].font, "650 52px Inter");
});

test("una riga troppo lunga cala di corpo fin dentro la sua larghezza, poi il font torna com'era", () => {
  const { ctx, scritte } = contesto("650 52px Inter, sans-serif");
  const corpo = scriviEntro(ctx, "Cerca gli aggiornamenti", 0, 0, 500);
  assert.ok(corpo < 52 && 23 * corpo * 0.5 <= 500, `corpo ${corpo}`);
  assert.equal(scritte[0].font, `650 ${corpo}px Inter, sans-serif`);
  assert.equal(ctx.font, "650 52px Inter, sans-serif");
});

test("il corpo non scende sotto il minimo: la riga che non entra e' troncata con «…»", () => {
  const { ctx, scritte } = contesto("650 52px Inter");
  const corpo = scriviEntro(ctx, "Aggiornamentiaggiornamentiaggiornamenti", 0, 0, 300);
  assert.equal(corpo, 34);
  assert.equal(scritte[0].font, "650 34px Inter");
  assert.ok(scritte[0].testo.endsWith("…") && scritte[0].testo.length * 34 * 0.5 <= 300);
  assert.equal(ctx.font, "650 52px Inter");
});
