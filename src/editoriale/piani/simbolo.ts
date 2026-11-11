import type { ScenaDi } from "../../scenes/props.ts";
import type { PianoCarta } from "./carta.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { entroLettura, fineDi, paroleTitolo, testoDi, ultimaEntro } from "../titoli.ts";
import { suCarta } from "./carta.ts";

/** Quanti frame ci mette la mano a tracciare il pittogramma intero. */
export const TRACCIA_SIMBOLO = 18;
/** Fra il titolo e la barra: il titolo si legge, poi il pennarello lo nega. */
const DOPO_TITOLO = 8;

export interface PianoSimbolo extends PianoCarta {
  /** il pittogramma comincia a tracciarsi */
  simbolo: number;
  /** il titolo comincia a entrare */
  titolo: number;
  /** le parole del titolo, con i loro tempi: la scena le mostra cosi' come sono */
  parole: ParolaTitolo[];
  /** la diagonale a pennarello sopra il pittogramma, solo con `barrato` */
  barra?: number;
}

// Un pittogramma grande, tracciato a mano da subito; il titolo arriva quando la voce dice la chiave (prima, se la chiave
// cade troppo tardi per leggerlo) e, se la cosa manca o non vale piu', il pennarello lo barra subito dopo.
export function pianoSimbolo(s: ScenaDi<"simbolo">, durata: number): PianoSimbolo {
  const { voce } = s;
  const simbolo = 4;
  const chiave = voce.parole[voce.chiave]?.da ?? Math.round(durata * 0.35);
  // il titolo, e la barra dopo di lui, finiscono dentro la scena anche se la voce arriva tardi; il titolo resta da leggere
  const tetto = Math.min(durata - 12 - (s.barrato ? DOPO_TITOLO : 0), ultimaEntro(s.titolo, durata));
  const titolo = Math.max(simbolo + 6, Math.min(tetto, Math.max(simbolo + 10, chiave)));
  const barra = s.barrato ? titolo + DOPO_TITOLO : undefined;
  const parole = entroLettura(paroleTitolo(s.titolo, voce, titolo), durata, durata - 12);
  const testi = [
    { testo: s.etichetta, da: 4 },
    { testo: testoDi(parole), da: fineDi(parole) },
  ];
  const eventi = [simbolo, titolo, ...(barra !== undefined ? [barra] : [])];
  return { simbolo, titolo, parole, barra, ...suCarta(testi, [], eventi, durata, s.contesto) };
}
