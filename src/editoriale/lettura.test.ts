import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

import { costruisciLinea } from "../linea.ts";
import { propsFrase } from "../scenes/propsFrase.ts";
import type { Storyboard } from "../storyboard/tipi.ts";
import type { Timing } from "../timing.ts";
import { inSequenza, interoEntro, lettura, letturaIn, SCENA_PIENA } from "./lettura.ts";
import { pianoScena } from "./piani/index.ts";
import type { ParolaTitolo } from "./titoli.ts";
import { codaInTempo, intera } from "./titoli.ts";

test("la lettura va da 1,2 s per i testi brevi a 1,8 s per le righe lunghe, crescendo coi caratteri", () => {
  assert.equal(lettura(""), 36);
  assert.equal(lettura("Bluetooth"), 36);
  assert.equal(lettura("App aperta e"), 36);
  assert.equal(lettura("Un suono, non la voce"), 50);
  assert.equal(lettura("finché il download finisce"), 54);
  assert.equal(lettura("x".repeat(80)), 54);
  let prima = 0;
  for (let n = 0; n <= 40; n++) {
    const l = lettura("x".repeat(n));
    assert.ok(l >= prima);
    prima = l;
  }
});

test("la lettura scala con la scena solo sotto i 3,6 s, al piu' meta' scena", () => {
  assert.equal(SCENA_PIENA, 108);
  const lungo = "x".repeat(30);
  assert.equal(letturaIn(lungo, SCENA_PIENA), 54);
  assert.equal(letturaIn(lungo, 300), 54);
  assert.equal(letturaIn(lungo, 90), 45);
  assert.equal(letturaIn("Stereo", 90), 36);
  assert.equal(letturaIn("Stereo", 60), 30);
  assert.equal(interoEntro("Stereo", 159), 123);
});

test("in sequenza ogni tetto lascia la distanza a quelli dopo; nelle scene cortissime vince la distanza", () => {
  assert.deepEqual(inSequenza([100, 90, 120], 10), [80, 90, 120]);
  assert.deepEqual(inSequenza([100, 90, 120], 10, 2), [80, 90, 120]);
  assert.deepEqual(inSequenza([20, 20, 20], 8, 2), [4, 12, 20]);
  assert.deepEqual(inSequenza([10, 10, 10], 8, 2), [2, 10, 18]);
  assert.deepEqual(inSequenza([], 8), []);
});

const cartella = new URL("../../fixtures/", import.meta.url);
const fixture = readdirSync(cartella).filter((f) => f.endsWith(".storyboard.json"));
const leggi = <T>(nome: string): T => JSON.parse(readFileSync(new URL(nome, cartella), "utf8"));

// Ogni testo dichiarato dal piano e, nel gancio, l'ultima parola della frase scritta parola per parola (il testo intero
// e' dichiarato al frame 0 perche' segue la voce): quelli che non restano a schermo la loro lettura.
const mancanti = (sb: Storyboard, timing: Timing) => {
  const linea = costruisciLinea(timing, 30);
  return sb.frasi.flatMap((frase, k) => {
    if (frase.scena.tipo === "chiusura") return [];
    const p = propsFrase(sb, timing, linea, k);
    const piano = pianoScena(p, p.durata);
    const ultima = p.tipo === "gancio" && "parole" in piano ? (piano.parole as ParolaTitolo[]).at(-1) : undefined;
    const testi = [...piano.testi, ...(ultima ? [{ testo: ultima.t, da: intera(ultima) }] : [])];
    return testi
      .filter((t) => p.durata - t.da < letturaIn(t.testo, p.durata))
      .map((t) => `frase ${k + 1} (${p.tipo}, ${p.durata} frame): «${t.testo}» intero al ${t.da}, resta ${p.durata - t.da} frame su ${letturaIn(t.testo, p.durata)}`);
  });
};

// Il difetto: un testo che la voce porta a fine frase compariva e spariva subito con lo stacco. Ogni testo a schermo resta
// intero almeno la sua lettura (piena dai 3,6 s di scena, meta' scena sotto), con ogni tipo di scena e la voce stimata.
// Sotto i 2,6 s, nelle scene a sequenza (checklist, passi, flusso…) possono vincere le distanze minime fra gli elementi.
test("ogni testo a schermo resta da leggere prima dello stacco, con frasi da 2,6 a 7 secondi", () => {
  let casi = 0;
  for (const nome of fixture) {
    const sb = leggi<Storyboard>(nome);
    for (const secondi of [2.6, 3, 3.6, 4.3, 5, 7]) {
      const timing: Timing = { voce: "elevenlabs", clips: sb.frasi.map(() => ({ file: "x.wav", secondi, inviluppo: Array(Math.round(secondi * 30)).fill(0.5) })) };
      assert.deepEqual(mancanti(sb, timing), [], `${nome} a ${secondi} s`);
      casi += sb.frasi.length;
    }
  }
  assert.ok(casi > 500, `${casi} casi`);
});

test("la frase detta del gancio anticipa solo le ultime parole, in ordine, perche' l'ultima resti da leggere", () => {
  // una parola ogni 8 frame in una scena di 90: «router?» detta al frame 70, a un terzo di secondo dallo stacco
  const parole = "Hai provato a spegnere il router?".split(" ").map((t, i) => ({ t, da: i * 8 + 30 }));
  const fuori = codaInTempo(parole, 90);
  assert.ok(90 - intera(fuori.at(-1)!) >= letturaIn("router?", 90));
  assert.deepEqual(fuori.slice(0, 3), parole.slice(0, 3), "le prime restano sulla voce");
  assert.notDeepEqual(fuori.slice(3), parole.slice(3));
  for (let i = 1; i < fuori.length; i++) assert.ok(fuori[i].da >= fuori[i - 1].da);
  assert.deepEqual(codaInTempo(parole, 300), parole, "in una scena lunga nessuna si sposta");
});

test("con la voce vera di windows10 ogni testo resta da leggere prima dello stacco", () => {
  const { storyboard, timing } = leggi<{ storyboard: Storyboard; timing: Timing }>("windows10.props.json");
  assert.deepEqual(mancanti(storyboard, timing), []);
});

test("la lettura scala solo nelle scene sotto i 3,6 s: sopra, ogni testo ha la lettura piena", () => {
  for (const testo of ["Bluetooth", "Un suono, non la voce", "finché il download finisce"]) {
    for (let durata = SCENA_PIENA; durata < 400; durata += 7) assert.equal(letturaIn(testo, durata), lettura(testo));
    assert.ok(letturaIn(testo, 60) < lettura(testo));
  }
});
