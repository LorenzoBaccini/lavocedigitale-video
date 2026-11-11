import { carta } from "../set/oggetti/disegni";
import { Disegno } from "./Disegno";

// Gli oggetti del set disegnati piatti, come schede illustrate: stessi colori e stessi dettagli, nessun volume, nessun marchio.

const OMBRA = "drop-shadow(0 14px 22px rgba(20,24,30,0.22))";

/** La chiavetta di traverso: corpo grafite, fascia e connettore in acciaio, asola, spia d'attivita'. */
export const ChiavettaPiatta: React.FC<{ spia: boolean }> = ({ spia }) => (
  <svg width={1000} height={760} viewBox="0 0 1000 760" style={{ position: "absolute", inset: 0, filter: OMBRA }}>
    <rect x={720} y={322} width={150} height={116} rx={6} fill="#c2c6cc" />
    <rect x={770} y={350} width={30} height={22} rx={3} fill="#8a8f96" />
    <rect x={770} y={388} width={30} height={22} rx={3} fill="#8a8f96" />
    <rect x={170} y={290} width={560} height={180} rx={44} fill="#2b2e33" />
    <rect x={640} y={290} width={90} height={180} fill="#9ea3aa" />
    <circle cx={232} cy={380} r={24} fill="none" stroke="#15171a" strokeWidth={14} />
    <circle cx={310} cy={330} r={11} fill={spia ? "#ffd27a" : "#3a3328"} />
  </svg>
);

/** Il router di fronte: guscio grafite, due antenne, le asole d'aerazione, la fila di spie (la quarta lampeggia). */
export const RouterPiatto: React.FC<{ lampeggio: boolean }> = ({ lampeggio }) => (
  <svg width={1000} height={760} viewBox="0 0 1000 760" style={{ position: "absolute", inset: 0, filter: OMBRA }}>
    <rect x={248} y={110} width={26} height={250} rx={13} fill="#26282b" transform="rotate(-6 261 360)" />
    <rect x={726} y={110} width={26} height={250} rx={13} fill="#26282b" transform="rotate(6 739 360)" />
    <rect x={150} y={330} width={700} height={250} rx={38} fill="#2b2d31" />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={380 + i * 34} y={372} width={18} height={60} rx={9} fill="#16171a" />
    ))}
    {Array.from({ length: 5 }, (_, i) => (
      <circle key={i} cx={290 + i * 60} cy={510} r={12} fill={i === 3 && !lampeggio ? "#1a2a1c" : i === 0 ? "#f2f2ee" : "#7fe08a"} />
    ))}
  </svg>
);

/** La carta di pagamento: la faccia del set, con gli angoli tondi. */
export const CartaPiatta: React.FC = () => (
  <div style={{ position: "absolute", left: 12, top: 72, width: 976, height: 616, borderRadius: 40, overflow: "hidden", boxShadow: "0 14px 30px rgba(20,24,30,0.25)" }}>
    <Disegno w={976} h={616} disegna={carta} chiave="carta" />
  </div>
);

/** Il lettore di smart card da tavolo: guscio nero, la fessura, la spia accesa, il cavo. */
export const LettorePiatto: React.FC = () => (
  <svg width={700} height={500} viewBox="0 0 700 500" style={{ position: "absolute", inset: 0 }}>
    <rect x={0} y={372} width={80} height={22} rx={11} fill="#18191b" />
    <rect x={50} y={90} width={620} height={330} rx={60} fill="#1f2023" />
    <rect x={130} y={318} width={460} height={16} rx={8} fill="#050506" />
    <circle cx={580} cy={170} r={14} fill="#7fe08a" />
  </svg>
);
