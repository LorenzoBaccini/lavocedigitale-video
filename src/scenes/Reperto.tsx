import { useCurrentFrame } from "remotion";

import { useDettagli } from "../editoriale/DettagliVideo";
import { FINITURE } from "../editoriale/dettagli";
import { DURATA_REAZIONE, pianoReperto } from "../editoriale/piani/reperto";
import { fase, liscio } from "../editoriale/regia";
import { proietta } from "../editoriale/set/geometria";
import { Ingombro } from "../editoriale/set/Ingombro";
import { avvicina } from "../editoriale/set/inquadrature";
import { SPAZIO_OCCHIELLO } from "../editoriale/set/misureOcchiello";
import { LuciNotte, PianoNotte } from "../editoriale/set/Notturno";
import { Occhiello } from "../editoriale/set/Occhiello";
import { Palco } from "../editoriale/set/Palco";
import { CartaReperto } from "../editoriale/set/reperti/Carta";
import { angoliReperto, centroReperto, inquadraReperto, SAGOME } from "../editoriale/set/reperti/inquadra";
import { LucchettoReperto } from "../editoriale/set/reperti/Lucchetto";
import { TelefonoReperto } from "../editoriale/set/reperti/Telefono";
import { Velo } from "../editoriale/set/Velo";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { CIANO, MAGENTA } from "../editoriale/stili/notte";
import { titoloReperto } from "../editoriale/testate/reperto";
import { Titolo } from "../editoriale/Titolo";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const GIRO_MAX = 0.4;

/** Quanto e' girato il reperto: un'oscillazione lenta, piu' una piccola spinta a ogni stacco. */
function giro(f: number, stacchi: number[]): number {
  const spinte = stacchi.reduce((a, s, i) => a + (i % 2 ? -1 : 1) * 0.1 * liscio(fase(f, s, s + 10)), 0);
  return Math.max(-GIRO_MAX, Math.min(GIRO_MAX, 0.28 * Math.sin((2 * Math.PI * f) / 150) + spinte));
}

// Il reperto: un oggetto grande al centro, nel buio, che gira piano; sulla chiave reagisce (si crepa, si spezza, si
// apre) con un sobbalzo e una luce di sirena. Il sobbalzo e' dell'oggetto: la camera si avvicina sempre continua.
export const Reperto: React.FC<ScenaDi<"reperto">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const dettagli = useDettagli();
  const { durata, reperto, etichetta } = props;
  const piano = pianoReperto(props, durata);
  const { righe, alto, basso } = titoloReperto(props, piano, stile);
  const sagoma = SAGOME[reperto];
  const cam = avvicina(inquadraReperto(sagoma, alto, basso), 1.08 - 0.08 * liscio(fase(f, 0, durata)));
  const r = fase(f, piano.reazione, piano.reazione + DURATA_REAZIONE);
  const dopo = f - piano.reazione;
  const sobbalzo = dopo >= 0 ? 0.1 * Math.exp(-dopo / 5) * Math.sin(dopo * 1.4) : 0;
  const sirena = dopo >= 0 ? 60 * Math.exp(-dopo / 7) + 8 : 0;
  const g = giro(f, piano.stacchi);
  const centro = centroReperto(sagoma);
  const allarme = stile.colori.inchiostro.timbro;
  const distanza = Math.hypot(...cam.pos.map((p, i) => p - cam.look[i]));
  const luci = stile.luciSet ?? { sinistra: CIANO, destra: MAGENTA };
  return (
    <>
      <Palco camera={cam} fondo={stile.colori.fondo}>
        {/* il piano sfuma nel fondo: niente orizzonte netto dietro il reperto */}
        <fog attach="fog" args={[stile.colori.fondo, distanza + 1, distanza + 14]} />
        <LuciNotte chiave={1} sinistra={luci.sinistra} destra={luci.destra} />
        <spotLight position={[2.5, centro.y + 4, 9]} angle={0.5} penumbra={0.8} intensity={260} decay={2} color="#e9e4ff" castShadow />
        <pointLight position={[0, centro.y + 1.2, 3]} color={allarme} intensity={sirena} distance={7} decay={2} />
        <PianoNotte />
        <group position={centro.toArray()} rotation-y={g} rotation-z={sobbalzo}>
          {reperto === "telefono" && <TelefonoReperto messaggio={props.messaggio} ora={dettagli.ora} r={r} finitura={FINITURE[dettagli.finitura]} allarme={allarme} />}
          {reperto === "carta" && <CartaReperto r={r} bordo={allarme} />}
          {reperto === "lucchetto" && <LucchettoReperto r={r} allarme={allarme} />}
        </group>
      </Palco>
      <Velo alto={0.6} basso={0.6} />
      <Ingombro nome="reperto" angoli={angoliReperto(sagoma, g).map((p) => proietta(p, cam))} />
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: allineaFlesso(stile), gap: SPAZIO_OCCHIELLO }}>
        <Occhiello f={f} testo={etichetta} />
        <Titolo nome="titolo" f={f} righe={righe} style={{ alignSelf: "stretch" }} />
      </div>
    </>
  );
};
