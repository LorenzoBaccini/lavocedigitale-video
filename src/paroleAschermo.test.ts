import { test } from "node:test";
import assert from "node:assert/strict";

import { paroleAschermo } from "./paroleAschermo.ts";

// Ogni parola dura 10 frame, una dopo l'altra.
const dette = (testo: string) => testo.split(" ").map((parola, i) => ({ parola, da: i * 10, a: i * 10 + 8 }));

test("i numeri in lettere diventano cifre e tengono i tempi della parola", () => {
  assert.deepEqual(paroleAschermo(dette("Hai ancora Windows dieci?")), [
    { parola: "Hai", da: 0, a: 8 },
    { parola: "ancora", da: 10, a: 18 },
    { parola: "Windows", da: 20, a: 28 },
    { parola: "10?", da: 30, a: 38 },
  ]);
});

test("gigabyte dopo un numero diventa GB", () => {
  assert.deepEqual(paroleAschermo(dette("almeno otto gigabyte, stessa")).map((p) => p.parola), ["almeno", "8", "GB,", "stessa"]);
});

test("l'indirizzo parlato è una parola sola che dura dalla prima all'ultima", () => {
  assert.deepEqual(paroleAschermo(dette("su la voce digitale punto it, il link")), [
    { parola: "su", da: 0, a: 8 },
    { parola: "lavocedigitale.it,", da: 10, a: 58 },
    { parola: "il", da: 60, a: 68 },
    { parola: "link", da: 70, a: 78 },
  ]);
});

test("una frase senza trasformazioni resta uguale", () => {
  const parole = dette("Il sistema nasce già scoperto.");
  assert.deepEqual(paroleAschermo(parole), parole);
});
