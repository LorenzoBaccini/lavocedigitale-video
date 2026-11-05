import type { Contesto } from "../../scenes/props.ts";
import { SU_CARTA } from "../carta/stile.ts";
import type { Effetto, Piano } from "../piano.ts";
import { accentiMancanti, fase, liscio } from "../regia.ts";

export interface PianoCarta extends Piano {
  /** stacchi della camera sul foglio, aggiunti per la regola del secondo accento */
  stacchi: number[];
}

/**
 * Completa il piano di una scena su carta: il fruscio del foglio quando si arriva dal set, gli stacchi che
 * spezzano le pause troppo lunghe. `eventi` sono i cambiamenti gia' previsti dalla scena.
 */
export function suCarta(testi: Piano["testi"], suoni: Effetto[], eventi: number[], durata: number, contesto: Contesto): PianoCarta {
  const dalSet = !contesto.precedente || !SU_CARTA.has(contesto.precedente);
  const stacchi = accentiMancanti(eventi, durata);
  return {
    testi,
    suoni: [...(dalSet ? [{ da: 0, suono: "carta" as const, volume: 0.8 }] : []), ...suoni],
    eventi: [...eventi, ...stacchi],
    stacchi,
  };
}

/** Quanto il foglio si avvicina al frame f: una discesa lentissima, piu' uno scatto a ogni stacco. */
export const spintaFoglio = (f: number, durata: number, stacchi: number[]) => 0.018 * liscio(fase(f, 0, durata)) + 0.045 * stacchi.filter((s) => f >= s).length;
