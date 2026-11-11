import type { ScenaDi } from "../../scenes/props.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";
import { entrateConVoce } from "./entrate.ts";

/** Frame minimi fra un nodo e il successivo: il tempo di disegnare la freccia che li lega. */
const FRA_NODI = 10;
/** La freccia parte dopo che il riquadro e' stato tracciato... */
const DOPO_NODO = 5;
/** ...o, se il nodo dopo tarda, poco prima che arrivi: non resta a indicare il vuoto. */
const PRIMA_DEL_NODO = 9;
/** Il testo del nodo entra in dissolvenza mentre si traccia il riquadro, da qui a qui (frame dopo l'entrata del nodo). */
export const TESTO_NODO = { da: 3, a: 9 };

export interface PianoFlusso extends PianoCarta {
  /** frame in cui entra ciascun nodo */
  nodi: number[];
  /** frame in cui comincia a tracciarsi ciascuna freccia: la i-esima fra il nodo i e il nodo i+1 */
  frecce: number[];
}

// Una catena di riquadri sul foglio: il primo nodo subito, gli altri quando la voce dice una parola del loro testo
// (vedi `entrateConVoce`), mai meno di 10 frame l'uno dall'altro.
export function pianoFlusso(s: ScenaDi<"flusso">, durata: number): PianoFlusso {
  const nodi = entrateConVoce(s.voce, s.nodi.map((n) => n.testo), durata, FRA_NODI, TESTO_NODO.a);
  const frecce = nodi.slice(1).map((dopo, i) => Math.max(nodi[i] + DOPO_NODO, dopo - PRIMA_DEL_NODO));
  const testi = [{ testo: s.etichetta, da: 4 }, ...s.nodi.map((nodo, i) => ({ testo: nodo.testo, da: nodi[i] + TESTO_NODO.a }))];
  return { nodi, frecce, ...suCarta(testi, [], [4, ...nodi, ...frecce], durata, s.contesto) };
}
