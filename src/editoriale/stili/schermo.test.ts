import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

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

// gli import che portano codice (non `import type`), relativi risolti sul file, gli altri come nome del pacchetto
function importi(file: URL): { file: URL[]; pacchetti: string[] } {
  const testo = readFileSync(file, "utf8");
  const nomi = [...testo.matchAll(/^(?:import|export)\s+(?!type\b)(?:[^;]*?\s+from\s+)?"([^"]+)"/gm)].map((m) => m[1]);
  const risolvi = (nome: string) =>
    ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].map((estensione) => new URL(nome.replace(/\.tsx?$/, "") + estensione, file)).find((u) => existsSync(u) && statSync(u).isFile());
  return { file: nomi.filter((n) => n.startsWith(".")).map((n) => risolvi(n)!).filter(Boolean), pacchetti: nomi.filter((n) => !n.startsWith(".")) };
}

// three (la matematica dei vettori) resta raggiungibile: lo usano i piani delle scene, comuni a tutti gli stili
test("le scene dello schermo non raggiungono il 3D nemmeno di riflesso: niente canvas, niente drei, niente set", () => {
  const cartella = new URL("../schermo/", import.meta.url);
  const daVedere = readdirSync(cartella).filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts")).map((f) => new URL(f, cartella));
  const visti = new Set<string>();
  while (daVedere.length) {
    const file = daVedere.pop()!;
    if (visti.has(file.href)) continue;
    visti.add(file.href);
    const { file: altri, pacchetti } = importi(file);
    for (const p of pacchetti) assert.doesNotMatch(p, /^@remotion\/three$|^@react-three\//, `${file.pathname} importa ${p}`);
    daVedere.push(...altri);
  }
  const raggiunti = [...visti].map((h) => new URL(h).pathname);
  assert.ok(raggiunti.some((p) => p.endsWith("/piani/allarme.ts")), "il grafo deve arrivare fino ai piani");
  for (const p of raggiunti) {
    assert.doesNotMatch(p, /\/src\/scenes\/|\/set\/(Set3D|Palco|Rig|Portatile|Scrivania|Fondale|Notturno|Velo)\.tsx$|\/set\/oggetti\/(Oggetti|Pezzi)\.tsx$/, p);
  }
});

test("ogni scena che usa il set ha la sua resa a tutto quadro", () => {
  const sulSet = readdirSync(new URL("../../scenes/", import.meta.url))
    .filter((f) => f.endsWith(".tsx") && sorgente(`../../scenes/${f}`).includes("<Set3D"))
    .map((f) => f.replace(".tsx", "").toLowerCase())
    .sort();
  const rese = [...sorgente("../schermo/index.ts").matchAll(/^ {2}(\w+): \w+Schermo,$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(rese, sulSet);
});
