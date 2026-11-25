import type { CampiReperto } from "../../../storyboard/tipi";
import { useDettagli } from "../../DettagliVideo";
import { FINITURE } from "../../dettagli";
import { DURATA_REAZIONE } from "../../piani/reperto";
import { fase, liscio } from "../../regia";
import { useStile } from "../../stili";
import { CIANO, MAGENTA } from "../../stili/notte";
import { proietta } from "../geometria";
import { Ingombro } from "../Ingombro";
import { avvicina } from "../inquadrature";
import { LuciNotte, PianoNotte } from "../Notturno";
import { Palco } from "../Palco";
import { Velo } from "../Velo";
import { CartaReperto } from "./Carta";
import { EmailReperto } from "./Email";
import { angoliReperto, centroReperto, inquadraReperto, SAGOME } from "./inquadra";
import { LucchettoReperto } from "./Lucchetto";
import { SoldiReperto } from "./Soldi";
import { TelefonoReperto } from "./Telefono";

const GIRO_MAX = 0.4;

/** Quanto e' girato il reperto: un'oscillazione lenta, piu' una piccola spinta a ogni stacco. */
function giro(f: number, stacchi: number[]): number {
  const spinte = stacchi.reduce((a, s, i) => a + (i % 2 ? -1 : 1) * 0.1 * liscio(fase(f, s, s + 10)), 0);
  return Math.max(-GIRO_MAX, Math.min(GIRO_MAX, 0.28 * Math.sin((2 * Math.PI * f) / 150) + spinte));
}

/**
 * Il reperto nel buio, fra le quote `alto` e `basso`: gira piano, sulla `reazione` reagisce con un sobbalzo e la luce
 * di sirena. Il sobbalzo e' dell'oggetto: la camera si avvicina sempre continua.
 */
export const RepertoSulSet: React.FC<CampiReperto & { f: number; durata: number; reazione: number; stacchi: number[]; alto: number; basso: number }> = ({ reperto, messaggio, mittente, f, durata, reazione, stacchi, alto, basso }) => {
  const stile = useStile();
  const dettagli = useDettagli();
  const sagoma = SAGOME[reperto];
  const cam = avvicina(inquadraReperto(sagoma, alto, basso), 1.08 - 0.08 * liscio(fase(f, 0, durata)));
  const r = fase(f, reazione, reazione + DURATA_REAZIONE);
  const dopo = f - reazione;
  const sobbalzo = dopo >= 0 ? 0.1 * Math.exp(-dopo / 5) * Math.sin(dopo * 1.4) : 0;
  const sirena = dopo >= 0 ? 60 * Math.exp(-dopo / 7) + 8 : 0;
  const g = giro(f, stacchi);
  const centro = centroReperto(sagoma);
  const allarme = stile.colori.inchiostro.timbro;
  const distanza = Math.hypot(...cam.pos.map((p, i) => p - cam.look[i]));
  const luci = stile.luciSet ?? { sinistra: CIANO, destra: MAGENTA };
  const telefono = reperto === "telefono" || reperto === "chiamata";
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
          {telefono && <TelefonoReperto chiamata={reperto === "chiamata"} messaggio={messaggio} mittente={mittente} ora={dettagli.ora} f={f} r={r} finitura={FINITURE[dettagli.finitura]} allarme={allarme} />}
          {reperto === "email" && <EmailReperto mittente={mittente} messaggio={messaggio} r={r} allarme={allarme} />}
          {reperto === "carta" && <CartaReperto r={r} bordo={allarme} />}
          {reperto === "lucchetto" && <LucchettoReperto r={r} allarme={allarme} />}
          {reperto === "soldi" && <SoldiReperto r={r} />}
        </group>
      </Palco>
      <Velo alto={0.6} basso={0.6} />
      <Ingombro nome="reperto" angoli={angoliReperto(sagoma, g).map((p) => proietta(p, cam))} />
    </>
  );
};
