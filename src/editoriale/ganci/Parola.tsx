import { useCurrentFrame } from "remotion";

import { ALTEZZA, MARGINE } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import { Foglio } from "../carta/Foglio";
import { spintaFoglio } from "../piani/carta";
import { pianoGancio } from "../piani/gancio";
import { useStile } from "../stili";
import { FASCIA_PAROLA, titoloParola } from "../testate/parola";
import { Titolo } from "../Titolo";

// Il gancio a parola: niente oggetto, solo la frase detta a tutta pagina sulla superficie delle grafiche dello stile.
export const Parola: React.FC<ScenaDi<"gancio">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const piano = pianoGancio(props, props.durata);
  const righe = titoloParola(piano, stile);
  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, props.durata, piano.stacchi)}>
      <Titolo
        nome="titolo"
        f={f}
        tinta="grafica"
        righe={righe}
        style={{ position: "absolute", top: FASCIA_PAROLA.alto, bottom: ALTEZZA - FASCIA_PAROLA.basso, left: MARGINE, right: MARGINE, justifyContent: "center" }}
      />
    </Foglio>
  );
};
