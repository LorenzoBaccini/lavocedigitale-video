import { Environment, Lightformer } from "@react-three/drei";
import { ThreeCanvas } from "@remotion/three";
import { RepeatWrapping } from "three";
import { AbsoluteFill, useVideoConfig } from "remotion";

import { FOV } from "../../three/proiezione";
import { useCanvasTexture } from "../../three/useCanvasTexture";
import { useVariante } from "../VarianteVideo";
import { legno, legnoRuvido } from "./disegni";
import type { Camera } from "./geometria";
import { NORMALE, puntoSchermo, TACCUINO } from "./geometria";
import type { Luce } from "./luci";
import { LUCI_SCRIVANIA } from "./luci";
import type { Notifica, Schermo } from "./Portatile";
import { Portatile } from "./Portatile";
import { Rig } from "./Rig";

// Una sola luce chiave (finestra in alto a sinistra) con ombre vere, un riempimento debole, la luce dello schermo.
const Luci: React.FC<{ chiave: number; luce: Luce }> = ({ chiave, luce }) => {
  const schermo = puntoSchermo(1280, 800).addScaledVector(NORMALE, 1.1);
  return (
    <>
      <hemisphereLight args={[luce.cielo, luce.terra, luce.emisfero]} />
      <spotLight
        position={[-7, 10, 4]}
        angle={0.6}
        penumbra={0.85}
        intensity={1400 * chiave * luce.forza}
        decay={2}
        color={luce.chiave}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <pointLight position={schermo.toArray()} color="#aebbd0" intensity={0.25} distance={5} decay={2} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={luce.finestraForza} color={luce.finestra} position={[-6, 7, 4]} rotation={[0, 0.7, 0]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={0.25} color={luce.riempimento} position={[6, 3, 2]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>
    </>
  );
};

const Taccuino: React.FC = () => (
  <group position={TACCUINO.posizione} rotation-y={TACCUINO.rotazione}>
    <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.95, 0.08, 2.7]} />
      <meshStandardMaterial color="#e6dfd1" roughness={0.95} />
    </mesh>
    <mesh position={[0.01, 0.092, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.0, 0.016, 2.74]} />
      <meshStandardMaterial color="#2e2b28" roughness={0.88} />
    </mesh>
    {/* elastico */}
    <mesh position={[0.82, 0.1, 0]}>
      <boxGeometry args={[0.05, 0.004, 2.75]} />
      <meshStandardMaterial color="#1a1918" roughness={0.6} />
    </mesh>
    {/* penna appoggiata di traverso */}
    <group position={[0.15, 0.145, 0.25]} rotation={[0, 0.75, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.042, 0.042, 1.75, 20]} />
        <meshPhysicalMaterial color="#141414" roughness={0.35} metalness={0.1} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, -0.95, 0]} castShadow>
        <coneGeometry args={[0.042, 0.16, 20]} />
        <meshPhysicalMaterial color="#9a9ea5" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  </group>
);

// La scrivania: rovere tinto con venature, muro caldo e scuro dietro.
const Piano: React.FC<{ luce: Luce }> = ({ luce }) => {
  const mappa = useCanvasTexture(1024, 1024, legno(luce.legno), [luce.legno.join(",")]);
  const ruvido = useCanvasTexture(512, 512, legnoRuvido);
  for (const t of [mappa, ruvido]) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(2, 1.2);
  }
  return (
    <>
      <mesh position={[0, -0.25, 0.5]} receiveShadow>
        <boxGeometry args={[18, 0.5, 9]} />
        <meshStandardMaterial map={mappa} roughnessMap={ruvido} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 6, -4.2]} receiveShadow>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial color={luce.muro} roughness={0.95} />
      </mesh>
    </>
  );
};

export interface PropsScrivania {
  camera: Camera;
  schermo?: Schermo;
  notifica?: Notifica;
  /** la data dell'orologio sugli schermi, dal copione */
  orologio?: string;
  /** intensita' della luce chiave, 1 di norma */
  luce?: number;
  /** l'oggetto della scena, appoggiato sul piano */
  children?: React.ReactNode;
}

// Il set comune delle scene 3D: scrivania, portatile, taccuino, la luce della finestra; l'oggetto della scena si aggiunge come figlio.
export const Scrivania: React.FC<PropsScrivania> = ({ camera, schermo, notifica, orologio, luce = 1, children }) => {
  const { width, height } = useVideoConfig();
  const tinta = LUCI_SCRIVANIA[useVariante().luce];
  return (
    <AbsoluteFill style={{ background: tinta.fondo }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: FOV, position: camera.pos, near: 0.1, far: 200 }} gl={{ antialias: true }}>
        <Rig pos={camera.pos} look={camera.look} />
        <Luci chiave={luce} luce={tinta} />
        <Piano luce={tinta} />
        <Portatile schermo={schermo} notifica={notifica} orologio={orologio} />
        <Taccuino />
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
