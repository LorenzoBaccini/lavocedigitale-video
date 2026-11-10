import type { Scena } from "../storyboard/tipi.ts";
import { fase, liscio } from "./regia.ts";
import type { NomeChiusura } from "./variante.ts";

/** Di quanto si avvicina, alla fine, la scena ferma della chiusura integrata. */
export const SPINTA_FERMA = 0.02;

/**
 * La scena che la chiusura integrata tiene ferma sotto la fascia: l'ultima di contenuto. `undefined` con la cartolina,
 * o se lo storyboard non finisce con una chiusura preceduta da una scena.
 */
export function scenaFerma(tipi: Scena["tipo"][], chiusura: NomeChiusura): number | undefined {
  const ultima = tipi.length - 1;
  return chiusura === "integrata" && ultima > 0 && tipi[ultima] === "chiusura" ? ultima - 1 : undefined;
}

/** La scala della scena ferma al frame `f` della sua sequenza: 1 finche' la scena dura, poi una spinta lenta per tutta la chiusura. */
export const scalaFerma = (f: number, durata: number, chiusura: number): number => 1 + SPINTA_FERMA * liscio(fase(f, durata, durata + chiusura));
