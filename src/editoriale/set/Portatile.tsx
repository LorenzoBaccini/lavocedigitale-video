import { RoundedBox } from "@react-three/drei";
import { RepeatWrapping } from "three";

import { useCanvasTexture } from "../../three/useCanvasTexture";
import { alluminioRuvido, notifica, tastiera } from "./disegni";
import { BASE, CENTRO_SCHERMO_LOCALE, CERNIERA, INCLINAZIONE, NOTIFICA_PX, NOTIFICA_SCALA, PORTA_USB, SCHERMO, SCHERMO_PX } from "./geometria";
import type { Orologio } from "./disegni";
import type { Notifica, Schermo } from "./schermata";
import { disegnoSchermo } from "./schermata";

export type { Notifica, Schermo } from "./schermata";

const unita = SCHERMO.larghezza / SCHERMO_PX.w;

const Toast: React.FC<Notifica> = ({ messaggio, mittente, azione, visibile, scarto }) => {
  const toast = useCanvasTexture(NOTIFICA_PX.w * NOTIFICA_SCALA, NOTIFICA_PX.h * NOTIFICA_SCALA, notifica(messaggio, mittente, azione), [messaggio, mittente, azione]);
  const x = (NOTIFICA_PX.x + NOTIFICA_PX.w / 2) * unita - SCHERMO.larghezza / 2 + scarto * unita;
  const y = CENTRO_SCHERMO_LOCALE[1] + SCHERMO.altezza / 2 - (NOTIFICA_PX.y + NOTIFICA_PX.h / 2) * unita;
  return (
    <mesh position={[x, y, CENTRO_SCHERMO_LOCALE[2] - 0.018]} visible={visibile > 0}>
      <planeGeometry args={[NOTIFICA_PX.w * unita, NOTIFICA_PX.h * unita]} />
      <meshBasicMaterial map={toast} color="#e6e6e6" transparent opacity={visibile} toneMapped={false} />
    </mesh>
  );
};

// Portatile da 14" grigio scuro, con usura: lo schermo mostra un'interfaccia vera, la notifica sta su un piano a parte.
export const Portatile: React.FC<{ schermo?: Schermo; notifica?: Notifica; orologio: Orologio }> = ({ schermo = { tipo: "desktop" }, notifica: toast, orologio }) => {
  const chiave = JSON.stringify([schermo, orologio]);
  const immagine = useCanvasTexture(SCHERMO_PX.w, SCHERMO_PX.h, disegnoSchermo(schermo, orologio), [chiave]);
  const tasti = useCanvasTexture(1024, 360, tastiera);
  const ruvido = useCanvasTexture(512, 512, alluminioRuvido);
  ruvido.wrapS = ruvido.wrapT = RepeatWrapping;
  const alluminio = <meshPhysicalMaterial color="#70757c" metalness={0.6} roughness={1} roughnessMap={ruvido} clearcoat={0} />;
  return (
    <group>
      <RoundedBox args={[BASE.larghezza, BASE.spessore, BASE.profondita]} radius={0.06} smoothness={4} position={[0, BASE.spessore / 2, 0]} castShadow receiveShadow>
        {alluminio}
      </RoundedBox>
      {/* piedini: la base non galleggia, appoggia */}
      <mesh position={[0, 0.004, 0]} receiveShadow>
        <boxGeometry args={[BASE.larghezza - 0.3, 0.01, BASE.profondita - 0.3]} />
        <meshStandardMaterial color="#0d0d0e" roughness={0.9} />
      </mesh>
      {/* porta USB sul fianco destro */}
      <mesh position={[PORTA_USB[0] + 0.001, PORTA_USB[1], PORTA_USB[2]]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[0.2, 0.075]} />
        <meshStandardMaterial color="#050506" roughness={0.6} />
      </mesh>
      <mesh position={[0, BASE.spessore + 0.002, -0.62]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[3.9, 1.37]} />
        <meshStandardMaterial map={tasti} roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0, BASE.spessore + 0.002, 0.78]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1.5, 0.92]} />
        <meshPhysicalMaterial color="#666b72" metalness={0.55} roughness={0.42} />
      </mesh>
      <group position={CERNIERA} rotation-x={INCLINAZIONE}>
        <RoundedBox args={[BASE.larghezza, 2.92, 0.09]} radius={0.04} smoothness={4} position={[0, 1.46, -0.01]} castShadow receiveShadow>
          {alluminio}
        </RoundedBox>
        <mesh position={[0, 1.46, 0.0365]}>
          <planeGeometry args={[BASE.larghezza - 0.08, 2.86]} />
          <meshStandardMaterial color="#070708" roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[0, CENTRO_SCHERMO_LOCALE[1], CENTRO_SCHERMO_LOCALE[2] - 0.02]}>
          <planeGeometry args={[SCHERMO.larghezza, SCHERMO.altezza]} />
          <meshBasicMaterial map={immagine} color="#dcdcdc" toneMapped={false} />
        </mesh>
        {toast && <Toast {...toast} />}
      </group>
    </group>
  );
};
