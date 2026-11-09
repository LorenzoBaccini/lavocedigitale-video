import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { frameScena, scartoSpinta } from "./transizione";

// La spinta laterale fra due scene dello stile (vedi transizione.ts): oltre la sua fine la scena uscente e' ferma.
// Niente <Freeze>: anche spento azzera l'origine della sequenza e i figli vedrebbero il frame assoluto.
export const Spinta: React.FC<{ durata: number; entra: boolean; esce: boolean; children: React.ReactNode }> = ({ durata, entra, esce, children }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ transform: `translateX(${scartoSpinta(f, durata, width, entra, esce)}px)` }}>
      {/* spostare l'inizio della sequenza di quanto si e' oltre la fine tiene i figli sull'ultimo frame */}
      <Sequence from={f - frameScena(f, durata)} layout="none">
        {children}
      </Sequence>
    </AbsoluteFill>
  );
};
