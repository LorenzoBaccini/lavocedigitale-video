import type { Effetto } from "./piano.ts";
import type { Voce } from "./voce.ts";

/** Sotto questa durata una frase non ha tagli di zoom: stacco, tick e scatto le bastano. */
export const FRAME_TAGLIO = 60;
/** Le due basi del taglio di zoom e lo scatto sulla chiave: insieme restano sotto `SCALA_MAX`. */
const BASI = [1, 1.035] as const;
const SCATTO = 0.03;
const DECADE = 10;
/** Il gancio avanza piano, senza tagli. */
const AVANZA_GANCIO = 0.035;
export const SCALA_MAX = BASI[1] + SCATTO;

/** I frame dei tagli di zoom: uno al confine di parola piu' vicino a meta' frase, mai sulla prima parola. */
export function tagliZoom(durata: number, inizi: number[]): number[] {
  if (durata < FRAME_TAGLIO) return [];
  const candidati = inizi.slice(1);
  if (!candidati.length) return [];
  const meta = durata / 2;
  return [candidati.reduce((m, x) => (Math.abs(x - meta) < Math.abs(m - meta) ? x : m))];
}

/** La scala della scena al frame `f`: base che scatta a ogni taglio, scatto sulla chiave; il gancio (`i` = 0) avanza piano. */
export function scalaRitmo(f: number, durata: number, chiave: number, tagli: number[], i: number): number {
  const passati = tagli.filter((t) => f >= t).length;
  const base = i === 0 ? 1 + (AVANZA_GANCIO * Math.min(f, durata)) / durata : BASI[(i + passati) % 2];
  const dopo = f - chiave;
  const scatto = dopo >= 0 && dopo < DECADE ? SCATTO * (1 - dopo / DECADE) ** 2 : 0;
  return Math.min(SCALA_MAX, base + scatto);
}

/** Il frame della chiave e i tagli di una frase, dalle parole dette. */
export function ritmoFrase(voce: Voce, durata: number, i: number): { chiave: number; tagli: number[] } {
  const chiave = voce.parole[voce.chiave]?.da ?? 0;
  return { chiave, tagli: i === 0 ? [] : tagliZoom(durata, voce.parole.map((p) => p.da)) };
}

/** Colpo sul primo fotogramma, whoosh a ogni stacco, tick quando si dice la chiave (non nella chiusura). */
export function suoniRitmo(i: number, chiave: number, chiusura: boolean): Effetto[] {
  const apertura: Effetto = i === 0 ? { da: 0, suono: "colpo", volume: 0.5 } : { da: 0, suono: "whoosh", volume: 0.45 };
  return chiusura ? [apertura] : [apertura, { da: chiave, suono: "tick", volume: 0.35 }];
}
