import type { ScenaDi } from "../../scenes/props.ts";
import { quandoDice } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export const INDIRIZZO = "lavocedigitale.it";
export const TESTATA = "La Voce Digitale";

/** In quanti frame entrano il marchio e la testata (la scheda della cartolina, la fascia dell'integrata). */
export const ENTRATA_CHIUSURA = 6;
/** L'indirizzo e' scritto al piu' tardi qui, anche se la voce lo dice dopo. */
const INDIRIZZO_ENTRO = 20;

export interface PianoChiusura extends PianoCarta {
  testata: number;
  indirizzo: number;
  sottolinea: number;
}

// La chiusura: marchio e testata subito, l'indirizzo entro due terzi di secondo, sottolineato quando la voce lo dice.
// Lo stesso piano regge la cartolina e la fascia della chiusura integrata.
export function pianoChiusura(s: ScenaDi<"chiusura">, durata: number): PianoChiusura {
  const testata = 0;
  const detto = quandoDice(s.voce, INDIRIZZO, Math.round(durata * 0.3));
  const indirizzo = Math.min(INDIRIZZO_ENTRO, Math.max(ENTRATA_CHIUSURA, detto - 2));
  const sottolinea = Math.min(durata - 14, Math.max(indirizzo + 6, detto + 4));
  const testi = [
    { testo: TESTATA, da: testata + ENTRATA_CHIUSURA },
    { testo: INDIRIZZO, da: indirizzo + 4 },
  ];
  return { testata, indirizzo, sottolinea, ...suCarta(testi, [], [testata, indirizzo, sottolinea], durata, s.contesto) };
}

/**
 * Quello che la fascia scrive sopra l'indirizzo: la frase finale detta, senza l'indirizzo se lo dice
 * («Tutto su», «Link nel post», «Il resto è nel link del post»).
 */
export const attaccoChiusura = (parole: { t: string }[]): string => {
  const i = parole.findIndex((p) => p.t.toLowerCase().startsWith(INDIRIZZO));
  return (i < 0 ? parole : parole.slice(0, i)).map((p) => p.t).join(" ");
};
