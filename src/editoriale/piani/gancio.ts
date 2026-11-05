import type { ScenaDi } from "../../scenes/props.ts";
import type { Piano } from "../piano.ts";
import { accentiMancanti } from "../regia.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { intera, paroleTitolo, testoDi } from "../titoli.ts";

/** Oltre questi caratteri la frase detta non sta come titolo: si scrivono titolo ed evidenza. */
export const FRASE_TITOLO_MAX = 64;
const DURATA_SPINTA = 22;

export interface PianoGancio extends Piano {
  /** parole del titolo; la riga grande (la chiave, sottolineata) va da `grande[0]` a `grande[1]` escluso */
  parole: ParolaTitolo[];
  grande: [number, number];
  sottolinea: number;
  /** la camera si avvicina all'oggetto da `spinta.da` a `spinta.a` */
  spinta: { da: number; a: number };
  /** frame in cui arriva la notifica (solo prima di un allarme) */
  notifica?: number;
  /** stacchi in asse aggiunti per la regola del secondo accento */
  stacchi: number[];
}

// Il gancio scrive la frase detta, parola per parola sulla voce; la chiave in grande, sottolineata a pennarello.
// La camera e' larga sulla scrivania, quasi ferma; sulla chiave si avvicina all'oggetto. Prima di un allarme, alla fine
// arriva la notifica e la camera va da lei: lo stacco sull'allarme e' in asse.
export function pianoGancio(s: ScenaDi<"gancio">, durata: number): PianoGancio {
  const { voce } = s;
  const frase = voce.parole.map((p) => p.t).join(" ");
  const usaFrase = frase.length <= FRASE_TITOLO_MAX && voce.parole.length > 0;
  const parole = usaFrase ? voce.parole.map(({ t, da }) => ({ t, da })) : [...paroleTitolo(s.titolo, voce, 3), ...paroleTitolo(s.evidenza, voce, 12)];
  const grande: [number, number] = usaFrase ? [Math.max(0, voce.chiave), Math.max(voce.chiave + 1, voce.chiaveFine)] : [0, paroleTitolo(s.titolo, voce, 3).length];
  const kDa = parole[grande[0]]?.da ?? 0;
  const sottolinea = Math.min(durata - 12, kDa + 4);
  const ultima = voce.parole[voce.parole.length - 1]?.da ?? 0;
  const notifica = s.contesto.messaggioSeguente !== undefined ? Math.max(8, Math.min(ultima + 8, durata - 16)) : undefined;
  const spinta = notifica !== undefined ? { da: notifica + 1, a: durata } : { da: Math.min(kDa, durata - DURATA_SPINTA), a: Math.min(kDa, durata - DURATA_SPINTA) + DURATA_SPINTA };
  const eventi = [...parole.map((p) => p.da), sottolinea, spinta.da, spinta.a, ...(notifica !== undefined ? [notifica] : [])];
  const stacchi = accentiMancanti(eventi, durata);
  return {
    parole,
    grande,
    sottolinea,
    spinta,
    notifica,
    stacchi,
    testi: [{ testo: usaFrase ? frase : testoDi(parole), da: usaFrase ? 0 : intera(parole[parole.length - 1]) }],
    suoni: notifica !== undefined ? [{ da: notifica, suono: "notifica" }] : [],
    eventi: [...eventi, ...stacchi],
  };
}
