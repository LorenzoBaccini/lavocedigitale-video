import type { Timing } from "./timing.ts";

export interface Linea {
  inizi: number[];
  durate: number[];
  totale: number;
}

/** Quanto la chiusura resta a schermo dopo l'ultima parola; ci esce la musica (`mix.ts`). */
export const CODA_S = 0.8;

export function costruisciLinea(timing: Timing, fps: number): Linea {
  const frames = timing.clips.map((c) => Math.round(c.secondi * fps));
  const durate = frames.map((f, i) => (i === frames.length - 1 ? f + Math.round(CODA_S * fps) : f));
  const inizi = durate.map((_, i) => durate.slice(0, i).reduce((a, b) => a + b, 0));
  return { inizi, durate, totale: durate.reduce((a, b) => a + b, 0) };
}

export function scenaAlFrame(linea: Linea, frame: number): number {
  return Math.max(0, linea.inizi.findLastIndex((s) => s <= frame));
}

// Volume della voce al frame globale, 0..1: muove le barre del logo.
export function livelloVoce(timing: Timing, linea: Linea, frame: number): number {
  if (frame < 0) return 0;
  const i = scenaAlFrame(linea, frame);
  return timing.clips[i]?.inviluppo[frame - linea.inizi[i]] ?? 0;
}
