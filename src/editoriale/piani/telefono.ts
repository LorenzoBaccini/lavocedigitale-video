import type { ScenaDi } from "../../scenes/props.ts";
import type { Piano } from "../piano.ts";
import { accentiMancanti } from "../regia.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { fineDi, leggibile, paroleInAccento, paroleTitolo, testoDi } from "../titoli.ts";
import { quandoDiceUna } from "../voce.ts";

export interface PianoTelefono extends Piano {
  titolo: ParolaTitolo[];
  accento: number[];
  colpo: number;
  /** indice dell'opzione esclusa e frame in cui la si barra a mano */
  esclusa?: { indice: number; da: number };
  /** l'opzione cerchiata: quella che resta di due, o la prima sulla chiave se nessuna e' esclusa */
  cerchio?: { indice: number; da: number };
  stacchi: number[];
}

// Il telefono in primo piano sulla scrivania, con la schermata delle opzioni (i metodi d'accesso, le scelte di un'app).
// In alto occhiello e titolo con la chiave in ambra; sull'opzione esclusa un barrato a pennarello quando la voce la nomina,
// poi un cerchio sull'opzione che resta.
export function pianoTelefono(s: ScenaDi<"telefono">, durata: number): PianoTelefono {
  const { voce } = s;
  const titolo = leggibile(paroleTitolo(s.titolo, voce, 6), durata, Math.round(durata * 0.55));
  const accento = paroleInAccento(titolo, voce.parole.slice(voce.chiave).map((p) => p.t));
  const colpo = Math.min(durata - 6, Math.max(titolo[accento[0]]?.da ?? 0, voce.parole[voce.chiave]?.da ?? 0));
  const indice = s.esclusa === undefined ? -1 : s.opzioni.indexOf(s.esclusa);
  const barra = indice < 0 ? undefined : Math.min(durata - 34, Math.max(8, quandoDiceUna(voce, s.esclusa!, Math.round(durata * 0.35))));
  const esclusa = barra === undefined ? undefined : { indice, da: barra };
  // con tre opzioni e una esclusa ne restano due: nessun cerchio, basta il barrato
  const cerchio =
    barra === undefined
      ? { indice: 0, da: Math.min(durata - 16, colpo + 4) }
      : s.opzioni.length === 2
        ? { indice: 1 - indice, da: Math.min(durata - 16, barra + 18) }
        : undefined;
  const eventi = [...titolo.map((p) => p.da), colpo, ...(cerchio ? [cerchio.da] : []), ...(barra !== undefined ? [barra] : [])];
  const stacchi = accentiMancanti(eventi, durata);
  return {
    titolo,
    accento,
    colpo,
    esclusa,
    cerchio,
    stacchi,
    testi: [
      ...s.opzioni.map((testo) => ({ testo, da: 4 })),
      { testo: s.etichetta, da: 4 },
      { testo: testoDi(titolo), da: fineDi(titolo) },
    ],
    suoni: [{ da: colpo, suono: "tonfo" }],
    eventi: [...eventi, ...stacchi],
  };
}
