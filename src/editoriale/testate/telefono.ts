import { corpo } from "../../anim";
import { TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import type { PianoTelefono } from "../piani/telefono";
import { sopraIlTitolo } from "../set/misureOcchiello";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";
import { altezzaRighe } from "../titoli";

/** Il titolo con la chiave in accento e la quota dove finiscono occhiello e titolo. */
export function titoloTelefono(props: ScenaDi<"telefono">, piano: PianoTelefono, stile: Stile): { righe: Riga[]; sottoITitoli: number } {
  const sottoITitoli = TITOLO_TOP + sopraIlTitolo(props.etichetta) + altezzaRighe([{ testo: props.titolo, size: corpo(props.titolo, 104, 16, stile.larghezza) }], undefined, stile.larghezza);
  const righe: Riga[] = [
    {
      parole: piano.titolo.map((p, i) => (piano.accento.includes(i) ? { ...p, colore: stile.colori.accento, colpo: true } : p)),
      size: corpo(props.titolo, 104, 16, stile.larghezza),
      peso: 700,
    },
  ];
  return { righe, sottoITitoli };
}
