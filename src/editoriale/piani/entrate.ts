import { inSequenza, interoEntro } from "../lettura.ts";
import type { Voce } from "../voce.ts";
import { quandoDiceUna } from "../voce.ts";

/** Il primo elemento entra subito, in apertura, senza aspettare la voce: con 4 elementi in una frase di 1 s non ci sarebbe posto per gli altri. */
const PRIMO = 2;

// Gli elementi di una colonna o di una catena (passi, nodi): il primo subito, gli altri quando la voce dice una parola del
// loro testo (o a intervalli regolari fino al 70 % della scena), mai meno di `distanza` frame l'uno dall'altro e sempre
// in tempo per leggerli: il testo (3 frame dopo l'entrata) resta intero la sua `lettura` prima della fine, anche
// anticipando la voce, e ogni elemento lascia lo spazio per quelli che seguono; solo con una scena cortissima vince la
// distanza minima.
export function entrateConVoce(voce: Voce, testi: string[], durata: number, distanza: number): number[] {
  const n = testi.length;
  const regolare = (i: number) => Math.round(PRIMO + (i * (durata * 0.7 - PRIMO)) / Math.max(1, n - 1));
  const tetti = inSequenza(testi.map((t) => interoEntro(t, durata) - 3), distanza, PRIMO);
  const entrate: number[] = [];
  testi.forEach((testo, i) => {
    const tetto = tetti[i];
    if (i === 0) return void entrate.push(Math.min(PRIMO, tetto));
    const da = Math.max(0, voce.parole.findIndex((w) => w.da >= entrate[i - 1]));
    const detto = quandoDiceUna(voce, testo, regolare(i), da);
    entrate.push(Math.min(tetto, Math.max(entrate[i - 1] + distanza, detto)));
  });
  return entrate;
}
