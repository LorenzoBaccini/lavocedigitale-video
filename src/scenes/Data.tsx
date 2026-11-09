import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { GIORNI } from "../editoriale/carta/calendario";
import { Foglio } from "../editoriale/carta/Foglio";
import { Occhiello } from "../editoriale/carta/Occhiello";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoData } from "../editoriale/piani/data";
import { fase } from "../editoriale/regia";
import { SegnoInQuadro } from "../editoriale/Segno";
import { allineaFlesso, allineaTesto, useStile } from "../editoriale/stili";
import { conAlfa } from "../editoriale/stili/alfa";
import { cerchiatura, sottolineatura } from "../editoriale/tratto";
import { FONDO_UTILE, LARGHEZZA, MARGINE, RESPIRO, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const LARGO_CELLA = 124;
const GRIGLIA = { x: (LARGHEZZA - 7 * LARGO_CELLA) / 2, y: 660 };
// la pagina riempie il foglio fino al barrato (o fino alla zona del sottotitolo): le righe si allungano quanto possono
const altezzaCella = (righe: number, conBarrato: boolean) => Math.min(132, Math.floor((FONDO_UTILE - RESPIRO - (conBarrato ? 120 : 30) - GRIGLIA.y) / righe));
const CORPO_BARRATO = 54;

// La data: la pagina del mese di un'agenda, il giorno cerchiato a pennarello, cio' che finisce barrato, il timbro.
export const Data: React.FC<ScenaDi<"data">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, barrato, timbro } = props;
  const piano = pianoData(props, durata);
  const { pagina } = piano;
  const righe = pagina.celle.length / 7;
  const CELLA = { w: LARGO_CELLA, h: altezzaCella(righe, Boolean(barrato)) };
  const fondoGriglia = GRIGLIA.y + righe * CELLA.h;
  const cx = GRIGLIA.x + (pagina.casella % 7) * CELLA.w + CELLA.w / 2;
  const cy = GRIGLIA.y + Math.floor(pagina.casella / 7) * CELLA.h + CELLA.h / 2;
  const yBarrato = fondoGriglia + 40;
  // la larghezza del barrato, stimata sul corsivo: il segno e' a mano, non serve al pixel
  const largo = Math.min(LARGHEZZA - 2 * MARGINE, (barrato?.length ?? 0) * CORPO_BARRATO * 0.47);
  const barra = sottolineatura(largo, 21).map(([x, y]) => [LARGHEZZA / 2 - largo / 2 + x, yBarrato + CORPO_BARRATO * 0.68 + y] as [number, number]);
  const colpo = piano.timbro === undefined ? 0 : fase(f, piano.timbro, piano.timbro + 3);
  return (
    <Foglio tipo="agenda" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: allineaFlesso(stile), gap: 18 }}>
        <Occhiello testo={etichetta} opacita={fase(f, 0, 6)} />
        <div data-impaginazione="mese" style={{ fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: 76, lineHeight: 1.1, color: stile.colori.inchiostro.testo, textTransform: "capitalize" }}>{`${pagina.mese} ${pagina.anno}`}</div>
      </div>
      <div style={{ position: "absolute", top: GRIGLIA.y - 62, left: GRIGLIA.x, display: "flex" }}>
        {GIORNI.map((g, i) => (
          <div key={i} data-impaginazione="giorni" style={{ width: CELLA.w, textAlign: "center", fontFamily: stile.caratteri.testo, fontWeight: 600, fontSize: 34, color: stile.colori.inchiostro.tenue }}>{g}</div>
        ))}
      </div>
      <div style={{ position: "absolute", top: GRIGLIA.y, left: GRIGLIA.x, width: 7 * CELLA.w, display: "grid", gridTemplateColumns: `repeat(7, ${CELLA.w}px)`, gridAutoRows: CELLA.h, borderTop: `2px solid ${conAlfa(stile.colori.inchiostro.testo, 0.55)}` }}>
        {pagina.celle.map((n, i) => (
          <div key={i} data-impaginazione={n ? "giorno" : undefined} style={{ borderBottom: `1px solid ${conAlfa(stile.colori.inchiostro.testo, 0.16)}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: stile.caratteri.titolo, fontWeight: i === pagina.casella ? 700 : 500, fontSize: 54, color: i % 7 > 4 ? stile.colori.inchiostro.tenue : stile.colori.inchiostro.testo, opacity: n ? 1 : 0 }}>
            {n ?? ""}
          </div>
        ))}
      </div>
      <SegnoInQuadro punti={cerchiatura(cx, cy, CELLA.w * 0.46, CELLA.h * 0.5, 11)} colore={stile.colori.accentoSuChiaro} spessore={7} progresso={(f - piano.cerchio) / 15} />
      {barrato && piano.scritto !== undefined && (
        <>
          <div style={{ position: "absolute", top: yBarrato, left: MARGINE, right: MARGINE, display: "flex", justifyContent: "center" }}>
            <div data-impaginazione="barrato" style={{ fontFamily: stile.caratteri.titolo, fontStyle: "italic", fontWeight: 600, fontSize: CORPO_BARRATO, lineHeight: 1.2, color: stile.colori.inchiostro.testo, whiteSpace: "nowrap", opacity: fase(f, piano.scritto, piano.scritto + 6) }}>{barrato}</div>
          </div>
          <SegnoInQuadro punti={barra} colore={stile.colori.accentoSuChiaro} spessore={9} progresso={(f - (piano.barra ?? 0)) / 12} />
        </>
      )}
      {timbro && piano.timbro !== undefined && f >= piano.timbro && (
        <div style={{ position: "absolute", left: MARGINE, right: MARGINE, top: GRIGLIA.y + (fondoGriglia - GRIGLIA.y) * 0.5, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div data-impaginazione="timbro" style={{ fontFamily: stile.caratteri.testo, fontWeight: 800, fontSize: corpo(timbro, 96, 9), letterSpacing: "0.12em", textTransform: "uppercase", color: stile.colori.inchiostro.timbro, border: `6px double ${stile.colori.inchiostro.timbro}`, padding: "6px 26px", borderRadius: 10, mixBlendMode: stile.grafiche === "carta" ? "multiply" : "normal", opacity: 0.85 * colpo, transform: `rotate(-7deg) scale(${1.14 - 0.14 * colpo})`, WebkitMaskImage: "radial-gradient(circle at 30% 40%, #000 55%, rgba(0,0,0,0.72) 100%)" }}>{timbro}</div>
        </div>
      )}
    </Foglio>
  );
};
