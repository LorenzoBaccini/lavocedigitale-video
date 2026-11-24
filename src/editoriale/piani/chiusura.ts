import type { ScenaDi } from "../../scenes/props.ts";
import { testoAschermo } from "../../testoAschermo.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export const INDIRIZZO = "lavocedigitale.it";
export const TESTATA = "La Voce Digitale";
export const INVITO = "Scrivilo nei commenti";

/** In quanti frame entrano la scheda della cartolina e la fascia dell'integrata. */
export const ENTRATA_CHIUSURA = 6;
/** Frame in cui la domanda e' scritta per intero: chi guarda muto la legge mentre la voce la dice. */
const DOMANDA = 4;
/** L'invito resta a schermo almeno questi frame prima della fine. */
const INVITO_PRIMA_DELLA_FINE = 12;

export interface PianoChiusura extends PianoCarta {
  domanda: number;
  invito: number;
}

/** La domanda come si scrive: i numeri detti in lettere tornano cifre, come nei sottotitoli. */
export const domandaScritta = (s: Pick<ScenaDi<"chiusura">, "voce">): string => testoAschermo(s.voce.parole.map((p) => p.t).join(" "));

// La chiusura: la domanda subito, l'invito a commentare quando la voce ha finito di farla.
// Lo stesso piano regge la cartolina e la fascia della chiusura integrata.
export function pianoChiusura(s: ScenaDi<"chiusura">, durata: number): PianoChiusura {
  const ultima = s.voce.parole.at(-1);
  const invito = Math.max(DOMANDA + 2, Math.min(durata - INVITO_PRIMA_DELLA_FINE, ultima ? ultima.a : Math.round(durata / 2)));
  const testi = [
    { testo: domandaScritta(s), da: DOMANDA },
    { testo: INVITO, da: invito },
    { testo: INDIRIZZO, da: DOMANDA },
  ];
  return { domanda: DOMANDA, invito, ...suCarta(testi, [], [0, DOMANDA, invito], durata, s.contesto) };
}
