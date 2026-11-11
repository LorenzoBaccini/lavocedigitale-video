import type { ScenaDi } from "../../scenes/props.ts";
import type { Effetto, Piano, TestoAschermo } from "../piano.ts";
import { accentiMancanti } from "../regia.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { interoEntro } from "../lettura.ts";
import { entroLettura, fineDi, paroleTitolo, testoDi } from "../titoli.ts";
import { quandoDice } from "../voce.ts";

export interface PianoOggetto extends Piano {
  titolo: ParolaTitolo[];
  evidenza: ParolaTitolo[];
  /** frame in cui si cerchia il punto di `indica` (sul portatile: lo stacco sul pulsante) */
  indica?: number;
  /** frame in cui la penna traccia la spunta della conferma */
  conferma?: number;
  stacchi: number[];
}

/**
 * Il richiamo di `indica` (frame dopo il segno): si traccia da `da` e la scritta e' intera ad `a`. E' la piu' lenta delle
 * scritte di indica (la nota accanto al telefono e' intera prima), quindi vale per tutte.
 */
export const RICHIAMO_INDICA = { da: 10, a: 20 };
/** La scritta della conferma entra in dissolvenza dopo la spunta, da qui a qui (frame dopo la conferma). */
export const TESTO_CONFERMA = { da: 6, a: 14 };

// L'oggetto appoggiato sulla scrivania, in primo piano. In alto l'occhiello, il titolo e l'evidenza; a meta' scena
// `indica` cerchia il punto da toccare (sul portatile la camera stacca sul pulsante che porta quel testo);
// la conferma arriva con una spunta a penna quando la voce la dice.
export function pianoOggetto(s: ScenaDi<"oggetto">, durata: number): PianoOggetto {
  const { voce } = s;
  const titolo = entroLettura(paroleTitolo(s.titolo, voce, 4), durata, Math.round(durata * 0.45));
  const evidenza = s.evidenza ? entroLettura(paroleTitolo(s.evidenza, voce, fineDi(titolo) + 4), durata, Math.round(durata * 0.6)) : [];
  const testiFine = Math.max(fineDi(titolo), fineDi(evidenza));
  // le scritte di indica e conferma, intere a dissolvenza finita, restano da leggere; la conferma segue indica di 22
  const tettoConferma = s.conferma ? Math.min(durata - 22, interoEntro(s.conferma, durata) - TESTO_CONFERMA.a) : Infinity;
  const tettoIndica = s.indica ? Math.min(durata - 30, interoEntro(s.indica, durata) - RICHIAMO_INDICA.a, tettoConferma - 22) : Infinity;
  const indica = s.indica && s.oggetto !== "nessuno" ? Math.min(tettoIndica, Math.max(testiFine + 6, Math.round(durata * 0.42))) : undefined;
  const conferma = s.conferma
    ? Math.min(tettoConferma, Math.max(testiFine + 8, (indica ?? -99) + 22, quandoDice(voce, s.conferma, Math.round(durata * 0.6))))
    : undefined;
  const testi: TestoAschermo[] = [
    { testo: s.etichetta, da: 4 },
    { testo: testoDi(titolo), da: fineDi(titolo) },
    ...(evidenza.length ? [{ testo: testoDi(evidenza), da: fineDi(evidenza) }] : []),
    ...(indica !== undefined && s.indica ? [{ testo: s.indica, da: indica + RICHIAMO_INDICA.a }] : []),
    ...(conferma !== undefined && s.conferma ? [{ testo: s.conferma, da: conferma + TESTO_CONFERMA.a }] : []),
  ];
  const suoni: Effetto[] = [
    ...(s.oggetto === "chiavetta" ? [{ da: 1, suono: "clic" as const }] : []),
  ];
  const eventi = [...titolo.map((p) => p.da), ...evidenza.map((p) => p.da), ...(indica !== undefined ? [indica, indica + 12] : []), ...(conferma !== undefined ? [conferma, conferma + 10] : [])];
  const stacchi = accentiMancanti(eventi, durata);
  return { titolo, evidenza, indica, conferma, stacchi, testi, suoni, eventi: [...eventi, ...stacchi] };
}
