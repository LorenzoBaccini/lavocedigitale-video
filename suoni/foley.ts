import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { èPrincipale } from "../pipeline/principale.ts";
import { fileTema, NOMI_TEMI, sottofondo, TEMI } from "./sottofondo.ts";

// Foley sintetizzati del video: notifica, colpo sordo, timbro, clic, carta, tono di stanza, e i temi del sottofondo musicale.
// I segni a mano sono muti: il fruscio del pennarello sulle parole evidenziate disturbava la voce.
// Niente file con diritti, niente whoosh: ogni suono passa per la stessa piccola stanza, cosi' sembrano
// registrati nello stesso posto. Il render li rigenera ogni volta (pochi secondi): non stanno in git.

export const SR = 48_000;
/** Cartella dei wav, relativa alla radice del repo; la composizione li legge da `suoni/editoriale/`. */
export const CARTELLA = "public/suoni/editoriale";
// la voce parlata sta a circa -21 dBFS RMS: la stanza resta ~30 dB sotto, i foley sono brevi e misurati
const STANZA_RMS_DB = -52;
const STANZA_S = 10;

type Segnale = Float64Array;

/** Generatore con seme: lo stesso suono a ogni render. */
export function rumoreBianco(seme: number) {
  let s = Math.max(1, Math.floor(seme)) % 2147483647;
  const u = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // Box-Muller: rumore gaussiano
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

const campioni = (secondi: number) => Math.round(secondi * SR);
const db = (x: number) => 10 ** (x / 20);
const tempo = (i: number) => i / SR;

const rumore = (n: number, seme: number): Segnale => {
  const r = rumoreBianco(seme);
  return Float64Array.from({ length: n }, r);
};

export function passaBasso(x: Segnale, taglio: number): Segnale {
  const a = Math.exp((-2 * Math.PI * taglio) / SR);
  const y = new Float64Array(x.length);
  let v = 0;
  for (let i = 0; i < x.length; i++) y[i] = v = (1 - a) * x[i] + a * v;
  return y;
}

/** Biquad passa-banda (RBJ) a frequenza fissa. */
export function passaBanda(x: Segnale, centro: number, q: number): Segnale {
  const w = (2 * Math.PI * centro) / SR;
  const alfa = Math.sin(w) / (2 * q);
  const [a0, a1, a2] = [1 + alfa, -2 * Math.cos(w), 1 - alfa];
  const y = new Float64Array(x.length);
  let [x1, x2, y1, y2] = [0, 0, 0, 0];
  for (let i = 0; i < x.length; i++) {
    const v = (alfa * x[i] - alfa * x2 - a1 * y1 - a2 * y2) / a0;
    [x2, x1, y2, y1] = [x1, x[i], y1, v];
    y[i] = v;
  }
  return y;
}

const picco = (x: Segnale) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const scala = (x: Segnale, k: number) => x.map((v) => v * k);

/** Piccola stanza: risposta all'impulso di rumore scuro che decade, diversa sui due canali. */
function stanza(x: Segnale, mandata: number, coda = 0.2): [Segnale, Segnale] {
  const n = campioni(coda);
  return [1, 2].map((seme) => {
    const ir = passaBasso(rumore(n, seme * 101).map((v, i) => v * Math.exp(-tempo(i) / (coda / 6.5))), 3200);
    ir.fill(0, 0, campioni(0.004)); // primo riflesso dopo 4 ms
    const norma = Math.sqrt(ir.reduce((s, v) => s + v * v, 0));
    const y = new Float64Array(x.length + n);
    for (let i = 0; i < x.length; i++) {
      y[i] += x[i];
      if (x[i] === 0) continue;
      const k = (mandata * x[i]) / norma;
      for (let j = 0; j < n; j++) y[i + j] += k * ir[j];
    }
    return y;
  }) as [Segnale, Segnale];
}

/** Il suono passa per la stanza e il canale piu' forte arriva al picco indicato. */
function conStanza(x: Segnale, piccoDb: number, mandata: number): [Segnale, Segnale] {
  const [s, d] = stanza(scala(x, 1 / (picco(x) || 1)), mandata);
  const k = db(piccoDb) / Math.max(picco(s), picco(d));
  return [scala(s, k), scala(d, k)];
}

/** Barra di legno: fondamentale corta e una parziale inarmonica a 3,93× che muore subito. */
function notaLegno(t: number, f: number) {
  const inviluppo = (1 - Math.exp(-t / 0.0015)) * Math.exp(-t / 0.13);
  return (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 3.93 * t) * Math.exp(-t / 0.02)) * inviluppo;
}

/** Colpo sordo: corpo che scende di frequenza, legno, un attacco secco; saturato appena. */
function colpo(durata: number, base: number, salto: number, seme: number, legnoHz: number): Segnale {
  const n = campioni(durata);
  const legno = passaBanda(rumore(n, seme), legnoHz, 2.5);
  const attacco = passaBasso(rumore(n, seme + 1), 1800);
  let fase = 0;
  return Float64Array.from({ length: n }, (_, i) => {
    const t = tempo(i);
    fase += (2 * Math.PI * (base + salto * Math.exp(-t / 0.018))) / SR;
    const corpo = Math.sin(fase) * (1 - Math.exp(-t / 0.002)) * Math.exp(-t / 0.06);
    return Math.tanh(1.4 * (corpo + 1.6 * legno[i] * Math.exp(-t / 0.03) + 1.2 * attacco[i] * Math.exp(-t / 0.004)));
  });
}

export type Stereo = [Segnale, Segnale];

export const FOLEY: Record<string, () => Stereo> = {
  // notifica di sistema: due note da xilofono di legno, Do6 poi Sol6
  notifica: () => {
    const n = campioni(0.6);
    const x = Float64Array.from({ length: n }, (_, i) => {
      const t = tempo(i);
      return 0.8 * notaLegno(t, 1046.5) + (t >= 0.085 ? notaLegno(t - 0.085, 1568) : 0);
    });
    return conStanza(passaBasso(x, 6000), -22, 0.22);
  },
  // palmo sul piano della scrivania: niente sub, niente coda lunga
  tonfo: () => conStanza(colpo(0.35, 72, 60, 41, 420), -14, 0.12),
  // timbro di gomma sulla carta: piu' secco e piu' alto del tonfo, con lo schiocco della carta
  timbro: () => {
    const base = colpo(0.28, 120, 90, 47, 900);
    const carta = passaBanda(rumore(base.length, 53), 2600, 0.8).map((v, i) => v * 0.5 * Math.exp(-tempo(i) / 0.012));
    return conStanza(base.map((v, i) => v + carta[i]), -17, 0.12);
  },
  // chiavetta nella porta: due scatti metallici ravvicinati
  clic: () => {
    const n = campioni(0.16);
    const r = rumore(n, 59);
    const x = Float64Array.from({ length: n }, (_, i) => {
      const t = tempo(i);
      const a = Math.exp(-t / 0.0018);
      const b = t >= 0.045 ? 0.7 * Math.exp(-(t - 0.045) / 0.0025) : 0;
      return r[i] * (a + b) + 0.4 * Math.sin(2 * Math.PI * 3400 * t) * (a + b);
    });
    return conStanza(passaBanda(x, 3800, 0.9), -23, 0.2);
  },
  // foglio appoggiato sul piano: un fruscio che sale e si posa
  carta: () => {
    const n = campioni(0.42);
    const corpo = passaBanda(rumore(n, 61), 1500, 0.6);
    const aria = passaBanda(rumore(n, 62), 4800, 0.7);
    const x = corpo.map((v, i) => {
      const t = tempo(i) / 0.42;
      return (v + 0.5 * aria[i]) * Math.sin(Math.PI * t) ** 1.5 * (1 + 0.6 * Math.exp(-((t - 0.78) ** 2) / 0.002));
    });
    return conStanza(x, -30, 0.2);
  },
  // tono di stanza in loop: rumore scuro quasi impercettibile, toglie il silenzio digitale fra le parole
  stanza: () => {
    const n = campioni(STANZA_S);
    const giunta = campioni(0.5);
    return [71, 73].map((seme) => {
      const grezzo = passaBasso(passaBasso(rumore(n + giunta, seme), 380), 600);
      // la coda sfuma nella testa: il loop non ha scalini
      const x = grezzo.slice(0, n);
      for (let i = 0; i < giunta; i++) {
        const k = i / giunta;
        x[i] = Math.sqrt(k) * grezzo[i] + Math.sqrt(1 - k) * grezzo[n + i];
      }
      const rms = Math.sqrt(x.reduce((s, v) => s + v * v, 0) / n);
      return scala(x, db(STANZA_RMS_DB) / rms);
    }) as Stereo;
  },
};

/** Wav PCM 16 bit stereo. */
export function wav([s, d]: Stereo): Buffer {
  const n = Math.max(s.length, d.length);
  const dati = Buffer.alloc(n * 4);
  const pcm = (v = 0) => Math.round(Math.max(-1, Math.min(1, v)) * 32767);
  for (let i = 0; i < n; i++) {
    dati.writeInt16LE(pcm(s[i]), i * 4);
    dati.writeInt16LE(pcm(d[i]), i * 4 + 2);
  }
  const testa = Buffer.alloc(44);
  testa.write("RIFF", 0);
  testa.writeUInt32LE(36 + dati.length, 4);
  testa.write("WAVEfmt ", 8);
  testa.writeUInt32LE(16, 16);
  testa.writeUInt16LE(1, 20);
  testa.writeUInt16LE(2, 22);
  testa.writeUInt32LE(SR, 24);
  testa.writeUInt32LE(SR * 4, 28);
  testa.writeUInt16LE(4, 32);
  testa.writeUInt16LE(16, 34);
  testa.write("data", 36);
  testa.writeUInt32LE(dati.length, 40);
  return Buffer.concat([testa, dati]);
}

/** Scrive tutti i foley e tutti i temi del sottofondo in `cartella` (relativa alla cwd). */
export function generaFoley(cartella = CARTELLA): string[] {
  mkdirSync(cartella, { recursive: true });
  const temi = NOMI_TEMI.map((nome): [string, () => Stereo] => [fileTema(nome), () => sottofondo(TEMI[nome])]);
  const tutti: [string, () => Stereo][] = [...Object.entries(FOLEY), ...temi];
  return tutti.map(([nome, genera]) => {
    writeFileSync(join(cartella, `${nome}.wav`), wav(genera()));
    return nome;
  });
}

// Uso: node --experimental-strip-types suoni/foley.ts   (dalla cartella video/)
if (èPrincipale(import.meta.url)) {
  process.chdir(fileURLToPath(new URL("..", import.meta.url)));
  const inizio = Date.now();
  const nomi = generaFoley();
  console.log(`${nomi.length} foley in ${CARTELLA} (${((Date.now() - inizio) / 1000).toFixed(1)} s)`);
}
