import { useCurrentFrame } from "remotion";

import { pianoTelefono } from "../editoriale/piani/telefono";
import { fase, uscita } from "../editoriale/regia";
import { SegnoInQuadro } from "../editoriale/Segno";
import { proietta } from "../editoriale/set/geometria";
import { Ingombro } from "../editoriale/set/Ingombro";
import { Smartphone } from "../editoriale/set/oggetti/Oggetti";
import { Set3D } from "../editoriale/set/Set3D";
import { angoliSchermoTelefono, cameraOpzioni, opzionePx, puntoTelefono, rettangoloTelefono } from "../editoriale/set/telefono";
import { Occhiello } from "../editoriale/set/Occhiello";
import { SPAZIO_OCCHIELLO } from "../editoriale/set/misureOcchiello";
import { Velo } from "../editoriale/set/Velo";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { titoloTelefono } from "../editoriale/testate/telefono";
import { Titolo } from "../editoriale/Titolo";
import type { Punto } from "../editoriale/tratto";
import { cerchiatura, trattoFra } from "../editoriale/tratto";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

/** Il barrato a pennarello attraverso un pulsante della schermata, da un bordo all'altro, un poco storto. */
function barrato(i: number, cam: Parameters<typeof proietta>[1]): Punto[] {
  const b = opzionePx(i);
  const a = proietta(puntoTelefono(b.x + 18, b.y + b.h * 0.62), cam);
  const z = proietta(puntoTelefono(b.x + b.w - 18, b.y + b.h * 0.4), cam);
  return trattoFra(a, z, 31);
}


// Il telefono in primo piano sulla scrivania, con le opzioni a schermo: occhiello e titolo in alto, il barrato a pennarello
// sull'opzione esclusa, il cerchio su quella che resta.
export const Telefono: React.FC<ScenaDi<"telefono">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, opzioni } = props;
  const piano = pianoTelefono(props, durata);
  const { righe, sottoITitoli } = titoloTelefono(props, piano, stile);
  const cam = cameraOpzioni(uscita(fase(f, 0, durata)), 0.92 ** piano.stacchi.filter((s) => f >= s).length, sottoITitoli, opzioni.length);
  const resta = piano.cerchio && rettangoloTelefono(opzionePx(piano.cerchio.indice), cam);
  return (
    <>
      <Set3D camera={cam} orologio={props.contesto.orologio}>
        <Smartphone schermo={{ tipo: "opzioni", opzioni }} />
      </Set3D>
      <Velo alto={0.62} basso={0.55} />
      <Ingombro nome="telefono" angoli={angoliSchermoTelefono(cam)} pieno />
      {piano.esclusa && <SegnoInQuadro punti={barrato(piano.esclusa.indice, cam)} colore={stile.colori.segnoSuChiaro} spessore={14} progresso={(f - piano.esclusa.da) / 10} />}
      {resta && piano.cerchio && <SegnoInQuadro punti={cerchiatura(resta.x + resta.w / 2, resta.y + resta.h / 2, resta.w / 2 + 22, resta.h / 2 + 20, 17)} colore={stile.colori.suChiaro} spessore={7} progresso={(f - piano.cerchio.da) / 15} />}
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: allineaFlesso(stile), gap: SPAZIO_OCCHIELLO }}>
        <Occhiello f={f} testo={etichetta} />
        <Titolo nome="titolo" f={f} righe={righe} style={{ alignSelf: "stretch" }} />
      </div>
    </>
  );
};
