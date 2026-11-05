import type { TempoParola } from "./tempiParole.ts";
import { testoAschermo } from "./testoAschermo.ts";

const parole = (testo: string) => testo.split(/\s+/).filter(Boolean);

/**
 * Le parole dette portate nella forma a schermo («dieci» → «10», l'indirizzo in una parola), con i loro tempi.
 * Una parola a schermo è pronta quando il testo detto fin lì la produce già uguale a quella della frase intera;
 * dura dalla prima all'ultima parola detta che la compongono. `null` se le due forme non si lasciano accoppiare.
 */
export function paroleAschermo(dette: TempoParola[]): TempoParola[] | null {
  const schermo = parole(testoAschermo(dette.map((p) => p.parola).join(" ")));
  const uscita: TempoParola[] = [];
  let prima = 0;
  for (let k = 0; k < dette.length; k++) {
    const finora = parole(testoAschermo(dette.slice(0, k + 1).map((p) => p.parola).join(" ")));
    const j = uscita.length;
    if (finora.length === j + 1 && finora[j] === schermo[j]) {
      uscita.push({ parola: schermo[j], da: dette[prima].da, a: dette[k].a });
      prima = k + 1;
    }
  }
  return uscita.length === schermo.length ? uscita : null;
}
