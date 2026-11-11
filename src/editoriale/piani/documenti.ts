import type { ScenaDi } from "../../scenes/props.ts";
import type { Piano } from "../piano.ts";
import { accentiMancanti } from "../regia.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { inSequenza, interoEntro } from "../lettura.ts";
import { entroLettura, fineDi, paroleInAccento, paroleTitolo, testoDi } from "../titoli.ts";
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
  const titolo = entroLettura(paroleTitolo(s.titolo, voce, 6), durata, Math.round(durata * 0.45));
  const accento = paroleInAccento(titolo, voce.parole.slice(voce.chiave).map((p) => p.t));
  const n = s.pezzi.length;
  // le note devono restare da leggere anche se la voce arriva tardi: la scritta e' intera `FRECCIA + 6` frame dopo la freccia
  const tetti = inSequenza(s.pezzi.map((p) => Math.min(durata - 20 - FRECCIA, interoEntro(p.nota, durata) - FRECCIA - 6)), PASSO_NOTE);
  const note: number[] = [];
  s.pezzi.forEach((pezzo, i) => {
    const ripiego = Math.round(durata * (0.25 + (0.5 * i) / Math.max(1, n - 1)));
    const prima = i ? note[i - 1] + PASSO_NOTE : 8;
    note.push(Math.min(tetti[i], Math.max(prima, quandoDiceUna(voce, pezzo.nota, ripiego))));
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
