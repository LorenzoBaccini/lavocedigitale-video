import type { ScenaDi } from "../../scenes/props.ts";
import type { Piano } from "../piano.ts";
import { accentiMancanti } from "../regia.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { entroLettura, fineDi, paroleTitolo, testoDi } from "../titoli.ts";

/** Quanto dura la reazione del reperto (crepa, spezzatura, scatto dell'arco). */
export const DURATA_REAZIONE = 14;

export interface PianoReperto extends Piano {
  titolo: ParolaTitolo[];
  /** il reperto reagisce: si crepa, si spezza, si apre */
  reazione: number;
  /** piccole spinte di rotazione dell'oggetto, dove la scena resterebbe ferma */
  stacchi: number[];
}

// Il reperto c'e' dal primo fotogramma e gira piano; il titolo entra con la voce; sulla chiave reagisce, con la crepa.
export function pianoReperto(s: ScenaDi<"reperto">, durata: number): PianoReperto {
  const { voce } = s;
  const titolo = entroLettura(paroleTitolo(s.titolo, voce, 2), durata, durata - 12);
  const chiave = voce.parole[voce.chiave]?.da ?? Math.round(durata * 0.4);
  const reazione = Math.max(10, Math.min(durata - DURATA_REAZIONE, chiave));
  const eventi = [...titolo.map((p) => p.da), reazione, reazione + DURATA_REAZIONE];
  const stacchi = accentiMancanti(eventi, durata);
  return {
    titolo,
    reazione,
    stacchi,
    testi: [{ testo: s.etichetta, da: 4 }, ...(s.messaggio ? [{ testo: s.messaggio, da: 0 }] : []), { testo: testoDi(titolo), da: fineDi(titolo) }],
    suoni: [{ da: reazione, suono: "crepa" }],
    eventi: [...eventi, ...stacchi],
  };
}
