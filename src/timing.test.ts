import { test } from "node:test";
import assert from "node:assert/strict";

import type { Timing } from "./timing.ts";
import { problemiTiming } from "./timing.ts";

const FRASI = ["Hai ancora Windows?", "Si può."];

const buono = (): Timing => ({
  voce: "elevenlabs",
  clips: [
    { file: "s0.wav", secondi: 1, inviluppo: Array(30).fill(0.5), parole: [{ t: "Hai", da: 0.1, a: 0.3 }, { t: "ancora", da: 0.3, a: 0.6 }, { t: "Windows?", da: 0.6, a: 0.9 }] },
    { file: "s1.wav", secondi: 0.5, inviluppo: Array(15).fill(0.5), parole: [{ t: "Si", da: 0.1, a: 0.2 }, { t: "può.", da: 0.2, a: 0.4 }] },
  ],
});

test("un timing coerente con le frasi non ha problemi", () => {
  assert.deepEqual(problemiTiming(buono(), FRASI), []);
});

test("le parole sono facoltative", () => {
  const t = buono();
  t.clips.forEach((c) => delete c.parole);
  assert.deepEqual(problemiTiming(t, FRASI), []);
});

test("una clip per frase", () => {
  const t = buono();
  t.clips.pop();
  assert.deepEqual(problemiTiming(t, FRASI), ["2 frasi, 1 clip"]);
});

test("durata e parole fuori posto vengono segnalate", () => {
  const t = buono();
  t.clips[0].secondi = 0;
  delete t.clips[0].parole;
  t.clips[1].parole = [{ t: "può.", da: 0.3, a: 0.2 }];
  assert.deepEqual(problemiTiming(t, FRASI), [
    "clip 1: durata non positiva",
    "clip 2: 1 parole, la frase ne ha 2",
    "clip 2: la parola 1 «può.» ha tempi fuori ordine o fuori dalla clip",
  ]);
});

test("le parole devono andare in avanti", () => {
  const t = buono();
  t.clips[0].parole![2] = { t: "Windows?", da: 0.2, a: 0.9 };
  assert.deepEqual(problemiTiming(t, FRASI), ["clip 1: la parola 3 «Windows?» ha tempi fuori ordine o fuori dalla clip"]);
});
