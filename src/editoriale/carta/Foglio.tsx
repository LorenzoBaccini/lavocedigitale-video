import { AbsoluteFill } from "remotion";

import { Griglia } from "../griglia/Griglia";
import { Poster } from "../poster/Poster";
import { Scheda } from "../scheda/Scheda";
import { useStile } from "../stili";
import type { TipoCarta } from "./stile";

// fibre della carta: rumore fisso, moltiplicato sul colore
const FIBRE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>")`;

const COLORE: Record<TipoCarta, string> = {
  quadretti: "#F1EFE8",
  giornale: "#E7E1D2",
  agenda: "#F2EEE3",
  liscia: "#F1ECE1",
};

const disegno = (tipo: TipoCarta): React.CSSProperties => {
  if (tipo === "quadretti") {
    return {
      backgroundImage: "linear-gradient(rgba(72,108,150,0.17) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(72,108,150,0.17) 1.5px, transparent 1.5px)",
      backgroundSize: "44px 44px",
      backgroundPosition: "18px 10px",
    };
  }
  return {};
};

/** Margine di legno visibile ai lati del foglio. */
export const BORDO_FOGLIO = 24;

// Un foglio sulla scrivania visto dall'alto: il legno ai lati, l'ombra del foglio, le fibre, la luce dalla finestra in alto a sinistra.
// `spinta` avvicina di poco il foglio (la camera che scende); il contenuto sta sopra, fermo nella sua impaginazione.
// Con lo stile a poster (studio) al posto del foglio c'e' il poster a tinta piena, con la notte il nero a griglia, con lo
// schermo una scheda d'interfaccia.
export const Foglio: React.FC<{ tipo: TipoCarta; spinta?: number; children?: React.ReactNode }> = ({ tipo, spinta = 0, children }) => {
  const stile = useStile();
  if (stile.grafiche === "poster") return <Poster tipo={tipo} spinta={spinta}>{children}</Poster>;
  if (stile.grafiche === "griglia") return <Griglia tipo={tipo} spinta={spinta}>{children}</Griglia>;
  if (stile.grafiche === "scheda") return <Scheda spinta={spinta}>{children}</Scheda>;
  return (
    <AbsoluteFill style={{ background: stile.colori.superficie }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(92deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 9px), repeating-linear-gradient(88deg, rgba(255,220,180,0.05) 0 1px, transparent 1px 23px)" }} />
      <AbsoluteFill style={{ transform: `scale(${1 + spinta})`, transformOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", left: BORDO_FOGLIO, right: BORDO_FOGLIO, top: -40, bottom: -40, background: COLORE[tipo], boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 6px 10px 28px rgba(0,0,0,0.45)", overflow: "hidden" }}>
          <AbsoluteFill style={disegno(tipo)} />
          <AbsoluteFill style={{ backgroundImage: FIBRE, mixBlendMode: "multiply", opacity: tipo === "giornale" ? 0.5 : 0.32 }} />
          {/* la luce della finestra: piu' chiara in alto a sinistra, cala verso il basso a destra */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 90% at 18% 8%, rgba(255,250,238,0.55) 0%, rgba(255,250,238,0) 55%), linear-gradient(160deg, rgba(0,0,0,0) 45%, rgba(60,40,20,0.16) 100%)" }} />
        </div>
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
