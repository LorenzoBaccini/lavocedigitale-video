import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

import { contrasto, sovrapponi } from "./colore.ts";
import { NOTTE } from "./notte.ts";
import { GRIGIO, PILLOLA, SCHEDA, SCHERMO } from "./schermo.ts";
import { studio } from "./studio.ts";

const { colori, sottotitolo } = SCHERMO;

test("il sottotitolo scuro nella pillola bianca si legge (>= 4.5:1), testo e chiave, sopra qualunque fondo", () => {
  for (const s of [sottotitolo.sulSet, sottotitolo.sulleGrafiche]) {
    assert.ok(s.pillola);
    assert.match(s.carattere ?? "", /Inter/);
    for (const sotto of ["#000000", "#ffffff", GRIGIO, "#1b2230"]) {
      const fondo = sovrapponi(PILLOLA.colore, PILLOLA.alfa, sotto);
      assert.ok(contrasto(s.testo, fondo) >= 4.5, `testo su ${sotto} ${contrasto(s.testo, fondo).toFixed(2)}`);
      assert.ok(contrasto(s.chiave, fondo) >= 4.5, `chiave su ${sotto} ${contrasto(s.chiave, fondo).toFixed(2)}`);
    }
  }
});

// ogni testo delle scene e' sopra i 34 px: testo grande per WCAG, soglia 3:1
test("sulle schede e sul grigio ogni colore di testo si legge (>= 3:1), tenue e accenti compresi", () => {
  const { testo, tenue, penna, timbro } = colori.inchiostro;
  for (const [chi, c] of Object.entries({ testo, tenue, penna, timbro, accentoSuChiaro: colori.accentoSuChiaro })) {
    for (const sotto of [SCHEDA, colori.superficie]) {
      assert.ok(contrasto(c, sotto) >= 3, `grafiche ${chi} su ${sotto} ${contrasto(c, sotto).toFixed(2)}`);
    }
  }
  for (const [chi, c] of Object.entries({ testo: colori.testo, tenue: colori.tenue, accento: colori.accento })) {
    for (const sotto of [colori.fondo, colori.velo, colori.superficie]) {
      assert.ok(contrasto(c, sotto) >= 3, `fuori dallo schermo ${chi} su ${sotto} ${contrasto(c, sotto).toFixed(2)}`);
    }
  }
});

test("sopra lo schermo chiaro il testo si legge (>= 4.5:1) e il barrato si vede (>= 3:1)", () => {
  for (const sotto of ["#ffffff", "#f4f2ee", "#dcdcdc"]) {
    assert.ok(contrasto(colori.suChiaro, sotto) >= 4.5, `testo su ${sotto}`);
    assert.ok(contrasto(colori.segnoSuChiaro, sotto) >= 3, `barrato su ${sotto} ${contrasto(colori.segnoSuChiaro, sotto).toFixed(2)}`);
  }
});

test("lo schermo ha la sua resa: niente set 3D, schede, Inter, scorrimento; non coincide con studio ne' con notte", () => {
  assert.equal(SCHERMO.set, "schermo");
  assert.equal(SCHERMO.grafiche, "scheda");
  assert.equal(SCHERMO.transizione, "scorrimento");
  assert.equal(SCHERMO.larghezza, 1);
  assert.equal(SCHERMO.bagliore, "none");
  assert.match(SCHERMO.caratteri.titolo, /Inter/);
  for (const altro of [studio("cobalto"), NOTTE]) {
    assert.notDeepEqual([SCHERMO.allineamentoTitoli, SCHERMO.transizione], [altro.allineamentoTitoli, altro.transizione]);
  }
});

const sorgente = (percorso: string) => readFileSync(new URL(percorso, import.meta.url), "utf8");

test("nessuna scena dello schermo monta il 3D, e ogni scena che usa il set ha la sua resa a tutto quadro", () => {
  const cartella = new URL("../schermo/", import.meta.url);
  for (const file of readdirSync(cartella).filter((f) => /\.tsx?$/.test(f))) {
    const testo = readFileSync(new URL(file, cartella), "utf8");
    assert.doesNotMatch(testo, /from "(@remotion\/three|@react-three\/[^"]+|three)"|set\/(Set3D|Palco|Portatile|Scrivania|oggetti\/Oggetti|oggetti\/Pezzi)"/, file);
  }
  const sulSet = readdirSync(new URL("../../scenes/", import.meta.url))
    .filter((f) => f.endsWith(".tsx") && sorgente(`../../scenes/${f}`).includes("<Set3D"))
    .map((f) => f.replace(".tsx", "").toLowerCase())
    .sort();
  const rese = [...sorgente("../schermo/index.ts").matchAll(/^ {2}(\w+): \w+Schermo,$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(rese, sulSet);
});
