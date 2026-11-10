import { useCurrentFrame } from "remotion";

import { ALTEZZA, MARGINE } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import { Foglio } from "../carta/Foglio";
import { spintaFoglio } from "../piani/carta";
import { pianoGancio } from "../piani/gancio";
import { useStile } from "../stili";
import { conAlfa } from "../stili/alfa";
import { fantasmaChiave, FASCIA_PAROLA, titoloParola } from "../testate/parola";
import { Titolo } from "../Titolo";

// Il gancio a parola: niente oggetto, solo la frase detta a tutta pagina sulla superficie delle grafiche dello stile. La
// chiave c'e' gia' dal primo fotogramma, enorme e in trasparenza, e si riempie quando la voce la dice.
export const Parola: React.FC<ScenaDi<"gancio">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const piano = pianoGancio(props, props.durata);
  const righe = titoloParola(piano, stile);
  const posto = { position: "absolute", top: FASCIA_PAROLA.alto, bottom: ALTEZZA - FASCIA_PAROLA.basso, left: MARGINE, right: MARGINE, justifyContent: "center" } as const;
  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, props.durata, piano.stacchi)}>
      {/* stessa impaginazione del titolo, parola per parola: il fantasma sta esattamente sotto la chiave vera */}
      <Titolo nome="chiave-fantasma" f={f} tinta="grafica" righe={fantasmaChiave(righe, conAlfa(stile.colori.inchiostro.testo, 0.2))} style={posto} />
      <Titolo nome="titolo" f={f} tinta="grafica" righe={righe} style={posto} />
    </Foglio>
  );
};
