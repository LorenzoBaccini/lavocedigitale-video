import { AbsoluteFill, useCurrentFrame } from "remotion";

import { scalaRitmo } from "./ritmo";

// Il ritmo della scena: tagli di zoom, scatto sulla chiave, il gancio che avanza. Come la spinta, e' un movimento
// transitorio: il controllo d'impaginazione misura la scena senza.
export const RitmoScena: React.FC<{ durata: number; chiave: number; tagli: number[]; indice: number; children: React.ReactNode }> = ({ durata, chiave, tagli, indice, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ transform: `scale(${scalaRitmo(f, durata, chiave, tagli, indice)})` }}>{children}</AbsoluteFill>;
};
