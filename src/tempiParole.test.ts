import { test } from "node:test";
import assert from "node:assert/strict";

import { framesParlati, sillabe, stimaTempiParole, tempiParole } from "./tempiParole.ts";

test("le sillabe contano i gruppi di vocali", () => {
  assert.equal(sillabe("problema"), 3);
  assert.equal(sillabe("può"), 1);
  assert.equal(sillabe("c'è"), 1);
  assert.equal(sillabe("Hai"), 1);
  assert.equal(sillabe("installare,"), 4);
  assert.equal(sillabe("10"), 1);
});

test("i frame parlati saltano il silenzio ai bordi e le pause lunghe, non i cali brevi", () => {
  const inviluppo = [0, 0, 0.5, 0.01, 0.6, 0.7, 0, 0, 0, 0, 0.4, 0.5, 0];
  assert.deepEqual(framesParlati(inviluppo), [2, 3, 4, 5, 10, 11]);
});

test("senza voce ogni parola copre la clip", () => {
  assert.deepEqual(stimaTempiParole("ciao", [0, 0, 0]), [{ parola: "ciao", da: 0, a: 3 }]);
});

test("le parole si spartiscono i frame parlati per sillabe e la pausa cade fra le due proposizioni", () => {
  const inviluppo = [0, ...Array(9).fill(0.8), 0, 0, 0, 0, ...Array(6).fill(0.8), 0, 0];
  const tempi = stimaTempiParole("installa, ora", inviluppo);
  assert.deepEqual(tempi, [
    { parola: "installa,", da: 1, a: 10 },
    { parola: "ora", da: 14, a: 20 },
  ]);
});

test("i tempi sono in ordine e dentro la clip", () => {
  const inviluppo = [0, 0, 0.3, 0.9, 1, 0.7, 0.5, 0.6, 0.2, 0.06, 0.3, 0.8, 0.6, 0.1, 0, 0];
  const tempi = stimaTempiParole("Hai ancora Windows dieci?", inviluppo);
  assert.equal(tempi.length, 4);
  assert.equal(tempi[0].da, 2);
  assert.equal(tempi[3].a, 14);
  tempi.forEach((t, i) => {
    assert.ok(t.da < t.a);
    if (i) assert.ok(t.da >= tempi[i - 1].a);
  });
});

test("con le parole della voce i tempi sono quelli veri, in frame", () => {
  const clip = { file: "s0.wav", secondi: 1, inviluppo: Array(30).fill(0.5), parole: [{ t: "Si", da: 0.1, a: 0.25 }, { t: "può.", da: 0.3, a: 0.62 }] };
  assert.deepEqual(tempiParole("Si può.", clip, 30), [
    { parola: "Si", da: 3, a: 8 },
    { parola: "può.", da: 9, a: 19 },
  ]);
});

test("una parola brevissima dura almeno un frame", () => {
  const clip = { file: "s0.wav", secondi: 1, inviluppo: [], parole: [{ t: "e", da: 0.1, a: 0.11 }] };
  assert.deepEqual(tempiParole("e", clip, 30), [{ parola: "e", da: 3, a: 4 }]);
});

test("senza parole della voce resta la stima sull'inviluppo", () => {
  const inviluppo = [0, ...Array(9).fill(0.8), 0, 0, 0, 0, ...Array(6).fill(0.8), 0, 0];
  const clip = { file: "s0.wav", secondi: 0.7, inviluppo };
  assert.deepEqual(tempiParole("installa, ora", clip, 30), stimaTempiParole("installa, ora", inviluppo));
});
