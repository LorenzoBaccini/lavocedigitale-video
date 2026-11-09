import { AbsoluteFill, useCurrentFrame } from "remotion";

import { ALTEZZA, FONDO_SCENA, FONDO_UTILE, LARGHEZZA, RESPIRO } from "../../impaginazione";
import { Conferma, titoliOggetto } from "../../scenes/Oggetto";
import type { ScenaDi } from "../../scenes/props";
import { pianoOggetto } from "../piani/oggetto";
import { conPeso, fase, mix } from "../regia";
import { Richiamo } from "../Segno";
import type { Schermo } from "../set/schermata";
import { FINESTRA_PX } from "../set/geometria";
import { useStile } from "../stili";
import type { Contenuto } from "./contenuto";
import { contenutoOggetto, contenutoPortatile, contenutoTelefono, scalaInsieme, vistaDi } from "./contenuto";
import { VIAGGIO } from "./tocco";
import { Puntatore } from "./Puntatore";
import { Schermata } from "./Schermata";
import { Testata } from "./Testata";
import type { Ripresa } from "./vista";
import { fraRiprese, punto, stringi } from "./vista";

const ALTEZZA_CONFERMA = 100;
const STACCO = 30;
/** Lo spazio sotto lo schermo per il richiamo di `indica` sugli oggetti senza schermo (due righe). */
const SPAZIO_RICHIAMO = 120;

function contenutoDi(props: ScenaDi<"oggetto">, f: number): Contenuto {
  const { oggetto, indica, titolo, menu } = props;
  const schermata = props.schermata ?? "sistema";
  if (oggetto === "smartphone") return contenutoTelefono(indica ? { tipo: "elenco", riga: indica, titolo, menu, app: schermata !== "sistema" } : { tipo: "blocco", titolo });
  if (oggetto === "chiavetta" || oggetto === "router" || oggetto === "carta") return contenutoOggetto(oggetto, f);
  const schermo: Schermo = oggetto === "portatile" && indica ? { tipo: "finestra", titolo, pulsante: indica, menu, schermata } : oggetto === "portatile" && schermata !== "sistema" ? { tipo: "pagina", titolo, schermata } : { tipo: "desktop" };
  return contenutoPortatile(schermo, props.contesto.orologio);
}

// L'oggetto a tutto quadro: sotto occhiello e titolo lo schermo (o l'oggetto come scheda illustrata); su `indica` il
// puntatore va al suo posto e tocca, mentre la camera scorre e stringe; la conferma spuntata in basso.
export const OggettoSchermo: React.FC<ScenaDi<"oggetto">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, indica, conferma } = props;
  const piano = pianoOggetto(props, durata);
  const { righe, limite } = titoliOggetto(props, piano, stile);
  const c = contenutoDi(props, f);
  const tocca = piano.indica !== undefined && c.caldo !== undefined;
  const richiamo = tocca && c.tipo === "oggetto" && indica !== undefined;
  const sottoConferma = conferma ? ALTEZZA - FONDO_SCENA - RESPIRO - ALTEZZA_CONFERMA - STACCO : ALTEZZA;
  const basso = richiamo ? Math.min(sottoConferma, FONDO_UTILE) - SPAZIO_RICHIAMO : sottoConferma;
  const quadro = { x: 0, y: limite, w: LARGHEZZA, h: basso - limite };
  const utile = Math.min(basso, FONDO_UTILE) - STACCO;
  const base = scalaInsieme(c, quadro, utile - limite);

  const caldo = c.caldo;
  const centroCaldo = caldo && { x: caldo.x + caldo.w / 2, y: caldo.y + caldo.h / 2 };
  const larga: Ripresa =
    c.tipo === "portatile"
      ? { u: caldo ? FINESTRA_PX.x + FINESTRA_PX.w / 2 : c.misure.w / 2, v: caldo ? FINESTRA_PX.y + FINESTRA_PX.h / 2 : c.misure.h * 0.45, scala: base * mix(1, 1.06, fase(f, 0, durata)) }
      : c.tipo === "telefono"
        ? { u: c.misure.w / 2, v: caldo ? 560 : 705, scala: base * mix(1, 1.04, fase(f, 0, durata)) }
        : { u: c.misure.w / 2, v: c.misure.h / 2, scala: base };
  const stretta: Ripresa | undefined = centroCaldo && { u: centroCaldo.x, v: centroCaldo.y, scala: c.tipo === "portatile" ? Math.max(base, 640 / caldo!.w) : base * (c.tipo === "telefono" ? 1.12 : 1.25) };
  const verso = tocca && stretta ? conPeso(fase(f, piano.indica! - VIAGGIO - 4, piano.indica! + 4)) : 0;
  const ripresa = stringi(stretta ? fraRiprese(larga, stretta, verso) : larga, 1.136 ** piano.stacchi.filter((s) => f >= s).length);
  const v = vistaDi(c, quadro, ripresa, (limite + utile) / 2);

  // il puntatore arriva dal basso a destra del punto (sul telefono da sotto, come un dito che sale)
  const partenza = centroCaldo && (c.tipo === "telefono" ? { x: centroCaldo.x + 120, y: Math.min(c.misure.h, centroCaldo.y + 520) } : { x: Math.min(c.misure.w, centroCaldo.x + 0.22 * c.misure.w), y: Math.min(c.misure.h, centroCaldo.y + 0.3 * c.misure.h) });
  const bersaglio = centroCaldo && (c.tipo === "telefono" ? { x: caldo!.x + caldo!.w * 0.62, y: centroCaldo.y } : centroCaldo);
  const sulCaldo = centroCaldo && punto(v, centroCaldo.x, caldo!.y + caldo!.h);
  return (
    <AbsoluteFill style={{ background: stile.colori.superficie }}>
      <Schermata nome="schermo" quadro={quadro} vista={v} misure={c.misure} fondo={c.fondo}>
        {c.strato}
      </Schermata>
      {tocca && partenza && bersaglio && <Puntatore f={f} arrivo={piano.indica!} da={partenza} a={bersaglio} vista={v} dito={c.tipo === "telefono"} />}
      {richiamo && sulCaldo && (
        <Richiamo nome="indica" testo={indica!} x={sulCaldo.x} daY={Math.min(sulCaldo.y + 14, basso - 10)} aY={basso + 4} progresso={(f - piano.indica! - 10) / 10} />
      )}
      <Testata f={f} etichetta={etichetta} righe={righe} />
      {conferma && piano.conferma !== undefined && f >= piano.conferma && <Conferma testo={conferma} da={piano.conferma} f={f} suChiaro={false} />}
    </AbsoluteFill>
  );
};
