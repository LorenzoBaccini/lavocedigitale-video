import { Vector3 } from "three";
import { useCurrentFrame } from "remotion";

import { pianoGancio } from "../editoriale/piani/gancio";
import { conPeso, fase, liscio } from "../editoriale/regia";
import { angoliInQuadro, centroDi, fraCamere, NOTIFICA_PX, puntoSchermo, SCHERMO_PX, sferica, sottoLaQuota } from "../editoriale/set/geometria";
import type { Camera } from "../editoriale/set/geometria";
import { Ingombro } from "../editoriale/set/Ingombro";
import { apertura, avvicina, stretta } from "../editoriale/set/inquadrature";
import { OggettoSulPiano } from "../editoriale/set/oggetti/Oggetti";
import type { Schermo } from "../editoriale/set/Portatile";
import { Set3D } from "../editoriale/set/Set3D";
import { angoliSchermoTelefono } from "../editoriale/set/telefono";
import { Velo } from "../editoriale/set/Velo";
import { useStile } from "../editoriale/stili";
import { titoloGancio } from "../editoriale/testate/gancio";
import { Titolo } from "../editoriale/Titolo";
import { useVariante } from "../editoriale/VarianteVideo";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const BORDO_ALTO = [puntoSchermo(0, 0), puntoSchermo(SCHERMO_PX.w / 2, 0), puntoSchermo(SCHERMO_PX.w, 0)];

// verso la notifica appena arrivata: la camera la cerca sullo schermo, di tre quarti
const versoNotifica = (): Camera => {
  const centro = centroDi(NOTIFICA_PX).add(new Vector3(-0.45, 0.15, 0));
  return { pos: sferica(centro, 11.5, 0.3, 0.3), look: centro.toArray() as Camera["look"] };
};

// Il gancio: la scrivania larga, l'oggetto al suo posto, la frase detta scritta parola per parola.
export const Gancio: React.FC<ScenaDi<"gancio">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const variante = useVariante();
  const { oggetto, durata, contesto } = props;
  const piano = pianoGancio(props, durata);
  const { righe, limite } = titoloGancio(piano, stile);
  const sotto = (c: Camera) => (oggetto === "portatile" ? sottoLaQuota(c, BORDO_ALTO, limite) : c);
  const largaCam = apertura(oggetto, variante.apertura);
  const meta = piano.notifica !== undefined ? versoNotifica() : fraCamere(largaCam, stretta(oggetto), 0.5);
  // quasi ferma fino alla spinta, poi un solo movimento con peso; gli stacchi in asse la avvicinano
  const ferma = sotto(avvicina(largaCam, 1 - 0.035 * liscio(fase(f, 0, piano.spinta.da))));
  const mossa = avvicina(fraCamere(ferma, meta, conPeso(fase(f, piano.spinta.da, piano.spinta.a))), 0.88 ** piano.stacchi.filter((s) => f >= s).length);
  const cam = piano.notifica === undefined ? sotto(mossa) : mossa;
  // andando verso la notifica conta lei, non il bordo dello schermo che la camera taglia di tre quarti
  const versoLaNotifica = piano.notifica !== undefined && f >= piano.spinta.da;
  const entrata = piano.notifica === undefined ? 0 : fase(f, piano.notifica, piano.notifica + 6);
  const schermata = props.schermata ?? "sistema";
  const schermo: Schermo | undefined = oggetto === "portatile" && schermata !== "sistema" ? { tipo: "pagina", titolo: props.titolo, schermata } : undefined;
  return (
    <>
      <Set3D
        camera={cam}
        schermo={schermo}
        orologio={contesto.orologio}
        notifica={contesto.messaggioSeguente !== undefined && entrata > 0 ? { messaggio: contesto.messaggioSeguente, mittente: contesto.mittenteSeguente, azione: contesto.azioneSeguente, visibile: entrata, scarto: 28 * (1 - entrata) ** 3 } : undefined}
      >
        <OggettoSulPiano nome={oggetto} f={f} titolo={props.titolo} schermata={schermata} />
      </Set3D>
      <Velo basso={0.5} />
      {oggetto === "portatile" && (versoLaNotifica ? <Ingombro nome="notifica" angoli={angoliInQuadro(NOTIFICA_PX, cam)} pieno /> : <Ingombro nome="schermo" angoli={angoliInQuadro({ x: 0, y: 0, ...SCHERMO_PX }, cam)} pieno={schermo !== undefined} />)}
      {oggetto === "smartphone" && <Ingombro nome="telefono" angoli={angoliSchermoTelefono(cam)} />}
      <Titolo nome="titolo" f={f} righe={righe} style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE }} />
    </>
  );
};
