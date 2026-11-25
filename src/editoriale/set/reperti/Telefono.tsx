import { RoundedBox } from "@react-three/drei";

import { useCanvasTexture } from "../../../three/useCanvasTexture";
import { crepa, SCHERMO_REPERTO, schermoSms } from "./disegni";
import { SAGOME } from "./inquadra";

const { larghezza: W, altezza: H, profondita: P } = SAGOME.telefono;
const LATO = { w: W * 0.93, h: H * 0.95, p: P * 0.8 };
// passi della crepa: la texture si ridisegna solo quando cambia il passo
const PASSI_CREPA = 10;

/** Il telefono in piedi, di fronte: l'SMS sullo schermo; `r` (0..1) crepa il vetro e tinge il fumetto di `allarme`. */
export const TelefonoReperto: React.FC<{ messaggio?: string; ora: string; r: number; finitura: string; allarme: string }> = ({ messaggio, ora, r, finitura, allarme }) => {
  const rosso = r > 0.15 ? allarme : undefined;
  const schermo = useCanvasTexture(SCHERMO_REPERTO.w, SCHERMO_REPERTO.h, schermoSms(messaggio, ora, rosso), [messaggio, ora, rosso]);
  const passo = Math.round(r * PASSI_CREPA) / PASSI_CREPA;
  const vetro = useCanvasTexture(SCHERMO_REPERTO.w, SCHERMO_REPERTO.h, crepa(17, passo), [passo]);
  const schermoW = LATO.w - 0.1;
  const schermoH = LATO.h - 0.14;
  return (
    <group>
      <RoundedBox args={[LATO.w, LATO.h, LATO.p]} radius={0.06} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color={finitura} metalness={0.75} roughness={0.35} clearcoat={0.4} />
      </RoundedBox>
      <mesh position-z={LATO.p / 2 + 0.002}>
        <planeGeometry args={[LATO.w - 0.04, LATO.h - 0.04]} />
        <meshPhysicalMaterial color="#060708" roughness={0.1} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position-z={LATO.p / 2 + 0.004}>
        <planeGeometry args={[schermoW, schermoH]} />
        <meshBasicMaterial map={schermo} toneMapped={false} />
      </mesh>
      <mesh position-z={LATO.p / 2 + 0.006}>
        <planeGeometry args={[schermoW, schermoH]} />
        <meshBasicMaterial map={vetro} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};
