import { RoundedBox } from "@react-three/drei";

import { useCanvasTexture } from "../../../three/useCanvasTexture";
import { crepa, SCHERMO_REPERTO, schermoChiamata, schermoSms } from "./disegni";
import { SAGOME } from "./inquadra";

const { larghezza: W, altezza: H, profondita: P } = SAGOME.telefono;
const LATO = { w: W * 0.93, h: H * 0.95, p: P * 0.8 };
// passi della crepa: la texture si ridisegna solo quando cambia il passo
const PASSI_CREPA = 10;

// la chiamata squilla: gli anelli si ridisegnano ogni 3 frame, un giro ogni 30
const passoSquillo = (f: number) => (Math.floor(f / 3) % 10) / 10;

/**
 * Il telefono in piedi, di fronte. Con l'SMS: `r` (0..1) crepa il vetro e tinge il fumetto di `allarme`.
 * Con la chiamata in arrivo: squilla e su `r` lo schermo diventa rosso.
 */
export const TelefonoReperto: React.FC<{ chiamata?: boolean; messaggio?: string; mittente?: string; ora: string; f: number; r: number; finitura: string; allarme: string }> = ({ chiamata, messaggio, mittente, ora, f, r, finitura, allarme }) => {
  const rosso = r > 0.15 ? allarme : undefined;
  const squillo = chiamata && !rosso ? passoSquillo(f) : 0;
  const disegno = chiamata ? schermoChiamata(mittente ?? "Numero sconosciuto", ora, squillo, rosso) : schermoSms(messaggio, ora, rosso, mittente);
  const schermo = useCanvasTexture(SCHERMO_REPERTO.w, SCHERMO_REPERTO.h, disegno, [chiamata, messaggio, mittente, ora, rosso, squillo]);
  const passo = chiamata ? 0 : Math.round(r * PASSI_CREPA) / PASSI_CREPA;
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
