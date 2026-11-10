import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { pianoChiusura } from "../editoriale/piani/chiusura.ts";
import { titoliVisibili } from "../editoriale/piano.ts";
import { FRASI_FINALI } from "../editoriale/variante.ts";
import { voceDellaFrase } from "../editoriale/voce.ts";
import { costruisciLinea } from "../linea.ts";
import { bloccoRidondante } from "../ridondanza.ts";
import { propsFrase } from "../scenes/propsFrase.ts";
import { blocchiSottotitolo } from "../sottotitoli.ts";
import { testoAschermo } from "../testoAschermo.ts";
import type { Timing } from "../timing.ts";
import { conFraseFinale } from "./fraseFinale.ts";
import type { Storyboard } from "./tipi.ts";
import { FRASI_CHIUSURA, TESTO_CHIUSURA } from "./tipi.ts";
import { validaStoryboard } from "./valida.ts";

const leggi = (): Storyboard => JSON.parse(readFileSync(new URL("../../fixtures/windows10.storyboard.json", import.meta.url), "utf8"));

test("le tre frasi finali sono corte, e la frase del copione non e' fra loro", () => {
  assert.deepEqual(FRASI_CHIUSURA.map((f) => f.testo), ["Tutto su la voce digitale punto it.", "Link nel post.", "Il resto è nel link del post."]);
  assert.equal(FRASI_CHIUSURA.length, FRASI_FINALI.length);
  assert.ok(!FRASI_CHIUSURA.some((f) => (f.testo as string) === TESTO_CHIUSURA));
});

test("la validazione vuole la frase del copione: la sostituzione viene dopo", () => {
  const sb = leggi();
  assert.equal(sb.frasi.at(-1)!.testo, TESTO_CHIUSURA);
  assert.equal(validaStoryboard(sb).ok, true);
});

test("ogni frase finale prende il posto dell'ultima con la sua chiave; il resto non cambia", () => {
  const sb = leggi();
  const prima = structuredClone(sb);
  for (const i of FRASI_FINALI) {
    const nuovo = conFraseFinale(sb, i);
    const ultima = nuovo.frasi.at(-1)!;
    assert.equal(ultima.testo, FRASI_CHIUSURA[i].testo);
    assert.equal(ultima.chiave, FRASI_CHIUSURA[i].chiave);
    assert.deepEqual(ultima.scena, { tipo: "chiusura" });
    assert.deepEqual(nuovo.frasi.slice(0, -1), sb.frasi.slice(0, -1));
    assert.equal(nuovo.slug, sb.slug);
  }
  assert.deepEqual(sb, prima, "lo storyboard di partenza resta intatto");
});

test("la voce trova la chiave di ogni frase; l'indirizzo detto si scrive lavocedigitale.it", () => {
  assert.equal(testoAschermo(FRASI_CHIUSURA[0].testo), "Tutto su lavocedigitale.it.");
  for (const { testo, chiave } of FRASI_CHIUSURA) {
    const clip = { file: "x.wav", secondi: 2, inviluppo: Array(60).fill(0.5) };
    const voce = voceDellaFrase(testo, chiave, clip);
    assert.equal(voce.parole.slice(voce.chiave, voce.chiaveFine).map((p) => p.t).join(" ").toLowerCase(), testoAschermo(chiave).toLowerCase(), testo);
  }
});

// con la cartolina sono scritti testata e indirizzo: il sottotitolo si nasconde solo se li ripete parola per parola
test("con la cartolina il sottotitolo di ogni frase finale resta visibile", () => {
  for (const i of FRASI_FINALI) {
    const sb = conFraseFinale(leggi(), i);
    const timing: Timing = { voce: "elevenlabs", clips: sb.frasi.map(() => ({ file: "x.wav", secondi: 2, inviluppo: Array(60).fill(0.5) })) };
    const linea = costruisciLinea(timing, 30);
    const k = sb.frasi.length - 1;
    const p = propsFrase(sb, timing, linea, k);
    if (p.tipo !== "chiusura") throw new Error("chiusura");
    const scritti = titoliVisibili(pianoChiusura(p, p.durata).testi, p.durata);
    for (const b of blocchiSottotitolo(testoAschermo(sb.frasi[k].testo), testoAschermo(sb.frasi[k].chiave), 60)) {
      assert.equal(bloccoRidondante(b, scritti), false, `${sb.frasi[k].testo}: «${b.parole.map((w) => w.t).join(" ")}»`);
    }
  }
});

test("senza la chiusura in fondo la sostituzione si rifiuta", () => {
  const sb = leggi();
  sb.frasi = sb.frasi.slice(0, -1);
  assert.throws(() => conFraseFinale(sb, 0), /chiusura/);
});
