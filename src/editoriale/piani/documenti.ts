import type { ScenaDi } from "../../scenes/props.ts";
import type { Piano } from "../piano.ts";
import { accentiMancanti } from "../regia.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { entroIl, fineDi, paroleInAccento, paroleTitolo, testoDi } from "../titoli.ts";
import { quandoDiceUna } from "../voce.ts";

/** Fra una nota e la successiva passano almeno tanti frame: la freccia si traccia, la scritta entra. */
export const PASSO_NOTE = 12;
/** La freccia a pennarello dura tanto, poi entra la scritta. */
export const FRECCIA = 9;

export interface PianoDocumenti extends Piano {
  titolo: ParolaTitolo[];
  accento: number[];
  /** frame in cui comincia la freccia di ciascuna nota, in ordine */
  note: number[];
  stacchi: number[];
}

// I pezzi sul tavolo visti dall'alto (tessera, documento, lettore, lettera del PIN), con le note a mano accanto.
// Ogni nota arriva con una freccia a pennarello quando la voce nomina il suo pezzo; in alto occhiello e titolo.
export function pianoDocumenti(s: ScenaDi<"documenti">, durata: number): PianoDocumenti {
  const { voce } = s;
  const titolo = entroIl(paroleTitolo(s.titolo, voce, 6), Math.round(durata * 0.45));
  const accento = paroleInAccento(titolo, voce.parole.slice(voce.chiave).map((p) => p.t));
  const n = s.pezzi.length;
  const ultimo = durata - 20 - FRECCIA;
  const note: number[] = [];
  s.pezzi.forEach((pezzo, i) => {
    const ripiego = Math.round(durata * (0.25 + (0.5 * i) / Math.max(1, n - 1)));
    const prima = i ? note[i - 1] + PASSO_NOTE : 8;
    // le ultime note devono restare dentro la scena anche se la voce arriva tardi
    const tetto = ultimo - (n - 1 - i) * PASSO_NOTE;
    note.push(Math.min(tetto, Math.max(prima, quandoDiceUna(voce, pezzo.nota, ripiego))));
  });
  const eventi = [...titolo.map((p) => p.da), ...note, ...note.map((d) => d + FRECCIA)];
  const stacchi = accentiMancanti(eventi, durata);
  return {
    titolo,
    accento,
    note,
    stacchi,
    testi: [
      { testo: s.etichetta, da: 4 },
      { testo: testoDi(titolo), da: fineDi(titolo) },
      ...s.pezzi.map((p, i) => ({ testo: p.nota, da: note[i] + FRECCIA + 6 })),
    ],
    suoni: [],
    eventi: [...eventi, ...stacchi],
  };
}
