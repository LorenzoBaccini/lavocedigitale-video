import { test } from "node:test";
import assert from "node:assert/strict";

import { LARGHEZZA, MARGINE } from "../../impaginazione.ts";
import { CORPO_MINIMO, CORPO_NOTA, postoNota } from "./nota.ts";

const larghezzaParola = (parola: string, corpo: number) => parola.length * 0.76 * corpo;

test("una nota di parole corte resta dove deve e al suo corpo", () => {
  assert.deepEqual(postoNota("la tessera", 640), { sinistra: 640, corpo: CORPO_NOTA });
});

test("la parola piu' lunga sta sempre prima del margine destro, mai sotto il corpo minimo", () => {
  for (const testo of ["Amministrazione Comune s", "Credenziali verifica Ministe", "Sportello accesso creden", "PIN"]) {
    for (const sinistra of [520, 640, 700, 800, 900]) {
      const { sinistra: sx, corpo } = postoNota(testo, sinistra);
      const lunga = testo.split(" ").reduce((a, b) => (b.length > a.length ? b : a));
      assert.ok(corpo >= CORPO_MINIMO, `${testo} da ${sinistra}: corpo ${corpo}`);
      assert.ok(sx + larghezzaParola(lunga, corpo) <= LARGHEZZA - MARGINE + 0.5, `${testo} da ${sinistra}: arriva a ${sx + larghezzaParola(lunga, corpo)}`);
      assert.ok(sx <= sinistra && sx >= MARGINE);
    }
  }
});

test("prima scende il corpo, poi la nota si sposta", () => {
  const { sinistra, corpo } = postoNota("Amministrazione", 600);
  assert.equal(sinistra, 600);
  assert.ok(corpo < CORPO_NOTA && corpo >= CORPO_MINIMO);
  assert.ok(postoNota("Amministrazione", 700).sinistra < 700);
});
