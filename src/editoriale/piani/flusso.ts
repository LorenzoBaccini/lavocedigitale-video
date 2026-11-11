import type { ScenaDi } from "../../scenes/props.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";
import { quandoDiceUna } from "../voce.ts";

/** Frame minimi fra un nodo e il successivo: il tempo di disegnare la freccia che li lega. */
const FRA_NODI = 10;
/** La freccia parte dopo che il riquadro e' stato tracciato... */
const DOPO_NODO = 5;
/** ...o, se il nodo dopo tarda, poco prima che arrivi: non resta a indicare il vuoto. */
const PRIMA_DEL_NODO = 9;
/** Il primo nodo entra subito, in apertura, senza aspettare la voce. */
const PRIMO = 2;

export interface PianoFlusso extends PianoCarta {
  /** frame in cui entra ciascun nodo */
  nodi: number[];
  /** frame in cui comincia a tracciarsi ciascuna freccia: la i-esima fra il nodo i e il nodo i+1 */
  frecce: number[];
}

// Una catena di riquadri sul foglio: il primo nodo subito, gli altri quando la voce dice una parola del loro testo
// (o a intervalli regolari fino al 70 % della scena), mai meno di 10 frame l'uno dall'altro e sempre dentro la scena.
export function pianoFlusso(s: ScenaDi<"flusso">, durata: number): PianoFlusso {
  const { voce } = s;
  const n = s.nodi.length;
  const regolare = (i: number) => Math.round(PRIMO + (i * (durata * 0.7 - PRIMO)) / Math.max(1, n - 1));
  const nodi: number[] = [];
  s.nodi.forEach((nodo, i) => {
    // il testo (3 frame dopo il nodo) deve essere intero 10 frame prima della fine e ogni nodo lascia lo spazio per
    // quelli che seguono; solo con una scena cortissima vince la distanza minima
    const tetto = Math.max(PRIMO + i * FRA_NODI, durata - 13 - (n - 1 - i) * FRA_NODI);
    if (i === 0) return void nodi.push(Math.min(PRIMO, tetto));
    const da = Math.max(0, voce.parole.findIndex((w) => w.da >= nodi[i - 1]));
    const detto = quandoDiceUna(voce, nodo.testo, regolare(i), da);
    nodi.push(Math.min(tetto, Math.max(nodi[i - 1] + FRA_NODI, detto)));
  });
  const frecce = nodi.slice(1).map((dopo, i) => Math.max(nodi[i] + DOPO_NODO, dopo - PRIMA_DEL_NODO));
  const testi = [{ testo: s.etichetta, da: 4 }, ...s.nodi.map((nodo, i) => ({ testo: nodo.testo, da: nodi[i] + 3 }))];
  return { nodi, frecce, ...suCarta(testi, [], [4, ...nodi, ...frecce], durata, s.contesto) };
}
