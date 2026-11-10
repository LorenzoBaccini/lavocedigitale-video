import { AbsoluteFill, useCurrentFrame } from "remotion";

import { ALTEZZA, FONDO_UTILE, LARGHEZZA, MARGINE, TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import type { Dettagli } from "../dettagli";
import { useDettagli } from "../DettagliVideo";
import { Blocco } from "../ganci/Blocco";
import type { Dettaglio } from "../ganci/dettaglio";
import { allargamento, dettaglioDi, notificaSulloSchermo, pianoDettaglio, riquadroDettaglioSchermo } from "../ganci/dettaglio";
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

function contenutoGancio(props: ScenaDi<"gancio">, f: number, d: Dettagli): Contenuto {
  const schermata = props.schermata ?? "sistema";
  if (props.oggetto === "smartphone") return contenutoTelefono({ tipo: "blocco", titolo: props.titolo }, d);
  if (props.oggetto === "chiavetta" || props.oggetto === "router" || props.oggetto === "carta") return contenutoOggetto(props.oggetto, f);
  const pagina = props.oggetto === "portatile" && schermata !== "sistema";
  return contenutoPortatile(pagina ? { tipo: "pagina", titolo: props.titolo, schermata } : { tipo: "desktop" }, { ora: d.ora, data: props.contesto.orologio });
}

/** Dove stringe la camera sulla chiave: il titolo della pagina (dal suo inizio), la scheda del telefono, il punto caldo dell'oggetto. */
function arrivo(c: Contenuto, props: ScenaDi<"gancio">, base: number): Ripresa {
  if (c.tipo === "telefono") return { u: 360, v: 705, scala: base * 1.08 };
  if (c.tipo === "oggetto" && c.caldo) return { u: c.caldo.x + c.caldo.w / 2, v: c.caldo.y + c.caldo.h / 2, scala: base * 1.4 };
  const pagina = props.oggetto === "portatile" && (props.schermata ?? "sistema") !== "sistema";
  return pagina ? { u: 740, v: 560, scala: base * 1.15 } : { u: c.misure.w / 2, v: c.misure.h / 2, scala: base * 1.2 };
}

/**
 * Il primo piano del gancio a dettaglio, nel disegno, e il riquadro in cui sta: il dettaglio largo quasi quanto il
 * fotogramma (o il punto caldo dell'oggetto), il riquadro fra il logo e il sottotitolo, non piu' alto del disegno a quella
 * scala: attorno resta la superficie dello stile, e il sottotitolo non copre il dettaglio.
 */
function primoPianoSchermo(c: Contenuto, d: Dettaglio, props: ScenaDi<"gancio">, scalaBase: number): { ripresa: Ripresa; alto: number } {
  const r = riquadroDettaglioSchermo(d, props);
  if (!r) {
    const u = c.caldo ? c.caldo.x + c.caldo.w / 2 : c.misure.w / 2;
    const v = c.caldo ? c.caldo.y + c.caldo.h / 2 : c.misure.h / 2;
    return { ripresa: { u, v, scala: scalaBase * (c.caldo ? 2.6 : 2) }, alto: TITOLO_TOP };
  }
  const scala = LARGHEZZA_DETTAGLIO / r.w;
  const alto = c.tipo === "telefono" ? TITOLO_TOP : Math.max(TITOLO_TOP, FONDO_UTILE - c.misure.h * scala);
  return { ripresa: { u: r.x + r.w / 2, v: r.y + r.h / 2, scala: Math.max(scala, copri(c.misure, { x: 0, y: alto, w: LARGHEZZA, h: FONDO_UTILE - alto })) }, alto };
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
  const dettagli = useDettagli();
  const c = contenutoGancio(props, f, dettagli);
  const quadroScena = { x: 0, y: quota, w: LARGHEZZA, h: ALTEZZA - quota };
  const scalaBase = scalaInsieme(c, quadroScena, FONDO_UTILE - quota);
  const conNotifica = notificaSulloSchermo(props, true);
  const [pu, pv] = PARTENZA[variante.apertura];
  // sulla pagina la camera parte dal titolo, che comincia a sinistra: l'apertura la sposta solo di poco
  const pagina = props.oggetto === "portatile" && (props.schermata ?? "sistema") !== "sistema";
  const larga: Ripresa = { u: pagina ? 740 + (pu - 0.5) * 400 : c.misure.w * pu, v: c.misure.h * pv, scala: scalaBase * (1 + 0.035 * liscio(fase(f, 0, piano.spinta.da))) };
  const meta: Ripresa = conNotifica
    ? { u: NOTIFICA_PX.x + NOTIFICA_PX.w / 2, v: NOTIFICA_PX.y + NOTIFICA_PX.h / 2, scala: Math.max(scalaBase, 880 / NOTIFICA_PX.w) }
    : arrivo(c, props, scalaBase);
  const mossa = stringi(fraRiprese(larga, meta, conPeso(fase(f, piano.spinta.da, piano.spinta.a))), 1.136 ** piano.stacchi.filter((s) => f >= s).length);
  // sotto il blocco del diviso c'e' poco posto: la camera parte dal punto che conta e torna dove sarebbe mentre il blocco sale
  const fuoco = arrivo(c, props, scalaBase);
  const scena = blocco && blocco.sale < 1 ? fraRiprese({ ...mossa, u: fuoco.u, v: fuoco.v }, mossa, blocco.sale) : mossa;
  const dettaglio = formato === "dettaglio" ? dettaglioDi(props, conNotifica) : undefined;
  // a dettaglio il riquadro parte fra il logo e il sottotitolo, poi va fin sotto il titolo e al fondo mentre la camera si allarga
  const t = dettaglio ? allargamento(f) : 1;
  const primo = dettaglio && t < 1 ? primoPianoSchermo(c, dettaglio, props, scalaBase) : undefined;
  const alto = primo ? primo.alto + (quota - primo.alto) * t : quota;
  const basso = primo ? FONDO_UTILE + (ALTEZZA - FONDO_UTILE) * t : ALTEZZA;
  const quadro = primo ? { ...quadroScena, y: alto, h: basso - alto } : quadroScena;
  const ripresa = primo ? fraRiprese(primo.ripresa, scena, t) : scena;
  const v = vistaDi(c, quadro, ripresa, (alto + Math.min(basso, FONDO_UTILE)) / 2);
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
