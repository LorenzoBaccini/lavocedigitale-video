import { test } from "node:test";
import assert from "node:assert/strict";

import { titoliVisibili } from "./editoriale/piano.ts";
import { bloccoRidondante } from "./ridondanza.ts";

const parole = (testo: string) => testo.split(" ").map((t) => ({ t, chiave: false }));
const blocco = (testo: string) => ({ parole: parole(testo), da: 0, a: 1 });

test("servono parole contigue: una parola presa da un altro testo non basta", () => {
  const titoli = ["Passo 2 di 3", "Crea la chiavetta USB"];
  assert.equal(bloccoRidondante(blocco("chiavetta USB di"), titoli), false);
  assert.equal(bloccoRidondante(blocco("2 di 3."), titoli), true);
  assert.equal(bloccoRidondante(blocco("la chiavetta USB"), titoli), true);
});

test("i testi si leggono uno dopo l'altro, nell'ordine dato", () => {
  assert.equal(bloccoRidondante(blocco("Windows 10, ancora"), ["Windows 10", "ancora tuo?"]), true);
  assert.equal(bloccoRidondante(blocco("ancora Windows 10"), ["Windows 10", "ancora tuo?"]), false);
});

test("maiuscole e punteggiatura non contano", () => {
  assert.equal(bloccoRidondante(blocco("NASCE già, scoperto!"), ["Nasce già", "scoperto"]), true);
});

test("senza testi a schermo non si nasconde niente", () => {
  assert.equal(bloccoRidondante(blocco("il link è nel post."), []), false);
});

test("sono a schermo solo i testi gia' entrati, nell'ordine di lettura", () => {
  const testi = [{ testo: "Ma c'è", da: 10 }, { testo: "un problema", da: 30 }];
  assert.deepEqual(titoliVisibili(testi, 5), []);
  assert.deepEqual(titoliVisibili(testi, 10), ["Ma c'è"]);
  assert.deepEqual(titoliVisibili(testi, 99), ["Ma c'è", "un problema"]);
});
