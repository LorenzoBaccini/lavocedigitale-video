import { AbsoluteFill, useCurrentFrame } from "remotion";

import { useStile } from "./stili";
import { mescola } from "./stili/colore";
import { lampo } from "./transizione";

/** Opacita' del lampo al suo picco. */
const PICCO = 0.82;

/** Il lampo dello stacco (vedi transizione.ts): bianco sul primo frame della scena, si spegne virando all'accento. */
export const Lampo: React.FC<{ inizi: number[] }> = ({ inizi }) => {
  const k = lampo(useCurrentFrame(), inizi);
  const { accento } = useStile().colori;
  if (k === 0) return null;
  return <AbsoluteFill style={{ background: mescola(accento, "#ffffff", k), opacity: PICCO * k, pointerEvents: "none" }} />;
};
