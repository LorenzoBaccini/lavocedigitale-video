import type { Blocco } from "./sottotitoli.ts";
import { normalizza } from "./sottotitoli.ts";

const paroleDi = (testo: string) => testo.split(/\s+/).map(normalizza).filter(Boolean);

// Il blocco si nasconde solo se le sue parole compaiono di seguito nei testi a schermo letti uno dopo l'altro
// (quali testi e da quando: il piano della scena, `editoriale/piano.ts`).
export function bloccoRidondante(blocco: Blocco, titoli: string[]): boolean {
  const cercate = blocco.parole.map((p) => normalizza(p.t)).filter(Boolean);
  const testo = titoli.flatMap(paroleDi);
  if (!cercate.length) return false;
  for (let i = 0; i + cercate.length <= testo.length; i++) {
    if (cercate.every((c, j) => testo[i + j] === c)) return true;
  }
  return false;
}
