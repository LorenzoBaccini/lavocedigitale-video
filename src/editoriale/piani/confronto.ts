import type { ScenaDi } from "../../scenes/props.ts";
import { quandoDice } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export interface PianoConfronto extends PianoCarta {
  a: number;
  b: number;
  /** il pennarello cerchia il secondo valore */
  cerchio: number;
}

// Due colonne di giornale a fronte, divise da un filetto: la prima subito, la seconda quando la voce ci arriva;
// poi il pennarello cerchia il secondo valore, quello che il confronto vuole far vedere.
export function pianoConfronto(s: ScenaDi<"confronto">, durata: number): PianoConfronto {
  const { voce } = s;
  const a = Math.max(6, Math.min(Math.round(durata * 0.3), quandoDice(voce, s.a.valore, 8)));
  const b = Math.max(a + 18, Math.min(durata - 34, quandoDice(voce, s.b.valore, Math.round(durata * 0.5))));
  const cerchio = Math.min(durata - 18, b + 14);
  const testi = [
    { testo: s.etichetta, da: 4 },
    { testo: s.a.titolo, da: a },
    { testo: s.a.valore, da: a + 3 },
    { testo: s.b.titolo, da: b },
    { testo: s.b.valore, da: b + 3 },
  ];
  return { a, b, cerchio, ...suCarta(testi, [], [4, a, b, cerchio], durata, s.contesto) };
}
