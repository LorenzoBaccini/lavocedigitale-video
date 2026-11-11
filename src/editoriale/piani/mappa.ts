import type { ScenaDi } from "../../scenes/props.ts";
import type { FormaMappa } from "../../storyboard/tipi.ts";
import type { PianoCarta } from "./carta.ts";
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

export interface PianoMappa extends PianoCarta {
  /** la piantina comincia ad apparire */
  piantina: number;
  /** comincia il segno: lo spillo che cade, la cerchiatura, il tragitto */
  segno: number;
  /** frame in cui arriva l'etichetta di ciascun luogo; con `percorso` la seconda e' l'arrivo del tragitto */
  luoghi: number[];
  titolo: number;
}

// La piantina appare in dissolvenza, poi la mano segna il luogo quando la voce lo nomina (o a un quarto della scena);
// col percorso il tragitto arriva al secondo luogo quando la voce lo dice. Il titolo arriva sulla chiave. Ogni testo e'
// intero 10 frame prima della fine, anche nelle frasi cortissime.
export function pianoMappa(s: ScenaDi<"mappa">, durata: number): PianoMappa {
  const { voce, forma } = s;
  const n = s.luoghi.length;
  const ultimo = durata - 13;
  const tettoSegno = ultimo - (n - 1) * FRA_LUOGHI - DOPO_SEGNO[forma];
  const detto = quandoDiceUna(voce, s.luoghi[0], Math.round(durata * 0.25)) - DOPO_SEGNO[forma];
  const segno = Math.max(PIANTINA + DOPO_PIANTINA, Math.min(tettoSegno, detto));
  const luoghi = [segno + DOPO_SEGNO[forma]];
  if (n > 1) {
    const da = Math.max(0, voce.parole.findIndex((w) => w.da > luoghi[0]));
    const arrivo = quandoDiceUna(voce, s.luoghi[1], luoghi[0] + TRAGITTO, da);
    luoghi.push(Math.min(ultimo, Math.max(luoghi[0] + FRA_LUOGHI, arrivo)));
  }
  const chiave = voce.parole[voce.chiave]?.da ?? Math.round(durata * 0.6);
  const titolo = Math.min(ultimo, Math.max(segno + 4, chiave));
  const testi = [{ testo: s.etichetta, da: 4 }, ...s.luoghi.map((testo, i) => ({ testo, da: luoghi[i] + 3 })), { testo: s.titolo, da: titolo + 3 }];
  return { piantina: PIANTINA, segno, luoghi, titolo, ...suCarta(testi, [], [PIANTINA, segno, ...luoghi, titolo], durata, s.contesto) };
}
