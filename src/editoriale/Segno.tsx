import { useId } from "react";

import { SANS } from "../theme";
import type { Punto } from "./tratto";
import { lunghezza, percorso } from "./tratto";

const eased = (p: number) => {
  const t = Math.min(1, Math.max(0, p));
  return 1 - (1 - t) ** 2.2;
};

// Tratto a pennarello: corpo pieno e una venatura piu' chiara dove la punta scarica meno inchiostro.
// `rivela` scopre il segno da sinistra con un ritaglio (per gli SVG stirati sulla larghezza di una riga),
// altrimenti lo traccia con il tratteggio, lungo il percorso.
export const Pennarello: React.FC<{ d: string; colore: string; spessore: number; progresso: number; rivela?: boolean; lunghezza?: number }> = ({ d, colore, spessore, progresso, rivela, lunghezza: l = 1 }) => {
  const id = useId();
  const p = eased(progresso);
  if (p <= 0) return null;
  const tratto = rivela
    ? { vectorEffect: "non-scaling-stroke" as const, clipPath: `url(#${CSS.escape(id)})` }
    : { strokeDasharray: `${l} ${l}`, strokeDashoffset: l * (1 - p) };
  return (
    <g style={{ mixBlendMode: "normal" }}>
      {rivela && (
        <clipPath id={id}>
          <rect x={-10} y={-50} width={10 + 112 * p} height={100} />
        </clipPath>
      )}
      <path d={d} fill="none" stroke={colore} strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round" opacity={0.93} style={tratto} />
      <path d={d} fill="none" stroke="#fff" strokeWidth={spessore * 0.28} strokeLinecap="round" opacity={0.12} transform={`translate(0 ${rivela ? -0.6 : -spessore * 0.18})`} style={tratto} />
    </g>
  );
};

// Segno in coordinate del fotogramma (cerchiature, sottolineature, barrati, spunte).
export const SegnoInQuadro: React.FC<{ punti: Punto[]; colore: string; spessore: number; progresso: number }> = ({ punti, colore, spessore, progresso }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <Pennarello d={percorso(punti)} colore={colore} spessore={spessore} progresso={progresso} lunghezza={lunghezza(punti)} />
  </svg>
);

/** Corpo del richiamo: il minimo leggibile su telefono. */
export const CORPO_RICHIAMO = 36;

// Richiamo da infografica: un filetto verticale scende (o sale) dal punto indicato fino al testo sans maiuscolo.
// (x, daY) e' il punto indicato, aY la fine del filetto; il testo e' centrato su `centro` (di norma x),
// gia' riportato dentro i margini da chi lo dispone.
export const Richiamo: React.FC<{ testo: string; x: number; daY: number; aY: number; progresso: number; nome: string; centro?: number; colore?: string; larghezza?: number }> = ({ testo, x, daY, aY, progresso, nome, centro = x, colore = "#FAFAF7", larghezza = 760 }) => {
  const p = eased(progresso);
  if (p <= 0) return null;
  const testoP = eased((progresso - 0.4) / 0.6);
  const giu = aY >= daY;
  const sinistra = Math.min(Math.max(80, centro - larghezza / 2), 1000 - larghezza);
  return (
    <>
      <div style={{ position: "absolute", left: x - 1.5, top: giu ? daY : daY - (daY - aY) * p, width: 3, height: Math.abs(aY - daY) * p, background: colore, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: sinistra, width: larghezza, display: "flex", justifyContent: "center", ...(giu ? { top: aY + 10 } : { bottom: 1920 - aY + 10 }) }}>
        <div data-impaginazione={nome} style={{ fontFamily: SANS, fontWeight: 650, fontSize: CORPO_RICHIAMO, lineHeight: 1.2, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", color: colore, textShadow: colore === "#FAFAF7" ? "0 2px 12px rgba(0,0,0,0.6)" : "none", opacity: testoP, transform: `translateY(${(1 - testoP) * (giu ? -8 : 8)}px)` }}>
          {testo}
        </div>
      </div>
    </>
  );
};
