import { test } from "node:test";
import assert from "node:assert/strict";

import { contrasto, mescola, sovrapponi } from "./colore.ts";
import { NOMI_TINTE, PILLOLA, studio, TINTE, tintaDi } from "./studio.ts";

test("contrasto WCAG: bianco su nero 21, un colore con se stesso 1", () => {
  assert.equal(Math.round(contrasto("#ffffff", "#000000")), 21);
  assert.equal(contrasto("#2f4ba0", "#2f4ba0"), 1);
  assert.equal(mescola("#000000", "#ffffff", 0.5), "#808080");
});

test("la tinta dipende solo dallo slug e le usa tutte", () => {
  assert.equal(tintaDi("un-articolo"), tintaDi("un-articolo"));
  const viste = new Set(Array.from({ length: 200 }, (_, i) => tintaDi(`articolo-${i}`)));
  assert.deepEqual([...viste].sort(), [...NOMI_TINTE].sort());
});

test("il sottotitolo nella pillola si legge (>= 4.5:1), testo e chiave, sopra qualunque fondo", () => {
  for (const nome of NOMI_TINTE) {
    const { sulSet, sulleGrafiche } = studio(nome).sottotitolo;
    for (const s of [sulSet, sulleGrafiche]) {
      assert.ok(s.pillola, nome);
      // la pillola e' quasi opaca: il caso peggiore e' sopra una pagina bianca dello schermo
      for (const sotto of ["#ffffff", "#000000", TINTE[nome].fondo]) {
        const fondo = sovrapponi(PILLOLA.colore, PILLOLA.alfa, sotto);
        assert.ok(contrasto(s.testo, fondo) >= 4.5, `${nome} testo su ${sotto}`);
        assert.ok(contrasto(s.chiave, fondo) >= 4.5, `${nome} chiave su ${sotto}`);
      }
    }
  }
});

// ogni testo sul set e sui poster e' sopra i 34 px: testo grande per WCAG, soglia 3:1
test("sul poster e sul fondale l'inchiostro e l'accento si leggono (>= 3:1, testo grande)", () => {
  for (const nome of NOMI_TINTE) {
    const { colori } = studio(nome);
    assert.ok(contrasto(colori.inchiostro.testo, colori.superficie) >= 3, `${nome} inchiostro`);
    assert.ok(contrasto(colori.testo, colori.velo) >= 3, `${nome} testo sul velo`);
    assert.ok(contrasto(colori.accento, colori.velo) >= 3, `${nome} accento sul velo`);
    assert.ok(contrasto(colori.accento, colori.superficie) >= 3, `${nome} accento`);
  }
});

test("lo studio ha il suo set, i poster, i titoli a sinistra e la spinta", () => {
  const s = studio("cobalto");
  assert.equal(s.set, "fondale");
  assert.equal(s.grafiche, "poster");
  assert.equal(s.allineamentoTitoli, "sinistra");
  assert.equal(s.transizione, "spinta");
  assert.match(s.caratteri.titolo, /Space Grotesk/);
});
