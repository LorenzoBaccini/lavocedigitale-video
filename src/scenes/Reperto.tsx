import { useCurrentFrame } from "remotion";

import { pianoReperto } from "../editoriale/piani/reperto";
import { SPAZIO_OCCHIELLO } from "../editoriale/set/misureOcchiello";
import { Occhiello } from "../editoriale/set/Occhiello";
import { RepertoSulSet } from "../editoriale/set/reperti/RepertoSulSet";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { titoloReperto } from "../editoriale/testate/reperto";
import { Titolo } from "../editoriale/Titolo";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

// Il reperto: un oggetto grande al centro, nel buio, che reagisce sulla chiave (si crepa, si spezza, si apre).
export const Reperto: React.FC<ScenaDi<"reperto">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta } = props;
  const piano = pianoReperto(props, durata);
  const { righe, alto, basso } = titoloReperto(props, piano, stile);
  return (
    <>
      <RepertoSulSet reperto={props.reperto} messaggio={props.messaggio} mittente={props.mittente} f={f} durata={durata} reazione={piano.reazione} stacchi={piano.stacchi} alto={alto} basso={basso} />
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: allineaFlesso(stile), gap: SPAZIO_OCCHIELLO }}>
        <Occhiello f={f} testo={etichetta} />
        <Titolo nome="titolo" f={f} righe={righe} style={{ alignSelf: "stretch" }} />
      </div>
    </>
  );
};
