import { RoundedBox } from "@react-three/drei";

import { uscita } from "../../regia";

const CORPO = { w: 1.5, h: 1.25, p: 0.5, y: -0.5 };
const ARCO = { raggio: 0.42, spessore: 0.1, y: 0.47 };
const ACCIAIO = { color: "#d4d8de", metalness: 1, roughness: 0.25 };

/** Il lucchetto chiuso; quando `r` (0..1) sale l'arco scatta in alto e ruota fuori, il corpo si accende di `allarme`. */
export const LucchettoReperto: React.FC<{ r: number; allarme: string }> = ({ r, allarme }) => {
  const u = uscita(r);
  const gamba = ARCO.y - CORPO.y - CORPO.h / 2 + 0.06;
  return (
    <group>
      <RoundedBox args={[CORPO.w, CORPO.h, CORPO.p]} radius={0.12} smoothness={4} position-y={CORPO.y} castShadow receiveShadow>
        <meshPhysicalMaterial color="#b8893a" metalness={0.9} roughness={0.32} clearcoat={0.3} emissive={allarme} emissiveIntensity={0.28 * u} />
      </RoundedBox>
      {/* la toppa */}
      <group position={[0, CORPO.y - 0.05, CORPO.p / 2 + 0.003]}>
        <mesh position-y={0.08}>
          <circleGeometry args={[0.11, 32]} />
          <meshBasicMaterial color="#07060d" />
        </mesh>
        <mesh position-y={-0.08}>
          <planeGeometry args={[0.08, 0.26]} />
          <meshBasicMaterial color="#07060d" />
        </mesh>
      </group>
      {/* l'arco: il cardine e' la gamba di destra; si apre all'indietro, lontano dalla camera */}
      <group position={[ARCO.raggio, 0.18 * u, 0]} rotation-y={-1.3 * u}>
        <group position-x={-ARCO.raggio}>
          <mesh position-y={ARCO.y} castShadow>
            <torusGeometry args={[ARCO.raggio, ARCO.spessore, 20, 48, Math.PI]} />
            <meshPhysicalMaterial {...ACCIAIO} />
          </mesh>
          {[-1, 1].map((lato) => (
            <mesh key={lato} position={[lato * ARCO.raggio, ARCO.y - gamba / 2, 0]} castShadow>
              <cylinderGeometry args={[ARCO.spessore, ARCO.spessore, gamba, 20]} />
              <meshPhysicalMaterial {...ACCIAIO} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};
