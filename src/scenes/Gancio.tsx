import { Vector3 } from "three";
import { useCurrentFrame } from "remotion";

import { useDettagli } from "../editoriale/DettagliVideo";
import { Blocco } from "../editoriale/ganci/Blocco";
import { allargamento, dettaglioDi, FINE_DETTAGLIO, pianoDettaglio, riquadroDettaglio } from "../editoriale/ganci/dettaglio";
import { bloccoDiviso, tingiPerBlocco } from "../editoriale/ganci/diviso";
import { Parola } from "../editoriale/ganci/Parola";
import { pianoGancio } from "../editoriale/piani/gancio";
import { conPeso, fase, liscio } from "../editoriale/regia";
import { angoliInQuadro, centroDi, fraCamere, NOTIFICA_PX, puntoSchermo, SCHERMO_PX, sferica, sottoLaQuota } from "../editoriale/set/geometria";
import type { Camera } from "../editoriale/set/geometria";
import { Ingombro } from "../editoriale/set/Ingombro";
import { allarga, apertura, avvicina, primoPiano, stretta } from "../editoriale/set/inquadrature";
import { OggettoSulPiano } from "../editoriale/set/oggetti/Oggetti";
import type { Schermo } from "../editoriale/set/Portatile";
import { Set3D } from "../editoriale/set/Set3D";
import { angoliSchermoTelefono } from "../editoriale/set/telefono";
import { Velo } from "../editoriale/set/Velo";
import { useStile } from "../editoriale/stili";
import { titoloGancio } from "../editoriale/testate/gancio";
import { Titolo } from "../editoriale/Titolo";
import type { NomeGancio } from "../editoriale/variante";
import { useVariante } from "../editoriale/VarianteVideo";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const BORDO_ALTO = [puntoSchermo(0, 0), puntoSchermo(SCHERMO_PX.w / 2, 0), puntoSchermo(SCHERMO_PX.w, 0)];

// verso la notifica appena arrivata: la camera la cerca sullo schermo, di tre quarti
const versoNotifica = (): Camera => {
  const centro = centroDi(NOTIFICA_PX).add(new Vector3(-0.45, 0.15, 0));
  return { pos: sferica(centro, 11.5, 0.3, 0.3), look: centro.toArray() as Camera["look"] };
};

// Il gancio: il formato della variante sceglie la resa; a parola non c'e' il set.
export const Gancio: React.FC<ScenaDi<"gancio">> = (props) => {
  const formato = useVariante().gancio;
  return formato === "parola" ? <Parola {...props} /> : <GancioSulSet {...props} formato={formato} />;
};

// Sul set: la scrivania larga, l'oggetto al suo posto, la frase detta scritta parola per parola. A dettaglio si parte da un
// primo piano e ci si allarga; diviso ha sopra un blocco di colore col titolo che si ritira.
const GancioSulSet: React.FC<ScenaDi<"gancio"> & { formato: Exclude<NomeGancio, "parola"> }> = ({ formato, ...props }) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const variante = useVariante();
  const dettagli = useDettagli();
  const { oggetto, durata, contesto } = props;
  const pianoBase = pianoGancio(props, durata);
  const piano = formato === "dettaglio" ? pianoDettaglio(pianoBase, durata) : pianoBase;
  const { righe, limite } = titoloGancio(piano, stile);
  const blocco = formato === "diviso" ? bloccoDiviso(f, limite) : undefined;
  // col blocco lo schermo sta sotto il suo bordo, e sale con lui fino alla quota sotto il titolo
  const quota = blocco ? Math.max(limite, blocco.basso) : limite;
  const sotto = (c: Camera) => (oggetto === "portatile" ? sottoLaQuota(c, BORDO_ALTO, quota) : c);
  const largaCam = apertura(oggetto, variante.apertura);
  const meta = piano.notifica !== undefined ? versoNotifica() : fraCamere(largaCam, stretta(oggetto), 0.5);
  // quasi ferma fino alla spinta, poi un solo movimento con peso; gli stacchi in asse la avvicinano
  const ferma = sotto(avvicina(largaCam, 1 - 0.035 * liscio(fase(f, 0, piano.spinta.da))));
  const mossa = avvicina(fraCamere(ferma, meta, conPeso(fase(f, piano.spinta.da, piano.spinta.a))), 0.88 ** piano.stacchi.filter((s) => f >= s).length);
  const scena = piano.notifica === undefined ? sotto(mossa) : mossa;
  const dettaglio = formato === "dettaglio" ? dettaglioDi(props, piano.notifica !== undefined) : undefined;
  const cam = dettaglio && f < FINE_DETTAGLIO ? allarga(primoPiano(dettaglio, riquadroDettaglio(dettaglio, props), oggetto), scena, allargamento(f)) : scena;
  // andando verso la notifica conta lei, non il bordo dello schermo che la camera taglia di tre quarti
  const versoLaNotifica = piano.notifica !== undefined && f >= piano.spinta.da;
  // aperta sulla notifica, la notifica c'e' gia' dal primo fotogramma
  const entrata = piano.notifica === undefined ? 0 : dettaglio === "notifica" ? 1 : fase(f, piano.notifica, piano.notifica + 6);
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
        <OggettoSulPiano nome={oggetto} f={f} titolo={props.titolo} dettagli={dettagli} schermata={schermata} />
      </Set3D>
      <Velo basso={0.5} />
      {oggetto === "portatile" && (versoLaNotifica ? <Ingombro nome="notifica" angoli={angoliInQuadro(NOTIFICA_PX, cam)} pieno /> : <Ingombro nome="schermo" angoli={angoliInQuadro({ x: 0, y: 0, ...SCHERMO_PX }, cam)} pieno={schermo !== undefined} />)}
      {oggetto === "smartphone" && <Ingombro nome="telefono" angoli={angoliSchermoTelefono(cam)} />}
      {blocco && <Blocco basso={blocco.basso} pieno={blocco.pieno} />}
      <Titolo nome="titolo" f={f} righe={blocco ? tingiPerBlocco(righe, stile, blocco.pieno) : righe} style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE }} />
    </>
  );
};
