import { pianoScena } from "./editoriale/piani/index.ts";
import { titoliVisibili } from "./editoriale/piano.ts";
import type { Linea } from "./linea.ts";
import { scenaAlFrame } from "./linea.ts";
import { paroleAschermo } from "./paroleAschermo.ts";
import { bloccoRidondante } from "./ridondanza.ts";
import { propsFrase } from "./scenes/propsFrase.ts";
import type { Blocco } from "./sottotitoli.ts";
import { blocchiSottotitolo } from "./sottotitoli.ts";
import type { Storyboard } from "./storyboard/tipi.ts";
import { tempiParole } from "./tempiParole.ts";
import { testoAschermo } from "./testoAschermo.ts";
import { FPS } from "./theme.ts";
import type { Timing } from "./timing.ts";

/**
 * Il blocco di sottotitolo al frame globale `f` e se va nascosto. Si nasconde se le sue parole sono gia' scritte a
 * schermo, o se lo saranno prima che il blocco finisca: i titoli si scrivono con la voce, e un sottotitolo che
 * ripete la stessa frase mentre si compone e' un doppione.
 */
export function sottotitoloAlFrame(storyboard: Storyboard, timing: Timing, linea: Linea, f: number): { blocco: Blocco; locale: number; ridondante: boolean } {
  const i = scenaAlFrame(linea, f);
  const frase = storyboard.frasi[i];
  const locale = f - linea.inizi[i];
  const clip = timing.clips[i];
  const inizi = clip.parole && paroleAschermo(tempiParole(frase.testo, clip, FPS))?.map((p) => p.da);
  const blocchi = blocchiSottotitolo(testoAschermo(frase.testo), testoAschermo(frase.chiave), Math.round(clip.secondi * FPS), inizi ?? undefined);
  const blocco = blocchi.find((b) => locale >= b.da && locale < b.a) ?? blocchi[blocchi.length - 1];
  const { testi } = pianoScena(propsFrase(storyboard, timing, linea, i), linea.durate[i]);
  const quando = Math.max(locale, blocco.a - 1);
  return { blocco, locale, ridondante: bloccoRidondante(blocco, titoliVisibili(testi, quando)) };
}
