import { AbsoluteFill } from "remotion";

// Velo leggero in alto e in basso: tiene leggibili titoli e sottotitoli senza inventare una luce (la vignettatura e' nell'Overlay).
export const Velo: React.FC<{ alto?: number; basso?: number }> = ({ alto = 0.55, basso = 0.6 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,9,8,${alto}) 0%, rgba(10,9,8,0) 32%, rgba(10,9,8,0) 58%, rgba(10,9,8,${basso}) 100%)` }} />
);
