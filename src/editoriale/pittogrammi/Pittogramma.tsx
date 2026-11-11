import type { Simbolo } from "../../storyboard/tipi";
import { TRACCIATI } from "./tracciati";

/** Lo spessore del tratto nel riquadro 100×100: lo stesso peso ottico per ogni pittogramma. */
export const SPESSORE_PITTOGRAMMA = 6;

// Un pittogramma tracciato a mano: `progresso` da 0 a 1 percorre i tracciati uno dopo l'altro, ognuno con la sua quota.
export const Pittogramma: React.FC<{ simbolo: Simbolo; lato: number; colore: string; progresso: number; spessore?: number }> = ({ simbolo, lato, colore, progresso, spessore = SPESSORE_PITTOGRAMMA }) => {
  const tracciati = TRACCIATI[simbolo];
  const n = tracciati.length;
  return (
    <svg width={lato} height={lato} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      {tracciati.map((d, i) => {
        const p = Math.min(1, Math.max(0, progresso * n - i));
        // a zero il cappuccio tondo lascerebbe un punto: il tracciato non c'e' ancora
        if (p <= 0) return null;
        return <path key={i} d={d} pathLength={1} fill="none" stroke={colore} strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />;
      })}
    </svg>
  );
};
