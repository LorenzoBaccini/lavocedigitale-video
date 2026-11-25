import { test } from "node:test";
import assert from "node:assert/strict";

import { contrasto, sovrapponi } from "./colore.ts";
import { LUCE_GRIGLIA } from "../griglia/luce.ts";
import { CRONACA, NASTRO, PILLOLA_CRONACA, SIRENA } from "./cronaca.ts";

const { colori, sottotitolo } = CRONACA;

test("il sottotitolo nella pillola si legge (>= 4.5:1), testo e chiave, anche sopra uno schermo chiaro", () => {
  for (const s of [sottotitolo.sulSet, sottotitolo.sulleGrafiche]) {
    assert.ok(s.pillola);
    for (const sotto of ["#ffffff", "#000000", colori.fondo, colori.superficie]) {
      const fondo = sovrapponi(PILLOLA_CRONACA.colore, PILLOLA_CRONACA.alfa, sotto);
      assert.ok(contrasto(s.testo, fondo) >= 4.5, `testo su ${sotto} ${contrasto(s.testo, fondo).toFixed(2)}`);
      assert.ok(contrasto(s.chiave, fondo) >= 4.5, `chiave su ${sotto} ${contrasto(s.chiave, fondo).toFixed(2)}`);
    }
  }
});

test("sulle grafiche ogni colore di testo si legge (>= 3:1) sulla notte viola e sotto la luce della griglia", () => {
  const { testo, tenue, penna, timbro } = colori.inchiostro;
  const illuminato = sovrapponi(colori.accento, LUCE_GRIGLIA, colori.superficie);
  for (const [chi, c] of Object.entries({ testo, tenue, penna, timbro, accentoSuChiaro: colori.accentoSuChiaro })) {
    for (const sotto of [colori.superficie, illuminato]) {
      assert.ok(contrasto(c, sotto) >= 3, `grafiche ${chi} su ${sotto} ${contrasto(c, sotto).toFixed(2)}`);
    }
  }
});

test("sul set testo, tenue e accento si leggono (>= 3:1) sul velo e sul fondo", () => {
  for (const [chi, c] of Object.entries({ testo: colori.testo, tenue: colori.tenue, accento: colori.accento })) {
    for (const sotto of [colori.velo, colori.fondo]) {
      assert.ok(contrasto(c, sotto) >= 3, `set ${chi} su ${sotto} ${contrasto(c, sotto).toFixed(2)}`);
    }
  }
});

test("sopra lo schermo chiaro del set il testo si legge (>= 4.5:1) e il barrato si vede (>= 3:1)", () => {
  for (const sotto of ["#ffffff", "#dcdcdc"]) {
    assert.ok(contrasto(colori.suChiaro, sotto) >= 4.5, `testo su ${sotto}`);
    assert.ok(contrasto(colori.segnoSuChiaro, sotto) >= 3, `barrato su ${sotto} ${contrasto(colori.segnoSuChiaro, sotto).toFixed(2)}`);
  }
});

test("la cronaca: notte viola, nastro giallo come accento, sirena per il pericolo, Archivo, titoli in maiuscolo, nastro in testa", () => {
  assert.equal(CRONACA.set, "notturno");
  assert.equal(CRONACA.grafiche, "griglia");
  assert.equal(colori.accento, NASTRO);
  assert.equal(colori.inchiostro.timbro, SIRENA);
  assert.match(CRONACA.caratteri.titolo, /Archivo Black/);
  assert.equal(CRONACA.maiuscole, true);
  assert.equal(CRONACA.nastro, "CRONACA DIGITALE");
  assert.deepEqual(CRONACA.luciSet, { sinistra: SIRENA, destra: "#7b5cff" });
});
