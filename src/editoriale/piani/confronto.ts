import type { ScenaDi } from "../../scenes/props.ts";
import { interoEntro } from "../lettura.ts";
import { quandoDice } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

/** In quanti frame una colonna entra in dissolvenza: da li' titolo e valore sono interi. */
export const DISSOLVENZA_COLONNA = 8;

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
  // titolo e valore entrano insieme con la colonna, interi a dissolvenza finita
  const ultima = (lato: { titolo: string; valore: string }) => Math.min(interoEntro(lato.titolo, durata), interoEntro(lato.valore, durata)) - DISSOLVENZA_COLONNA;
  const tettoB = Math.min(durata - 34, ultima(s.b));
  const a = Math.max(6, Math.min(Math.round(durata * 0.3), ultima(s.a), tettoB - 18, quandoDice(voce, s.a.valore, 8)));
  // nelle scene cortissime la seconda colonna accorcia la distanza dalla prima: e' intera sul fotogramma fermo
  const b = Math.max(Math.min(a + 18, durata - 1 - DISSOLVENZA_COLONNA), Math.min(tettoB, quandoDice(voce, s.b.valore, Math.round(durata * 0.5))));
  const cerchio = Math.min(durata - 18, b + 14);
  const testi = [
    { testo: s.etichetta, da: 4 },
    { testo: s.a.titolo, da: a + DISSOLVENZA_COLONNA },
    { testo: s.a.valore, da: a + DISSOLVENZA_COLONNA },
    { testo: s.b.titolo, da: b + DISSOLVENZA_COLONNA },
    { testo: s.b.valore, da: b + DISSOLVENZA_COLONNA },
  ];
  return { a, b, cerchio, ...suCarta(testi, [], [4, a, b, cerchio], durata, s.contesto) };
}
