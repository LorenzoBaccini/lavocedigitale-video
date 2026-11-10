import { DoubleSide } from "three";

import type { OggettoScrivania } from "../dettagli";
import type { Camera } from "./geometria";
import { PIANTA, TACCUINO, TAZZA } from "./geometria";
import { Ingombro } from "./Ingombro";
import { FOGLIA, FOGLIE, sagomaInQuadro, sagomaPianta, sagomaTazza } from "./sagome";

// Gli oggetti di scena della scrivania: forme semplici, pochi poligoni, nessun asset esterno.

export const Taccuino: React.FC = () => (
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

/** Tazza di ceramica opaca col caffe' a meta': cilindro aperto, orlo, manico a mezzo toro. */
export const Tazza: React.FC = () => {
  const { raggio: r, altezza: h } = TAZZA;
  return (
    <group position={TAZZA.posizione} rotation-y={TAZZA.giro}>
      <mesh position-y={h / 2} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.94, h, 28, 1, true]} />
        <meshPhysicalMaterial color="#e9e4da" roughness={0.42} clearcoat={0.5} clearcoatRoughness={0.4} side={DoubleSide} />
      </mesh>
      <mesh position-y={0.02} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[r * 0.94, 28]} />
        <meshStandardMaterial color="#d9d3c7" roughness={0.6} />
      </mesh>
      <mesh position-y={h * 0.78} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[r * 0.96, 28]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.25} />
      </mesh>
      <mesh position-y={h} rotation-x={Math.PI / 2}>
        <torusGeometry args={[r, 0.028, 8, 32]} />
        <meshPhysicalMaterial color="#e9e4da" roughness={0.42} clearcoat={0.5} />
      </mesh>
      <mesh position={[r + 0.02, h * 0.52, 0]} rotation-z={-Math.PI / 2}>
        <torusGeometry args={[0.27, 0.06, 10, 20, Math.PI]} />
        <meshPhysicalMaterial color="#e9e4da" roughness={0.42} clearcoat={0.5} />
      </mesh>
    </group>
  );
};

/** Pianta grassa a foglie dritte in un vaso di terracotta. */
export const Pianta: React.FC = () => {
  const { raggio: r, vaso } = PIANTA;
  return (
    <group position={PIANTA.posizione}>
      <mesh position-y={vaso / 2} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.78, vaso, 24]} />
        <meshStandardMaterial color="#a65b3b" roughness={0.92} />
      </mesh>
      <mesh position-y={vaso - 0.07} castShadow>
        <cylinderGeometry args={[r * 1.08, r * 1.08, 0.16, 24]} />
        <meshStandardMaterial color="#b0653f" roughness={0.9} />
      </mesh>
      <mesh position-y={vaso + 0.012} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[r * 0.98, 24]} />
        <meshStandardMaterial color="#2c2119" roughness={1} />
      </mesh>
      {FOGLIE.map(([giro, inclinazione, alta], i) => (
        <group key={giro} position-y={vaso} rotation={[0, giro, inclinazione]}>
          <mesh position={[FOGLIA.scarto, alta / 2, 0]} scale={[1, 1, 0.3]} castShadow>
            <coneGeometry args={[FOGLIA.raggio, alta, 5]} />
            <meshStandardMaterial color={i % 2 ? "#466f3c" : "#5a8449"} roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Gli oggetti di scena dentro il canvas. */
export const OggettiDiScena: React.FC<{ oggetti: readonly OggettoScrivania[] }> = ({ oggetti }) => (
  <>
    {oggetti.includes("taccuino") && <Taccuino />}
    {oggetti.includes("tazza") && <Tazza />}
    {oggetti.includes("pianta") && <Pianta />}
  </>
);

/** Tazza e pianta per il controllo d'impaginazione, fuori dal canvas: nessun testo ci deve passare sopra. */
export const IngombriDiScena: React.FC<{ oggetti: readonly OggettoScrivania[]; camera: Camera }> = ({ oggetti, camera }) => {
  const forme = [
    oggetti.includes("tazza") && (["tazza", sagomaTazza(TAZZA.posizione, TAZZA.raggio, TAZZA.altezza, TAZZA.manico)] as const),
    oggetti.includes("pianta") && (["pianta", sagomaPianta(PIANTA.posizione, PIANTA.raggio, PIANTA.vaso)] as const),
  ].filter((f) => f !== false);
  return (
    <>
      {forme.map(([nome, spigoli]) => {
        const angoli = sagomaInQuadro(spigoli, camera);
        return angoli && <Ingombro key={nome} nome={nome} angoli={angoli} pieno />;
      })}
    </>
  );
};
