import { Environment, Lightformer } from "@react-three/drei";
import { RepeatWrapping } from "three";

import { useCanvasTexture } from "../../three/useCanvasTexture";
import type { Dettagli } from "../dettagli";
import { useVariante } from "../VarianteVideo";
import { legno, legnoRuvido } from "./disegni";
import type { Camera } from "./geometria";
import { NORMALE, puntoSchermo } from "./geometria";
import type { Luce } from "./luci";
import { LUCI_SCRIVANIA } from "./luci";
import { IngombriDiScena, OggettiDiScena } from "./OggettiDiScena";
import type { Notifica, Schermo } from "./Portatile";
import { Palco } from "./Palco";
import { Portatile } from "./Portatile";

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

/** Le props del set come le passa Set3D: quelle della scena e i dettagli del video, letti fuori dal canvas. */
export type PropsSet = PropsScrivania & { dettagli: Dettagli };

// Il set comune delle scene 3D: scrivania, portatile, due oggetti di scena, la luce della finestra; l'oggetto della scena si aggiunge come figlio.
export const Scrivania: React.FC<PropsSet> = ({ camera, schermo, notifica, orologio, luce = 1, dettagli, children }) => {
  const tinta = LUCI_SCRIVANIA[useVariante().luce];
  return (
    <>
      <Palco camera={camera} fondo={tinta.fondo}>
        <Luci chiave={luce} luce={tinta} />
        <Piano luce={tinta} />
        <Portatile schermo={schermo} notifica={notifica} orologio={{ ora: dettagli.ora, data: orologio }} />
        <OggettiDiScena oggetti={dettagli.oggetti} />
        {children}
      </Palco>
      <IngombriDiScena oggetti={dettagli.oggetti} camera={camera} />
    </>
  );
};
