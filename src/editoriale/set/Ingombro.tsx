import type { Punto2 } from "./geometria";
import { rettangoloDi } from "./geometria";

/** Lo schermo o l'oggetto 3D principale, invisibile, per il controllo d'impaginazione: i suoi angoli proiettati. */
export const Ingombro: React.FC<{ nome: string; angoli: Punto2[]; pieno?: boolean }> = ({ nome, angoli, pieno }) => {
  const r = rettangoloDi(angoli);
  return (
    <div
      data-ingombro={nome}
      data-pieno={pieno ? "1" : undefined}
      data-angoli={JSON.stringify(angoli.map((a) => [Math.round(a.x * 10) / 10, Math.round(a.y * 10) / 10]))}
      style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, pointerEvents: "none" }}
    />
  );
};
