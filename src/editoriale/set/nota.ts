import { LARGHEZZA, MARGINE } from "../../impaginazione.ts";

/** Corpo della nota a mano e il minimo sotto cui un testo informativo non scende. */
export const CORPO_NOTA = 36;
export const CORPO_MINIMO = 34;
/** Larghezza stimata di un carattere maiuscolo di Inter 650 con la spaziatura della nota, in em (per eccesso). */
const CARATTERE = 0.76;

/**
 * Dove comincia la nota e con che corpo, perche' la parola piu' lunga stia prima del margine destro: la nota va a
 * capo solo fra le parole, e una parola piu' larga della colonna usciva dal margine (fixture della matrice, nota da 24).
 * Prima si scende fino al corpo minimo, poi la nota si sposta a sinistra.
 */
export function postoNota(testo: string, sinistra: number): { sinistra: number; corpo: number } {
  const lettere = Math.max(1, ...testo.split(/\s+/).map((p) => p.length));
  const destra = LARGHEZZA - MARGINE;
  const sx = Math.min(sinistra, destra - lettere * CARATTERE * CORPO_MINIMO);
  const corpo = Math.min(CORPO_NOTA, Math.floor((destra - sx) / (lettere * CARATTERE)));
  return { sinistra: Math.max(MARGINE, sx), corpo: Math.max(CORPO_MINIMO, corpo) };
}
