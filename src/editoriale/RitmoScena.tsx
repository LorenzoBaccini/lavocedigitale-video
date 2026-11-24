import { AbsoluteFill, useCurrentFrame } from "remotion";

import { scalaRitmo } from "./ritmo";

// Il movimento di camera della scena, continuo. Come la spinta, e' transitorio: il controllo d'impaginazione misura la
// scena senza.
export const RitmoScena: React.FC<{ durata: number; indice: number; children: React.ReactNode }> = ({ durata, indice, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ transform: `scale(${scalaRitmo(f, durata, indice)})` }}>{children}</AbsoluteFill>;
};
