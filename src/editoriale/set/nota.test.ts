import { test } from "node:test";
import assert from "node:assert/strict";

import { LARGHEZZA, MARGINE } from "../../impaginazione.ts";
import { LIMITI } from "../../storyboard/tipi.ts";
import { COLONNA_NOTA, CORPO_MINIMO, CORPO_NOTA, parolaMassima, postoNota, STACCO_NOTA } from "./nota.ts";

const larghezzaParola = (parola: string, corpo: number) => parola.length * 0.76 * corpo;
const piuLunga = (testo: string) => testo.split(" ").reduce((a, b) => (b.length > a.length ? b : a));

test("una nota di parole corte resta dove deve e al suo corpo", () => {
  assert.deepEqual(postoNota("la tessera", 640, 570), { sinistra: 640, corpo: CORPO_NOTA });
});

test("con parole entro il limite sta sempre nel margine destro, al corpo minimo o sopra", () => {
  for (const testo of ["Amministrazione Comune s", "Credenziali verifica Ministe", "Sportello accesso creden", "PIN"]) {
    for (const x of [500, 540, 580]) {
      const sinistra = Math.max(COLONNA_NOTA, x + 60);
      const { sinistra: sx, corpo } = postoNota(testo, sinistra, x);
      assert.ok(corpo >= CORPO_MINIMO, `${testo} da ${sinistra}: corpo ${corpo}`);
      assert.ok(sx + larghezzaParola(piuLunga(testo), corpo) <= LARGHEZZA - MARGINE + 0.5, `${testo} da ${sinistra}: arriva a ${sx + larghezzaParola(piuLunga(testo), corpo)}`);
      assert.ok(sx <= sinistra && sx >= x + STACCO_NOTA);
    }
  }
});

test("una parola lunghissima non porta mai la nota sopra l'oggetto indicato", () => {
  for (const x of [400, 520, 640]) {
    const { sinistra } = postoNota("Riconfigurazionedelledisposizioni", Math.max(COLONNA_NOTA, x + 60), x);
    assert.ok(sinistra >= x + STACCO_NOTA, `x ${x}: la nota parte da ${sinistra}`);
  }
});

test("il limite della validazione e' la parola piu' lunga che sta nella colonna al corpo minimo", () => {
  assert.equal(LIMITI.parolaNota, parolaMassima());
  const parola = "A".repeat(LIMITI.parolaNota);
  const { sinistra, corpo } = postoNota(parola, COLONNA_NOTA, COLONNA_NOTA - 60);
  assert.equal(sinistra, COLONNA_NOTA);
  assert.ok(sinistra + larghezzaParola(parola, corpo) <= LARGHEZZA - MARGINE + 0.5);
});
