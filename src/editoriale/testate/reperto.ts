import { corpo } from "../../anim";
import { FONDO_UTILE, TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import type { PianoReperto } from "../piani/reperto";
import { sopraIlTitolo } from "../set/misureOcchiello";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";
import { altezzaRighe, carattereTitoli } from "../titoli";

const STACCO = 28;

/** Il titolo, e la fascia fra il titolo e i sottotitoli dove sta il reperto. */
export function titoloReperto(props: ScenaDi<"reperto">, piano: PianoReperto, stile: Stile): { righe: Riga[]; alto: number; basso: number } {
  const size = corpo(props.titolo, 104, 16, stile.larghezza);
  const alto = TITOLO_TOP + sopraIlTitolo(props.etichetta) + altezzaRighe([{ testo: props.titolo, size }], undefined, carattereTitoli(stile)) + STACCO;
  return { righe: [{ parole: piano.titolo, size, peso: 700 }], alto, basso: FONDO_UTILE - STACCO };
}
