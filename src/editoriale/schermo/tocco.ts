import { clamp01, conPeso, fase } from "../regia.ts";
import type { Punto2 } from "../set/geometria.ts";

/** Quanti frame impiega il puntatore ad arrivare su `indica`; il tocco cade sul frame d'arrivo. */
export const VIAGGIO = 14;
/** Quanti frame dura l'onda del tocco. */
export const ONDA = 16;
/** Il raggio finale dell'onda, in pixel del fotogramma. */
export const RAGGIO_ONDA = 90;

/** Il puntatore al frame `f`: dove sta (fra `da` e `a`, nelle coordinate del disegno), quanto si vede, quanto e' premuto (0..1). */
export function posaPuntatore(f: number, arrivo: number, da: Punto2, a: Punto2): Punto2 & { opacita: number; premuto: number } {
  const t = conPeso(fase(f, arrivo - VIAGGIO, arrivo));
  return {
    x: da.x + (a.x - da.x) * t,
    y: da.y + (a.y - da.y) * t,
    opacita: fase(f, arrivo - VIAGGIO - 6, arrivo - VIAGGIO),
    premuto: clamp01(1 - Math.abs(f - arrivo) / 3),
  };
}

/** L'onda del tocco: raggio e opacita' al frame `f`, o niente fuori dalla sua durata. */
export function onda(f: number, arrivo: number): { raggio: number; opacita: number } | undefined {
  if (f < arrivo || f >= arrivo + ONDA) return undefined;
  const t = (f - arrivo) / ONDA;
  return { raggio: RAGGIO_ONDA * (1 - (1 - t) ** 2), opacita: 0.45 * (1 - t) };
}
