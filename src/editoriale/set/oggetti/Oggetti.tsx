import { RoundedBox } from "@react-three/drei";
import { RepeatWrapping } from "three";

import type { Schermata } from "../../../storyboard/tipi";
import { useCanvasTexture } from "../../../three/useCanvasTexture";
import type { Dettagli } from "../../dettagli";
import { FINITURE } from "../../dettagli";
import { alluminioRuvido } from "../disegni";
import { NOTIFICA_TELEFONO_PX, SCHERMO_TELEFONO, TELEFONO_PX } from "../telefono";
import type { SchermoTelefono } from "./disegni";
import { carta, disegnoTelefono, griglia, notificaTelefono } from "./disegni";
import type { NomeOggetto } from "./posti";
import { CARTA, CHIAVETTA, POSTI, ROUTER, SMARTPHONE } from "./posti";

// Gli oggetti della scrivania: materiali satinati, spigoli arrotondati, segni d'uso; nessun marchio.

const Posa: React.FC<{ nome: NomeOggetto; children: React.ReactNode }> = ({ nome, children }) => (
  <group position={POSTI[nome].posizione} rotation-y={POSTI[nome].giro}>
    {children}
  </group>
);

/** Chiavetta in plastica grafite satinata, connettore in acciaio; `fuori` la tiene sfilata di poco, `spia` accende il led. */
export const Chiavetta: React.FC<{ fuori?: number; spia?: number }> = ({ fuori = 0, spia = 0 }) => {
  const { lunghezza: l, larghezza: w, spessore: h, connettore: c } = CHIAVETTA;
  return (
    <Posa nome="chiavetta">
      <group position-x={-fuori}>
        <RoundedBox args={[l, h, w]} radius={0.04} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#26282c" roughness={0.55} metalness={0} clearcoat={0.25} clearcoatRoughness={0.6} />
        </RoundedBox>
        {/* fascia in metallo spazzolato verso il connettore */}
        <mesh position={[l / 2 - 0.09, 0, 0]} castShadow>
          <boxGeometry args={[0.16, h * 1.01, w * 1.01]} />
          <meshPhysicalMaterial color="#9ea3aa" roughness={0.38} metalness={0.85} />
        </mesh>
        <mesh position={[l / 2 + c / 2, 0, 0]} castShadow>
          <boxGeometry args={[c, 0.058, 0.2]} />
          <meshPhysicalMaterial color="#c2c6cc" roughness={0.3} metalness={0.95} />
        </mesh>
        {/* asola del laccetto e spia d'attivita' */}
        <mesh position={[-l / 2 + 0.07, h / 2 + 0.001, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.025, 0.045, 24]} />
          <meshStandardMaterial color="#111214" roughness={0.8} />
        </mesh>
        <mesh position={[-l / 2 + 0.2, h / 2 + 0.002, 0.07]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.014, 16]} />
          <meshBasicMaterial color={spia > 0.5 ? "#ffd27a" : "#3a3328"} toneMapped={false} />
        </mesh>
      </group>
    </Posa>
  );
};

/** La notifica sulla schermata di blocco: messaggio, intestazione, opacita' (0..1), quanto manca ad arrivare (pixel dello schermo). */
export type NotificaTelefono = { messaggio: string; mittente?: string; visibile: number; scarto: number };

const ToastTelefono: React.FC<NotificaTelefono> = ({ messaggio, mittente, visibile, scarto }) => {
  const { x, y, w, h } = NOTIFICA_TELEFONO_PX;
  const mappa = useCanvasTexture(w * 2, h * 2, notificaTelefono(messaggio, mittente), [messaggio, mittente]);
  const kx = SCHERMO_TELEFONO.larghezza / TELEFONO_PX.w;
  const kz = SCHERMO_TELEFONO.lunghezza / TELEFONO_PX.h;
  return (
    <mesh position={[(x + w / 2 - TELEFONO_PX.w / 2) * kx, SMARTPHONE.spessore + 0.003, (y + h / 2 - scarto - TELEFONO_PX.h / 2) * kz]} rotation-x={-Math.PI / 2} visible={visibile > 0}>
      <planeGeometry args={[w * kx, h * kz]} />
      <meshBasicMaterial map={mappa} color="#e2e2e2" transparent opacity={visibile} toneMapped={false} />
    </mesh>
  );
};

/** Smartphone appoggiato a faccia in su: vetro scuro, cornice in alluminio della finitura del video, lo schermo acceso; la notifica su un piano a parte. */
export const Smartphone: React.FC<{ schermo: SchermoTelefono; dettagli: Dettagli; notifica?: NotificaTelefono }> = ({ schermo: s, dettagli, notifica }) => {
  const { larghezza: w, lunghezza: l, spessore: h } = SMARTPHONE;
  const schermo = useCanvasTexture(TELEFONO_PX.w, TELEFONO_PX.h, disegnoTelefono(s, dettagli), [JSON.stringify([s, dettagli.ora, dettagli.sfondo])]);
  const ruvido = useCanvasTexture(512, 512, alluminioRuvido);
  return (
    <Posa nome="smartphone">
      <RoundedBox args={[w, h, l]} radius={0.05} smoothness={4} position-y={h / 2} castShadow receiveShadow>
        <meshPhysicalMaterial color={FINITURE[dettagli.finitura]} metalness={0.7} roughness={1} roughnessMap={ruvido} />
      </RoundedBox>
      <mesh position={[0, h + 0.001, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w - 0.04, l - 0.04]} />
        <meshPhysicalMaterial color="#060708" roughness={0.12} metalness={0} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
      <mesh position={[0, h + 0.002, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w - 0.1, l - 0.12]} />
        <meshBasicMaterial map={schermo} color="#d8d8d8" toneMapped={false} />
      </mesh>
      {notifica && <ToastTelefono {...notifica} />}
    </Posa>
  );
};

/** Router da tavolo: guscio grafite opaco con la griglia d'aerazione, due antenne, la fila di spie sul fronte. */
export const Router: React.FC<{ lampeggio: number }> = ({ lampeggio }) => {
  const { larghezza: w, profondita: p, altezza: h } = ROUTER;
  const sopra = useCanvasTexture(1024, 680, griglia);
  sopra.wrapS = sopra.wrapT = RepeatWrapping;
  return (
    <Posa nome="router">
      <RoundedBox args={[w, h, p]} radius={0.08} smoothness={4} position-y={h / 2 + 0.03} castShadow receiveShadow>
        <meshPhysicalMaterial color="#2b2d31" roughness={0.78} metalness={0.05} />
      </RoundedBox>
      <mesh position={[0, h + 0.031, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[w - 0.2, p - 0.2]} />
        <meshStandardMaterial map={sopra} roughness={0.8} transparent />
      </mesh>
      {/* piedini */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.25), 0.015, sz * (p / 2 - 0.25)]}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      )))}
      {[-0.95, 0.95].map((x, i) => (
        <group key={x} position={[x, h * 0.6, -p / 2 - 0.05]} rotation={[-0.18, 0, i ? -0.1 : 0.1]}>
          <mesh position-y={0.85} castShadow>
            <cylinderGeometry args={[0.06, 0.075, 1.7, 20]} />
            <meshPhysicalMaterial color="#26282b" roughness={0.7} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.16, 20]} />
            <meshPhysicalMaterial color="#1c1d20" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 5 }, (_, i) => {
        const acceso = i === 3 ? lampeggio > 0.5 : true;
        return (
          <mesh key={i} position={[-1.15 + i * 0.2, h * 0.55, p / 2 + 0.031]}>
            <circleGeometry args={[0.028, 16]} />
            <meshBasicMaterial color={acceso ? (i === 0 ? "#f2f2ee" : "#7fe08a") : "#1a2a1c"} toneMapped={false} />
          </mesh>
        );
      })}
    </Posa>
  );
};

/** Carta di pagamento generica: blu notte satinato, chip, cifre in rilievo; nessun circuito, nessuna banca. */
export const CartaPagamento: React.FC = () => {
  const { larghezza: w, lunghezza: l, spessore: h } = CARTA;
  const faccia = useCanvasTexture(976, 616, carta);
  return (
    <Posa nome="carta">
      <RoundedBox args={[w, h, l]} radius={0.004} smoothness={2} position-y={h / 2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1f2a3a" roughness={0.5} metalness={0.2} clearcoat={0.4} clearcoatRoughness={0.5} />
      </RoundedBox>
      <mesh position={[0, h + 0.0008, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[w - 0.01, l - 0.01]} />
        <meshPhysicalMaterial map={faccia} roughness={0.45} metalness={0.25} clearcoat={0.4} clearcoatRoughness={0.4} />
      </mesh>
    </Posa>
  );
};

/** L'oggetto della scena sul piano (il portatile c'e' sempre). */
export const OggettoSulPiano: React.FC<{ nome: NomeOggetto | "nessuno"; f: number; titolo: string; dettagli: Dettagli; riga?: string; fuori?: number; menu?: string[]; schermata?: Schermata }> = ({ nome, f, titolo, dettagli, riga, fuori, menu, schermata = "sistema" }) => {
  if (nome === "chiavetta") return <Chiavetta fuori={fuori} spia={Math.floor(f / 7) % 2} />;
  if (nome === "smartphone") return <Smartphone schermo={riga ? { tipo: "elenco", riga, titolo, menu, app: schermata !== "sistema" } : { tipo: "blocco", titolo }} dettagli={dettagli} />;
  if (nome === "router") return <Router lampeggio={Math.floor(f / 9) % 2} />;
  if (nome === "carta") return <CartaPagamento />;
  return null;
};
