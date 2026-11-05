import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { INCHIOSTRO } from "../editoriale/carta/stile";
import { fase } from "../editoriale/regia";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import { SERIF } from "../theme";

// Ripiego per uno schema senza scena: la frase stampata su un foglio.
export const Tipografica: React.FC<{ testo: string; durata: number }> = ({ testo }) => {
  const f = useCurrentFrame();
  return (
    <Foglio tipo="liscia">
      <div data-impaginazione="testo" style={{ position: "absolute", top: TITOLO_TOP + 120, left: MARGINE, right: MARGINE, textAlign: "center", fontFamily: SERIF, fontWeight: 700, fontSize: Math.max(52, corpo(testo, 84, 50)), lineHeight: 1.15, color: INCHIOSTRO.testo, opacity: fase(f, 0, 8) }}>{testo}</div>
    </Foglio>
  );
};
