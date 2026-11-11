import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScenaDi } from "../../scenes/props.ts";
import type { FormaMappa } from "../../storyboard/tipi.ts";
import type { Voce } from "../voce.ts";
import { pianoMappa } from "./mappa.ts";

// una parola ogni 6 frame dal frame 0; la chiave e' la parola di indice `chiave`
const voce = (testo: string, chiave: number): Voce => ({ parole: testo.split(" ").map((t, i) => ({ t, da: i * 6, a: i * 6 + 5 })), chiave, chiaveFine: chiave + 1 });
const SENZA: Voce = { parole: [], chiave: 0, chiaveFine: 0 };

const LUOGHI: Record<FormaMappa, string[]> = { punto: ["Il municipio"], area: ["Il centro storico"], percorso: ["La stazione", "Il porto"] };

const scena = (durata: number, v: Voce, forma: FormaMappa): ScenaDi<"mappa"> => ({
  tipo: "mappa",
  etichetta: "Dove succede",
  titolo: "Tutto in un quartiere",
  forma,
  luoghi: LUOGHI[forma],
  durata,
  voce: v,
  contesto: {},
});

const DETTA = "Si parte dalla stazione e si arriva al porto passando per il quartiere";

test("piantina < segno <= luoghi[0] (< luoghi[1]), tutto entro durata - 8 anche con 36 frame, con e senza voce", () => {
  for (const forma of ["punto", "area", "percorso"] as const) {
    for (const v of [voce(DETTA, 12), SENZA]) {
      for (const durata of [36, 45, 60, 150, 240]) {
        const piano = pianoMappa(scena(durata, v, forma), durata);
        const dove = `${forma}/${durata}: ${piano.piantina} ${piano.segno} ${piano.luoghi.join(",")} ${piano.titolo}`;
        assert.equal(piano.luoghi.length, LUOGHI[forma].length, dove);
        assert.ok(piano.piantina < piano.segno && piano.segno <= piano.luoghi[0], dove);
        if (forma === "percorso") assert.ok(piano.luoghi[0] < piano.luoghi[1], dove);
        for (const t of [piano.piantina, piano.segno, ...piano.luoghi, piano.titolo, ...piano.testi.map((x) => x.da)]) assert.ok(t < durata - 8, dove);
      }
    }
  }
});

test("il percorso arriva al secondo luogo quando la voce lo dice", () => {
  const v = voce(DETTA, 12);
  const piano = pianoMappa(scena(240, v, "percorso"), 240);
  assert.equal(piano.luoghi[0], v.parole[3].da);
  assert.equal(piano.luoghi[1], v.parole[8].da);
});

test("il titolo arriva sulla chiave", () => {
  const v = voce(DETTA, 12);
  const piano = pianoMappa(scena(240, v, "punto"), 240);
  assert.equal(piano.titolo, v.parole[12].da);
});

test("i testi a schermo sono l'occhiello, i luoghi e il titolo", () => {
  const piano = pianoMappa(scena(240, voce(DETTA, 12), "percorso"), 240);
  assert.deepEqual(piano.testi.map((t) => t.testo), ["Dove succede", "La stazione", "Il porto", "Tutto in un quartiere"]);
});

test("un titolo di 7 parole in una scena di un secondo e' intero prima dello stacco, parola per parola", () => {
  for (const forma of ["punto", "area", "percorso"] as const) {
    const lungo = { ...scena(30, voce(DETTA, 12), forma), titolo: "Una a una tutte le sette parole" };
    const piano = pianoMappa(lungo, 30);
    assert.equal(piano.parole.length, 7, forma);
    for (const p of piano.parole) assert.ok(p.da - 2 + 3 <= 30 - 10, `${forma}: ${p.t} a ${p.da}`);
    assert.ok(piano.testi.at(-1)!.da <= 30 - 10, forma);
  }
});

test("con 18 o 20 frame i tempi non si invertono: segno <= luoghi[0] <= luoghi[1] e segno <= titolo", () => {
  for (const forma of ["punto", "area", "percorso"] as const) {
    for (const durata of [18, 20]) {
      for (const v of [voce(DETTA, 12), SENZA]) {
        const piano = pianoMappa(scena(durata, v, forma), durata);
        const dove = `${forma}/${durata}: ${piano.segno} ${piano.luoghi.join(",")} ${piano.titolo}`;
        assert.ok(piano.segno <= piano.luoghi[0], dove);
        if (forma === "percorso") assert.ok(piano.luoghi[0] <= piano.luoghi[1], dove);
        assert.ok(piano.segno <= piano.titolo, dove);
      }
    }
  }
});
