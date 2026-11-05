import { test } from "node:test";
import assert from "node:assert/strict";

import { blocchiSottotitolo } from "./sottotitoli.ts";
import { testoAschermo } from "./testoAschermo.ts";

test("i numeri in lettere tornano cifre", () => {
  assert.equal(testoAschermo("Ti servono una chiavetta da almeno otto giga, stessa lingua."), "Ti servono una chiavetta da almeno 8 GB, stessa lingua.");
  assert.equal(testoAschermo("Ma dal quattordici ottobre duemilaventicinque niente più aggiornamenti."), "Ma dal 14 ottobre 2025 niente più aggiornamenti.");
  assert.equal(testoAschermo("Hai ancora Windows dieci?"), "Hai ancora Windows 10?");
});

test("giga e gigabyte diventano GB solo dopo un numero", () => {
  assert.equal(testoAschermo("otto giga"), "8 GB");
  assert.equal(testoAschermo("otto gigabyte"), "8 GB");
  assert.equal(testoAschermo("almeno otto Gigabyte, stessa lingua."), "almeno 8 GB, stessa lingua.");
  assert.equal(testoAschermo("tanti giga"), "tanti giga");
  assert.equal(testoAschermo("tanti gigabyte"), "tanti gigabyte");
});

test("la chiusura parlata diventa l'indirizzo scritto", () => {
  assert.equal(testoAschermo("Trovi tutto su la voce digitale punto it, il link è nel post."), "Trovi tutto su lavocedigitale.it, il link è nel post.");
  assert.equal(testoAschermo("La Voce Digitale Punto IT."), "lavocedigitale.it.");
  assert.equal(testoAschermo("della voce digitale punto it"), "della voce digitale punto it");
});

test("le parole quotidiane restano parole", () => {
  assert.equal(testoAschermo("sei in dubbio"), "sei in dubbio");
  assert.equal(testoAschermo("Uno strumento, una chiavetta e zero rischi."), "Uno strumento, una chiavetta e zero rischi.");
});

test("la chiave convertita allo stesso modo si ritrova nel testo a schermo", () => {
  const parole = blocchiSottotitolo(testoAschermo("Ti servono almeno otto gigabyte."), testoAschermo("otto gigabyte"), 60).flatMap((b) => b.parole);
  assert.deepEqual(parole.filter((p) => p.chiave).map((p) => p.t), ["8", "GB."]);
});
