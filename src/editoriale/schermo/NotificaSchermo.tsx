import type { Ctx } from "../set/disegni";
import type { Rettangolo } from "../set/geometria";
import { Disegno } from "./Disegno";

/** Di quanto scende la notifica per arrivare al suo posto, in pixel del disegno. */
const DISCESA = 90;

/**
 * La notifica sopra lo schermo, nel suo rettangolo `r` del disegno: scende al suo posto mentre compare (`entrata` 0..1).
 * Il disegno e' quello del set, dipinto a 2×.
 */
export const NotificaSchermo: React.FC<{ r: Rettangolo; disegna: (ctx: Ctx) => void; chiave: string; entrata: number; raggio: number }> = ({ r, disegna, chiave, entrata, raggio }) => {
  if (entrata <= 0) return null;
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity: Math.min(1, entrata * 1.4), transform: `translateY(${-DISCESA * (1 - entrata) ** 3}px)`, borderRadius: raggio, boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }}>
      <Disegno w={r.w * 2} h={r.h * 2} disegna={disegna} chiave={chiave} style={{ width: r.w, height: r.h }} />
    </div>
  );
};
