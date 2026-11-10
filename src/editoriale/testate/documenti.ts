import { corpo } from "../../anim";
import type { ScenaDi } from "../../scenes/props";
import type { PianoDocumenti } from "../piani/documenti";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";

/** Il titolo con la chiave in accento. */
export const titoloDocumenti = (props: ScenaDi<"documenti">, piano: PianoDocumenti, stile: Stile): Riga[] => [
  {
    parole: piano.titolo.map((p, i) => (piano.accento.includes(i) ? { ...p, colore: stile.colori.accento } : p)),
    size: corpo(props.titolo, 104, 16, stile.larghezza),
    peso: 700,
  },
];
