import { RoundedBox } from "@react-three/drei";

import { useCanvasTexture } from "../../../three/useCanvasTexture";
import { uscita } from "../../regia";
import { EMAIL_PX, schermoEmail } from "./disegni";
import { SAGOME } from "./inquadra";

const W = SAGOME.email.larghezza * 0.94;
const H = (W * EMAIL_PX.h) / EMAIL_PX.w;

/** La mail di phishing su una lastra sospesa; quando `r` (0..1) sale si marchia di `allarme` e si inclina all'indietro. */
export const EmailReperto: React.FC<{ mittente?: string; messaggio?: string; r: number; allarme: string }> = ({ mittente, messaggio, r, allarme }) => {
  const rosso = r > 0.15 ? allarme : undefined;
  const faccia = useCanvasTexture(EMAIL_PX.w, EMAIL_PX.h, schermoEmail(mittente ?? "Mittente sconosciuto", messaggio ?? "Azione richiesta sul tuo conto", rosso), [mittente, messaggio, rosso]);
  return (
    <group rotation-x={-0.18 * uscita(r)}>
      <RoundedBox args={[W + 0.08, H + 0.08, 0.06]} radius={0.03} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1b1638" roughness={0.4} metalness={0.3} />
      </RoundedBox>
      <mesh position-z={0.032}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={faccia} toneMapped={false} />
      </mesh>
    </group>
  );
};
