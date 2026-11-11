import { Vector3 } from "three";
import { useCurrentFrame } from "remotion";

import { useDettagli } from "../editoriale/DettagliVideo";
import { pianoRischio } from "../editoriale/piani/rischio";
import { fase, liscio, mix, uscita } from "../editoriale/regia";
import { angoliInQuadro, fraLeQuote, puntoSchermo, SCHERMO_PX, sferica } from "../editoriale/set/geometria";
import type { Camera } from "../editoriale/set/geometria";
import { Ingombro } from "../editoriale/set/Ingombro";
import { avvicina } from "../editoriale/set/inquadrature";
import { Smartphone } from "../editoriale/set/oggetti/Oggetti";
import { POSTI } from "../editoriale/set/oggetti/posti";
import { Set3D } from "../editoriale/set/Set3D";
import { angoliSchermoTelefono, puntoTelefono, TELEFONO_PX } from "../editoriale/set/telefono";
import { Velo } from "../editoriale/set/Velo";
import { useStile } from "../editoriale/stili";
import { titoliRischio } from "../editoriale/testate/rischio";
import { Titolo } from "../editoriale/Titolo";
import { FONDO_TITOLO, MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const CENTRO = new Vector3(0.1, 1.35, -0.7);
const BORDI_SCHERMO = {
  alti: [puntoSchermo(0, 0), puntoSchermo(SCHERMO_PX.w / 2, 0), puntoSchermo(SCHERMO_PX.w, 0)],
  bassi: [puntoSchermo(0, SCHERMO_PX.h), puntoSchermo(SCHERMO_PX.w / 2, SCHERMO_PX.h), puntoSchermo(SCHERMO_PX.w, SCHERMO_PX.h)],
};
const BORDI_TELEFONO = {
  alti: [puntoTelefono(0, 0), puntoTelefono(TELEFONO_PX.w, 0)],
  bassi: [puntoTelefono(0, TELEFONO_PX.h), puntoTelefono(TELEFONO_PX.w, TELEFONO_PX.h)],
};
function camera(telefono: boolean, t: number): Camera {
  if (!telefono) return { pos: sferica(CENTRO, mix(10.5, 13.5, uscita(t)), -0.62, 0.17), look: CENTRO.toArray() as Camera["look"] };
  const centro = puntoTelefono(TELEFONO_PX.w / 2, TELEFONO_PX.h * 0.45, 0);
  return { pos: sferica(centro, mix(5.2, 6.6, uscita(t)), POSTI.smartphone.giro - 0.55, 0.62), look: centro.toArray() as Camera["look"] };
}

// La conseguenza: il dispositivo visto basso; la camera si allontana piano e la luce cala sulla chiave.
export const Rischio: React.FC<ScenaDi<"rischio">> = (props) => {
  const f = useCurrentFrame();
  const dettagli = useDettagli();
  const stile = useStile();
  const { durata } = props;
  const piano = pianoRischio(props, durata);
  const telefono = props.dispositivo === "smartphone";
  const mossa = avvicina(camera(telefono, fase(f, 0, durata)), 0.88 ** piano.stacchi.filter((s) => f >= s).length);
  // lo schermo sta fra il sopratitolo e il titolo in ogni fotogramma, non solo in quelli misurati
  const { sopra, titolo, alto, basso } = titoliRischio(props, piano, stile);
  const bordi = telefono ? BORDI_TELEFONO : BORDI_SCHERMO;
  const cam = fraLeQuote(mossa, bordi.alti, bordi.bassi, alto, basso);
  const luce = 1 - 0.4 * liscio(fase(f, piano.ombra, piano.ombra + 20));
  return (
    <>
      <Set3D camera={cam} luce={luce} orologio={props.contesto.orologio}>
        {telefono && <Smartphone schermo={{ tipo: "blocco" }} dettagli={dettagli} />}
      </Set3D>
      <Velo alto={0.55} basso={0.68} />
      <Ingombro nome={telefono ? "telefono" : "schermo"} angoli={telefono ? angoliSchermoTelefono(cam) : angoliInQuadro({ x: 0, y: 0, ...SCHERMO_PX }, cam)} />
      <Titolo nome="sopra" f={f} righe={sopra} style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE }} />
      <Titolo nome="titolo" f={f} righe={titolo} style={{ position: "absolute", bottom: FONDO_TITOLO, left: MARGINE, right: MARGINE }} />
    </>
  );
};
