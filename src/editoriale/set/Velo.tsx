import { AbsoluteFill } from "remotion";

import { useStile } from "../stili";
import { conAlfa } from "../stili/alfa";

// Velo leggero in alto e in basso: tiene leggibili titoli e sottotitoli senza inventare una luce (la vignettatura e' nell'Overlay).
export const Velo: React.FC<{ alto?: number; basso?: number }> = ({ alto = 0.55, basso = 0.6 }) => {
  const { velo } = useStile().colori;
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${conAlfa(velo, alto)} 0%, ${conAlfa(velo, 0)} 32%, ${conAlfa(velo, 0)} 58%, ${conAlfa(velo, basso)} 100%)` }} />;
};
