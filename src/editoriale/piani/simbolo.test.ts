import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScenaDi } from "../../scenes/props.ts";
import type { Voce } from "../voce.ts";
import { pianoSimbolo } from "./simbolo.ts";

// una parola ogni 6 frame dal frame 0; la chiave e' la parola di indice `chiave`
const voce = (testo: string, chiave: number): Voce => {
  const parole = testo.split(" ").map((t, i) => ({ t, da: i * 6, a: i * 6 + 5 }));
  return { parole, chiave, chiaveFine: chiave + 1 };
};

const scena = (durata: number, v: Voce, barrato = true): ScenaDi<"simbolo"> => ({
  tipo: "simbolo",
  etichetta: "Dal 14 ottobre",
  simbolo: "scudo",
  titolo: "Niente più sicurezza",
  barrato,
  durata,
  voce: v,
  contesto: {},
});

const DETTA = "Da ottobre Windows 10 non riceve piu' le patch di sicurezza";

test("il titolo arriva quando la voce dice la chiave", () => {
  const v = voce(DETTA, 5);
  assert.equal(v.parole[5].da, 30);
  const piano = pianoSimbolo(scena(120, v), 120);
  assert.ok(piano.titolo >= 30, `titolo a ${piano.titolo}`);
  assert.ok(piano.simbolo < piano.titolo);
  assert.ok(piano.barra !== undefined && piano.barra > piano.titolo);
});

test("con una frase cortissima ogni tempo resta dentro la scena", () => {
  for (const barrato of [true, false]) {
    const piano = pianoSimbolo(scena(36, voce(DETTA, 9), barrato), 36);
    for (const t of [piano.simbolo, piano.titolo, piano.barra, ...piano.testi.map((x) => x.da)]) {
      if (t !== undefined) assert.ok(t < 36 - 8, `${t} con barrato ${barrato}`);
    }
  }
});

test("con una voce che non dice la chiave i tempi restano ordinati", () => {
  const senza: Voce = { parole: [], chiave: 0, chiaveFine: 0 };
  for (const durata of [36, 60, 150]) {
    const piano = pianoSimbolo(scena(durata, senza), durata);
    assert.ok(piano.barra !== undefined);
    assert.ok(piano.simbolo < piano.titolo && piano.titolo < piano.barra, `${durata}: ${piano.simbolo} ${piano.titolo} ${piano.barra}`);
  }
});

test("senza barrato niente barra; i testi a schermo sono etichetta e titolo", () => {
  const piano = pianoSimbolo(scena(90, voce(DETTA, 9), false), 90);
  assert.equal(piano.barra, undefined);
  assert.deepEqual(piano.testi.map((t) => t.testo), ["Dal 14 ottobre", "Niente più sicurezza"]);
});

test("un titolo di 7 parole in una scena di un secondo e' intero prima dello stacco, parola per parola", () => {
  const lungo = { ...scena(30, voce(DETTA, 9)), titolo: "Una a una tutte le sette parole" };
  const piano = pianoSimbolo(lungo, 30);
  assert.equal(piano.parole.length, 7);
  for (const p of piano.parole) assert.ok(p.da - 2 + 3 <= 30 - 10, `${p.t} a ${p.da}`);
  assert.ok(piano.testi[1].da <= 30 - 10, `testo a ${piano.testi[1].da}`);
});
