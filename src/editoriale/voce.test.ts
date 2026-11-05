import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { Timing } from "../timing.ts";
import { cercaParole, paroleDellaFrase, quandoDice, quandoDiceUna, voceDellaFrase } from "./voce.ts";

const timing = JSON.parse(readFileSync(new URL("../../fixtures/windows10.timing.json", import.meta.url), "utf8")) as Timing;

test("quandoDiceUna trova la prima parola piena che la voce dice, saltando le vuote", () => {
  const v = { parole: [["Con", 0], ["solo", 6], ["la", 12], ["CIE,", 15], ["l'app", 30]].map(([t, da]) => ({ t: t as string, da: da as number, a: (da as number) + 5 })), chiave: 0, chiaveFine: 1 };
  assert.equal(quandoDiceUna(v, "Entra con CIE", 99), 15);
  assert.equal(quandoDiceUna(v, "con la", 99), 99);
  assert.equal(quandoDiceUna(v, "Entra con SPID", 99), 99);
});

test("le parole a schermo prendono i tempi veri della voce, in frame dalla scena", () => {
  const parole = paroleDellaFrase("Devi reinstallare Windows dieci da zero?", timing.clips[0]);
  assert.deepEqual(parole.map((p) => p.t), ["Devi", "reinstallare", "Windows", "10", "da", "zero?"]);
  const veri = timing.clips[0].parole!;
  assert.equal(parole[2].da, Math.round(veri[2].da * 30));
  for (let i = 1; i < parole.length; i++) assert.ok(parole[i].da >= parole[i - 1].da);
});

test("la chiave si trova nella forma a schermo, maiuscole e punteggiatura a parte", () => {
  const v = voceDellaFrase("Devi reinstallare Windows dieci da zero?", "Windows dieci", timing.clips[0]);
  assert.equal(v.chiave, 2);
  assert.equal(v.chiaveFine, 4);
  const p = [{ t: "Si" }, { t: "può," }, { t: "ma" }, { t: "c'è" }, { t: "un" }, { t: "problema" }];
  assert.equal(cercaParole(p, "un problema"), 4);
  assert.equal(cercaParole(p, "PUÒ"), 1);
  assert.equal(cercaParole(p, "può ma", 2), -1);
});

test("senza la chiave nella frase si ripiega sull'ultima parola", () => {
  const v = voceDellaFrase("Devi reinstallare Windows dieci da zero?", "Linux", timing.clips[0]);
  assert.equal(v.chiave, 5);
});

test("quando la voce dice un testo, oppure il ripiego", () => {
  const v = voceDellaFrase("Dal quattordici ottobre duemilaventicinque niente più aggiornamenti di sicurezza.", "aggiornamenti", timing.clips[2]);
  assert.equal(quandoDice(v, "14 ottobre 2025", -1), v.parole[1].da);
  assert.equal(quandoDice(v, "domenica", 42), 42);
});

test("senza tempi veri le parole hanno tempi stimati crescenti", () => {
  const parole = paroleDellaFrase("E il permesso glielo hai dato tu.", { file: "x", secondi: 3, inviluppo: Array(90).fill(0.5) });
  assert.equal(parole.length, 7);
  assert.equal(parole.at(-1)!.t, "tu");
  for (let i = 1; i < parole.length; i++) assert.ok(parole[i].da > parole[i - 1].da);
});
