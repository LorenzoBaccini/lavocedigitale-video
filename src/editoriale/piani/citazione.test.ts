import { test } from "node:test";
import assert from "node:assert/strict";

import { costruisciLinea } from "../../linea.ts";
import { sottotitoloAlFrame } from "../../sottotitoloAlFrame.ts";
import type { Storyboard } from "../../storyboard/tipi.ts";
import type { Timing } from "../../timing.ts";
import type { Voce } from "../voce.ts";
import { paroleCitazione } from "./citazione.ts";

// la voce in frame dall'inizio della scena, una parola ogni `passo` frame a partire da `da`
const voce = (testo: string, da = 4, passo = 9): Voce => ({
  parole: testo.split(" ").map((t, i) => ({ t, da: da + i * passo, a: da + i * passo + passo - 1 })),
  chiave: 0,
  chiaveFine: 1,
});

// la prova sul runner del 5 novembre: la voce dice altro, «Il vecchio» arriva a 3,75 s
const DETTA = "Dal sette luglio duemilaventisei c'è un portale nuovo. Il vecchio resta.";
const CITAZIONE = "il vecchio e il nuovo portale web saranno disponibili in parallelo";

test("una citazione che la voce non legge si compone subito, non aspetta le parole comuni dette dopo", () => {
  const parole = paroleCitazione(CITAZIONE, voce(DETTA));
  assert.equal(parole[0].da, 6);
  assert.deepEqual(parole.map((p) => p.da), parole.map((_, i) => 6 + 2 * i));
  assert.ok(parole[parole.length - 1].da < 40, `ultima parola a ${parole[parole.length - 1].da}`);
});

test("una citazione letta dalla voce dall'inizio segue la voce, parola per parola", () => {
  const detta = voce(CITAZIONE);
  const parole = paroleCitazione(CITAZIONE, detta);
  assert.equal(parole[0].da, 6);
  assert.equal(parole[3].da, detta.parole[3].da);
  assert.equal(parole[parole.length - 1].da, detta.parole[detta.parole.length - 1].da);
});

test("una citazione letta dalla voce ma solo a meta' frase non aspetta: si compone subito", () => {
  const detta = voce(`Lo dice la Regione con queste parole: ${CITAZIONE}`);
  const parole = paroleCitazione(CITAZIONE, detta);
  assert.equal(parole[0].da, 6);
  assert.ok(parole.every((p, i) => p.da === 6 + 2 * i));
});

test("il primo virgolettato non entra mai dopo l'inizio del parlato", () => {
  for (const [testo, detta] of [[CITAZIONE, DETTA], [CITAZIONE, CITAZIONE], ["e poi resta", "Il portale resta e poi resta"]]) {
    const v = voce(detta);
    assert.ok(paroleCitazione(testo, v)[0].da <= Math.max(6, v.parole[0].da) + 2, `${testo} / ${detta}`);
  }
});

// una frase con la citazione e la chiusura, con i tempi veri della voce (una parola ogni 0,3 s)
function video(detta: string, citazione: string) {
  const clip = (testo: string) => {
    const parole = testo.split(" ").map((t, i) => ({ t, da: 0.1 + i * 0.3, a: 0.35 + i * 0.3 }));
    return { file: "x.wav", secondi: parole.length * 0.3 + 0.4, inviluppo: [0.5], parole };
  };
  const chiusura = "Trovi tutto su la voce digitale punto it, il link è nel post.";
  const storyboard: Storyboard = {
    slug: "x",
    frasi: [
      { testo: detta, chiave: detta.split(" ")[0], scena: { tipo: "citazione", testo: citazione, fonte: "Regione" } },
      { testo: chiusura, chiave: "link", scena: { tipo: "chiusura" } },
    ],
  };
  const timing: Timing = { voce: "elevenlabs", clips: [clip(detta), clip(chiusura)] };
  return { storyboard, timing, linea: costruisciLinea(timing, 30) };
}

test("ridondanza: la citazione a schermo da subito nasconde i sottotitoli che la ripetono, non gli altri", () => {
  // la voce legge la citazione dopo un attacco: la citazione si compone subito, i blocchi che la ripetono spariscono
  const letta = video(`Lo dice la Regione: ${CITAZIONE}`, CITAZIONE);
  const blocchi = [5, 40, 70, 100].map((f) => sottotitoloAlFrame(letta.storyboard, letta.timing, letta.linea, f));
  assert.equal(blocchi[0].ridondante, false, blocchi[0].blocco.parole.map((p) => p.t).join(" "));
  for (const b of blocchi.slice(1)) assert.equal(b.ridondante, true, b.blocco.parole.map((p) => p.t).join(" "));
  // la voce dice altro (prova sul runner): i sottotitoli restano tutti
  const diversa = video(DETTA, CITAZIONE);
  for (const f of [5, 40, 80, 110]) assert.equal(sottotitoloAlFrame(diversa.storyboard, diversa.timing, diversa.linea, f).ridondante, false, `frame ${f}`);
});
