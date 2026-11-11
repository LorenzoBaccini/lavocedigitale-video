import type { ScenaDi } from "../../scenes/props.ts";
import type { Piano } from "../piano.ts";
import { accentiMancanti } from "../regia.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { entroIl, fineDi, leggibile, paroleInAccento, paroleTitolo, testoDi, ultimaEntro } from "../titoli.ts";

export interface PianoRischio extends Piano {
  sopra: ParolaTitolo[];
  titolo: ParolaTitolo[];
  accento: number[];
  colpo: number;
  /** la luce della finestra cala da qui, in 20 frame */
  ombra: number;
  stacchi: number[];
}

// La conseguenza: la camera si allontana piano dal portatile, la luce della finestra cala di poco sulla chiave.
// Sopra il sopratitolo in corsivo, sotto il titolo con la parola chiave in ambra e il colpo sordo.
export function pianoRischio(s: ScenaDi<"rischio">, durata: number): PianoRischio {
  const { voce } = s;
  // sopratitolo e titolo restano da leggere prima dello stacco; il sopratitolo lascia il posto al titolo dopo di lui
  const tetto = Math.min(durata - 16, ultimaEntro(s.titolo, durata));
  const sopra = leggibile(paroleTitolo(s.sopra, voce, 2), durata, Math.min(durata - 30, tetto - 3));
  const titolo = entroIl(paroleTitolo(s.titolo, voce, fineDi(sopra) + 2), tetto);
  const accento = paroleInAccento(titolo, voce.parole.slice(voce.chiave).map((p) => p.t));
  const colpo = Math.min(durata - 6, Math.max(titolo[accento[0]]?.da ?? 0, voce.parole[voce.chiave]?.da ?? 0));
  const ombra = colpo;
  const eventi = [...sopra.map((p) => p.da), ...titolo.map((p) => p.da), colpo, ombra + 20];
  const stacchi = accentiMancanti(eventi, durata);
  return {
    sopra,
    titolo,
    accento,
    colpo,
    ombra,
    stacchi,
    testi: [
      { testo: testoDi(sopra), da: fineDi(sopra) },
      { testo: testoDi(titolo), da: fineDi(titolo) },
    ],
    suoni: [{ da: colpo, suono: "tonfo" }],
    eventi: [...eventi, ...stacchi],
  };
}
