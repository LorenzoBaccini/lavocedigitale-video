import { paroleAschermo } from "../paroleAschermo.ts";
import { normalizza } from "../sottotitoli.ts";
import { tempiParole } from "../tempiParole.ts";
import { testoAschermo } from "../testoAschermo.ts";
import type { Clip } from "../timing.ts";

/** Una parola nella forma a schermo («10», non «dieci») e il frame in cui la voce la comincia. */
export interface ParolaDetta {
  t: string;
  da: number;
  a: number;
}

/** Le parole della frase con i tempi della voce, in frame dall'inizio della scena, e dove sta la chiave. */
export interface Voce {
  parole: ParolaDetta[];
  /** indice della prima parola della chiave; se non si trova, l'ultima parola */
  chiave: number;
  /** indice dopo l'ultima parola della chiave */
  chiaveFine: number;
}

const FPS = 30;

/** Parole a schermo (cifre, niente punto finale) con i tempi della voce: veri se ci sono, altrimenti stimati. */
export const paroleDellaFrase = (testo: string, clip: Clip, inizio = 0): ParolaDetta[] => {
  const dette = tempiParole(testo, clip, FPS);
  return (paroleAschermo(dette) ?? dette).map((p) => ({ t: p.parola.replace(/\.$/, ""), da: inizio + p.da, a: inizio + p.a }));
};

const forme = (testo: string) => testoAschermo(testo).split(/\s+/).map(normalizza).filter(Boolean);

/** Indice della prima parola di `testo` dentro `parole`, cercando da `da`; -1 se non c'e'. */
export function cercaParole(parole: { t: string }[], testo: string, da = 0): number {
  const cercate = forme(testo);
  if (!cercate.length) return -1;
  for (let i = Math.max(0, da); i + cercate.length <= parole.length; i++) {
    if (cercate.every((c, j) => normalizza(parole[i + j].t) === c)) return i;
  }
  return -1;
}

export const posizioneChiave = (parole: { t: string }[], chiave: string) => cercaParole(parole, chiave);

export function voceDellaFrase(testo: string, chiave: string, clip: Clip): Voce {
  const parole = paroleDellaFrase(testo, clip);
  const k = posizioneChiave(parole, chiave);
  if (k < 0) return { parole, chiave: parole.length - 1, chiaveFine: parole.length };
  return { parole, chiave: k, chiaveFine: k + forme(chiave).length };
}

const VUOTE = new Set(["con", "il", "lo", "la", "le", "gli", "i", "e", "o", "di", "da", "del", "della", "per", "un", "una", "uno", "in", "al", "alla", "su", "sul", "nel"]);

/**
 * Frame in cui la voce dice una parola piena di `testo` (la prima che dice, nell'ordine del testo), oppure `ripiego`:
 * per le etichette che non ripetono la frase alla lettera («Entra con CIE» quando la voce dice solo «CIE»).
 */
export function quandoDiceUna(voce: Voce, testo: string, ripiego: number, da = 0): number {
  for (const parola of forme(testo)) {
    if (VUOTE.has(parola)) continue;
    const i = voce.parole.findIndex((p, j) => j >= da && normalizza(p.t) === parola);
    if (i >= 0) return voce.parole[i].da;
  }
  return ripiego;
}

/** Frame in cui la voce dice la prima parola di `testo` (dopo la parola `da`), oppure `ripiego`. */
export function quandoDice(voce: Voce, testo: string, ripiego: number, da = 0): number {
  const i = cercaParole(voce.parole, testo, da);
  return i < 0 ? ripiego : voce.parole[i].da;
}
