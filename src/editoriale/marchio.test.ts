import { test } from "node:test";
import assert from "node:assert/strict";

import { contrasto } from "./stili/colore.ts";
import { NOTTE } from "./stili/notte.ts";
import { SCHERMO } from "./stili/schermo.ts";
import { SCRIVANIA } from "./stili/scrivania.ts";
import { NOMI_TINTE, studio } from "./stili/studio.ts";
import { GANCI_TESTO } from "./variante.ts";
import { ETICHETTE_GANCIO, inchiostroSu } from "./marchio.ts";

test("ogni famiglia di gancio ha la sua etichetta di rubrica, corta e in maiuscolo", () => {
  for (const g of GANCI_TESTO) {
    const e = ETICHETTE_GANCIO[g];
    assert.ok(e && e.length <= 18, `${g}: ${e}`);
    assert.equal(e, e.toLocaleUpperCase("it"));
  }
  assert.equal(new Set(Object.values(ETICHETTE_GANCIO)).size, GANCI_TESTO.length, "etichette tutte diverse");
});

test("la parola chiave nella pillola dell'accento si legge in ogni stile", () => {
  const stili = { scrivania: SCRIVANIA, notte: NOTTE, schermo: SCHERMO, ...Object.fromEntries(NOMI_TINTE.map((t) => [`studio ${t}`, studio(t)])) };
  for (const [nome, stile] of Object.entries(stili)) {
    const fondo = stile.colori.accento;
    assert.ok(contrasto(inchiostroSu(fondo), fondo) >= 4.5, `${nome}: ${fondo}`);
  }
});
