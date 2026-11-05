import type { Linea } from "../linea.ts";
import { livelloVoce } from "../linea.ts";
import type { Timing } from "../timing.ts";

const ENTRATA = 15; // 0,5 s
const USCITA = 30; // 1 s, dentro la coda della chiusura
/** Quanto scende il sottofondo mentre si parla: -6 dB. */
export const DUCKING = 0.5;

/**
 * Volume del sottofondo al frame f: entra in mezzo secondo, si abbassa sotto la voce (guarda la voce poco prima e poco
 * dopo, cosi' scende prima della parola e risale dopo la pausa, senza pompare) ed esce con la chiusura.
 */
export function volumeSottofondo(f: number, timing: Timing, linea: Linea): number {
  let voce = 0;
  for (let k = f - 4; k <= f + 3; k++) voce = Math.max(voce, livelloVoce(timing, linea, k));
  const sotto = 1 - DUCKING * Math.min(1, voce * 2.5);
  const entra = Math.min(1, Math.max(0, f / ENTRATA));
  const esce = Math.min(1, Math.max(0, (linea.totale - f) / USCITA));
  return sotto * entra * esce;
}
