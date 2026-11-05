import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { costruisciLinea } from "../../linea.ts";
import { propsFrase } from "../../scenes/propsFrase.ts";
import type { Storyboard } from "../../storyboard/tipi.ts";
import type { Timing } from "../../timing.ts";
import { pausaPiuLunga, PAUSA_MAX } from "../regia.ts";
import { NOTIFICA_PX, rettangoloInQuadro } from "../set/geometria.ts";
import { CORPO_NOTIFICA } from "../set/disegni.ts";
import { CORPO_NOTIFICA_TELEFONO, NOTIFICA_TELEFONO_PX, rettangoloTelefono } from "../set/telefono.ts";
import { cameraAllarme, cameraAllarmeTelefono, NOTIFICA_IN_QUADRO, pianoAllarme } from "./allarme.ts";
import { pianoChecklist } from "./checklist.ts";
import { pianoChiusura } from "./chiusura.ts";
import { pianoData } from "./data.ts";
import { FRECCIA, PASSO_NOTE, pianoDocumenti } from "./documenti.ts";
import { pianoGancio } from "./gancio.ts";
import { pianoScena } from "./index.ts";
import { pianoOggetto } from "./oggetto.ts";
import { pianoTelefono } from "./telefono.ts";

const leggi = (nome: string) => JSON.parse(readFileSync(new URL(`../../../fixtures/${nome}`, import.meta.url), "utf8"));
const props = leggi("windows10.props.json") as { storyboard: Storyboard; timing: Timing };
const linea = costruisciLinea(props.timing, 30);
const scena = (i: number) => propsFrase(props.storyboard, props.timing, linea, i);

// le fixture senza voce: clip di `secondi` con l'inviluppo piatto, tempi stimati
const senzaVoce = (sb: Storyboard, secondi: number) => {
  const timing: Timing = { voce: "elevenlabs", clips: sb.frasi.map(() => ({ file: "x.wav", secondi, inviluppo: Array(Math.round(secondi * 30)).fill(0.5) })) };
  const l = costruisciLinea(timing, 30);
  return sb.frasi.map((_, i) => propsFrase(sb, timing, l, i));
};
const tutte = [leggi("tutte-le-scene.storyboard.json"), leggi("tutte-le-scene-2.storyboard.json"), leggi("tutte-le-scene-3.storyboard.json"), props.storyboard] as Storyboard[];

test("nessuna inquadratura resta ferma oltre 2,5 s, con la voce vera e con frasi lunghe", () => {
  const casi = [...props.storyboard.frasi.map((_, i) => scena(i)), ...tutte.flatMap((sb) => [...senzaVoce(sb, 3), ...senzaVoce(sb, 7)])];
  for (const p of casi) {
    const { eventi } = pianoScena(p, p.durata);
    assert.ok(pausaPiuLunga(eventi, p.durata) <= PAUSA_MAX, `${p.tipo} (${p.durata} frame): pausa ${pausaPiuLunga(eventi, p.durata)}`);
  }
});

test("i foley cadono dentro la scena", () => {
  for (const p of tutte.flatMap((sb) => senzaVoce(sb, 3))) {
    for (const e of pianoScena(p, p.durata).suoni) assert.ok(e.da >= 0 && e.da < p.durata, `${p.tipo}: ${e.suono} a ${e.da}`);
  }
});

test("il gancio scrive la frase detta, la chiave in grande; il sottotitolo non la ripete", () => {
  const p = scena(0);
  if (p.tipo !== "gancio") throw new Error("la fixture parte dal gancio");
  const piano = pianoGancio(p, p.durata);
  assert.deepEqual(piano.parole.map((w) => w.t), ["Devi", "reinstallare", "Windows", "10", "da", "zero?"]);
  assert.deepEqual(piano.grande, [2, 4]);
  assert.deepEqual(piano.testi, [{ testo: "Devi reinstallare Windows 10 da zero?", da: 0 }]);
  // prima dell'allarme arriva la notifica, e la camera va da lei fino allo stacco
  assert.ok(piano.notifica !== undefined && piano.notifica < p.durata);
  assert.equal(piano.spinta.a, p.durata);
});

test("la notifica dell'allarme si legge sul telefono: il messaggio supera i 34 px", () => {
  const p = scena(1);
  if (p.tipo !== "allarme") throw new Error("la seconda frase e' l'allarme");
  const piano = pianoAllarme(p, p.durata);
  assert.equal(piano.messaggio, "Aggiornamenti di sicurezza non più disponibili per questo PC");
  assert.ok(piano.arrivo < 0, "la notifica e' gia' arrivata nel gancio");
  const r = rettangoloInQuadro(NOTIFICA_PX, cameraAllarme(0, p.durata, []));
  const corpo = (CORPO_NOTIFICA * r.w) / NOTIFICA_PX.w;
  assert.ok(corpo >= 34, `corpo ${corpo}`);
  assert.ok(Math.abs(r.w - NOTIFICA_IN_QUADRO.larghezza) < 40, `larghezza ${r.w}`);
  assert.ok(r.x >= 60 && r.x + r.w <= 1020);
});

test("senza il campo notifica il messaggio e' la frase detta", () => {
  const [, allarme] = senzaVoce(leggi("tutte-le-scene.storyboard.json"), 3);
  if (allarme.tipo !== "allarme") throw new Error("la seconda frase e' l'allarme");
  assert.equal(pianoAllarme(allarme, allarme.durata).messaggio, "E il permesso glielo hai dato tu");
});

test("la conferma arriva dopo i titoli e resta a schermo abbastanza da leggerla", () => {
  const p = senzaVoce(leggi("tutte-le-scene.storyboard.json"), 7)[2];
  if (p.tipo !== "oggetto") throw new Error("la terza frase e' l'oggetto");
  const piano = pianoOggetto(p, p.durata);
  assert.ok(piano.conferma !== undefined && piano.indica !== undefined);
  assert.ok(piano.conferma >= piano.indica + 22);
  assert.ok(p.durata - piano.conferma >= 22);
  assert.ok(piano.testi.some((t) => t.testo === p.conferma));
});

test("sul portatile indica e' il pulsante: si cerchia dopo i titoli e prima dello stacco", () => {
  const p = scena(5);
  if (p.tipo !== "oggetto") throw new Error("la sesta frase e' l'oggetto");
  const piano = pianoOggetto(p, p.durata);
  assert.ok(piano.indica !== undefined && piano.indica < p.durata - 29);
  assert.ok(piano.testi.some((t) => t.testo === "Iscriviti ora"));
});

test("la chiusura sottolinea l'indirizzo quando la voce lo dice", () => {
  const p = scena(7);
  if (p.tipo !== "chiusura") throw new Error("l'ultima frase e' la chiusura");
  const piano = pianoChiusura(p, p.durata);
  const detto = p.voce.parole.find((w) => w.t.startsWith("lavocedigitale"))!.da;
  assert.equal(piano.sottolinea, detto + 8);
  assert.deepEqual(piano.testi.map((t) => t.testo), ["La Voce Digitale", "lavocedigitale.it"]);
});

test("sulla data il cerchio cade quando la voce dice il giorno, il barrato dopo, il timbro per ultimo", () => {
  const p = scena(2);
  if (p.tipo !== "data") throw new Error("la terza frase e' la data");
  const piano = pianoData(p, p.durata);
  assert.equal(piano.cerchio, p.voce.parole.find((w) => w.t === "14")!.da);
  assert.ok(piano.cerchio < piano.scritto! && piano.scritto! < piano.barra!);
  const fine = scena(6);
  if (fine.tipo !== "data") throw new Error("la settima frase e' la data");
  const dopo = pianoData(fine, fine.durata);
  assert.equal(dopo.cerchio, fine.voce.parole.find((w) => w.t === "12")!.da);
  assert.ok(dopo.barra === undefined && dopo.timbro! > dopo.cerchio && dopo.timbro! < fine.durata);
});

test("le voci della checklist entrano in ordine, ognuna quando la voce la nomina se la nomina", () => {
  const p = scena(4);
  if (p.tipo !== "checklist") throw new Error("la quinta frase e' la checklist");
  const piano = pianoChecklist(p, p.durata);
  for (let i = 1; i < piano.voci.length; i++) assert.ok(piano.voci[i] >= piano.voci[i - 1] + 14);
  // «≥ 8 GB / la chiavetta USB» entra su «chiavetta,», le altre due sulla loro prima parola piena: «stessa» (la prima e la seconda volta)
  const stessa = p.voce.parole.filter((w) => w.t === "stessa");
  const dette = [p.voce.parole.find((w) => w.t === "chiavetta,")!, stessa[0], stessa[1]];
  dette.forEach((w, i) => {
    assert.equal(piano.voci[i], Math.max(i ? piano.voci[i - 1] + 14 : 8, w.da));
  });
});

test("sul foglio il fruscio della carta c'e' solo arrivando dal set", () => {
  const dalSet = scena(2);
  const daCarta = { ...scena(7), contesto: { precedente: "checklist" as const } };
  assert.ok(pianoScena(dalSet, dalSet.durata).suoni.some((e) => e.suono === "carta"));
  assert.ok(!pianoScena(daCarta, daCarta.durata).suoni.some((e) => e.suono === "carta"));
});

const terza = (secondi: number) => senzaVoce(leggi("tutte-le-scene-3.storyboard.json"), secondi);

test("dispositivo e schermata arrivano alle scene gia' decisi, dal testo della frase", () => {
  const [gancio, allarme, , rischio] = terza(3);
  assert.equal(gancio.tipo === "gancio" && gancio.schermata, "sito");
  assert.equal(allarme.tipo === "allarme" && allarme.dispositivo, "smartphone");
  assert.equal(rischio.tipo === "rischio" && rischio.dispositivo, "smartphone");
  const w = scena(3);
  assert.equal(w.tipo === "rischio" && w.dispositivo, "portatile");
  const o = scena(5);
  assert.equal(o.tipo === "oggetto" && o.schermata, "sistema");
});

test("sul telefono l'allarme arriva nella sua scena, anche dopo il gancio, e il messaggio supera i 34 px", () => {
  const [gancio, p] = terza(3);
  if (gancio.tipo !== "gancio" || p.tipo !== "allarme") throw new Error("gancio e allarme");
  assert.equal(pianoGancio(gancio, gancio.durata).notifica, undefined, "il gancio non fa arrivare la notifica sul portatile");
  const piano = pianoAllarme(p, p.durata);
  assert.equal(piano.dispositivo, "smartphone");
  assert.ok(piano.arrivo >= 0 && piano.suoni.some((s) => s.suono === "notifica"));
  const r = rettangoloTelefono(NOTIFICA_TELEFONO_PX, cameraAllarmeTelefono(0, p.durata, []));
  assert.ok((CORPO_NOTIFICA_TELEFONO * r.w) / NOTIFICA_TELEFONO_PX.w >= 34, `larghezza ${r.w}`);
  assert.ok(r.x >= 40 && r.x + r.w <= 1040);
});

test("telefono: il barrato cade quando la voce nomina l'opzione esclusa, il cerchio dopo, tutto dentro la scena", () => {
  for (const secondi of [3, 7]) {
    const p = terza(secondi)[2];
    if (p.tipo !== "telefono") throw new Error("la terza frase e' il telefono");
    const piano = pianoTelefono(p, p.durata);
    assert.equal(piano.esclusa?.indice, 2);
    // tre opzioni, una esclusa: ne restano due, nessun cerchio
    assert.equal(piano.cerchio, undefined);
    assert.ok(piano.esclusa!.da <= p.durata - 34);
    // le opzioni sono testo a schermo: il sottotitolo non le ripete
    assert.deepEqual(piano.testi.slice(0, 3).map((t) => t.testo), p.opzioni);
    // con due opzioni si cerchia quella che resta, dopo il barrato
    const due = { ...p, opzioni: ["Entra con SPID", "Entra con CIE"], esclusa: "Entra con SPID" };
    const piano2 = pianoTelefono(due, p.durata);
    assert.equal(piano2.cerchio?.indice, 1);
    assert.ok(piano2.cerchio!.da >= piano2.esclusa!.da && piano2.cerchio!.da <= p.durata - 16);
  }
});

test("documenti: una nota per pezzo, in ordine, distanziate e dentro la scena", () => {
  for (const secondi of [3, 7]) {
    const p = terza(secondi)[4];
    if (p.tipo !== "documenti") throw new Error("la quinta frase e' documenti");
    const piano = pianoDocumenti(p, p.durata);
    assert.equal(piano.note.length, p.pezzi.length);
    for (let i = 1; i < piano.note.length; i++) assert.ok(piano.note[i] >= piano.note[i - 1] + PASSO_NOTE);
    assert.ok(piano.note.at(-1)! + FRECCIA + 6 <= p.durata - 10);
    assert.deepEqual(piano.testi.slice(2).map((t) => t.testo), p.pezzi.map((x) => x.nota));
  }
});

test("ogni testo e' intero prima dello stacco, anche nelle frasi brevi senza voce", () => {
  for (const p of tutte.flatMap((sb) => senzaVoce(sb, 3))) {
    for (const t of pianoScena(p, p.durata).testi) assert.ok(t.da <= p.durata - 10, `${p.tipo}: «${t.testo}» a ${t.da} di ${p.durata}`);
  }
});
