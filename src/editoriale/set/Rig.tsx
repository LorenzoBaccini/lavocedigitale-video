import { useThree } from "@react-three/fiber";

import type { Camera } from "./geometria";

/** Porta la camera del canvas dove dice la scena, a ogni fotogramma. */
export const Rig: React.FC<Camera> = ({ pos, look }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(...pos);
  camera.lookAt(...look);
  return null;
};
