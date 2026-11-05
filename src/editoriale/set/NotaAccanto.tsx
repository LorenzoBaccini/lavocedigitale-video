import { FONDO_UTILE, LARGHEZZA, MARGINE, RESPIRO } from "../../impaginazione";
import { SANS } from "../../theme";
import { FRECCIA } from "../piani/documenti";
import { fase } from "../regia";
import { Pennarello } from "../Segno";
import type { Punto } from "../tratto";
import { casuale, lunghezza, percorso } from "../tratto";
import { postoNota } from "./nota";

/** Mezza altezza di una nota di due righe. */
const NOTA_MEZZA = 46;

/** Freccia a mano da (x0, y0) verso (x1, y1): un arco appena curvo e la punta a due tratti. */
export function freccia(x0: number, y0: number, x1: number, y1: number, seme: number): Punto[] {
  const r = casuale(seme);
  const curva = 14 + r() * 10;
  const corpo: Punto[] = Array.from({ length: 16 }, (_, i) => {
    const t = i / 15;
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * curva];
  });
  const ang = Math.atan2(y1 - corpo[14][1], x1 - corpo[14][0]);
  const punta = (d: number): Punto => [x1 - 26 * Math.cos(ang + d), y1 - 26 * Math.sin(ang + d)];
  return [...corpo, punta(0.5), [x1, y1], punta(-0.5)];
}

/**
 * Una nota a mano a destra di un punto: la freccia a pennarello dal testo al punto `(x, y)`, poi la scritta in Inter maiuscolo
 * da `sinistra` al margine. Comincia al frame `da`.
 */
export const NotaAccanto: React.FC<{ nome: string; testo: string; x: number; y: number; sinistra: number; da: number; f: number; seme: number }> = ({ nome, testo, x, y, sinistra: voluta, da, f, seme }) => {
  const { sinistra, corpo } = postoNota(testo, voluta, x);
  // mai nella fascia del sottotitolo
  const yNota = Math.min(y, FONDO_UTILE - RESPIRO - NOTA_MEZZA);
  const tratto = freccia(sinistra - 14, yNota - 4, x + 14, y, seme);
  const entrata = fase(f, da + FRECCIA, da + FRECCIA + 6);
  return (
    <>
      <svg width={LARGHEZZA} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        <Pennarello d={percorso(tratto)} colore="#FAFAF7" spessore={6} progresso={(f - da) / FRECCIA} lunghezza={lunghezza(tratto)} />
      </svg>
      <div
        data-impaginazione={nome}
        style={{ position: "absolute", left: sinistra, width: LARGHEZZA - MARGINE - sinistra, top: yNota, transform: `translateY(-50%) translateX(${(1 - entrata) * -10}px)`, fontFamily: SANS, fontWeight: 650, fontSize: corpo, lineHeight: 1.18, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FAFAF7", textShadow: "0 2px 12px rgba(0,0,0,0.65)", opacity: entrata }}
      >
        {testo}
      </div>
    </>
  );
};
