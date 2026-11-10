import { AbsoluteFill, useCurrentFrame } from "remotion";

import { ALTEZZA, FONDO_UTILE, LARGHEZZA, MARGINE, TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import { Blocco } from "../ganci/Blocco";
import type { Dettaglio } from "../ganci/dettaglio";
import { allargamento, dettaglioDi, pianoDettaglio, riquadroDettaglio } from "../ganci/dettaglio";
import { bloccoDiviso, tingiPerBlocco } from "../ganci/diviso";
import { Parola } from "../ganci/Parola";
import { pianoGancio } from "../piani/gancio";
import { conPeso, fase, liscio } from "../regia";
import { notifica } from "../set/disegni";
import { NOTIFICA_PX } from "../set/geometria";
import { useStile } from "../stili";
import { titoloGancio } from "../testate/gancio";
import { Titolo } from "../Titolo";
import type { NomeApertura, NomeGancio } from "../variante";
import { useVariante } from "../VarianteVideo";
import type { Contenuto } from "./contenuto";
import { contenutoOggetto, contenutoPortatile, contenutoTelefono, scalaInsieme, vistaDi } from "./contenuto";
import { NotificaSchermo } from "./NotificaSchermo";
import { Schermata } from "./Schermata";
import type { Ripresa } from "./vista";
import { copri, fraRiprese, stringi } from "./vista";

/** Quanto e' largo nel fotogramma il dettaglio del primo piano. */
const LARGHEZZA_DETTAGLIO = 1040;

/** Da dove parte la camera, per apertura: al centro, in basso a sinistra, in alto a destra (frazioni del disegno). */
const PARTENZA: Record<NomeApertura, [number, number]> = { classica: [0.5, 0.5], radente: [0.36, 0.6], alta: [0.64, 0.38] };

function contenutoGancio(props: ScenaDi<"gancio">, f: number): Contenuto {
  const schermata = props.schermata ?? "sistema";
  if (props.oggetto === "smartphone") return contenutoTelefono({ tipo: "blocco", titolo: props.titolo });
  if (props.oggetto === "chiavetta" || props.oggetto === "router" || props.oggetto === "carta") return contenutoOggetto(props.oggetto, f);
  const pagina = props.oggetto === "portatile" && schermata !== "sistema";
  return contenutoPortatile(pagina ? { tipo: "pagina", titolo: props.titolo, schermata } : { tipo: "desktop" }, props.contesto.orologio);
}

/** Dove stringe la camera sulla chiave: il titolo della pagina (dal suo inizio), la scheda del telefono, il punto caldo dell'oggetto. */
function arrivo(c: Contenuto, props: ScenaDi<"gancio">, base: number): Ripresa {
  if (c.tipo === "telefono") return { u: 360, v: 705, scala: base * 1.08 };
  if (c.tipo === "oggetto" && c.caldo) return { u: c.caldo.x + c.caldo.w / 2, v: c.caldo.y + c.caldo.h / 2, scala: base * 1.4 };
  const pagina = props.oggetto === "portatile" && (props.schermata ?? "sistema") !== "sistema";
  return pagina ? { u: 740, v: 560, scala: base * 1.15 } : { u: c.misure.w / 2, v: c.misure.h / 2, scala: base * 1.2 };
}

/** Il primo piano del gancio a dettaglio, nel disegno: il dettaglio largo quasi quanto il fotogramma, o il punto caldo dell'oggetto. */
function primoPiano(c: Contenuto, d: Dettaglio, props: ScenaDi<"gancio">, base: number): Ripresa {
  const r = riquadroDettaglio(d, props.schermata);
  if (!r) return c.caldo ? { u: c.caldo.x + c.caldo.w / 2, v: c.caldo.y + c.caldo.h / 2, scala: base * 2.6 } : { u: c.misure.w / 2, v: c.misure.h / 2, scala: base * 2 };
  const pieno = c.tipo === "telefono" ? 0 : copri(c.misure, { x: 0, y: 0, w: LARGHEZZA, h: ALTEZZA });
  return { u: r.x + r.w / 2, v: r.y + r.h / 2, scala: Math.max(pieno, LARGHEZZA_DETTAGLIO / r.w) };
}

// Il gancio a tutto quadro: sotto il titolo lo schermo intero, quasi fermo; sulla chiave la camera stringe sul punto che
// conta. Prima di un allarme la notifica scende sullo schermo e la camera va da lei. A parola niente schermo; a dettaglio lo
// schermo parte a tutto fotogramma su un dettaglio e si allarga; diviso ha sopra il blocco di colore che si ritira.
export const GancioSchermo: React.FC<ScenaDi<"gancio">> = (props) => {
  const formato = useVariante().gancio;
  return formato === "parola" ? <Parola {...props} /> : <GancioSulloSchermo {...props} formato={formato} />;
};

const GancioSulloSchermo: React.FC<ScenaDi<"gancio"> & { formato: Exclude<NomeGancio, "parola"> }> = ({ formato, ...props }) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const variante = useVariante();
  const { durata, contesto } = props;
  const iniziale = pianoGancio(props, durata);
  const piano = formato === "dettaglio" ? pianoDettaglio(iniziale, durata) : iniziale;
  const { righe, limite } = titoloGancio(piano, stile);
  const blocco = formato === "diviso" ? bloccoDiviso(f, limite) : undefined;
  const quota = blocco ? Math.max(limite, blocco.basso) : limite;
  const c = contenutoGancio(props, f);
  const quadroScena = { x: 0, y: quota, w: LARGHEZZA, h: ALTEZZA - quota };
  const base = scalaInsieme(c, quadroScena, FONDO_UTILE - quota);
  const conNotifica = piano.notifica !== undefined && c.tipo === "portatile" && contesto.messaggioSeguente !== undefined;
  const [pu, pv] = PARTENZA[variante.apertura];
  // sulla pagina la camera parte dal titolo, che comincia a sinistra: l'apertura la sposta solo di poco
  const pagina = props.oggetto === "portatile" && (props.schermata ?? "sistema") !== "sistema";
  const larga: Ripresa = { u: pagina ? 740 + (pu - 0.5) * 400 : c.misure.w * pu, v: c.misure.h * pv, scala: base * (1 + 0.035 * liscio(fase(f, 0, piano.spinta.da))) };
  const meta: Ripresa = conNotifica
    ? { u: NOTIFICA_PX.x + NOTIFICA_PX.w / 2, v: NOTIFICA_PX.y + NOTIFICA_PX.h / 2, scala: Math.max(base, 880 / NOTIFICA_PX.w) }
    : arrivo(c, props, base);
  const mossa = stringi(fraRiprese(larga, meta, conPeso(fase(f, piano.spinta.da, piano.spinta.a))), 1.136 ** piano.stacchi.filter((s) => f >= s).length);
  // sotto il blocco del diviso c'e' poco posto: la camera parte dal punto che conta e torna dove sarebbe mentre il blocco sale
  const fuoco = arrivo(c, props, base);
  const scena = blocco && blocco.sale < 1 ? fraRiprese({ ...mossa, u: fuoco.u, v: fuoco.v }, mossa, blocco.sale) : mossa;
  const dettaglio = formato === "dettaglio" ? dettaglioDi(props, conNotifica) : undefined;
  // a dettaglio il riquadro parte dal bordo alto del fotogramma e scende fin sotto il titolo mentre la camera si allarga
  const t = dettaglio ? allargamento(f) : 1;
  const quadro = dettaglio ? { ...quadroScena, y: quota * t, h: ALTEZZA - quota * t } : quadroScena;
  const ripresa = dettaglio ? fraRiprese(primoPiano(c, dettaglio, props, base), scena, t) : scena;
  const centro = (quota + FONDO_UTILE) / 2;
  const v = vistaDi(c, quadro, ripresa, dettaglio ? ALTEZZA / 2 + (centro - ALTEZZA / 2) * t : centro);
  const entrata = conNotifica ? (dettaglio === "notifica" ? 1 : fase(f, piano.notifica!, piano.notifica! + 8)) : 0;
  return (
    <AbsoluteFill style={{ background: stile.colori.superficie }}>
      <Schermata nome="schermo" quadro={quadro} vista={v} misure={c.misure} fondo={c.fondo}>
        {c.strato}
        {conNotifica && (
          <NotificaSchermo r={NOTIFICA_PX} disegna={notifica(contesto.messaggioSeguente!, contesto.mittenteSeguente, contesto.azioneSeguente)} chiave={JSON.stringify([contesto.messaggioSeguente, contesto.mittenteSeguente, contesto.azioneSeguente])} entrata={entrata} raggio={14} />
        )}
      </Schermata>
      {blocco && <Blocco basso={blocco.basso} pieno={blocco.pieno} />}
      <Titolo nome="titolo" f={f} righe={blocco ? tingiPerBlocco(righe, stile, blocco.pieno) : righe} style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE }} />
    </AbsoluteFill>
  );
};
