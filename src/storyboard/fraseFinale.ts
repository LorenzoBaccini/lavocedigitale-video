import type { FraseFinale } from "../editoriale/variante.ts";
import type { Storyboard } from "./tipi.ts";
import { CHIAVE_CHIUSURA, FRASI_CHIUSURA } from "./tipi.ts";

/**
 * Lo storyboard con la frase finale scelta dalla variante al posto di quella del copione: voce, sottotitolo e chiusura
 * leggono tutti da qui. Si applica dopo la validazione (che vuole `TESTO_CHIUSURA`) e prima della voce.
 */
export function conFraseFinale(storyboard: Storyboard, fraseFinale: FraseFinale): Storyboard {
  const ultima = storyboard.frasi.length - 1;
  if (storyboard.frasi[ultima]?.scena.tipo !== "chiusura") throw new Error("l'ultima frase dello storyboard non è la chiusura");
  return {
    ...storyboard,
    frasi: storyboard.frasi.map((f, i) => (i === ultima ? { ...f, testo: FRASI_CHIUSURA[fraseFinale], chiave: CHIAVE_CHIUSURA } : f)),
  };
}
