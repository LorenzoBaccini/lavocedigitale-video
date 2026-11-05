import { test } from "node:test";
import assert from "node:assert/strict";

import type { Variante } from "./variante.ts";
import { DIMENSIONI, scegliVariante, VARIANTE_BASE, varianteDi } from "./variante.ts";

const SLUG = "fascicolo-sanitario-emilia-romagna-nuovo-portale-accesso";

test("senza storico la scelta dipende solo dallo slug ed e' sempre la stessa", () => {
  assert.deepEqual(scegliVariante(SLUG, []), scegliVariante(SLUG, []));
  const diverse = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => JSON.stringify(scegliVariante(`slug-${s}`, []))));
  assert.ok(diverse.size > 1);
});

test("ogni dimensione evita i valori degli ultimi n-1 video", () => {
  const recenti: Variante[] = [
    { musica: "caldo", luce: "calda", apertura: "classica" },
    { musica: "chiaro", luce: "sera", apertura: "radente" },
    { musica: "notturno", luce: "mattino", apertura: "alta" },
  ];
  for (const s of ["uno", "due", "tre", "quattro", SLUG]) {
    const v = scegliVariante(s, recenti);
    assert.equal(v.musica, "notturno", s);
    assert.equal(v.apertura, "alta", s);
    assert.equal(v.luce, "chiara", s);
  }
});

test("dopo il video approvato nessuna dimensione ripete l'aspetto di base", () => {
  const v = scegliVariante(SLUG, [VARIANTE_BASE]);
  for (const k of Object.keys(DIMENSIONI) as (keyof Variante)[]) assert.notEqual(v[k], VARIANTE_BASE[k], k);
});

test("voci vecchie senza variante non escludono niente", () => {
  assert.deepEqual(scegliVariante(SLUG, [{}, {}]), scegliVariante(SLUG, []));
});

test("le props senza variante o con valori sconosciuti hanno l'aspetto approvato", () => {
  assert.deepEqual(varianteDi(undefined), VARIANTE_BASE);
  assert.deepEqual(varianteDi({ luce: "neon" as never, apertura: "alta" }), { ...VARIANTE_BASE, apertura: "alta" });
});
