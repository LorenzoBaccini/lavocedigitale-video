import { test } from "node:test";
import assert from "node:assert/strict";

import { costruisciLinea } from "../linea.ts";
import type { Timing } from "../timing.ts";
import { DUCKING, volumeSottofondo } from "./mix.ts";

// una frase di 2 s: muta il primo secondo, parlata il secondo
const timing: Timing = { voce: "elevenlabs", clips: [{ file: "x", secondi: 2, inviluppo: [...Array(30).fill(0), ...Array(30).fill(0.8)] }] };
const linea = costruisciLinea(timing, 30);

test("entra in mezzo secondo ed esce a zero alla fine", () => {
  assert.equal(volumeSottofondo(0, timing, linea), 0);
  assert.ok(volumeSottofondo(15, timing, linea) > 0.99);
  assert.equal(volumeSottofondo(linea.totale, timing, linea), 0);
});

test("sotto la voce scende di 6 dB, e comincia a scendere prima della parola", () => {
  assert.ok(Math.abs(volumeSottofondo(45, timing, linea) - (1 - DUCKING)) < 1e-9);
  assert.ok(volumeSottofondo(27, timing, linea) < 1);
  assert.equal(volumeSottofondo(20, timing, linea), 1);
});
