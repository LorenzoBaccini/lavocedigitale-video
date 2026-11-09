import { test } from "node:test";
import assert from "node:assert/strict";

import { contrasto, sovrapponi } from "./colore.ts";
import { CIANO, LAVAGNA, LUCE_GRIGLIA, NOTTE, PILLOLA } from "./notte.ts";

const { colori, sottotitolo } = NOTTE;

test("il sottotitolo nella pillola si legge (>= 4.5:1), testo e chiave, anche sopra uno schermo chiaro", () => {
  for (const s of [sottotitolo.sulSet, sottotitolo.sulleGrafiche]) {
    assert.ok(s.pillola);
    assert.match(s.carattere ?? "", /Inter/);
    for (const sotto of ["#ffffff", "#000000", colori.fondo, LAVAGNA]) {
      const fondo = sovrapponi(PILLOLA.colore, PILLOLA.alfa, sotto);
      assert.ok(contrasto(s.testo, fondo) >= 4.5, `testo su ${sotto} ${contrasto(s.testo, fondo).toFixed(2)}`);
      assert.ok(contrasto(s.chiave, fondo) >= 4.5, `chiave su ${sotto} ${contrasto(s.chiave, fondo).toFixed(2)}`);
    }
  }
});

// ogni testo sul set e sulle grafiche e' sopra i 34 px: testo grande per WCAG, soglia 3:1
test("sulle grafiche ogni colore di testo si legge (>= 3:1) sul nero e sotto la luce ciano della griglia", () => {
  const { testo, tenue, penna, timbro } = colori.inchiostro;
  const illuminato = sovrapponi(CIANO, LUCE_GRIGLIA, colori.superficie);
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

test("sopra lo schermo chiaro del set testo e barrato si vedono (>= 3:1)", () => {
  for (const sotto of ["#ffffff", "#dcdcdc"]) {
    assert.ok(contrasto(colori.suChiaro, sotto) >= 4.5, `testo su ${sotto}`);
    assert.ok(contrasto(colori.segnoSuChiaro, sotto) >= 3, `barrato su ${sotto} ${contrasto(colori.segnoSuChiaro, sotto).toFixed(2)}`);
  }
});

test("la notte ha il suo set, la griglia, il mono, i titoli centrati e il lampo", () => {
  assert.equal(NOTTE.set, "notturno");
  assert.equal(NOTTE.grafiche, "griglia");
  assert.equal(NOTTE.allineamentoTitoli, "centro");
  assert.equal(NOTTE.transizione, "lampo");
  assert.match(NOTTE.caratteri.titolo, /JetBrains Mono/);
  assert.notEqual(NOTTE.bagliore, "none");
});
