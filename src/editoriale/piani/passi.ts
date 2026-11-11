import type { ScenaDi } from "../../scenes/props.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";
import { quandoDiceUna } from "../voce.ts";

/** Frame minimi fra un passo e il successivo: il tempo di leggere il numero prima che arrivi l'altro. */
const FRA_PASSI = 8;
/** Il primo passo entra subito, in apertura. */
const PRIMO = 2;

export interface PianoPassi extends PianoCarta {
  /** frame in cui entra ciascun passo */
  passi: number[];
}

// Una colonna numerata sul quaderno: il primo passo subito, gli altri quando la voce dice una parola del loro testo
// (o a intervalli regolari fino al 70 % della scena), mai meno di 8 frame l'uno dall'altro e sempre dentro la scena.
export function pianoPassi(s: ScenaDi<"passi">, durata: number): PianoPassi {
  const { voce } = s;
  const n = s.passi.length;
  const regolare = (i: number) => Math.round(PRIMO + (i * (durata * 0.7 - PRIMO)) / Math.max(1, n - 1));
  const passi: number[] = [];
  s.passi.forEach((p, i) => {
    // il testo (3 frame dopo il passo) deve essere intero 10 frame prima della fine e ogni passo lascia lo spazio per
    // quelli che seguono; solo con una scena cortissima vince la distanza minima
    const tetto = Math.max(PRIMO + i * FRA_PASSI, durata - 13 - (n - 1 - i) * FRA_PASSI);
    if (i === 0) return void passi.push(Math.min(PRIMO, tetto));
    const da = Math.max(0, voce.parole.findIndex((w) => w.da >= passi[i - 1]));
    const detto = quandoDiceUna(voce, p.testo, regolare(i), da);
    passi.push(Math.min(tetto, Math.max(passi[i - 1] + FRA_PASSI, detto)));
  });
  const testi = [{ testo: s.etichetta, da: 4 }, ...s.passi.map((p, i) => ({ testo: p.testo, da: passi[i] + 3 }))];
  return { passi, ...suCarta(testi, [], [4, ...passi], durata, s.contesto) };
}
