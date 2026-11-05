import { messaggioAllarme } from "../editoriale/piani/allarme.ts";
import { dispositivoDi, schermataDi } from "../editoriale/set/ambiente.ts";
import { voceDellaFrase } from "../editoriale/voce.ts";
import type { Linea } from "../linea.ts";
import type { Scena, Storyboard } from "../storyboard/tipi.ts";
import type { Timing } from "../timing.ts";
import type { PropsScena } from "./props.ts";

/** Dispositivo e schermata decisi qui, una volta sola e dal testo della frase: le scene leggono il valore. */
function ambiente(scena: Scena, testo: string) {
  if (scena.tipo === "allarme" || scena.tipo === "rischio") return { dispositivo: dispositivoDi(scena, testo) };
  if (scena.tipo === "gancio" || scena.tipo === "oggetto") return { schermata: schermataDi(scena, testo) };
  return {};
}

/** Le props della scena i-esima: i campi della scena, la durata, la voce della frase e le scene vicine. */
export function propsFrase(storyboard: Storyboard, timing: Timing, linea: Linea, i: number): PropsScena<Scena> {
  const frase = storyboard.frasi[i];
  const seguente = storyboard.frasi[i + 1];
  // la notifica arriva gia' nel gancio solo se l'allarme che segue e' sullo stesso portatile
  const allarmeSulPortatile = seguente?.scena.tipo === "allarme" && dispositivoDi(seguente.scena, seguente.testo) === "portatile" ? seguente.scena : undefined;
  const messaggioSeguente = allarmeSulPortatile ? messaggioAllarme(allarmeSulPortatile.notifica, voceDellaFrase(seguente.testo, seguente.chiave, timing.clips[i + 1])) : undefined;
  return {
    ...frase.scena,
    ...ambiente(frase.scena, frase.testo),
    durata: linea.durate[i],
    voce: voceDellaFrase(frase.testo, frase.chiave, timing.clips[i]),
    contesto: {
      precedente: storyboard.frasi[i - 1]?.scena.tipo,
      prossima: seguente?.scena.tipo,
      messaggioSeguente,
      mittenteSeguente: allarmeSulPortatile?.mittente,
      azioneSeguente: allarmeSulPortatile?.azione,
      orologio: storyboard.orologio,
    },
  };
}
