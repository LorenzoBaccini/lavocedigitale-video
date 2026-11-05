import { LARGHEZZA, MARGINE } from "../../impaginazione.ts";

/** Corpo della nota a mano e il minimo sotto cui un testo informativo non scende. */
export const CORPO_NOTA = 36;
export const CORPO_MINIMO = 34;
/** Larghezza stimata di un carattere maiuscolo di Inter 650 con la spaziatura della nota, in em (per eccesso). */
const CARATTERE = 0.76;
/** La nota non va piu' a sinistra di cosi' rispetto al punto indicato: oltre, la freccia si gira e il testo copre l'oggetto. */
export const STACCO_NOTA = 20;
/** Dove comincia la colonna delle note quando l'oggetto non la spinge piu' a destra (documenti 600, oggetto 580). */
export const COLONNA_NOTA = 600;

/** La parola piu' lunga che una nota puo' contenere: al corpo minimo sta nella colonna che parte da `COLONNA_NOTA`. */
export const parolaMassima = (): number => Math.floor((LARGHEZZA - MARGINE - COLONNA_NOTA) / (CARATTERE * CORPO_MINIMO));

/**
 * Dove comincia la nota e con che corpo, perche' la parola piu' lunga stia prima del margine destro: la nota va a
 * capo solo fra le parole. Prima si scende fino al corpo minimo, poi la nota si sposta a sinistra, ma mai a meno di
 * `STACCO_NOTA` dal punto indicato `x`; le parole troppo lunghe per la colonna le scarta la validazione (`LIMITI.parolaNota`).
 */
export function postoNota(testo: string, sinistra: number, x: number): { sinistra: number; corpo: number } {
  const lettere = Math.max(1, ...testo.split(/\s+/).map((p) => p.length));
  const destra = LARGHEZZA - MARGINE;
  const sx = Math.min(sinistra, Math.max(x + STACCO_NOTA, MARGINE, destra - lettere * CARATTERE * CORPO_MINIMO));
  const corpo = Math.min(CORPO_NOTA, Math.floor((destra - sx) / (lettere * CARATTERE)));
  return { sinistra: sx, corpo: Math.max(CORPO_MINIMO, corpo) };
}
