import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { voceDellaFrase } from "../editoriale/voce.ts";
import { FRASI_FINALI } from "../editoriale/variante.ts";
import { testoAschermo } from "../testoAschermo.ts";
import { conFraseFinale } from "./fraseFinale.ts";
import type { Storyboard } from "./tipi.ts";
import { CHIAVE_CHIUSURA, FRASI_CHIUSURA, TESTO_CHIUSURA } from "./tipi.ts";
import { validaStoryboard } from "./valida.ts";

const leggi = (): Storyboard => JSON.parse(readFileSync(new URL("../../fixtures/windows10.storyboard.json", import.meta.url), "utf8"));

test("le tre frasi finali sono quelle dello spec, e la frase del copione non e' fra loro", () => {
  assert.deepEqual(FRASI_CHIUSURA, ["Il resto è su la voce digitale punto it.", "Link nel post: la voce digitale punto it.", "Trovi tutto su la voce digitale punto it."]);
  assert.equal(FRASI_CHIUSURA.length, FRASI_FINALI.length);
  assert.ok(!(FRASI_CHIUSURA as readonly string[]).includes(TESTO_CHIUSURA));
});

test("la validazione vuole la frase del copione: la sostituzione viene dopo", () => {
  const sb = leggi();
  assert.equal(sb.frasi.at(-1)!.testo, TESTO_CHIUSURA);
  assert.equal(validaStoryboard(sb).ok, true);
});

test("ogni frase finale prende il posto dell'ultima, con l'indirizzo come chiave; il resto non cambia", () => {
  const sb = leggi();
  const prima = structuredClone(sb);
  for (const i of FRASI_FINALI) {
    const nuovo = conFraseFinale(sb, i);
    const ultima = nuovo.frasi.at(-1)!;
    assert.equal(ultima.testo, FRASI_CHIUSURA[i]);
    assert.equal(ultima.chiave, CHIAVE_CHIUSURA);
    assert.deepEqual(ultima.scena, { tipo: "chiusura" });
    assert.deepEqual(nuovo.frasi.slice(0, -1), sb.frasi.slice(0, -1));
    assert.equal(nuovo.slug, sb.slug);
  }
  assert.deepEqual(sb, prima, "lo storyboard di partenza resta intatto");
});

test("a schermo la frase scrive l'indirizzo, e la voce ci trova la chiave", () => {
  for (const i of FRASI_FINALI) {
    const testo = FRASI_CHIUSURA[i];
    assert.match(testoAschermo(testo), /lavocedigitale\.it\.$/);
    assert.equal(testoAschermo(CHIAVE_CHIUSURA), "lavocedigitale.it");
    const clip = { file: "x.wav", secondi: 3, inviluppo: Array(90).fill(0.5) };
    const voce = voceDellaFrase(testo, CHIAVE_CHIUSURA, clip);
    assert.equal(voce.parole[voce.chiave].t, "lavocedigitale.it");
  }
});

test("senza la chiusura in fondo la sostituzione si rifiuta", () => {
  const sb = leggi();
  sb.frasi = sb.frasi.slice(0, -1);
  assert.throws(() => conFraseFinale(sb, 0), /chiusura/);
});
