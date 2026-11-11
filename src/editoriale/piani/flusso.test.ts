import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScenaDi } from "../../scenes/props.ts";
import type { Voce } from "../voce.ts";
import { pianoFlusso } from "./flusso.ts";

// una parola ogni 6 frame dal frame 0
const voce = (testo: string): Voce => ({ parole: testo.split(" ").map((t, i) => ({ t, da: i * 6, a: i * 6 + 5 })), chiave: 0, chiaveFine: 1 });

const scena = (durata: number, v: Voce, n = 3): ScenaDi<"flusso"> => ({
  tipo: "flusso",
  etichetta: "Come funziona",
  nodi: ["Scarichi il file", "Lo controlli", "Lo installi"].slice(0, n).map((testo) => ({ testo })),
  durata,
  voce: v,
  contesto: {},
});

const DETTA = "Prima scarichi il file poi lo controlli e infine lo installi";

test("il primo nodo entra subito, gli altri quando la voce dice una parola del loro testo", () => {
  const v = voce(DETTA);
  const piano = pianoFlusso(scena(240, v), 240);
  assert.equal(piano.nodi[0], 2);
  assert.equal(piano.nodi[1], v.parole[6].da);
  assert.equal(piano.nodi[2], v.parole[10].da);
});

test("nodi[i] < frecce[i] < nodi[i+1], tutto entro durata - 8 anche con 36 frame, con e senza voce", () => {
  const senza: Voce = { parole: [], chiave: 0, chiaveFine: 0 };
  for (const v of [voce(DETTA), senza]) {
    for (const [durata, n] of [[36, 3], [36, 2], [60, 3], [150, 3], [90, 2], [240, 3]] as const) {
      const { nodi, frecce } = pianoFlusso(scena(durata, v, n), durata);
      assert.equal(nodi.length, n);
      assert.equal(frecce.length, n - 1);
      frecce.forEach((fr, i) => {
        assert.ok(nodi[i] < fr && fr < nodi[i + 1], `${durata}/${n}: ${nodi.join(",")} / ${frecce.join(",")}`);
      });
      assert.ok(nodi[n - 1] < durata - 8, `${durata}/${n}: ${nodi.join(",")}`);
    }
  }
});

test("senza voce i nodi si distribuiscono fino al 70 % della durata", () => {
  const { nodi } = pianoFlusso(scena(200, { parole: [], chiave: 0, chiaveFine: 0 }), 200);
  assert.ok(nodi[2] <= 200 * 0.7 + 1, nodi.join(","));
  assert.ok(nodi[2] > nodi[0] + 60);
});

test("i testi a schermo sono l'occhiello e i nodi, ciascuno col suo tempo", () => {
  const piano = pianoFlusso(scena(240, voce(DETTA)), 240);
  assert.deepEqual(piano.testi.map((t) => t.testo), ["Come funziona", "Scarichi il file", "Lo controlli", "Lo installi"]);
});
