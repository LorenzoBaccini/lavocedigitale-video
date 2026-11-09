import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { scartoSpinta } from "./transizione";

// La spinta laterale fra due scene dello stile (vedi transizione.ts).
export const Spinta: React.FC<{ durata: number; entra: boolean; esce: boolean; children: React.ReactNode }> = ({ durata, entra, esce, children }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  return <AbsoluteFill style={{ transform: `translateX(${scartoSpinta(f, durata, width, entra, esce)}px)` }}>{children}</AbsoluteFill>;
};
