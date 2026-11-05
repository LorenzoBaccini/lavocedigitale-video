import type { ScenaDi } from "../../scenes/props.ts";
import type { TestoAschermo } from "../piano.ts";
import { normalizza } from "../../sottotitoli.ts";
import { testoAschermo } from "../../testoAschermo.ts";
import type { Voce } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

/** Dopo quanti frame dalla comparsa della voce la penna la spunta. */
export const RITARDO_SPUNTA = 6;

/**
 * Quando la voce comincia a nominare la voce della lista: la prima parola piena (o cifra) di `grande` o di `piccolo`
 * detta dopo `da`. «chiavetta» basta per «≥ 8 GB / la chiavetta USB». Se la voce non ne dice nessuna, `ripiego`.
 */
export function quandoNomina(voce: Voce, v: { grande: string; piccolo: string }, da: number, ripiego: number): number {
  const piene = new Set(testoAschermo(`${v.grande} ${v.piccolo}`).split(/\s+/).map(normalizza).filter((p) => p.length >= 4 || /\d/.test(p)));
  const detta = voce.parole.find((p) => p.da >= da - 2 && piene.has(normalizza(p.t)));
  return detta ? detta.da : ripiego;
}

export interface PianoChecklist extends PianoCarta {
  /** frame in cui compare ciascuna voce */
  voci: number[];
}

// La lista su un quaderno a quadretti: ogni voce si scrive quando la voce comincia a nominarla (o a intervalli regolari)
// e la penna la spunta subito dopo.
export function pianoChecklist(s: ScenaDi<"checklist">, durata: number): PianoChecklist {
  const n = s.voci.length;
  const passo = (durata - 40) / n;
  const voci: number[] = [];
  s.voci.forEach((v, i) => {
    const regolare = Math.round(10 + i * passo);
    const minimo = i ? voci[i - 1] + 14 : 8;
    voci.push(Math.min(durata - 20, Math.max(minimo, quandoNomina(s.voce, v, minimo, regolare))));
  });
  const testi: TestoAschermo[] = [{ testo: s.etichetta, da: 4 }, ...s.voci.flatMap((v, i) => [{ testo: v.grande, da: voci[i] + 4 }, { testo: v.piccolo, da: voci[i] + 6 }])];
  return { voci, ...suCarta(testi, [], [4, ...voci, ...voci.map((v) => v + RITARDO_SPUNTA)], durata, s.contesto) };
}
