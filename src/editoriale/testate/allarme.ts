import { corpo } from "../../anim";
import type { ScenaDi } from "../../scenes/props";
import type { PianoAllarme } from "../piani/allarme";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";

/** Il sopratitolo in corsivo e il titolo con la chiave in accento. */
export function titoliAllarme(props: ScenaDi<"allarme">, piano: PianoAllarme, stile: Stile): { sopra: Riga[]; titolo: Riga[] } {
  const sopra: Riga[] = [{ parole: piano.sopra, size: corpo(props.sopra, 68, 22, stile.larghezza), peso: 500, corsivo: true }];
  const titolo: Riga[] = [
    {
      parole: piano.titolo.map((p, i) => (piano.accento.includes(i) ? { ...p, colore: stile.colori.accento, colpo: true } : p)),
      size: corpo(props.titolo, 112, 15, stile.larghezza),
      peso: 700,
    },
  ];
  return { sopra, titolo };
}
