import type { CSSProperties } from "react";
import { spring } from "remotion";

import { FPS } from "../theme";
import { Pennarello } from "./Segno";
import { percorso, sottolineatura } from "./tratto";

export type Parola = { t: string; da: number; colore?: string; colpo?: boolean };
export type Riga = {
  parole: Parola[];
  size: number;
  font: string;
  peso?: number;
  corsivo?: boolean;
  /** sottolineatura a pennarello sotto l'intera riga: frame d'inizio e durata */
  sottolinea?: { da: number; durata: number; colore: string; seme: number };
};

/** Colore del testo: carta chiara sul set (con un'ombra leggera), inchiostro sulla carta (piatto). */
export type Tinta = { colore: string; ombra: boolean };
export const SUL_SET: Tinta = { colore: "#FAFAF7", ombra: true };

// le parole entrano due frame prima di essere dette: l'occhio arriva insieme all'orecchio
export const ANTICIPO = 2;
/** Frame in cui la parola e' interamente a schermo. */
export const entrata = (p: { da: number }) => p.da - ANTICIPO + 3;

// Entrata con peso: sale di poco, arriva con un assestamento minimo; niente sfocature, niente bagliori.
const stileParola = (f: number, p: Parola): CSSProperties => {
  const u = f - (p.da - ANTICIPO);
  const e = spring({ frame: u, fps: FPS, config: { damping: 15, stiffness: 240, mass: 0.7 } });
  const opacita = Math.min(1, Math.max(0, u / 3));
  if (p.colpo) return { color: p.colore, opacity: opacita, transform: `translateY(${(1 - e) * 10}px) scale(${1 + (1 - e) * 0.12})` };
  return { color: p.colore, opacity: opacita, transform: `translateY(${(1 - e) * 22}px)` };
};

const PUNTI_RIGA = percorso(sottolineatura(100, 1));

export const Titolo: React.FC<{ nome: string; f: number; righe: Riga[]; style: CSSProperties; tinta?: Tinta }> = ({ nome, f, righe, style, tinta = SUL_SET }) => (
  <div data-impaginazione={nome} style={{ ...style, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
    {righe.map((riga, r) => (
      <div key={r} style={{ position: "relative", display: "inline-flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${riga.size * 0.24}px`, fontFamily: riga.font, fontStyle: riga.corsivo ? "italic" : "normal", fontWeight: riga.peso ?? 600, fontSize: riga.size, lineHeight: 1.12, letterSpacing: -riga.size * 0.012, color: tinta.colore, textShadow: tinta.ombra ? "0 2px 14px rgba(0,0,0,0.45)" : "none", fontFeatureSettings: '"kern", "liga", "lnum"' }}>
        {riga.sottolinea && (
          <svg viewBox="0 -12 100 24" preserveAspectRatio="none" style={{ position: "absolute", left: 0, width: "100%", top: "86%", height: riga.size * 0.2, overflow: "visible" }}>
            <Pennarello d={PUNTI_RIGA} colore={riga.sottolinea.colore} spessore={riga.size * 0.075} progresso={(f - riga.sottolinea.da) / riga.sottolinea.durata} rivela />
          </svg>
        )}
        {riga.parole.map((p, j) => (
          <span key={j} style={{ position: "relative", display: "inline-block", ...stileParola(f, p) }}>{p.t}</span>
        ))}
      </div>
    ))}
  </div>
);
