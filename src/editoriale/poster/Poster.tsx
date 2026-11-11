import { AbsoluteFill } from "remotion";

import type { TipoCarta } from "../carta/stile";
import { useStile } from "../stili";
import { mescola } from "../stili/colore";

// un disco appena piu' chiaro o piu' scuro della tinta, in un angolo diverso per ogni tipo di scena: il poster non e' mai vuoto
const DISCO: Record<TipoCarta, { x: number; y: number; d: number }> = {
  quadretti: { x: 760, y: 120, d: 1100 },
  giornale: { x: -380, y: 980, d: 1300 },
  agenda: { x: 640, y: 1180, d: 1200 },
  liscia: { x: -300, y: -260, d: 1250 },
};

/** La scena grafica dello studio: tinta piena, nessuna carta; `spinta` avvicina di poco il fondo come la camera sul foglio. */
export const Poster: React.FC<{ tipo: TipoCarta; spinta?: number; children?: React.ReactNode }> = ({ tipo, spinta = 0, children }) => {
  const { superficie, inchiostro } = useStile().colori;
  const disco = DISCO[tipo];
  return (
    <AbsoluteFill style={{ background: superficie }}>
      <AbsoluteFill style={{ transform: `scale(${1 + spinta})`, transformOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", left: disco.x, top: disco.y, width: disco.d, height: disco.d, borderRadius: "50%", background: mescola(superficie, inchiostro.testo, 0.07) }} />
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
