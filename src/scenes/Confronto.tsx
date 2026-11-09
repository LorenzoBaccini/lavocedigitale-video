import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { Occhiello } from "../editoriale/carta/Occhiello";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoConfronto } from "../editoriale/piani/confronto";
import { fase, uscita } from "../editoriale/regia";
import { SegnoInQuadro } from "../editoriale/Segno";
import { useStile } from "../editoriale/stili";
import { cerchiatura } from "../editoriale/tratto";
import { LARGHEZZA, MARGINE, TITOLO_TOP } from "../impaginazione";
import type { Confronto as Lato } from "../storyboard/tipi";
import type { ScenaDi } from "./props";

const COLONNA = 430;
const FILETTO = 2;
const ALTO = 760;
const TESTA = 130;

const Colonna: React.FC<{ lato: Lato; p: number; accento: boolean; x: number }> = ({ lato, p, accento, x }) => {
  const stile = useStile();
  return (
    <div style={{ position: "absolute", top: ALTO, left: x, width: COLONNA, display: "flex", flexDirection: "column", alignItems: "center", opacity: p, transform: `translateY(${(1 - uscita(p)) * 14}px)` }}>
    <div style={{ height: TESTA, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div data-impaginazione="voce" style={{ textAlign: "center", fontFamily: stile.caratteri.testo, fontWeight: 600, fontSize: 40, lineHeight: 1.2, color: stile.colori.inchiostro.tenue }}>{lato.titolo}</div>
    </div>
    <div data-impaginazione="valore" style={{ marginTop: 24, fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: corpo(lato.valore, 112, 7), lineHeight: 1.1, color: accento ? stile.colori.accentoSuChiaro : stile.colori.inchiostro.testo, whiteSpace: "nowrap", fontVariantNumeric: "lining-nums" }}>{lato.valore}</div>
    </div>
  );
};

// Il confronto: due colonne di giornale divise da un filetto; il secondo valore arriva con la voce e si cerchia a pennarello.
export const Confronto: React.FC<ScenaDi<"confronto">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, a, b } = props;
  const piano = pianoConfronto(props, durata);
  const xa = LARGHEZZA / 2 - FILETTO / 2 - 20 - COLONNA;
  const xb = LARGHEZZA / 2 + FILETTO / 2 + 20;
  const yValore = ALTO + TESTA + 24 + corpo(b.valore, 112, 7) * 0.55;
  const largo = Math.min(COLONNA / 2 - 6, b.valore.length * corpo(b.valore, 112, 7) * 0.3 + 26);
  return (
    <Foglio tipo="giornale" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", justifyContent: "center" }}>
        <Occhiello testo={etichetta} opacita={fase(f, 0, 6)} />
      </div>
      <div style={{ position: "absolute", top: ALTO - 10, height: 340, left: LARGHEZZA / 2 - FILETTO / 2, width: FILETTO, background: stile.colori.inchiostro.testo, opacity: 0.35 * fase(f, piano.a, piano.a + 10) }} />
      <Colonna lato={a} p={fase(f, piano.a, piano.a + 8)} accento={false} x={xa} />
      <Colonna lato={b} p={fase(f, piano.b, piano.b + 8)} accento x={xb} />
      <SegnoInQuadro punti={cerchiatura(xb + COLONNA / 2, yValore, largo, 64, 13)} colore={stile.colori.accentoSuChiaro} spessore={7} progresso={(f - piano.cerchio) / 15} />
    </Foglio>
  );
};
