import { AbsoluteFill } from "remotion";

import type { TipoCarta } from "../carta/stile";
import { useStile } from "../stili";
import { conAlfa } from "../stili/alfa";
import { LUCE_GRIGLIA } from "../stili/notte";

/** Il passo della griglia, in pixel. */
const PASSO = 60;

// la macchia di luce ciano cade in un angolo diverso per ogni tipo di scena
const LUCE: Record<TipoCarta, string> = {
  quadretti: "88% 8%",
  giornale: "8% 92%",
  agenda: "85% 96%",
  liscia: "10% 6%",
};

/** La scena grafica della notte: nero, griglia sottile, una luce ciano; i testi sopra ereditano il bagliore dello stile. */
export const Griglia: React.FC<{ tipo: TipoCarta; spinta?: number; children?: React.ReactNode }> = ({ tipo, spinta = 0, children }) => {
  const { colori, bagliore } = useStile();
  const linea = conAlfa(colori.accento, 0.09);
  return (
    <AbsoluteFill style={{ background: colori.superficie, textShadow: bagliore }}>
      <AbsoluteFill style={{ transform: `scale(${1 + spinta})`, transformOrigin: "50% 45%" }}>
        <AbsoluteFill style={{ backgroundImage: `linear-gradient(${linea} 1px, transparent 1px), linear-gradient(90deg, ${linea} 1px, transparent 1px)`, backgroundSize: `${PASSO}px ${PASSO}px`, backgroundPosition: "center" }} />
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${LUCE[tipo]}, ${conAlfa(colori.accento, LUCE_GRIGLIA)} 0%, ${conAlfa(colori.accento, 0)} 55%)` }} />
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
