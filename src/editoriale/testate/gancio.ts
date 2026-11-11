import { corpo } from "../../anim";
import { TITOLO_TOP } from "../../impaginazione";
import type { PianoGancio } from "../piani/gancio";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";
import { altezzaRighe } from "../titoli";

const DURATA_SOTTOLINEATURA = 9;
const MARGINE_SCHERMO = 36;

/** Le righe del titolo del gancio (la chiave in grande, sottolineata) e la quota sotto la quale resta libero per lo schermo. */
export function titoloGancio(piano: PianoGancio, stile: Stile): { righe: Riga[]; limite: number } {
  const { parole, grande } = piano;
  const riga = (da: number, a: number, grossa: boolean): Riga[] => {
    const scelte = parole.slice(da, a);
    if (!scelte.length) return [];
    const testo = scelte.map((p) => p.t).join(" ");
    if (!grossa) return [{ parole: scelte, size: corpo(testo, 80, 22, stile.larghezza, 56), peso: 500 }];
    return [{ parole: scelte, size: corpo(testo, 136, 11, stile.larghezza, 76), peso: 700, sottolinea: { da: piano.sottolinea, durata: DURATA_SOTTOLINEATURA, colore: stile.colori.accento, seme: 4 } }];
  };
  const righe = [...riga(0, grande[0], false), ...riga(grande[0], grande[1], true), ...riga(grande[1], parole.length, false)];
  const limite = TITOLO_TOP + altezzaRighe(righe.map((r) => ({ testo: r.parole.map((p) => p.t).join(" "), size: r.size })), undefined, stile.larghezza) + MARGINE_SCHERMO;
  return { righe, limite };
}
