import { RoundedBox } from "@react-three/drei";

import type { Pezzo } from "../../../storyboard/tipi";
import type { Vec } from "../../../three/proiezione";
import { useCanvasTexture } from "../../../three/useCanvasTexture";
import { documento, letteraPin, tessera } from "./disegni";
import { CARTA, LETTERA, LETTORE } from "./posti";

// I pezzi della scena documenti: stessi materiali satinati degli oggetti del set, nessun marchio.

const Carta: React.FC<{ disegno: (ctx: CanvasRenderingContext2D) => void; colore: string }> = ({ disegno, colore }) => {
  const { larghezza: w, lunghezza: l, spessore: h } = CARTA;
  const faccia = useCanvasTexture(976, 616, disegno);
  return (
    <>
      <RoundedBox args={[w, h, l]} radius={0.004} smoothness={2} position-y={h / 2} castShadow receiveShadow>
        <meshPhysicalMaterial color={colore} roughness={0.55} metalness={0.05} clearcoat={0.35} clearcoatRoughness={0.5} />
      </RoundedBox>
      <mesh position={[0, h + 0.0008, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[w - 0.01, l - 0.01]} />
        <meshPhysicalMaterial map={faccia} roughness={0.5} metalness={0.05} clearcoat={0.35} clearcoatRoughness={0.45} />
      </mesh>
    </>
  );
};

// Lettore di smart card da tavolo: guscio nero opaco, la fessura sul fronte, la spia accesa, il cavo che esce a sinistra.
const Lettore: React.FC = () => {
  const { larghezza: w, profondita: p, altezza: h } = LETTORE;
  return (
    <>
      <RoundedBox args={[w, h, p]} radius={0.07} smoothness={4} position-y={h / 2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1f2023" roughness={0.7} metalness={0.05} clearcoat={0.2} clearcoatRoughness={0.7} />
      </RoundedBox>
      <mesh position={[0, h * 0.62, p / 2 + 0.001]}>
        <planeGeometry args={[w * 0.74, 0.022]} />
        <meshStandardMaterial color="#050506" roughness={0.6} />
      </mesh>
      <mesh position={[w * 0.3, h + 0.001, p * 0.22]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.022, 16]} />
        <meshBasicMaterial color="#7fe08a" toneMapped={false} />
      </mesh>
      <mesh position={[-w / 2 - 0.4, 0.035, 0.1]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 12]} />
        <meshPhysicalMaterial color="#18191b" roughness={0.6} />
      </mesh>
    </>
  );
};

const Lettera: React.FC = () => {
  const { larghezza: w, lunghezza: l, spessore: h } = LETTERA;
  const faccia = useCanvasTexture(880, 600, letteraPin);
  return (
    <mesh position-y={h} rotation-x={-Math.PI / 2} castShadow receiveShadow>
      <planeGeometry args={[w, l]} />
      <meshStandardMaterial map={faccia} roughness={0.92} />
    </mesh>
  );
};

const PEZZO: Record<Pezzo, React.FC> = {
  tessera: () => <Carta disegno={tessera} colore="#c9dad5" />,
  documento: () => <Carta disegno={documento} colore="#e2d2c9" />,
  lettore: Lettore,
  pin: Lettera,
};

/** I pezzi appoggiati sul piano, ciascuno al suo posto. */
export const PezziSulTavolo: React.FC<{ pezzi: { oggetto: Pezzo; posizione: Vec; giro: number }[] }> = ({ pezzi }) => (
  <>
    {pezzi.map(({ oggetto, posizione, giro }) => {
      const Componente = PEZZO[oggetto];
      return (
        <group key={oggetto} position={posizione} rotation-y={giro}>
          <Componente />
        </group>
      );
    })}
  </>
);
