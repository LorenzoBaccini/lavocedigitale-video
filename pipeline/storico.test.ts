import { test } from "node:test";
import assert from "node:assert/strict";

import { VARIANTE_BASE } from "../src/editoriale/variante.ts";
import { aggiungi, analizzaStorico, CHIAVE_STORICO, sequenzeRecenti, STORICO_VUOTO } from "./storico.ts";

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
