import { test } from "node:test";
import assert from "node:assert/strict";

import type { Variante } from "./variante.ts";
import { ATTIVI, DIMENSIONI, PROFONDITA, scegliVariante, VARIANTE_BASE, varianteDi } from "./variante.ts";

const SLUG = "fascicolo-sanitario-emilia-romagna-nuovo-portale-accesso";
const SLUGS = ["uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", SLUG];

test("senza storico la scelta dipende solo dallo slug ed e' sempre la stessa", () => {
  assert.deepEqual(scegliVariante(SLUG, []), scegliVariante(SLUG, []));
  const diverse = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => JSON.stringify(scegliVariante(`slug-${s}`, []))));
  assert.ok(diverse.size > 1);
  // anche con tutte le dimensioni aperte
  assert.deepEqual(scegliVariante(SLUG, [], DIMENSIONI), scegliVariante(SLUG, [], DIMENSIONI));
});

test("musica, luce e apertura evitano i valori degli ultimi n-1 video", () => {
  const recenti: Partial<Variante>[] = [
    { musica: "caldo", luce: "calda", apertura: "classica" },
    { musica: "chiaro", luce: "sera", apertura: "radente" },
    { musica: "notturno", luce: "mattino", apertura: "alta" },
  ];
  for (const s of SLUGS) {
    const v = scegliVariante(s, recenti);
    assert.equal(v.musica, "notturno", s);
    assert.equal(v.apertura, "alta", s);
    assert.equal(v.luce, "chiara", s);
  }
});

test("stile e gancio evitano gli ultimi 2 video; chiusura, frase finale e durata l'ultimo", () => {
  assert.deepEqual(
    { stile: PROFONDITA.stile, gancio: PROFONDITA.gancio, chiusura: PROFONDITA.chiusura, fraseFinale: PROFONDITA.fraseFinale, durata: PROFONDITA.durata },
    { stile: 2, gancio: 2, chiusura: 1, fraseFinale: 1, durata: 1 },
  );
  const recenti: Partial<Variante>[] = [
    { stile: "notte", gancio: "parola", chiusura: "integrata", fraseFinale: 0, durata: "corta" },
    { stile: "studio", gancio: "diviso", chiusura: "cartolina", fraseFinale: 1, durata: "lunga" },
    { stile: "schermo", gancio: "dettaglio", chiusura: "cartolina", fraseFinale: 2, durata: "media" },
  ];
  const scelte = SLUGS.map((s) => scegliVariante(s, recenti, DIMENSIONI));
  for (const v of scelte) {
    assert.ok(!["notte", "studio"].includes(v.stile));
    assert.ok(!["parola", "diviso"].includes(v.gancio));
    assert.equal(v.chiusura, "cartolina");
    assert.notEqual(v.fraseFinale, 0);
    assert.notEqual(v.durata, "corta");
  }
  // il terzo video indietro non esclude piu': lo stile schermo e la durata lunga tornano possibili
  assert.ok(scelte.some((v) => v.stile === "schermo"));
  assert.ok(scelte.some((v) => v.durata === "lunga"));
});

test("la pipeline sceglie solo i valori attivi: stili, ganci, chiusure e durate non ancora costruiti restano fuori", () => {
  assert.deepEqual(ATTIVI.stile, ["scrivania", "studio", "notte", "schermo"]);
  assert.deepEqual(ATTIVI.gancio, ["scena"]);
  assert.deepEqual(ATTIVI.chiusura, ["cartolina"]);
  assert.deepEqual(ATTIVI.durata, ["media"]);
  assert.deepEqual(ATTIVI.fraseFinale, [2]);
  for (const s of SLUGS) {
    const v = scegliVariante(s, [{ stile: "scrivania", gancio: "scena", chiusura: "cartolina", durata: "media" }]);
    for (const k of Object.keys(ATTIVI) as (keyof Variante)[]) assert.ok(ATTIVI[k].includes(v[k] as never), `${s} ${k}`);
  }
});

test("con meno valori attivi che video esclusi la memoria si accorcia: l'ultimo valore non si ripete mai", () => {
  const due = { ...ATTIVI, stile: ["scrivania", "studio"] as const };
  for (const s of SLUGS) {
    for (const [ultimo, penultimo] of [["studio", "scrivania"], ["scrivania", "studio"], ["studio", "studio"]] as const) {
      assert.notEqual(scegliVariante(s, [{ stile: ultimo }, { stile: penultimo }], due).stile, ultimo, `${s} ${ultimo}`);
    }
  }
  // un solo valore attivo: si ripete invece di fermarsi
  assert.equal(scegliVariante(SLUG, [{ stile: "scrivania" }], { ...ATTIVI, stile: ["scrivania"] }).stile, "scrivania");
});

test("dopo il video approvato nessuna dimensione con piu' valori attivi ripete l'aspetto di base", () => {
  const v = scegliVariante(SLUG, [VARIANTE_BASE]);
  for (const k of Object.keys(DIMENSIONI) as (keyof Variante)[]) if (ATTIVI[k].length > 1) assert.notEqual(v[k], VARIANTE_BASE[k], k);
});

test("voci vecchie senza i campi nuovi non escludono niente, tranne lo stile che vale scrivania", () => {
  // con un solo stile attivo: le voci vuote escluderebbero scrivania, il confronto riguarda le altre dimensioni
  const unoStile = { ...ATTIVI, stile: ["scrivania"] as const };
  assert.deepEqual(scegliVariante(SLUG, [{}, {}], unoStile), scegliVariante(SLUG, [], unoStile));
  assert.notEqual(scegliVariante(SLUG, [{}, {}]).stile, "scrivania");
  for (const s of SLUGS) {
    const vecchia: Partial<Variante> = { musica: "caldo", luce: "calda", apertura: "classica" };
    assert.notEqual(scegliVariante(s, [vecchia], DIMENSIONI).stile, "scrivania", s);
    assert.notEqual(scegliVariante(s, [{ stile: "notte" }, vecchia], DIMENSIONI).stile, "scrivania", s);
    assert.deepEqual(scegliVariante(s, [vecchia], DIMENSIONI), scegliVariante(s, [{ ...vecchia, stile: "scrivania" }], DIMENSIONI));
  }
});

test("le props senza variante o con valori sconosciuti hanno l'aspetto approvato", () => {
  assert.deepEqual(varianteDi(undefined), VARIANTE_BASE);
  assert.deepEqual(varianteDi({ luce: "neon" as never, apertura: "alta" }), { ...VARIANTE_BASE, apertura: "alta" });
  assert.deepEqual(varianteDi({ stile: "notte", durata: "eterna" as never, fraseFinale: 0 }), { ...VARIANTE_BASE, stile: "notte", fraseFinale: 0 });
});

test("la variante di base e' il video di oggi", () => {
  assert.deepEqual(
    { stile: VARIANTE_BASE.stile, gancio: VARIANTE_BASE.gancio, chiusura: VARIANTE_BASE.chiusura, durata: VARIANTE_BASE.durata },
    { stile: "scrivania", gancio: "scena", chiusura: "cartolina", durata: "media" },
  );
});
