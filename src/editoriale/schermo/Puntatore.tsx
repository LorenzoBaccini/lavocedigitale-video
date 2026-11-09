import type { Punto2 } from "../set/geometria";
import { useStile } from "../stili";
import { conAlfa } from "../stili/alfa";
import { onda, posaPuntatore } from "./tocco";
import type { Vista } from "./vista";
import { punto } from "./vista";

const FRECCIA = "M0 0 L0 33 L8.3 25.5 L14.3 39 L19.5 36.8 L13.5 23.3 L24 23.3 Z";
const DITO = 64;

/**
 * Il puntatore della registrazione: va da `da` ad `a` (pixel del disegno) e tocca al frame `arrivo` con un'onda
 * dell'accento. Sul portatile la freccia, sul telefono il dito (un cerchio grigio, come le registrazioni del telefono).
 */
export const Puntatore: React.FC<{ f: number; arrivo: number; da: Punto2; a: Punto2; vista: Vista; dito?: boolean }> = ({ f, arrivo, da, a, vista, dito }) => {
  const { colori } = useStile();
  const posa = posaPuntatore(f, arrivo, da, a);
  if (posa.opacita <= 0) return null;
  const q = punto(vista, posa.x, posa.y);
  const o = onda(f, arrivo);
  const k = 1 - 0.14 * posa.premuto;
  return (
    <>
      {o && <div style={{ position: "absolute", left: q.x - o.raggio, top: q.y - o.raggio, width: o.raggio * 2, height: o.raggio * 2, borderRadius: "50%", background: conAlfa(colori.accento, o.opacita * 0.5), border: `4px solid ${conAlfa(colori.accento, o.opacita * 1.6)}` }} />}
      {dito ? (
        <div style={{ position: "absolute", left: q.x - DITO / 2, top: q.y - DITO / 2, width: DITO, height: DITO, borderRadius: "50%", background: "rgba(30,34,40,0.32)", border: "3px solid rgba(255,255,255,0.85)", opacity: posa.opacita, transform: `scale(${k})` }} />
      ) : (
        <svg width={40} height={52} viewBox="-2 -2 28 44" style={{ position: "absolute", left: q.x - 2, top: q.y - 2, overflow: "visible", opacity: posa.opacita, transform: `scale(${k * 1.5})`, transformOrigin: "2px 2px", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))" }}>
          <path d={FRECCIA} fill="#ffffff" stroke="#111318" strokeWidth={2} strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
};
