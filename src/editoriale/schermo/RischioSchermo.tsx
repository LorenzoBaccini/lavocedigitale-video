import { AbsoluteFill, useCurrentFrame } from "remotion";

import { FONDO_TITOLO, LARGHEZZA, MARGINE, TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import { pianoRischio } from "../piani/rischio";
import { fase, liscio, mix, uscita } from "../regia";
import { useStile } from "../stili";
import { inizioTitoloBasso } from "../testate/quote";
import { titoliRischio } from "../testate/rischio";
import { Titolo } from "../Titolo";
import { contenutoPortatile, contenutoTelefono, scalaInsieme, vistaDi } from "./contenuto";
import { Schermata } from "./Schermata";

const STACCO = 30;

// La conseguenza a tutto quadro: lo schermo fra sopratitolo e titolo, la camera si allontana piano e sulla chiave lo
// schermo si spegne di poco.
export const RischioSchermo: React.FC<ScenaDi<"rischio">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata } = props;
  const piano = pianoRischio(props, durata);
  const { sopra, titolo, alto } = titoliRischio(props, piano, stile);
  // quella del set non conta la riserva del colpo: a sinistra il titolo andrebbe su due righe sopra lo schermo
  const basso = inizioTitoloBasso(props.titolo, titolo, stile) - STACCO;
  const telefono = props.dispositivo === "smartphone";
  const c = telefono ? contenutoTelefono({ tipo: "blocco" }) : contenutoPortatile({ tipo: "desktop" }, props.contesto.orologio);
  const quadro = { x: 0, y: alto, w: LARGHEZZA, h: basso - alto };
  const base = scalaInsieme(c, quadro, quadro.h);
  const scala = base * mix(1.3, 1, uscita(fase(f, 0, durata))) * 1.136 ** piano.stacchi.filter((s) => f >= s).length;
  const v = vistaDi(c, quadro, { u: c.misure.w / 2, v: c.misure.h * (telefono ? 0.22 : 0.48), scala });
  const buio = 0.4 * liscio(fase(f, piano.ombra, piano.ombra + 20));
  return (
    <AbsoluteFill style={{ background: stile.colori.superficie }}>
      <Schermata nome={telefono ? "telefono" : "schermo"} quadro={quadro} vista={v} misure={c.misure} fondo={c.fondo} buio={buio}>
        {c.strato}
      </Schermata>
      <Titolo nome="sopra" f={f} righe={sopra} style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE }} />
      <Titolo nome="titolo" f={f} righe={titolo} style={{ position: "absolute", bottom: FONDO_TITOLO, left: MARGINE, right: MARGINE }} />
    </AbsoluteFill>
  );
};
