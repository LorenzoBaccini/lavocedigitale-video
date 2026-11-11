import { corpo } from "../../anim";
import { TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import type { PianoOggetto } from "../piani/oggetto";
import { sopraIlTitolo } from "../set/misureOcchiello";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";
import { altezzaRighe } from "../titoli";

/** Titolo ed evidenza, e la quota sotto l'occhiello e i titoli dove comincia l'oggetto. */
export function titoliOggetto(props: ScenaDi<"oggetto">, piano: PianoOggetto, stile: Stile): { righe: Riga[]; limite: number } {
  const testata = [{ testo: props.titolo, size: corpo(props.titolo, 100, 18, stile.larghezza) }, ...(props.evidenza ? [{ testo: props.evidenza, size: corpo(props.evidenza, 84, 15, stile.larghezza) }] : [])];
  const limite = TITOLO_TOP + sopraIlTitolo(props.etichetta) + altezzaRighe(testata, undefined, stile.larghezza) + 36;
  const righe: Riga[] = [
    { parole: piano.titolo, size: corpo(props.titolo, 100, 18, stile.larghezza), peso: 700 },
    ...(piano.evidenza.length ? [{ parole: piano.evidenza.map((p) => ({ ...p, colore: stile.colori.accento })), size: corpo(props.evidenza ?? "", 84, 15, stile.larghezza), peso: 600, corsivo: true }] : []),
  ];
  return { righe, limite };
}
