import type { ScenaDi } from "../../scenes/props.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { entroIl, fineDi, paroleTitolo, testoDi } from "../titoli.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

/** Righe di testo coperte a pennarello sotto il teaser. */
export const OMISSIS = 3;
const PER_RIGA = 10;

export interface PianoTeaser extends PianoCarta {
  parole: ParolaTitolo[];
  /** frame in cui il pennarello comincia a coprire ciascuna riga */
  omissis: number[];
}

// Il passo che resta nell'articolo: la frase scritta sul foglio e, sotto, le righe che lo spiegano coperte a pennarello.
export function pianoTeaser(s: ScenaDi<"teaser">, durata: number): PianoTeaser {
  const parole = entroIl(paroleTitolo(s.testo, s.voce, 4), durata - OMISSIS * PER_RIGA - 14);
  const inizio = Math.min(durata - OMISSIS * PER_RIGA - 8, Math.max(fineDi(parole) + 4, Math.round(durata * 0.35)));
  const omissis = Array.from({ length: OMISSIS }, (_, i) => Math.max(10, inizio) + i * PER_RIGA);
  return { parole, omissis, ...suCarta([{ testo: testoDi(parole), da: fineDi(parole) }], [], [...parole.map((p) => p.da), ...omissis], durata, s.contesto) };
}
