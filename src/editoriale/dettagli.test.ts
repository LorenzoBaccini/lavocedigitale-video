import { test } from "node:test";
import assert from "node:assert/strict";

import { ALFA_ALONE, DETTAGLI_BASE, dettagliDi, FINITURE, NOMI_FINITURE, OGGETTI_SCRIVANIA, oraDi, sfondiBlocco } from "./dettagli.ts";
import { contrasto, sovrapponi } from "./stili/colore.ts";
import { NOTTE } from "./stili/notte.ts";
import { SCHERMO } from "./stili/schermo.ts";
import { SCRIVANIA } from "./stili/scrivania.ts";
import { NOMI_TINTE, studio } from "./stili/studio.ts";

const SLUGS = Array.from({ length: 400 }, (_, i) => `articolo-di-prova-${i}`);
const STILI = [SCRIVANIA, NOTTE, SCHERMO, ...NOMI_TINTE.map(studio)];

const minuti = (ora: string) => {
  const [h, m] = ora.split(":").map(Number);
  return h * 60 + m;
};

test("lo stesso slug e lo stesso stile danno sempre gli stessi dettagli", () => {
  for (const stile of STILI) assert.deepEqual(dettagliDi("fascicolo-sanitario", stile), dettagliDi("fascicolo-sanitario", stile));
});

test("l'ora e' «HH:MM» fra le 07:00 e le 22:59, e le copre tutte e sedici", () => {
  const ore = new Set<string>();
  for (const s of SLUGS) {
    const ora = oraDi(s);
    assert.match(ora, /^\d\d:\d\d$/);
    assert.ok(minuti(ora) >= 7 * 60 && minuti(ora) <= 22 * 60 + 59, ora);
    ore.add(ora.slice(0, 2));
  }
  assert.equal(ore.size, 16);
});

test("su molti slug ogni finitura, sfondo e coppia di oggetti esce in modo ragionevole (fra il 15 e il 35 %, o 23-43 % su tre)", () => {
  const conta = (valori: string[]) => valori.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>());
  const dettagli = SLUGS.map((s) => dettagliDi(s, SCRIVANIA));
  for (const [valori, n] of [
    [dettagli.map((d) => d.finitura), 4],
    [dettagli.map((d) => JSON.stringify(d.sfondo)), 4],
    [dettagli.map((d) => d.oggetti.join("+")), 3],
  ] as const) {
    const c = conta([...valori]);
    assert.equal(c.size, n);
    for (const [v, k] of c) assert.ok(Math.abs(k / SLUGS.length - 1 / n) < 0.1, `${v}: ${k}`);
  }
});

test("le scelte non vanno di pari passo: su molti slug escono tutte le coppie finitura × sfondo × oggetti", () => {
  for (const slugs of [SLUGS, SLUGS.map((_, i) => `matrice-${String(i).padStart(2, "0")}`)]) {
    const coppie = new Set(slugs.map((s) => dettagliDi(s, SCRIVANIA)).map((d) => `${d.finitura}|${JSON.stringify(d.sfondo)}|${d.oggetti.join("+")}`));
    assert.equal(coppie.size, 4 * 4 * 3);
  }
});

test("due slug diversi danno in genere dettagli diversi", () => {
  const diversi = SLUGS.slice(0, 100).filter((s, i) => JSON.stringify(dettagliDi(s, SCRIVANIA)) !== JSON.stringify(dettagliDi(SLUGS[i + 100], SCRIVANIA)));
  assert.ok(diversi.length >= 95, `${diversi.length}`);
});

test("gli oggetti sono sempre due dei tre, nell'ordine fisso; la finitura ha un colore", () => {
  for (const s of SLUGS) {
    const d = dettagliDi(s, SCRIVANIA);
    assert.equal(d.oggetti.length, 2);
    assert.deepEqual(d.oggetti, OGGETTI_SCRIVANIA.filter((o) => d.oggetti.includes(o)));
    assert.match(FINITURE[d.finitura], /^#[0-9a-f]{6}$/);
  }
  assert.equal(NOMI_FINITURE.length, 4);
});

test("lo sfondo viene dalla tavolozza dello stile: stili diversi, sfondi diversi", () => {
  assert.notDeepEqual(sfondiBlocco(SCRIVANIA), sfondiBlocco(NOTTE));
  assert.notDeepEqual(sfondiBlocco(NOTTE), sfondiBlocco(SCHERMO));
  assert.notDeepEqual(sfondiBlocco(studio("cobalto")), sfondiBlocco(studio("terracotta")));
  for (const stile of STILI) assert.equal(new Set(sfondiBlocco(stile).map((f) => JSON.stringify(f))).size, 4);
  for (const s of SLUGS.slice(0, 20)) assert.ok(sfondiBlocco(NOTTE).some((f) => JSON.stringify(f) === JSON.stringify(dettagliDi(s, NOTTE).sfondo)));
});

// l'ora grande (#e8e8ea) e il titolo della notifica (#f3f4f6 sul riquadro bianco al 12 %), al centro dell'alone e sul bordo
test("sopra ogni sfondo di ogni stile il testo bianco della schermata di blocco si legge (>= 4.5:1)", () => {
  for (const stile of STILI) {
    for (const { fondo, alone } of sfondiBlocco(stile)) {
      for (const sotto of [fondo, alone ? sovrapponi(alone, ALFA_ALONE, fondo) : fondo]) {
        assert.ok(contrasto("#e8e8ea", sotto) >= 4.5, `ora su ${sotto} ${contrasto("#e8e8ea", sotto).toFixed(2)}`);
        const riquadro = sovrapponi("#ffffff", 0.12, sotto);
        assert.ok(contrasto("#f3f4f6", riquadro) >= 4.5, `titolo su ${riquadro} ${contrasto("#f3f4f6", riquadro).toFixed(2)}`);
      }
    }
  }
});

test("i dettagli di base sono quelli del video approvato", () => {
  assert.deepEqual(DETTAGLI_BASE, { ora: "10:24", finitura: "grafite", sfondo: { fondo: "#1b2230" }, oggetti: ["taccuino"] });
});
