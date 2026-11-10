import { test } from "node:test";
import assert from "node:assert/strict";

import { impronta, improntaMescolata } from "./impronta.ts";

const SLUGS = Array.from({ length: 2000 }, (_, i) => `articolo-sintetico-${i}`);

// quante volte due chiavi dello stesso slug danno lo stesso `% 2`: 0.5 se le scelte sono indipendenti
const accordo = (hash: (t: string) => number, a: string, b: string) => SLUGS.filter((s) => hash(`${s}:${a}`) % 2 === hash(`${s}:${b}`) % 2).length / SLUGS.length;

// le coppie di chiavi che scegliVariante (variante.ts) e cambia (somiglianza.ts) usano sullo stesso slug
const COPPIE = [
  ["stile", "gancio"],
  ["stile", "durata"],
  ["gancio", "chiusura"],
  ["durata", "fraseFinale"],
  ["somiglianza:stile:2", "somiglianza:gancio:2"],
  ["somiglianza:stile:3", "somiglianza:gancio:3"],
];

test("FNV-1a da solo lega le scelte a due valori: e' il difetto che il rimescolamento corregge", () => {
  assert.ok(COPPIE.some(([a, b]) => Math.abs(accordo(impronta, a, b) - 0.5) > 0.4));
});

test("con l'impronta mescolata le scelte a due valori di chiavi diverse sono indipendenti", () => {
  for (const [a, b] of COPPIE) {
    const x = accordo(improntaMescolata, a, b);
    assert.ok(Math.abs(x - 0.5) < 0.05, `${a} e ${b}: stesso valore nel ${(x * 100).toFixed(1)}% degli slug`);
  }
});

test("l'impronta mescolata e' deterministica", () => {
  assert.equal(improntaMescolata("slug:stile"), improntaMescolata("slug:stile"));
  assert.notEqual(improntaMescolata("slug:stile"), impronta("slug:stile"));
});
