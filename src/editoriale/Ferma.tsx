import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

import { scalaFerma } from "./fermo";
import { frameScena } from "./transizione";

// L'ultima scena di contenuto con la chiusura integrata: oltre la sua fine resta sull'ultimo frame e si avvicina piano.
// Niente <Freeze>: azzera l'origine della sequenza e i figli vedrebbero il frame assoluto (vedi Spinta).
// `spinta` spenta nel controllo d'impaginazione, come le transizioni: si misura la scena al suo posto.
export const Ferma: React.FC<{ durata: number; chiusura: number; spinta: boolean; children: React.ReactNode }> = ({ durata, chiusura, spinta, children }) => {
  const f = useCurrentFrame();
  const scala = spinta ? scalaFerma(f, durata, chiusura) : 1;
  return (
    <AbsoluteFill style={{ transform: `scale(${scala})`, transformOrigin: "50% 45%" }}>
      <Sequence from={f - frameScena(f, durata)} layout="none">
        {children}
      </Sequence>
    </AbsoluteFill>
  );
};
