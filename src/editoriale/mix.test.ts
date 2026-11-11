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

test("esce solo nella coda della chiusura, dopo l'ultima parola, e in modo lineare", () => {
  const fineVoce = 2 * 30;
  // fino all'ultimo frame della voce la musica non ha ancora cominciato a uscire (resta sotto la voce)
  assert.ok(Math.abs(volumeSottofondo(fineVoce - 1, timing, linea) - (1 - DUCKING)) < 1e-9);
  assert.equal(linea.totale - fineVoce, 24);
  const meta = volumeSottofondo(fineVoce + 12, timing, linea);
  assert.ok(meta > 0.45 && meta < 0.55, String(meta));
});
