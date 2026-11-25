import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";

import { useCanvasTexture } from "../../../three/useCanvasTexture";
import { uscita } from "../../regia";
import { carta } from "../oggetti/disegni";

// la carta in piedi, grande: 2 volte quella della scrivania (1,22 × 0,77)
const W = 2.44;
const H = 1.54;
const P = 0.04;

/** Una meta' della carta: `lato` -1 a sinistra, 1 a destra; la faccia mostra solo la sua meta' della texture. */
const Meta: React.FC<{ lato: -1 | 1; r: number; faccia: ReturnType<typeof useCanvasTexture>; bordo: string }> = ({ lato, r, faccia, bordo }) => {
  const meta = useMemo(() => {
    const t = faccia.clone();
    t.repeat.set(0.5, 1);
    t.offset.set(lato === -1 ? 0 : 0.5, 0);
    t.needsUpdate = true;
    return t;
  }, [faccia, lato]);
  const u = uscita(r);
  return (
    <group position={[lato * (W / 4 + 0.16 * u), -0.1 * u, 0]} rotation-z={-lato * 0.14 * u} rotation-y={lato * 0.14 * u}>
      <RoundedBox args={[W / 2, H, P]} radius={0.015} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1f2a3a" roughness={0.5} metalness={0.2} clearcoat={0.4} />
      </RoundedBox>
      <mesh position-z={P / 2 + 0.002}>
        <planeGeometry args={[W / 2 - 0.01, H - 0.01]} />
        <meshPhysicalMaterial map={meta} roughness={0.55} metalness={0.15} clearcoat={0.15} clearcoatRoughness={0.5} />
      </mesh>
      {/* il bordo spezzato che si accende al momento della rottura */}
      <mesh position={[-lato * (W / 4), 0, P / 2 + 0.004]} visible={r > 0}>
        <planeGeometry args={[0.03, H]} />
        <meshBasicMaterial color={bordo} transparent opacity={1 - u * 0.6} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** La carta di pagamento che si spezza in due quando `r` (0..1) sale. */
export const CartaReperto: React.FC<{ r: number; bordo: string }> = ({ r, bordo }) => {
  const faccia = useCanvasTexture(976, 616, carta);
  return (
    <group>
      <Meta lato={-1} r={r} faccia={faccia} bordo={bordo} />
      <Meta lato={1} r={r} faccia={faccia} bordo={bordo} />
    </group>
  );
};
