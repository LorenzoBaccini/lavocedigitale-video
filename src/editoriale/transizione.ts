import { conPeso, fase } from "./regia.ts";

/** Quanti frame dura la spinta laterale fra due scene. */
export const DURATA_SPINTA = 10;

/**
 * Lo spostamento orizzontale di una scena lunga `durata` al frame `f` della sua sequenza: entra da destra nei primi
 * frame, esce a sinistra nei frame dopo la fine (la sequenza la tiene montata per `DURATA_SPINTA` in piu').
 * Uscente ed entrante usano la stessa curva sugli stessi frame: restano attaccate.
 */
// agli estremi valori esatti: conPeso(0) non e' zero per pochi ulp, e una scena ferma non deve avere uno scarto
const curva = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : conPeso(t));

export function scartoSpinta(f: number, durata: number, larghezza: number, entra: boolean, esce: boolean): number {
  const dentro = entra ? curva(fase(f, 0, DURATA_SPINTA)) : 1;
  const fuori = esce ? curva(fase(f, durata, durata + DURATA_SPINTA)) : 0;
  return (1 - dentro - fuori) * larghezza;
}

/** Quanti frame dura il lampo dopo uno stacco. */
export const DURATA_LAMPO = 6;

/** L'intensita' del lampo (0..1) al frame `f` del video: piena sul primo frame di ogni scena tranne la prima, si spegne in `DURATA_LAMPO` frame. */
export function lampo(f: number, inizi: number[]): number {
  const stacco = inizi.filter((i) => i > 0 && i <= f).at(-1);
  if (stacco === undefined) return 0;
  const t = (f - stacco) / DURATA_LAMPO;
  return t >= 1 ? 0 : (1 - t) ** 2;
}

/** Il frame che vede la scena:mentre esce, oltre la sua fine, resta ferma sull'ultimo (le scene non sono fatte per f >= durata). */
export const frameScena = (f: number, durata: number): number => Math.min(f, durata - 1);
