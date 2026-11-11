import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

import { FRASI_FINALI } from "../editoriale/variante.ts";
import type { Storyboard } from "./tipi.ts";
import type { Scena } from "./tipi.ts";
import { erroriVarieta, massimoSuDispositivo, MASSIMO_ALLARMI, sequenzaDi, somiglianza, suDispositivo, validaStoryboard } from "./valida.ts";

const fixture = (nome: string): Storyboard =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${nome}.storyboard.json`, import.meta.url), "utf8"));

const WINDOWS10 = ["gancio", "allarme", "data", "rischio", "checklist", "oggetto", "data"];

test("la sequenza esclude la chiusura", () => {
  assert.deepEqual(sequenzaDi(fixture("windows10")), WINDOWS10);
});

test("somiglianza: stessi tipi nelle stesse posizioni, sulla sequenza piu' lunga", () => {
  assert.equal(somiglianza(WINDOWS10, WINDOWS10), 1);
  assert.equal(somiglianza(["gancio", "data", "oggetto"], ["gancio", "data", "rischio"]), 2 / 3);
  // la stessa sequenza spostata di un posto non e' uguale posizione per posizione
  assert.equal(somiglianza(["gancio", "a", "b", "c"], ["gancio", "x", "a", "b", "c"]), 1 / 5);
  assert.equal(somiglianza([], []), 1);
});

test("windows10 resta valida e senza storico non ha problemi di varieta'", () => {
  assert.equal(validaStoryboard(fixture("windows10"), "media", 2).ok, true);
  assert.deepEqual(erroriVarieta(fixture("windows10"), []), []);
});

test("rifiuta una sequenza uguale o quasi a uno degli ultimi cinque video", () => {
  const sb = fixture("windows10");
  assert.ok(erroriVarieta(sb, [WINDOWS10]).some((e) => e.startsWith("sequenza: 100%")));
  const quasi = [...WINDOWS10.slice(0, 5), "telefono", "documenti"]; // 5 su 7 = 71%
  assert.ok(erroriVarieta(sb, [quasi]).some((e) => e.startsWith("sequenza: 71%")));
  const diversa = ["gancio", "data", "allarme", "telefono", "documenti", "oggetto"];
  assert.deepEqual(erroriVarieta(sb, [diversa]), []);
});

test("oltre il quinto video recente non si confronta", () => {
  const altri = Array.from({ length: 5 }, () => ["gancio", "numero", "citazione"]);
  assert.deepEqual(erroriVarieta(fixture("windows10"), [...altri, WINDOWS10]), []);
});

test("rifiuta lo stesso tipo due volte di fila, salvo data", () => {
  const sb = fixture("windows10");
  sb.frasi[3].scena = { tipo: "data", etichetta: "Altra data", data: "2026-01-01" };
  assert.deepEqual(erroriVarieta(sb, []).filter((e) => e.includes("di fila")), []);
  sb.frasi[5].scena = { tipo: "checklist", etichetta: "Ancora", voci: [{ grande: "a", piccolo: "b" }, { grande: "c", piccolo: "d" }], oggetto: "nessuno" };
  assert.ok(erroriVarieta(sb, []).includes("frasi[5].scena.tipo: «checklist» due volte di fila; solo «data» può ripetersi"));
});

test("due data di fila con la stessa data si scartano", () => {
  const sb = fixture("windows10");
  const prima = sb.frasi[2].scena;
  assert.equal(prima.tipo, "data");
  sb.frasi[3].scena = { ...prima, etichetta: "Ancora" };
  assert.ok(erroriVarieta(sb, []).includes("frasi[3].scena.data: due «data» di fila con la stessa data"));
});

test("le fixture tutte-le-scene restano valide come storyboard", () => {
  const matrice = readdirSync(new URL("../../fixtures/", import.meta.url)).filter((f) => /^matrice-\d+\.storyboard\.json$/.test(f)).map((f) => f.replace(".storyboard.json", ""));
  assert.ok(matrice.length >= 10, "le fixture della matrice ci sono");
  for (const nome of ["tutte-le-scene", "tutte-le-scene-2", "tutte-le-scene-3", "rischio-portatile", "ganci-lunghi", ...matrice]) {
    for (const fraseFinale of FRASI_FINALI) {
      const esito = validaStoryboard(fixture(nome), "media", fraseFinale);
      assert.equal(esito.ok, true, `${nome} ${fraseFinale}: ${esito.ok ? "" : esito.errori.join("; ")}`);
    }
  }
});

const storyboardDi = (scene: Scena[]): Storyboard => ({
  slug: "prova",
  frasi: [...scene, { tipo: "chiusura" } as Scena].map((scena) => ({ testo: "x", chiave: "x", scena })),
});
const GANCIO: Scena = { tipo: "gancio", titolo: "t", evidenza: "e", sottotitolo: "s", oggetto: "nessuno" };
const ALLARME: Scena = { tipo: "allarme", sopra: "s", titolo: "t" };
const RISCHIO: Scena = { tipo: "rischio", sopra: "s", titolo: "t" };
const OGGETTO = (oggetto: "smartphone" | "carta"): Scena => ({ tipo: "oggetto", etichetta: "e", titolo: "t", oggetto });
const NUMERO: Scena = { tipo: "numero", etichetta: "e", numero: "1" };
const CITAZIONE: Scena = { tipo: "citazione", testo: "t", fonte: "f" };
const CONFRONTO: Scena = { tipo: "confronto", etichetta: "e", a: { titolo: "a", valore: "1" }, b: { titolo: "b", valore: "2" } };

test("un solo allarme per video", () => {
  assert.equal(MASSIMO_ALLARMI, 1);
  const due = storyboardDi([GANCIO, ALLARME, NUMERO, ALLARME, CITAZIONE, CONFRONTO]);
  const errori = erroriVarieta(due, []).filter((e) => e.includes("«allarme»"));
  assert.equal(errori.length, 1);
  assert.ok(errori[0].includes("al massimo 1"), errori[0]);
  const uno = storyboardDi([GANCIO, ALLARME, NUMERO, CITAZIONE, CONFRONTO, NUMERO]);
  assert.deepEqual(erroriVarieta(uno, []).filter((e) => e.includes("«allarme»")), []);
});

test("al massimo meta' delle scene, chiusura esclusa, su un dispositivo", () => {
  assert.equal(massimoSuDispositivo(6), 3);
  assert.equal(massimoSuDispositivo(7), 4);
  assert.equal(massimoSuDispositivo(3), 2);
  const quattro = storyboardDi([GANCIO, ALLARME, NUMERO, RISCHIO, CITAZIONE, OGGETTO("smartphone")]);
  const errori = erroriVarieta(quattro, []).filter((e) => e.includes("su un dispositivo"));
  assert.equal(errori.length, 1);
  assert.ok(errori[0].includes("al massimo 3") && errori[0].includes("4 scene"), errori[0]);
  const tre = storyboardDi([GANCIO, ALLARME, NUMERO, RISCHIO, CITAZIONE, OGGETTO("carta")]);
  assert.deepEqual(erroriVarieta(tre, []).filter((e) => e.includes("su un dispositivo")), []);
});

test("suDispositivo: gancio, allarme, rischio, telefono e oggetto su portatile o smartphone", () => {
  const portatile: Scena = { ...OGGETTO("carta"), oggetto: "portatile" } as Scena;
  const si: Scena[] = [GANCIO, ALLARME, RISCHIO, { tipo: "telefono", etichetta: "e", titolo: "t", opzioni: ["a", "b"] }, OGGETTO("smartphone"), portatile];
  for (const s of si) assert.equal(suDispositivo(s), true, s.tipo);
  const no: Scena[] = [
    OGGETTO("carta"), NUMERO, CITAZIONE, CONFRONTO, { tipo: "data", etichetta: "e", data: "2026-01-01" },
    { tipo: "checklist", etichetta: "e", voci: [], oggetto: "nessuno" }, { tipo: "documenti", etichetta: "e", titolo: "t", pezzi: [] },
    { tipo: "teaser", testo: "t" }, { tipo: "chiusura" },
  ];
  for (const s of no) assert.equal(suDispositivo(s), false, s.tipo);
});
