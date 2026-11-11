import { corpo } from "../../anim";
import { ALTEZZA, FONDO_TITOLO, TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import type { PianoRischio } from "../piani/rischio";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";
import { altezzaRighe } from "../titoli";

/** Spazio fra un testo e il bordo dello schermo. */
const STACCO = 30;

/** Sopratitolo e titolo, e le quote fra cui sta lo schermo: sotto il primo e sopra il secondo, con lo stacco. */
export function titoliRischio(props: ScenaDi<"rischio">, piano: PianoRischio, stile: Stile): { sopra: Riga[]; titolo: Riga[]; alto: number; basso: number } {
  const alto = TITOLO_TOP + altezzaRighe([{ testo: props.sopra, size: corpo(props.sopra, 72, 22, stile.larghezza) }], undefined, stile.larghezza) + STACCO;
  const basso = ALTEZZA - FONDO_TITOLO - altezzaRighe([{ testo: props.titolo, size: corpo(props.titolo, 132, 12, stile.larghezza) }], undefined, stile.larghezza) - STACCO;
  const sopra: Riga[] = [{ parole: piano.sopra, size: corpo(props.sopra, 72, 22, stile.larghezza), peso: 500, corsivo: true }];
  const titolo: Riga[] = [
    {
      parole: piano.titolo.map((p, i) => (piano.accento.includes(i) ? { ...p, colore: stile.colori.accento, colpo: true } : p)),
      size: corpo(props.titolo, 132, 12, stile.larghezza),
      peso: 700,
    },
  ];
  return { sopra, titolo, alto, basso };
}
