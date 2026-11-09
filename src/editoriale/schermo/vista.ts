import type { Punto2, Rettangolo } from "../set/geometria.ts";

/** Quanto e' grande cio' che lo schermo mostra, in pixel del suo disegno. */
export interface Misure {
  w: number;
  h: number;
}

/** La camera sullo schermo: il punto del disegno (u, v) da mettere al centro e quanti pixel del fotogramma vale un pixel del disegno. */
export interface Ripresa {
  u: number;
  v: number;
  scala: number;
}

/** Dove finisce il disegno nel fotogramma: un punto (u, v) del disegno sta in (x + u * scala, y + v * scala). */
export interface Vista {
  x: number;
  y: number;
  scala: number;
}

/** La scala minima perche' il disegno copra tutto il riquadro. */
export const copri = (m: Misure, quadro: Rettangolo): number => Math.max(quadro.w / m.w, quadro.h / m.h);

// sul lato dove il disegno e' piu' grande del riquadro non si vede mai oltre il suo bordo; dove e' piu' piccolo sta al centro
const blocca = (pos: number, inizio: number, lato: number, largo: number) =>
  largo <= lato ? inizio + (lato - largo) / 2 : Math.min(inizio, Math.max(inizio + lato - largo, pos));

/**
 * La vista della ripresa nel riquadro: il punto (u, v) va al centro orizzontale e alla quota `centro` (di norma il centro
 * del riquadro), poi la vista si sposta quanto basta per non mostrare oltre i bordi del disegno. `libera` non si sposta:
 * per i disegni a tinta unita ai bordi (il telefono), dove il fondo del riquadro continua il disegno.
 */
export function vista(m: Misure, quadro: Rettangolo, r: Ripresa, centro = quadro.y + quadro.h / 2, libera = false): Vista {
  const s = r.scala;
  const x = quadro.x + quadro.w / 2 - r.u * s;
  const y = centro - r.v * s;
  if (libera) return { x, y, scala: s };
  return { x: blocca(x, quadro.x, quadro.w, m.w * s), y: blocca(y, quadro.y, quadro.h, m.h * s), scala: s };
}

/** Un punto del disegno nel fotogramma. */
export const punto = (v: Vista, u: number, w: number): Punto2 => ({ x: v.x + u * v.scala, y: v.y + w * v.scala });

/** Un rettangolo del disegno nel fotogramma. */
export const rettangolo = (v: Vista, r: Rettangolo): Rettangolo => ({ x: v.x + r.x * v.scala, y: v.y + r.y * v.scala, w: r.w * v.scala, h: r.h * v.scala });

/** I quattro angoli di un rettangolo del fotogramma, in senso orario. */
export const angoli = (r: Rettangolo): Punto2[] => [
  { x: r.x, y: r.y },
  { x: r.x + r.w, y: r.y },
  { x: r.x + r.w, y: r.y + r.h },
  { x: r.x, y: r.y + r.h },
];

/** Da una ripresa all'altra: il punto in linea retta, la scala in proporzione (lo zoom sembra uniforme). */
export const fraRiprese = (a: Ripresa, b: Ripresa, t: number): Ripresa => ({
  u: a.u + (b.u - a.u) * t,
  v: a.v + (b.v - a.v) * t,
  scala: a.scala * (b.scala / a.scala) ** t,
});

/** La ripresa stretta di un fattore (gli stacchi in asse: 1,12 = il 12 % piu' vicino). */
export const stringi = (r: Ripresa, k: number): Ripresa => ({ ...r, scala: r.scala * k });
