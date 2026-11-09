import { AbsoluteFill, useCurrentFrame } from "remotion";

import { ALTEZZA, FONDO_TITOLO, LARGHEZZA, MARGINE, TITOLO_TOP } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import { titoliAllarme } from "../../scenes/Allarme";
import { NOTIFICA_IN_QUADRO, NOTIFICA_TELEFONO_IN_QUADRO, pianoAllarme } from "../piani/allarme";
import { fase, mix, uscita } from "../regia";
import { SegnoInQuadro } from "../Segno";
import { CORPO_NOTIFICA, notifica, RIGA_NOTIFICA, righeNotifica, SANS_SCHERMI } from "../set/disegni";
import { NOTIFICA_PX } from "../set/geometria";
import { notificaTelefono, righeNotificaTelefono } from "../set/oggetti/disegni";
import { CORPO_NOTIFICA_TELEFONO, NOTIFICA_TELEFONO_PX, RIGA_NOTIFICA_TELEFONO } from "../set/telefono";
import { useRighe } from "../set/useRighe";
import { useStile } from "../stili";
import { larghezzaRiga, Titolo } from "../Titolo";
import { altezzaRighe } from "../titoli";
import { cerchiatura } from "../tratto";
import { contenutoPortatile, contenutoTelefono, vistaDi } from "./contenuto";
import { NotificaSchermo } from "./NotificaSchermo";
import { Schermata } from "./Schermata";
import { trattoFra } from "./segni";
import { punto, rettangolo } from "./vista";

const PER_RIGA = 9;
const STACCO = 30;
// i segni cadono sulla notifica scura: il cerchio bianco, la sottolineatura nel blu di sistema chiaro
const CERCHIO = "#ffffff";
const SOTTOLINEATURA = "#5aa2ff";

/** Dove stanno nella notifica la riga dell'app e le righe del messaggio, sul portatile e sul telefono (pixel del disegno). */
const DISPOSIZIONE = {
  portatile: { r: NOTIFICA_PX, app: { x: 22, y: 22, w: 300, h: 44 }, font: `650 ${CORPO_NOTIFICA}px ${SANS_SCHERMI}`, dividi: righeNotifica, riga: RIGA_NOTIFICA, sotto: 10, rientro: 30, raggio: 14 },
  telefono: { r: NOTIFICA_TELEFONO_PX, app: { x: 20, y: 20, w: 380, h: 58 }, font: `650 ${CORPO_NOTIFICA_TELEFONO}px ${SANS_SCHERMI}`, dividi: righeNotificaTelefono, riga: RIGA_NOTIFICA_TELEFONO, sotto: 12, rientro: 32, raggio: 34 },
};

// L'allarme a tutto quadro: la notifica in primo piano sullo schermo del dispositivo, fra il sopratitolo e il titolo;
// scende al suo posto, la camera stringe piano, e i segni a mano la annotano sulla voce.
export const AllarmeSchermo: React.FC<ScenaDi<"allarme">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, contesto } = props;
  const piano = pianoAllarme(props, durata);
  const { sopra, titolo } = titoliAllarme(props, piano, stile);
  const telefono = piano.dispositivo === "smartphone";
  const d = telefono ? DISPOSIZIONE.telefono : DISPOSIZIONE.portatile;
  const righe = useRighe(d.font, piano.messaggio, d.dividi);
  const c = telefono ? contenutoTelefono({ tipo: "blocco" }) : contenutoPortatile({ tipo: "desktop" }, contesto.orologio);

  const alto = TITOLO_TOP + altezzaRighe([{ testo: props.sopra, size: sopra[0].size }], undefined, stile.larghezza) + STACCO;
  const basso = ALTEZZA - FONDO_TITOLO - altezzaRighe([{ testo: props.titolo, size: titolo[0].size }], larghezzaRiga(titolo, stile.allineamentoTitoli), stile.larghezza) - STACCO;
  const quadro = { x: 0, y: alto, w: LARGHEZZA, h: basso - alto };
  const misura = telefono ? NOTIFICA_TELEFONO_IN_QUADRO : { larghezza: NOTIFICA_IN_QUADRO.larghezza, spinta: NOTIFICA_IN_QUADRO.spinta };
  const larghezza = mix(misura.larghezza, misura.spinta, uscita(fase(f, 0, durata))) * 1.08 ** piano.stacchi.filter((s) => f >= s).length;
  const v = vistaDi(c, quadro, { u: d.r.x + d.r.w / 2, v: d.r.y + d.r.h / 2, scala: larghezza / d.r.w });

  const entrata = !telefono && contesto.precedente === "gancio" ? 1 : fase(f, piano.arrivo, piano.arrivo + 8);
  const app = rettangolo(v, { ...d.app, x: d.r.x + d.app.x, y: d.r.y + d.app.y });
  const cerchio = cerchiatura(app.x + app.w / 2, app.y + app.h / 2, app.w / 2 + 26, app.h / 2 + 18, 7);
  const sottolineature = (righe ?? []).map((r, i) => {
    const base = d.r.y + d.riga.prima + i * d.riga.passo + d.sotto;
    return trattoFra(punto(v, d.r.x + d.rientro, base), punto(v, d.r.x + d.rientro + r.larghezza, base), 12 + i);
  });
  const disegna = telefono ? notificaTelefono(piano.messaggio, props.mittente) : notifica(piano.messaggio, props.mittente, props.azione);
  return (
    <AbsoluteFill style={{ background: stile.colori.superficie }}>
      <Schermata nome="notifica" quadro={quadro} vista={v} misure={c.misure} fondo={c.fondo}>
        {c.strato}
        <NotificaSchermo r={d.r} disegna={disegna} chiave={JSON.stringify([piano.messaggio, props.mittente, props.azione])} entrata={entrata} raggio={d.raggio} />
      </Schermata>
      <SegnoInQuadro punti={cerchio} colore={CERCHIO} spessore={6} progresso={(f - piano.cerchio) / 15} />
      {sottolineature.map((punti, i) => (
        <SegnoInQuadro key={i} punti={punti} colore={SOTTOLINEATURA} spessore={8} progresso={(f - piano.sottolinea - i * PER_RIGA) / PER_RIGA} />
      ))}
      <Titolo nome="sopra" f={f} righe={sopra} style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE }} />
      <Titolo nome="titolo" f={f} righe={titolo} style={{ position: "absolute", bottom: FONDO_TITOLO, left: MARGINE, right: MARGINE }} />
    </AbsoluteFill>
  );
};
