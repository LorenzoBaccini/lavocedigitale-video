import { useMemo } from "react";

import { useCanvasTexture } from "../../../three/useCanvasTexture";
import { casuale } from "../../tratto";
import { uscita } from "../../regia";
import { BANCONOTA_PX, banconota } from "./disegni";
import { SAGOME } from "./inquadra";

const N = 14;
const W = 1.5;
const H = (W * BANCONOTA_PX.h) / BANCONOTA_PX.w;
// dove arriva ogni banconota quando vola via: dentro la sagoma, cosi' non finisce sotto i titoli
const MEZZA = { x: SAGOME.soldi.larghezza / 2 - W / 2, y: SAGOME.soldi.altezza / 2 - H / 2 };

/** Il mazzetto di banconote; quando `r` (0..1) sale si apre a ventaglio e le banconote volano via girando. */
export const SoldiReperto: React.FC<{ r: number }> = ({ r }) => {
  const faccia = useCanvasTexture(BANCONOTA_PX.w, BANCONOTA_PX.h, banconota);
  const voli = useMemo(() => {
    const rnd = casuale(29);
    return Array.from({ length: N }, (_, i) => ({
      x: (rnd() * 2 - 1) * MEZZA.x,
      y: (rnd() * 2 - 1) * MEZZA.y,
      z: (rnd() - 0.5) * 0.8,
      giro: (rnd() - 0.5) * 2.6,
      ritardo: (i / N) * 0.35,
    }));
  }, []);
  return (
    <group>
      {voli.map((v, i) => {
        const t = uscita(Math.max(0, Math.min(1, (r - v.ritardo) / (1 - v.ritardo))));
        const pila = -H * 0.3 + i * 0.012;
        return (
          <mesh key={i} position={[v.x * t, pila * (1 - t) + v.y * t, i * 0.004 + v.z * t]} rotation={[v.giro * 0.4 * t, v.giro * 0.6 * t, (i % 2 ? 0.04 : -0.04) + v.giro * t]} castShadow>
            <planeGeometry args={[W, H]} />
            <meshStandardMaterial map={faccia} roughness={0.8} side={2} />
          </mesh>
        );
      })}
    </group>
  );
};
