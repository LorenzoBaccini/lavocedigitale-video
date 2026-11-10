import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

import type { Storyboard } from "./tipi.ts";
import { erroriVarieta, sequenzaDi, somiglianza, validaStoryboard } from "./valida.ts";

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
  assert.equal(validaStoryboard(fixture("windows10"), "lunga").ok, true);
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
  // le tutte-le-scene hanno 8 frasi e piu' di 72 parole: sono copioni da durata lunga
  const durate = [
    ...["tutte-le-scene", "tutte-le-scene-2", "tutte-le-scene-3"].map((n) => [n, "lunga"] as const),
    ...["rischio-portatile", ...matrice].map((n) => [n, "media"] as const),
  ];
  for (const [nome, durata] of durate) {
    const esito = validaStoryboard(fixture(nome), durata);
    assert.equal(esito.ok, true, `${nome}: ${esito.ok ? "" : esito.errori.join("; ")}`);
  }
});
