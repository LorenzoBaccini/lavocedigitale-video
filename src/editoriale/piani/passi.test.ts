import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScenaDi } from "../../scenes/props.ts";
import type { Voce } from "../voce.ts";
import { pianoPassi } from "./passi.ts";

// una parola ogni 6 frame dal frame 0
const voce = (testo: string): Voce => ({ parole: testo.split(" ").map((t, i) => ({ t, da: i * 6, a: i * 6 + 5 })), chiave: 0, chiaveFine: 1 });

const scena = (durata: number, v: Voce, n = 4): ScenaDi<"passi"> => ({
  tipo: "passi",
  etichetta: "Prima di iniziare",
  passi: ["Collega il caricatore", "Apri le impostazioni", "Controlla lo spazio", "Riavvia il computer"].slice(0, n).map((testo) => ({ testo })),
  durata,
  voce: v,
  contesto: {},
});

const DETTA = "Prima collega il caricatore poi apri le impostazioni controlla lo spazio e infine riavvia il computer";

test("il primo passo entra subito, gli altri quando la voce dice una parola del loro testo", () => {
  const v = voce(DETTA);
  const piano = pianoPassi(scena(240, v), 240);
  assert.equal(piano.passi[0], 2);
  assert.equal(piano.passi[1], v.parole[5].da);
  assert.equal(piano.passi[2], v.parole[8].da);
  assert.equal(piano.passi[3], v.parole[13].da);
});

test("tempi crescenti, di almeno 8 frame, dentro la scena anche con 40 frame e 4 passi", () => {
  const senza: Voce = { parole: [], chiave: 0, chiaveFine: 0 };
  for (const v of [voce(DETTA), senza]) {
    for (const [durata, n] of [[40, 4], [60, 4], [150, 3], [90, 2], [240, 4]] as const) {
      const { passi } = pianoPassi(scena(durata, v, n), durata);
      assert.equal(passi.length, n);
      passi.forEach((t, i) => {
        assert.ok(t < durata - 8, `${durata}/${n}: ${t}`);
        if (i) assert.ok(t - passi[i - 1] >= 8, `${durata}/${n}: ${passi.join(",")}`);
      });
    }
  }
});

test("senza voce i passi si distribuiscono fino al 70 % della durata", () => {
  const { passi } = pianoPassi(scena(200, { parole: [], chiave: 0, chiaveFine: 0 }), 200);
  assert.ok(passi[3] <= 200 * 0.7 + 1, passi.join(","));
  assert.ok(passi[3] > passi[0] + 60);
});

test("i testi a schermo sono l'occhiello e i passi, ciascuno col suo tempo", () => {
  const piano = pianoPassi(scena(240, voce(DETTA)), 240);
  assert.deepEqual(piano.testi.map((t) => t.testo), ["Prima di iniziare", "Collega il caricatore", "Apri le impostazioni", "Controlla lo spazio", "Riavvia il computer"]);
});
