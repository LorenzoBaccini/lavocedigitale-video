import type { Rettangolo } from "../set/geometria";
import { Ingombro } from "../set/Ingombro";
import type { Misure, Vista } from "./vista";
import { angoli } from "./vista";

/**
 * Lo schermo a tutto quadro: il riquadro `quadro` del fotogramma mostra il disegno (i figli, in pixel del disegno) come
 * lo inquadra la `vista`. Il riquadro intero e' l'ingombro pieno per il controllo d'impaginazione. `buio` lo spegne (0..1).
 */
export const Schermata: React.FC<{ nome: string; quadro: Rettangolo; vista: Vista; misure: Misure; fondo: string; buio?: number; children: React.ReactNode }> = ({ nome, quadro, vista, misure, fondo, buio = 0, children }) => (
  <>
    <div style={{ position: "absolute", left: quadro.x, top: quadro.y, width: quadro.w, height: quadro.h, overflow: "hidden", background: fondo, boxShadow: "0 -1px 0 rgba(20,24,30,0.08)" }}>
      <div style={{ position: "absolute", left: vista.x - quadro.x, top: vista.y - quadro.y, width: misure.w, height: misure.h, transform: `scale(${vista.scala})`, transformOrigin: "0 0" }}>{children}</div>
      {buio > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${buio})` }} />}
    </div>
    <Ingombro nome={nome} angoli={angoli(quadro)} pieno />
  </>
);
