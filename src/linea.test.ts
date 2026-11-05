import { test } from "node:test";
import assert from "node:assert/strict";

import { costruisciLinea, livelloVoce } from "./linea.ts";
import type { Timing } from "./timing.ts";

const timing: Timing = {
  voce: "elevenlabs",
  clips: [
    { file: "s0.wav", secondi: 2.79, inviluppo: [0.4, 0.9, 1] },
    { file: "s1.wav", secondi: 1.84, inviluppo: [0.7, 0.2] },
  ],
};

test("le scene partono una dopo l'altra", () => {
  assert.deepEqual(costruisciLinea(timing, 30).inizi, [0, 84]);
});

test("il totale è la somma dei frame più 1,2 s di coda", () => {
  const linea = costruisciLinea(timing, 30);
  assert.deepEqual(linea.durate, [84, 55 + 36]);
  assert.equal(linea.totale, 84 + 55 + 36);
});

test("il livello della voce al frame 0 è il primo valore dell'inviluppo", () => {
  assert.equal(livelloVoce(timing, costruisciLinea(timing, 30), 0), 0.4);
});

test("il livello della voce segue la clip della scena in corso", () => {
  assert.equal(livelloVoce(timing, costruisciLinea(timing, 30), 85), 0.2);
});

test("il livello della voce oltre la fine è 0", () => {
  const linea = costruisciLinea(timing, 30);
  assert.equal(livelloVoce(timing, linea, linea.totale + 10), 0);
});
