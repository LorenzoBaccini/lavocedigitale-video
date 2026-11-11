import { test } from "node:test";
import assert from "node:assert/strict";

import { VARIANTE_BASE } from "../src/editoriale/variante.ts";
import type { Storyboard } from "../src/storyboard/tipi.ts";
import { aggiungi, analizzaStorico, CHIAVE_STORICO, riassunto, sequenzeRecenti, STORICO_VUOTO } from "./storico.ts";

test("il file che non esiste ancora e' uno storico vuoto", () => {
  assert.deepEqual(analizzaStorico(null), STORICO_VUOTO);
});

test("un file che non e' uno storico lancia un errore invece di sembrare vuoto", () => {
  assert.throws(() => analizzaStorico("{ rotto"), /non è JSON/);
  assert.throws(() => analizzaStorico("[]"), /mancano recenti o pubblicati/);
  assert.throws(() => analizzaStorico(JSON.stringify({ recenti: [] })), /mancano/);
});

test("le voci malformate si scartano, il resto si tiene", () => {
  const testo = JSON.stringify({
    recenti: [{ slug: "a", data: "2026-11-01", scene: [{ tipo: "gancio" }], variante: VARIANTE_BASE }, { slug: 3 }, { slug: "b", scene: [{}] }],
    pubblicati: ["a", 7, "c"],
  });
  const s = analizzaStorico(testo);
  assert.deepEqual(s.recenti.map((v) => v.slug), ["a"]);
  assert.deepEqual(s.pubblicati, ["a", "c"]);
});

test("aggiungere uno slug gia' presente lo porta in cima senza doppioni", () => {
  const voce = (slug: string) => ({ slug, data: "2026-11-05", scene: [{ tipo: "gancio" }, { tipo: "chiusura" }], variante: VARIANTE_BASE });
  const s = aggiungi(aggiungi(aggiungi(STORICO_VUOTO, voce("a")), voce("b")), voce("a"));
  assert.deepEqual(s.pubblicati, ["a", "b"]);
  assert.deepEqual(s.recenti.map((v) => v.slug), ["a", "b"]);
  assert.deepEqual(sequenzeRecenti(s), [["gancio"], ["gancio"]]);
});

test("lo storico sta fuori dal prefisso video/, che scade dopo 7 giorni", () => {
  assert.ok(!CHIAVE_STORICO.startsWith("video/"));
});

test("una variante rovinata a mano diventa vuota, non fa cadere la lettura", () => {
  const s = analizzaStorico(JSON.stringify({ recenti: [{ slug: "a", data: "x", scene: [{ tipo: "gancio" }], variante: null }], pubblicati: ["a"] }));
  assert.deepEqual(s.recenti[0].variante, {});
});

test("le voci scritte prima degli stili si leggono com'erano: i campi nuovi restano assenti", () => {
  const vecchia = { musica: "caldo", luce: "calda", apertura: "classica" };
  const s = analizzaStorico(JSON.stringify({ recenti: [{ slug: "a", data: "2026-11-06", scene: [{ tipo: "gancio" }], variante: vecchia }], pubblicati: ["a"] }));
  assert.deepEqual(s.recenti[0].variante, vecchia);
});

test("il riassunto porta la variante intera, con stile, gancio, chiusura, frase finale e durata", () => {
  const storyboard = { slug: "a", frasi: [{ testo: "Fine.", chiave: "Fine", scena: { tipo: "chiusura" } }] } as unknown as Storyboard;
  const letto = analizzaStorico(JSON.stringify(aggiungi(STORICO_VUOTO, riassunto(storyboard, VARIANTE_BASE, "2026-11-09"))));
  assert.deepEqual(letto.recenti[0].variante, VARIANTE_BASE);
});

test("l'impronta del video entra nella voce e si rilegge; una rovinata a mano si scarta, la voce resta", () => {
  const storyboard = { slug: "a", frasi: [{ testo: "Fine.", chiave: "Fine", scena: { tipo: "chiusura" } }] } as unknown as Storyboard;
  const impronta = Array(6).fill("0123456789abcdef#a1b2c3");
  const letto = analizzaStorico(JSON.stringify(aggiungi(STORICO_VUOTO, riassunto(storyboard, VARIANTE_BASE, "2026-11-10", impronta))));
  assert.deepEqual(letto.recenti[0].impronta, impronta);
  const rovinata = analizzaStorico(JSON.stringify({ recenti: [{ slug: "b", data: "x", scene: [{ tipo: "gancio" }], variante: {}, impronta: ["zz"] }], pubblicati: ["b"] }));
  assert.equal(rovinata.recenti[0].slug, "b");
  assert.equal("impronta" in rovinata.recenti[0], false);
});

test("senza impronta (controllo saltato) la voce non ha il campo", () => {
  const storyboard = { slug: "a", frasi: [{ testo: "Fine.", chiave: "Fine", scena: { tipo: "chiusura" } }] } as unknown as Storyboard;
  assert.equal("impronta" in riassunto(storyboard, VARIANTE_BASE, "2026-11-10"), false);
});
