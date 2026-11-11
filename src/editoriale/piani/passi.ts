import type { ScenaDi } from "../../scenes/props.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";
import { entrateConVoce } from "./entrate.ts";

/** Frame minimi fra un passo e il successivo: il tempo di leggere il numero prima che arrivi l'altro. */
const FRA_PASSI = 8;
/** In quanti frame un passo entra in dissolvenza: da li' il suo testo e' intero. */
export const DISSOLVENZA_PASSO = 7;

export interface PianoPassi extends PianoCarta {
  /** frame in cui entra ciascun passo */
  passi: number[];
}

// Una colonna numerata sul quaderno: il primo passo subito, gli altri quando la voce dice una parola del loro testo
// (vedi `entrateConVoce`), mai meno di 8 frame l'uno dall'altro.
export function pianoPassi(s: ScenaDi<"passi">, durata: number): PianoPassi {
  const passi = entrateConVoce(s.voce, s.passi.map((p) => p.testo), durata, FRA_PASSI, DISSOLVENZA_PASSO);
  const testi = [{ testo: s.etichetta, da: 4 }, ...s.passi.map((p, i) => ({ testo: p.testo, da: passi[i] + DISSOLVENZA_PASSO }))];
  return { passi, ...suCarta(testi, [], [4, ...passi], durata, s.contesto) };
}
