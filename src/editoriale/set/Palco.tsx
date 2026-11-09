import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig } from "remotion";

import { FOV } from "../../three/proiezione";
import type { Camera } from "./geometria";
import { Rig } from "./Rig";

/** Il guscio comune dei set 3D: il fondo, il canvas con le ombre, la camera della scena; luci, piano e oggetti sono figli. */
export const Palco: React.FC<{ camera: Camera; fondo: string; flat?: boolean; children: React.ReactNode }> = ({ camera, fondo, flat, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: fondo }}>
      <ThreeCanvas width={width} height={height} shadows flat={flat} camera={{ fov: FOV, position: camera.pos, near: 0.1, far: 200 }} gl={{ antialias: true }}>
        <Rig pos={camera.pos} look={camera.look} />
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
