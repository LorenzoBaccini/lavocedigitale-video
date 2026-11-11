import type { ScenaDi } from "../../scenes/props.ts";
import { interoEntro } from "../lettura.ts";
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
// poi il pennarello cerchia il secondo valore, quello che il confronto vuole far vedere. Ogni colonna resta da leggere
// prima dello stacco: se la voce ci arriva tardi, entra prima.
export function pianoConfronto(s: ScenaDi<"confronto">, durata: number): PianoConfronto {
  const { voce } = s;
  // una colonna entra con il titolo, il valore 3 frame dopo
  const ultima = (lato: { titolo: string; valore: string }) => Math.min(interoEntro(lato.titolo, durata), interoEntro(lato.valore, durata) - 3);
  const tettoB = Math.min(durata - 34, ultima(s.b));
  const a = Math.max(6, Math.min(Math.round(durata * 0.3), ultima(s.a), tettoB - 18, quandoDice(voce, s.a.valore, 8)));
  const b = Math.max(a + 18, Math.min(tettoB, quandoDice(voce, s.b.valore, Math.round(durata * 0.5))));
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
