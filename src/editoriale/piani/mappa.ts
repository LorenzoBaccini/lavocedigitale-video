import type { ScenaDi } from "../../scenes/props.ts";
import type { FormaMappa } from "../../storyboard/tipi.ts";
import type { PianoCarta } from "./carta.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { entroLettura, fineDi, paroleTitolo, testoDi, ultimaEntro } from "../titoli.ts";
import { inSequenza, interoEntro } from "../lettura.ts";
import { suCarta } from "./carta.ts";
import { quandoDiceUna } from "../voce.ts";

/** La piantina comincia ad apparire, in dissolvenza. */
const PIANTINA = 2;
/** Il segno aspetta che la piantina si veda. */
const DOPO_PIANTINA = 6;
/** Fra il segno e l'etichetta del primo luogo: lo spillo e' caduto, la cerchiatura ha chiuso il giro; il tragitto parte gia' dal suo luogo. */
const DOPO_SEGNO: Record<FormaMappa, number> = { punto: 6, area: 10, percorso: 0 };
/** Il tragitto piu' breve, dalla partenza all'arrivo. */
const FRA_LUOGHI = 8;
/** Senza la voce, il tragitto ci mette tanto ad arrivare. */
const TRAGITTO = 18;
/** In quanti frame l'etichetta di un luogo entra in dissolvenza: da li' e' intera. */
export const DISSOLVENZA_LUOGO = 6;

export interface PianoMappa extends PianoCarta {
  /** la piantina comincia ad apparire */
  piantina: number;
  /** comincia il segno: lo spillo che cade, la cerchiatura, il tragitto */
  segno: number;
  /** frame in cui arriva l'etichetta di ciascun luogo; con `percorso` la seconda e' l'arrivo del tragitto */
  luoghi: number[];
  /** il titolo comincia a entrare */
  titolo: number;
  /** le parole del titolo, con i loro tempi: la scena le mostra cosi' come sono */
  parole: ParolaTitolo[];
}

// La piantina appare in dissolvenza, poi la mano segna il luogo quando la voce lo nomina (o a un quarto della scena);
// col percorso il tragitto arriva al secondo luogo quando la voce lo dice. Il titolo arriva sulla chiave. Ogni testo,
// intero, resta la sua `lettura` prima della fine (anticipando la voce se serve), anche nelle frasi cortissime.
export function pianoMappa(s: ScenaDi<"mappa">, durata: number): PianoMappa {
  const { voce, forma } = s;
  const n = s.luoghi.length;
  const tetti = inSequenza(s.luoghi.map((l) => interoEntro(l, durata) - DISSOLVENZA_LUOGO), FRA_LUOGHI);
  const tettoSegno = (tetti[0] ?? durata - 13) - DOPO_SEGNO[forma];
  const detto = quandoDiceUna(voce, s.luoghi[0], Math.round(durata * 0.25)) - DOPO_SEGNO[forma];
  const segno = Math.max(PIANTINA + DOPO_PIANTINA, Math.min(tettoSegno, detto));
  const luoghi = [segno + DOPO_SEGNO[forma]];
  if (n > 1) {
    const da = Math.max(0, voce.parole.findIndex((w) => w.da > luoghi[0]));
    const arrivo = quandoDiceUna(voce, s.luoghi[1], luoghi[0] + TRAGITTO, da);
    // sotto i 22 frame il tetto scende sotto il primo luogo: l'arrivo non lo precede mai
    luoghi.push(Math.max(luoghi[0], Math.min(tetti[1], Math.max(luoghi[0] + FRA_LUOGHI, arrivo))));
  }
  const chiave = voce.parole[voce.chiave]?.da ?? Math.round(durata * 0.6);
  const titolo = Math.max(segno, Math.min(ultimaEntro(s.titolo, durata), Math.max(segno + 4, chiave)));
  const parole = entroLettura(paroleTitolo(s.titolo, voce, titolo), durata, durata - 12);
  const testi = [{ testo: s.etichetta, da: 4 }, ...s.luoghi.map((testo, i) => ({ testo, da: luoghi[i] + DISSOLVENZA_LUOGO })), { testo: testoDi(parole), da: fineDi(parole) }];
  return { piantina: PIANTINA, segno, luoghi, titolo, parole, ...suCarta(testi, [], [PIANTINA, segno, ...luoghi, titolo], durata, s.contesto) };
}
