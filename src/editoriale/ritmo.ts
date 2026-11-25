import type { Effetto } from "./piano.ts";
import { liscio } from "./regia.ts";
import type { Voce } from "./voce.ts";

/** Quanto si muove la camera in una frase: continuo e morbido, mai a scatti. */
const ESCURSIONE = 0.05;
export const SCALA_MAX = 1 + ESCURSIONE;

/** La scala della scena al frame `f`: le frasi dispari (e il gancio) si avvicinano, le pari si allontanano. */
export function scalaRitmo(f: number, durata: number, i: number): number {
  const t = liscio(Math.min(1, Math.max(0, f / Math.max(1, durata))));
  const avvicina = i === 0 || i % 2 === 1;
  return 1 + ESCURSIONE * (avvicina ? t : 1 - t);
}

/** Il frame in cui la voce dice la chiave: lo usa il tick. */
export const frameChiave = (voce: Voce): number => voce.parole[voce.chiave]?.da ?? 0;

/** Colpo sul primo fotogramma, whoosh a ogni stacco, tick quando si dice la chiave (non nella chiusura). */
export function suoniRitmo(i: number, chiave: number, chiusura: boolean): Effetto[] {
  const apertura: Effetto = i === 0 ? { da: 0, suono: "colpo", volume: 0.5 } : { da: 0, suono: "whoosh", volume: 0.45 };
  return chiusura ? [apertura] : [apertura, { da: chiave, suono: "tick", volume: 0.35 }];
}
