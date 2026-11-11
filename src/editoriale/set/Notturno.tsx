import { Environment, Lightformer } from "@react-three/drei";

import { CIANO, MAGENTA } from "../stili/notte";
import { NORMALE, puntoSchermo } from "./geometria";
import { Palco } from "./Palco";
import { Portatile } from "./Portatile";
import type { PropsSet } from "./Scrivania";

// Quasi buio: due luci di taglio da dietro (ciano a sinistra, magenta a destra), un riempimento debole, lo schermo che illumina.
const Luci: React.FC<{ chiave: number }> = ({ chiave }) => {
  const schermo = puntoSchermo(1280, 800).addScaledVector(NORMALE, 1.5);
  return (
    <>
      <hemisphereLight args={["#8fa6bd", "#000000", 0.18]} />
      <directionalLight position={[3, 6, 14]} intensity={0.22 * chiave} color="#cdd8e8" />
      <spotLight
        position={[-8, 5, -6]}
        angle={0.75}
        penumbra={0.9}
        intensity={280 * chiave}
        decay={2}
        color={CIANO}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <spotLight position={[8, 5, -5]} angle={0.75} penumbra={0.9} intensity={300 * chiave} decay={2} color={MAGENTA} />
      <pointLight position={schermo.toArray()} color="#bcd2ff" intensity={1.6} distance={7} decay={2} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={1.2} color={CIANO} position={[-7, 3, -2]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.2} color={MAGENTA} position={[7, 3, -2]} rotation-y={-Math.PI / 2} scale={[6, 1.2, 1]} />
        <Lightformer form="rect" intensity={0.15} color="#ffffff" position={[0, 9, 2]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
      </Environment>
    </>
  );
};

// Il piano: scuro, satinato (riflette morbido le luci colorate), abbastanza largo da perdersi nel buio.
const Piano: React.FC = () => (
  <mesh rotation-x={-Math.PI / 2} receiveShadow>
    <planeGeometry args={[80, 80]} />
    <meshStandardMaterial color="#0c0e12" roughness={0.38} metalness={0.35} />
  </mesh>
);

/** Il set della notte: gli stessi dispositivi della scrivania, senza taccuino, su un piano scuro nel buio. */
export const Notturno: React.FC<PropsSet & { fondo: string }> = ({ camera, schermo, notifica, orologio, luce = 1, dettagli, fondo, children }) => (
  <Palco camera={camera} fondo={fondo}>
    <Luci chiave={luce} />
    <Piano />
    <Portatile schermo={schermo} notifica={notifica} orologio={{ ora: dettagli.ora, data: orologio }} />
    {children}
  </Palco>
);
