import { Environment, Lightformer } from "@react-three/drei";
import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";

import { profiloLimbo } from "./limbo";
import { Palco } from "./Palco";
import { Portatile } from "./Portatile";
import type { PropsScrivania } from "./Scrivania";

const LARGO = 90;

// Il limbo: pavimento e parete a tinta unita raccordati da una curva, nessuno spigolo dietro gli oggetti.
const Limbo: React.FC<{ colore: string }> = ({ colore }) => {
  const geometria = useMemo(() => {
    const profilo = profiloLimbo();
    const vertici: number[] = [];
    const indici: number[] = [];
    profilo.forEach(([z, y], i) => {
      vertici.push(-LARGO / 2, y, z, LARGO / 2, y, z);
      if (i > 0) {
        const a = (i - 1) * 2;
        indici.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(vertici, 3));
    g.setIndex(indici);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometria} receiveShadow>
      <meshStandardMaterial color={colore} roughness={0.95} metalness={0} />
    </mesh>
  );
};

// Luce da studio fotografico: un grande softbox quasi a picco (ombre corte e morbide), riempimento pieno, nessuna luce dello schermo.
const Luci: React.FC<{ chiave: number }> = ({ chiave }) => (
  <>
    <hemisphereLight args={["#ffffff", "#d8d4cc", 0.8]} />
    {/* riempimento frontale senza ombre: la parete non scurisce verso l'alto */}
    <directionalLight position={[0, 3, 14]} intensity={0.35} />
    <directionalLight
      position={[-3, 14, 6]}
      intensity={1.05 * chiave}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
      shadow-camera-left={-12}
      shadow-camera-right={12}
      shadow-camera-top={12}
      shadow-camera-bottom={-12}
      shadow-camera-near={1}
      shadow-camera-far={40}
    />
    <Environment resolution={128}>
      <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 9, 2]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
      <Lightformer form="rect" intensity={0.5} color="#ffffff" position={[-8, 3, 4]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
      <Lightformer form="rect" intensity={0.5} color="#ffffff" position={[8, 3, 4]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
    </Environment>
  </>
);

/** Il set dello studio: gli stessi dispositivi della scrivania su un fondale continuo della tinta del video. */
export const Fondale: React.FC<PropsScrivania & { colore: string }> = ({ camera, schermo, notifica, orologio, luce = 1, colore, children }) => (
  <Palco camera={camera} fondo={colore} flat>
    <Luci chiave={luce} />
    <Limbo colore={colore} />
    <Portatile schermo={schermo} notifica={notifica} orologio={orologio} />
    {children}
  </Palco>
);
