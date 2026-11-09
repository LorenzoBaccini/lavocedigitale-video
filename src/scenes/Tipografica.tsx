import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { fase } from "../editoriale/regia";
import { allineaFlesso, allineaTesto, useStile } from "../editoriale/stili";
import { MARGINE, TITOLO_TOP } from "../impaginazione";

// Ripiego per uno schema senza scena: la frase stampata su un foglio.
export const Tipografica: React.FC<{ testo: string; durata: number }> = ({ testo }) => {
  const f = useCurrentFrame();
  const stile = useStile();
  return (
    <Foglio tipo="liscia">
      <div data-impaginazione="testo" style={{ position: "absolute", top: TITOLO_TOP + 120, left: MARGINE, right: MARGINE, textAlign: allineaTesto(stile), fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: Math.max(52, corpo(testo, 84, 50, stile.larghezza)), lineHeight: 1.15, color: stile.colori.inchiostro.testo, opacity: fase(f, 0, 8) }}>{testo}</div>
    </Foglio>
  );
};
