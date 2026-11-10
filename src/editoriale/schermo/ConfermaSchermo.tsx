import { corpo } from "../../anim";
import { ALTEZZA, MARGINE } from "../../impaginazione";
import { fase } from "../regia";
import { Pennarello } from "../Segno";
import { useStile } from "../stili";
import { SCHEDA } from "../stili/schermo";
import { lunghezza, percorso, spunta } from "../tratto";

const SPUNTA = 64;
const PUNTI_SPUNTA = spunta(6, 12, SPUNTA - 16, 5);

/**
 * La conferma come avviso chiaro dentro lo schermo, col bordo basso a quota `fondo`: la spunta nell'accento, poi il
 * testo scuro. Sta sopra lo schermo ed e' segnata su chiaro: lo schermo non deve accorciarsi per farle posto.
 */
export const ConfermaSchermo: React.FC<{ testo: string; da: number; f: number; fondo: number }> = ({ testo, da, f, fondo }) => {
  const stile = useStile();
  const entra = fase(f, da, da + 6);
  if (entra <= 0) return null;
  const ok = fase(f, da + 6, da + 14);
  return (
    <div style={{ position: "absolute", left: MARGINE, right: MARGINE, bottom: ALTEZZA - fondo, display: "flex", alignItems: "center", gap: 18, padding: "18px 28px", background: SCHEDA, borderRadius: 26, boxShadow: "0 14px 36px rgba(20,24,30,0.22)", opacity: entra, transform: `translateY(${(1 - entra) * 24}px)` }}>
      <svg width={SPUNTA} height={SPUNTA} style={{ flex: "none", overflow: "visible" }}>
        <Pennarello d={percorso(PUNTI_SPUNTA)} colore={stile.colori.accento} spessore={8} progresso={(f - da) / 8} lunghezza={lunghezza(PUNTI_SPUNTA)} />
      </svg>
      <div data-impaginazione="conferma" data-su-chiaro="1" style={{ minWidth: 0, fontFamily: stile.caratteri.testo, fontWeight: 600, fontSize: corpo(testo, 52, 22, stile.larghezza), lineHeight: 1.15, color: stile.colori.suChiaro, opacity: ok }}>
        {testo}
      </div>
    </div>
  );
};
