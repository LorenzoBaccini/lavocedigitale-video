import { LARGHEZZA_UTILE } from "../../impaginazione.ts";

/** L'occhiello delle scene sul set: corpo, interlinea e spazio fino al titolo sotto. */
export const CORPO_OCCHIELLO = 36;
export const RIGA_OCCHIELLO = 44;
export const SPAZIO_OCCHIELLO = 14;
/** Larghezza di un carattere maiuscolo di Inter 600 con la spaziatura dell'occhiello, in em (per eccesso). */
const LETTERA = 0.8;

/** Altezza dell'occhiello: una riga, o due se a 32 caratteri non ci sta nella colonna. */
export const altezzaOcchiello = (testo: string, larghezza = LARGHEZZA_UTILE): number =>
  Math.max(1, Math.ceil((testo.length * LETTERA * CORPO_OCCHIELLO) / larghezza)) * RIGA_OCCHIELLO;

/** Da dove comincia il titolo sotto l'occhiello, misurato dalla cima dell'occhiello. */
export const sopraIlTitolo = (testo: string): number => altezzaOcchiello(testo) + SPAZIO_OCCHIELLO;
