import { Vector3 } from "three";
import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { pianoOggetto } from "../editoriale/piani/oggetto";
import { fase } from "../editoriale/regia";
import { Pennarello, Richiamo, SegnoInQuadro } from "../editoriale/Segno";
import type { Camera } from "../editoriale/set/geometria";
import { angoliInQuadro, CENTRO_PRIMO_PIANO_PX, distanzaPer, FINESTRA_PX, inAsse, proietta, PULSANTE_PX, puntoSchermo, rettangoloInQuadro, SCHERMO, SCHERMO_PX, sottoLaQuota } from "../editoriale/set/geometria";
import { avvicina, deriva, stretta } from "../editoriale/set/inquadrature";
import { Ingombro } from "../editoriale/set/Ingombro";
import { OggettoSulPiano } from "../editoriale/set/oggetti/Oggetti";
import type { Schermo } from "../editoriale/set/Portatile";
import { angoliSchermoTelefono, puntoTelefono, sopraIlTelefono, TELEFONO_PX } from "../editoriale/set/telefono";
import { POSTI, puntoCaldo } from "../editoriale/set/oggetti/posti";
import { Set3D } from "../editoriale/set/Set3D";
import { NotaAccanto } from "../editoriale/set/NotaAccanto";
import { Occhiello } from "../editoriale/set/Occhiello";
import { SPAZIO_OCCHIELLO } from "../editoriale/set/misureOcchiello";
import { Velo } from "../editoriale/set/Velo";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { titoliOggetto } from "../editoriale/testate/oggetto";
import { Titolo } from "../editoriale/Titolo";
import { cerchiatura, lunghezza, percorso, spunta } from "../editoriale/tratto";
import { ALTEZZA, FONDO_SCENA, FONDO_UTILE, MARGINE, RESPIRO, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const LARGHEZZA_PULSANTE = (PULSANTE_PX.w / SCHERMO_PX.w) * SCHERMO.larghezza;
const SPUNTA = 72;
const NOTA_DA = 580;
// il telefono tutto intero e a sinistra, fra i titoli e la conferma: a destra c'e' posto per la nota di `indica`
const TELEFONO_A_SINISTRA = sopraIlTelefono(900, 752, 12, 1.2, 0.1);
const ALTEZZA_CONFERMA = 100;
const ALTO_TELEFONO = [puntoTelefono(0, 0), puntoTelefono(TELEFONO_PX.w, 0)];
const BASSO_TELEFONO = [puntoTelefono(0, TELEFONO_PX.h), puntoTelefono(TELEFONO_PX.w, TELEFONO_PX.h)];

/** Il telefono sotto i titoli e sopra la conferma: se non ci sta, la camera arretra. */
function fraTitoloEConferma(cam: Camera, alto: number, basso: number): Camera {
  let c = sottoLaQuota(cam, ALTO_TELEFONO, alto);
  for (let k = 1; k <= 8 && Math.max(...BASSO_TELEFONO.map((p) => proietta(p, c).y)) > basso; k++) c = sottoLaQuota(avvicina(cam, 1 + 0.07 * k), ALTO_TELEFONO, alto);
  return c;
}
const BORDO_ALTO = [puntoSchermo(0, 0), puntoSchermo(SCHERMO_PX.w / 2, 0), puntoSchermo(SCHERMO_PX.w, 0)];
/** Il primo piano sul pulsante: quanto e' largo il pulsante nel fotogramma e a che quota sta. */
const PRIMO_PIANO = { larghezza: 640, quota: 1170 };
const PRIMO_PIANO_CHIARO = { larghezza: 560, quota: 1190 };
const PUNTI_SPUNTA = spunta(6, 14, SPUNTA - 18, 5);

/** Il cerchio a mano intorno al punto caldo e dove appoggiare il richiamo, nel fotogramma della camera. */
function cerchioSu(oggetto: Exclude<ScenaDi<"oggetto">["oggetto"], "nessuno">, cam: Camera, primoPiano: boolean) {
  if (oggetto === "portatile" && primoPiano) {
    const r = rettangoloInQuadro(PULSANTE_PX, cam);
    return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, rx: r.w / 2 + 34, ry: r.h / 2 + 30 };
  }
  const caldo = new Vector3(...puntoCaldo(oggetto));
  const c = proietta(caldo, cam);
  const bordo = proietta(caldo.clone().add(new Vector3(POSTI[oggetto].raggio, 0, 0)), cam);
  const rx = Math.max(46, Math.hypot(bordo.x - c.x, bordo.y - c.y));
  return { cx: c.x, cy: c.y, rx, ry: rx * (oggetto === "smartphone" ? 0.42 : 0.78) };
}

/** La conferma in basso, sopra i sottotitoli: la spunta a penna, poi il testo. `suChiaro` la scrive scura sulla pagina chiara. */
export const Conferma: React.FC<{ testo: string; da: number; f: number; suChiaro: boolean }> = ({ testo, da, f, suChiaro }) => {
  const stile = useStile();
  const ok = fase(f, da + 6, da + 14);
  return (
    <div style={{ position: "absolute", bottom: FONDO_SCENA + RESPIRO, left: MARGINE, right: MARGINE, display: "flex", justifyContent: allineaFlesso(stile), alignItems: "center", gap: 18 }}>
      <svg width={SPUNTA} height={SPUNTA} style={{ flex: "none", overflow: "visible" }}>
        <Pennarello d={percorso(PUNTI_SPUNTA)} colore={suChiaro ? stile.colori.suChiaro : stile.colori.testo} spessore={8} progresso={(f - da) / 8} lunghezza={lunghezza(PUNTI_SPUNTA)} />
      </svg>
      <div data-impaginazione="conferma" data-su-chiaro={suChiaro ? "1" : undefined} style={{ minWidth: 0, fontFamily: stile.caratteri.titolo, fontWeight: 600, fontSize: corpo(testo, 66, 20, stile.larghezza), lineHeight: 1.12, color: suChiaro ? stile.colori.suChiaro : stile.colori.testo, textShadow: suChiaro ? "none" : stile.ombra(14, 0.5), opacity: ok, transform: `translateY(${(1 - ok) * 12}px)` }}>{testo}</div>
    </div>
  );
};

// L'oggetto: in primo piano sulla scrivania, con l'occhiello e il titolo in alto, `indica` cerchiato a mano,
// la conferma spuntata a penna in basso.
export const Oggetto: React.FC<ScenaDi<"oggetto">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { oggetto, durata, etichetta, indica, conferma } = props;
  const piano = pianoOggetto(props, durata);
  const schermata = props.schermata ?? "sistema";
  const schermo: Schermo | undefined = oggetto !== "portatile" ? undefined : indica ? { tipo: "finestra", titolo: props.titolo, pulsante: indica, menu: props.menu, schermata } : schermata !== "sistema" ? { tipo: "pagina", titolo: props.titolo, schermata } : undefined;
  const chiara = schermo !== undefined && schermata !== "sistema";
  const primoPiano = chiara ? PRIMO_PIANO_CHIARO : PRIMO_PIANO;
  const suPulsante = oggetto === "portatile" && piano.indica !== undefined && f >= piano.indica;
  const telefono = oggetto === "smartphone";
  const base = suPulsante
    ? inAsse(puntoSchermo(CENTRO_PRIMO_PIANO_PX, PULSANTE_PX.y + PULSANTE_PX.h / 2), distanzaPer(LARGHEZZA_PULSANTE, primoPiano.larghezza), primoPiano.quota)
    : deriva(telefono ? TELEFONO_A_SINISTRA : stretta(oggetto), fase(f, 0, durata));
  const avvicinata = avvicina(base, 0.88 ** piano.stacchi.filter((s) => f >= s && !(suPulsante && s < piano.indica!)).length);
  const { righe, limite } = titoliOggetto(props, piano, stile);
  const cam = telefono
    ? fraTitoloEConferma(avvicinata, limite, conferma ? ALTEZZA - FONDO_SCENA - RESPIRO - ALTEZZA_CONFERMA : FONDO_UTILE)
    : oggetto === "portatile" && !suPulsante
      ? sottoLaQuota(avvicinata, BORDO_ALTO, limite)
      : avvicinata;
  const inchiostro = chiara && suPulsante;

  const segno = oggetto !== "nessuno" && piano.indica !== undefined ? cerchioSu(oggetto, cam, suPulsante) : undefined;
  // il richiamo va sotto il cerchio se ci sta prima della conferma e dei sottotitoli, altrimenti sopra
  const richiamoSotto = segno ? segno.cy + segno.ry + 140 < FONDO_UTILE - (conferma ? 110 : 10) : true;

  return (
    <>
      <Set3D camera={cam} schermo={schermo} orologio={props.contesto.orologio}>
        <OggettoSulPiano nome={oggetto} f={f} titolo={props.titolo} riga={indica} menu={props.menu} schermata={schermata} fuori={0.12 * (1 - fase(f, 0, 3))} />
      </Set3D>
      <Velo alto={0.62} basso={inchiostro ? 0.85 : conferma ? 0.7 : 0.5} />
      {oggetto === "portatile" && !inchiostro && <Ingombro nome="schermo" angoli={angoliInQuadro({ x: 0, y: 0, ...SCHERMO_PX }, cam)} />}
      {chiara && schermo?.tipo === "finestra" && <Ingombro nome="pagina" angoli={angoliInQuadro(FINESTRA_PX, cam)} pieno />}
      {oggetto === "smartphone" && <Ingombro nome="telefono" angoli={angoliSchermoTelefono(cam)} />}
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: allineaFlesso(stile), gap: SPAZIO_OCCHIELLO }}>
        <Occhiello f={f} testo={etichetta} />
        <Titolo nome="titolo" f={f} righe={righe} style={{ alignSelf: "stretch" }} />
      </div>
      {segno && piano.indica !== undefined && (
        <>
          <SegnoInQuadro punti={cerchiatura(segno.cx, segno.cy, segno.rx, segno.ry, 9)} colore={inchiostro ? stile.colori.suChiaro : stile.colori.testo} spessore={7} progresso={(f - piano.indica - 4) / 15} />
          {telefono && indica && (
            <NotaAccanto nome="indica" testo={indica} x={segno.cx + segno.rx} y={segno.cy} sinistra={Math.max(NOTA_DA, segno.cx + segno.rx + 60)} da={piano.indica - 3} f={f} seme={23} />
          )}
          {!suPulsante && !telefono && indica && (
            <Richiamo nome="indica" testo={indica} x={segno.cx} daY={richiamoSotto ? segno.cy + segno.ry + 10 : segno.cy - segno.ry - 10} aY={richiamoSotto ? segno.cy + segno.ry + 70 : segno.cy - segno.ry - 70} progresso={(f - piano.indica - 10) / 10} />
          )}
        </>
      )}
      {conferma && piano.conferma !== undefined && f >= piano.conferma && <Conferma testo={conferma} da={piano.conferma} f={f} suChiaro={inchiostro} />}
    </>
  );
};
