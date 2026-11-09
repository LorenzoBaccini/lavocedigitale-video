import { test } from "node:test";
import assert from "node:assert/strict";

import { NOTTE } from "./stili/notte.ts";
import { altezzaRighe, paroleInAccento, paroleTitolo } from "./titoli.ts";
import type { Voce } from "./voce.ts";

const voce = (parole: [string, number][]): Voce => ({ parole: parole.map(([t, da]) => ({ t, da, a: da + 5 })), chiave: 0, chiaveFine: 1 });

test("le parole dette entrano con la voce, le altre a passo dopo la precedente", () => {
  const v = voce([["Si", 2], ["può", 8], ["ma", 40], ["c'è", 46], ["un", 52], ["problema.", 58]]);
  assert.deepEqual(paroleTitolo("Ma c'è", v, 2), [{ t: "Ma", da: 40 }, { t: "c'è", da: 46 }]);
  assert.deepEqual(paroleTitolo("Crea un problema", v, 4), [{ t: "Crea", da: 4 }, { t: "un", da: 52 }, { t: "problema", da: 58 }]);
});

test("la ricerca va in ordine: una parola gia' passata non si ripesca", () => {
  const v = voce([["la", 5], ["chiavetta", 20], ["la", 40]]);
  assert.deepEqual(paroleTitolo("chiavetta la", v, 0).map((p) => p.da), [20, 40]);
});

test("l'accento cade sulle parole del titolo che ripetono la chiave, altrimenti sull'ultima", () => {
  assert.deepEqual(paroleInAccento([{ t: "Perde" }, { t: "i" }, { t: "soldi" }], ["perde", "i", "suoi"]), [0, 1]);
  assert.deepEqual(paroleInAccento([{ t: "un" }, { t: "problema" }], ["problema."]), [1]);
  assert.deepEqual(paroleInAccento([{ t: "Nasce" }, { t: "già" }], ["scoperto"]), [1]);
});

test("l'altezza stimata del titolo conta le righe che vanno a capo", () => {
  const corta = altezzaRighe([{ testo: "Windows 10", size: 100 }]);
  assert.ok(Math.abs(corta - 112) < 1);
  // il gancio del fascicolo: la riga piccola dopo la chiave va a capo
  const lunga = altezzaRighe([{ testo: "Devi entrare nel", size: 80 }, { testo: "fascicolo", size: 136 }, { testo: "sanitario dell'Emilia-Romagna?", size: 59 }]);
  assert.ok(lunga > 80 * 1.12 + 136 * 1.12 + 59 * 1.12 * 2 - 1, `${lunga}`);
});

test("col mono della notte un titolo vicino all'a capo conta una riga in piu'", () => {
  // 30 caratteri a 56 px: col serif ci stanno in 920 px, col mono (0,6 em) no
  const riga = [{ testo: "a".repeat(30), size: 56 }];
  assert.ok(Math.abs(altezzaRighe(riga, 920) - 56 * 1.12) < 1e-9);
  assert.ok(Math.abs(altezzaRighe(riga, 920, NOTTE.larghezza) - 2 * 56 * 1.12) < 1e-9);
});
