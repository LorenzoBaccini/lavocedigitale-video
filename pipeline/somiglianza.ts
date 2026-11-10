import { spawn } from "node:child_process";

import { improntaMescolata as hash } from "../src/editoriale/impronta.ts";
import type { Variante } from "../src/editoriale/variante.ts";
import { ATTIVI } from "../src/editoriale/variante.ts";
import type { VoceStorico } from "./storico.ts";

/** Sei fotogrammi, ognuno "dHash in 16 esadecimali" + "#rrggbb" del colore medio: 23 caratteri. */
export type Impronta = string[];

export const N_FOTOGRAMMI = 6;
/** Quanti video recenti con impronta si confrontano; e' anche la memoria dei tentativi nella scelta di stile e gancio. */
export const CONFRONTATI = 3;
export const MAX_TENTATIVI = 3;
/** Sotto questa distanza dal video piu' vicino si cambia variante: taratura nel README. */
export const SOGLIA = 0.32;
/** Il peso della forma (dHash) contro quello del colore medio nella distanza di un fotogramma: tarato col resto, vedi README. */
export const PESO_FORMA = 0.65;
const PESI = [2, 1, 1, 1, 1, 1];

const FOTOGRAMMA = /^[0-9a-f]{16}#[0-9a-f]{6}$/;

export const èImpronta = (v: unknown): v is Impronta => Array.isArray(v) && v.length === N_FOTOGRAMMI && v.every((f) => typeof f === "string" && FOTOGRAMMA.test(f));

/** Inizio, 1 s, 30, 50, 70 e 90 per cento della durata; ogni frame dentro il video. */
export function fotogrammiFissi(totale: number, fps: number): number[] {
  return [0, fps, 0.3 * totale, 0.5 * totale, 0.7 * totale, 0.9 * totale].map((f) => Math.min(totale - 1, Math.round(f)));
}

/** 72 pixel grigi di un'immagine 9×8, riga per riga: 64 bit, 1 dove il pixel e' piu' chiaro del vicino a destra. */
export function dHash(grigi: Uint8Array): string {
  let esa = "";
  for (let nibble = 0; nibble < 16; nibble++) {
    let n = 0;
    for (let b = 0; b < 4; b++) {
      const bit = nibble * 4 + b;
      const p = Math.floor(bit / 8) * 9 + (bit % 8);
      n = (n << 1) | (grigi[p] > grigi[p + 1] ? 1 : 0);
    }
    esa += n.toString(16);
  }
  return esa;
}

export const coloreHex = (rgb: Uint8Array): string => `#${[...rgb.slice(0, 3)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

function bitDiversi(a: string, b: string): number {
  let n = 0;
  for (let i = 0; i < 16; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    for (; x; x &= x - 1) n++;
  }
  return n;
}

function distanzaColore(a: string, b: string): number {
  const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) / Math.hypot(255, 255, 255);
}

/** 0 per impronte uguali, 1 per opposte: per fotogramma forma e colore pesati, poi media col primo fotogramma doppio. */
export function distanza(a: Impronta, b: Impronta): number {
  let somma = 0;
  for (let i = 0; i < N_FOTOGRAMMI; i++) {
    const forma = bitDiversi(a[i].slice(0, 16), b[i].slice(0, 16)) / 64;
    const colore = distanzaColore(a[i].slice(16), b[i].slice(16));
    somma += PESI[i] * (PESO_FORMA * forma + (1 - PESO_FORMA) * colore);
  }
  return somma / PESI.reduce((x, y) => x + y, 0);
}

/** Il piu' vicino fra gli ultimi `CONFRONTATI` video che hanno un'impronta; `undefined` se nessuno ce l'ha. */
export function confronta(impronta: Impronta, recenti: VoceStorico[]): { slug: string; distanza: number } | undefined {
  const confrontabili = recenti.filter((v) => èImpronta(v.impronta)).slice(0, CONFRONTATI);
  return confrontabili
    .map((v) => ({ slug: v.slug, distanza: distanza(impronta, v.impronta as Impronta) }))
    .reduce<{ slug: string; distanza: number } | undefined>((min, c) => (!min || c.distanza < min.distanza ? c : min), undefined);
}

// Come in scegliVariante: senza stile la voce e' di prima degli stili, cioe' scrivania.
const valore = (v: Partial<Variante>, dim: "stile" | "gancio") => (dim === "stile" ? (v.stile ?? "scrivania") : v.gancio);

function cambia<K extends "stile" | "gancio">(dim: K, slug: string, tentativo: number, provate: Variante[], recenti: Partial<Variante>[]): Variante[K] {
  const nonProvate = (ATTIVI[dim] as readonly Variante[K][]).filter((o) => !provate.some((p) => p[dim] === o));
  const opzioni = nonProvate.length > 0 ? nonProvate : (ATTIVI[dim] as readonly Variante[K][]);
  const pesca = (libere: readonly Variante[K][]) => libere[hash(`${slug}:somiglianza:${dim}:${tentativo}`) % libere.length];
  for (let profondita = CONFRONTATI; profondita > 0; profondita--) {
    const usate = new Set(recenti.slice(0, profondita).map((v) => valore(v, dim)));
    const libere = opzioni.filter((o) => !usate.has(o));
    if (libere.length > 0) return pesca(libere);
  }
  return pesca(opzioni);
}

/**
 * La variante del tentativo `tentativo` (2 o 3): cambia lo stile; il gancio cambia al terzo, o gia' al secondo se lo stile
 * nuovo con quel gancio e' fra gli ultimi `CONFRONTATI`, verso un gancio non usato con quello stile. Voce e copione sono gia' pagati:
 * frase finale e durata restano, come musica, luce, apertura e chiusura.
 */
export function prossimaVariante(slug: string, attuale: Variante, tentativo: number, provate: Variante[], recenti: Partial<Variante>[]): Variante {
  const stile = cambia("stile", slug, tentativo, provate, recenti);
  const conStile = recenti.slice(0, CONFRONTATI).filter((v) => valore(v, "stile") === stile);
  const coppiaRecente = conStile.some((v) => v.gancio === attuale.gancio);
  const gancio = tentativo >= 3 || coppiaRecente ? cambia("gancio", slug, tentativo, provate, conStile) : attuale.gancio;
  return { ...attuale, stile, gancio };
}

export interface Scelta {
  variante: Variante;
  /** assente se il controllo e' saltato: lo storico tiene la voce senza impronta */
  impronta?: Impronta;
  riga: string;
}

interface Tentativo {
  variante: Variante;
  impronta: Impronta;
  vicino: { slug: string; distanza: number };
}

const nome = (v: Variante) => `${v.stile}/${v.gancio}`;
const due = (n: number) => n.toFixed(2);
const messaggio = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Il controllo di somiglianza: `variante` ha gia' passato l'impaginazione. Mai un blocco: un errore salta il controllo,
 * tre tentativi vicini tengono il piu' lontano.
 */
export async function scegliDiversa(a: {
  slug: string;
  variante: Variante;
  recenti: VoceStorico[];
  impronta: (v: Variante) => Promise<Impronta>;
  controllaImpaginazione: (v: Variante) => Promise<string[]>;
}): Promise<Scelta> {
  let prima: Impronta;
  try {
    prima = await a.impronta(a.variante);
  } catch (e) {
    return { variante: a.variante, riga: `Somiglianza: controllo saltato: ${messaggio(e)}` };
  }
  const vicino = confronta(prima, a.recenti);
  if (!vicino) return { variante: a.variante, impronta: prima, riga: "Somiglianza: nessun video recente con impronta, niente confronto" };
  if (vicino.distanza >= SOGLIA) return { variante: a.variante, impronta: prima, riga: `Somiglianza: ok, distanza minima ${due(vicino.distanza)} da ${vicino.slug}` };

  const fatti: Tentativo[] = [{ variante: a.variante, impronta: prima, vicino }];
  const provate = [a.variante];
  const note = [`${nome(a.variante)} a ${due(vicino.distanza)} da ${vicino.slug}`];
  const recentiVarianti = a.recenti.map((v) => v.variante);
  let interrotto: string | undefined;
  for (let t = 2; t <= MAX_TENTATIVI; t++) {
    const v = prossimaVariante(a.slug, provate[provate.length - 1], t, provate, recentiVarianti);
    provate.push(v);
    try {
      if ((await a.controllaImpaginazione(v)).length > 0) {
        note.push(`${nome(v)} scartata dall'impaginazione`);
        continue;
      }
      const imp = await a.impronta(v);
      const c = confronta(imp, a.recenti) as Tentativo["vicino"];
      fatti.push({ variante: v, impronta: imp, vicino: c });
      if (c.distanza >= SOGLIA) {
        const cambi = provate.length - 1;
        return { variante: v, impronta: imp, riga: `Somiglianza: cambiata variante ${cambi} ${cambi === 1 ? "volta" : "volte"} (${note.join("; ")}), ok con ${nome(v)}, distanza minima ${due(c.distanza)} da ${c.slug}` };
      }
      note.push(`${nome(v)} a ${due(c.distanza)} da ${c.slug}`);
    } catch (e) {
      interrotto = messaggio(e);
      break;
    }
  }
  const lontano = fatti.reduce((m, f) => (f.vicino.distanza > m.vicino.distanza ? f : m));
  const perche = interrotto ? `controllo interrotto: ${interrotto}` : `${MAX_TENTATIVI} tentativi sotto soglia ${due(SOGLIA)}`;
  return {
    variante: lontano.variante,
    impronta: lontano.impronta,
    riga: `Somiglianza: ${perche} (${note.join("; ")}), tenuta la più lontana: ${nome(lontano.variante)}, ${due(lontano.vicino.distanza)} da ${lontano.vicino.slug}`,
  };
}

export function ffmpeg(argomenti: string[], ingresso?: Buffer): Promise<Buffer> {
  return new Promise((risolvi, rifiuta) => {
    const figlio = spawn("ffmpeg", ["-v", "error", ...argomenti], { stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    figlio.stdout.on("data", (d: Buffer) => out.push(d));
    figlio.stderr.on("data", (d) => (err += d));
    figlio.on("error", rifiuta);
    figlio.on("close", (codice) => (codice === 0 ? risolvi(Buffer.concat(out)) : rifiuta(new Error(`ffmpeg è uscito con codice ${codice}: ${err.trim()}`))));
    figlio.stdin.on("error", () => {});
    figlio.stdin.end(ingresso);
  });
}

/**
 * L'impronta di un fotogramma (png o qualsiasi immagine che ffmpeg legge): dHash da 9×8 grigio e colore da 1×1.
 * `flags=area` fa la media vera dei pixel: col bicubico di default l'1×1 campionerebbe solo il centro.
 */
export async function improntaFotogramma(immagine: Buffer): Promise<string> {
  const grigi = await ffmpeg(["-i", "pipe:0", "-vf", "scale=9:8:flags=area,format=gray", "-f", "rawvideo", "pipe:1"], immagine);
  const rgb = await ffmpeg(["-i", "pipe:0", "-vf", "scale=1:1:flags=area,format=rgb24", "-f", "rawvideo", "pipe:1"], immagine);
  if (grigi.length !== 72 || rgb.length !== 3) throw new Error(`ffmpeg: ${grigi.length} byte di grigio e ${rgb.length} di colore, attesi 72 e 3`);
  return dHash(grigi) + coloreHex(rgb);
}
