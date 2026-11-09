import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { frameScena, scartoSpinta } from "./transizione";

// La spinta fra due scene dello stile (vedi transizione.ts), laterale o in verticale (lo scorrimento dello schermo):
// oltre la sua fine la scena uscente e' ferma.
// Niente <Freeze>: anche spento azzera l'origine della sequenza e i figli vedrebbero il frame assoluto.
export const Spinta: React.FC<{ durata: number; entra: boolean; esce: boolean; verticale?: boolean; children: React.ReactNode }> = ({ durata, entra, esce, verticale, children }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scarto = scartoSpinta(f, durata, verticale ? height : width, entra, esce);
  return (
    <AbsoluteFill style={{ transform: verticale ? `translateY(${scarto}px)` : `translateX(${scarto}px)` }}>
      {/* spostare l'inizio della sequenza di quanto si e' oltre la fine tiene i figli sull'ultimo frame */}
      <Sequence from={f - frameScena(f, durata)} layout="none">
        {children}
      </Sequence>
    </AbsoluteFill>
  );
};
