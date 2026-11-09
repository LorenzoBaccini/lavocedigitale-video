import { AbsoluteFill } from "remotion";

import { ALTEZZA, FONDO_UTILE } from "../../impaginazione";
import { useStile } from "../stili";
import { SCHEDA } from "../stili/schermo";

/** I bordi della scheda nel fotogramma: sotto il logo comincia, sopra i sottotitoli finisce. */
const BORDI = { lato: 36, alto: 214, basso: ALTEZZA - FONDO_UTILE - 6 };

/** La scena grafica dello schermo: una scheda d'interfaccia bianca sul grigio chiaro; `spinta` la avvicina di poco come la camera sul foglio. */
export const Scheda: React.FC<{ spinta?: number; children?: React.ReactNode }> = ({ spinta = 0, children }) => {
  const { superficie } = useStile().colori;
  return (
    <AbsoluteFill style={{ background: superficie }}>
      <AbsoluteFill style={{ transform: `scale(${1 + spinta})`, transformOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", left: BORDI.lato, right: BORDI.lato, top: BORDI.alto, bottom: BORDI.basso, background: SCHEDA, borderRadius: 36, boxShadow: "0 1px 0 rgba(20,24,30,0.06), 0 18px 48px rgba(20,24,30,0.10)" }}>
          <div style={{ position: "absolute", left: "50%", top: 18, width: 120, height: 8, marginLeft: -60, borderRadius: 4, background: "#dfe2e8" }} />
        </div>
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
