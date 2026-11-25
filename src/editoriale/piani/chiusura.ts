import type { ScenaDi } from "../../scenes/props.ts";
import { testoAschermo } from "../../testoAschermo.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export const INDIRIZZO = "lavocedigitale.it";

/** In quanti frame entrano la scheda della cartolina e la fascia dell'integrata. */
export const ENTRATA_CHIUSURA = 6;
/** Frame in cui la domanda e' scritta per intero: chi guarda muto la legge mentre la voce la dice. */
const DOMANDA = 4;
/** Il marchio resta a schermo almeno questi frame prima della fine. */
const MARCHIO_PRIMA_DELLA_FINE = 12;

export interface PianoChiusura extends PianoCarta {
  domanda: number;
  /** quando entra il marchio della fascia integrata: a voce finita */
  marchio: number;
}

/** La domanda come si scrive: i numeri detti in lettere tornano cifre, come nei sottotitoli. */
export const domandaScritta = (s: Pick<ScenaDi<"chiusura">, "voce">): string => testoAschermo(s.voce.parole.map((p) => p.t).join(" "));

// La chiusura: la domanda subito, il marchio quando la voce ha finito di farla. Mai chiedere di commentare:
// Meta penalizza l'engagement bait anche scritto o detto nel video (docs/superpowers/specs/2026-11-25-viralita.md).
// Lo stesso piano regge la cartolina e la fascia della chiusura integrata.
export function pianoChiusura(s: ScenaDi<"chiusura">, durata: number): PianoChiusura {
  const ultima = s.voce.parole.at(-1);
  const marchio = Math.max(DOMANDA + 2, Math.min(durata - MARCHIO_PRIMA_DELLA_FINE, ultima ? ultima.a : Math.round(durata / 2)));
  const testi = [
    { testo: domandaScritta(s), da: DOMANDA },
    { testo: INDIRIZZO, da: DOMANDA },
  ];
  return { domanda: DOMANDA, marchio, ...suCarta(testi, [], [0, DOMANDA, marchio], durata, s.contesto) };
}
