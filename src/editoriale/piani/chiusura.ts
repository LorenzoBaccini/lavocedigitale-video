import type { ScenaDi } from "../../scenes/props.ts";
import { quandoDice } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export const INDIRIZZO = "lavocedigitale.it";
export const TESTATA = "La Voce Digitale";

export interface PianoChiusura extends PianoCarta {
  testata: number;
  indirizzo: number;
  sottolinea: number;
}

// La chiusura: il marchio e la testata su carta, poi l'indirizzo, sottolineato a pennarello quando la voce lo dice.
export function pianoChiusura(s: ScenaDi<"chiusura">, durata: number): PianoChiusura {
  const testata = 4;
  const detto = quandoDice(s.voce, INDIRIZZO, Math.round(durata * 0.3));
  const indirizzo = Math.max(10, detto - 2);
  const sottolinea = Math.min(durata - 14, detto + 8);
  const testi = [
    { testo: TESTATA, da: testata + 6 },
    { testo: INDIRIZZO, da: indirizzo + 4 },
  ];
  return { testata, indirizzo, sottolinea, ...suCarta(testi, [], [testata, indirizzo, sottolinea], durata, s.contesto) };
}
