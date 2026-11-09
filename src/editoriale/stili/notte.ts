import { MONO, SANS } from "../../theme.ts";
import { conAlfa } from "./alfa.ts";
import type { Stile, TrattamentoSottotitolo } from "./tipi.ts";

const NERO = "#050608";
/** Il fondo delle scene grafiche, sotto la griglia. */
export const LAVAGNA = "#07090c";
const BIANCO = "#eef7fb";
export const CIANO = "#29e3f2";
export const MAGENTA = "#ff4fd8";

/** La pillola del sottotitolo: tiene il testo leggibile anche sopra uno schermo chiaro del set. */
export const PILLOLA = { colore: "#05070a", alfa: 0.86 };
/** La macchia di luce ciano in un angolo della griglia, alla sua opacita' piu' alta: il fondo piu' chiaro su cui cade un testo. */
export const LUCE_GRIGLIA = 0.14;

const SOTTOTITOLO: TrattamentoSottotitolo = { testo: BIANCO, chiave: CIANO, ombra: "none", bagliore: `0 0 14px ${conAlfa(CIANO, 0.8)}`, carattere: SANS, pillola: { fondo: conAlfa(PILLOLA.colore, PILLOLA.alfa), raggio: 12, imbottitura: "4px 30px 5px" } };

/** La notte: piano scuro satinato con luci di taglio ciano e magenta, grafiche nere con griglia, JetBrains Mono, lampo. */
export const NOTTE: Stile = {
  colori: {
    fondo: NERO,
    testo: BIANCO,
    tenue: "#a6b8c6",
    accento: CIANO,
    accentoSuChiaro: CIANO,
    superficie: LAVAGNA,
    velo: "#020305",
    suChiaro: "#0b1016",
    // il ciano sparirebbe sul bianco dello schermo del telefono
    segnoSuChiaro: "#d1168f",
    inchiostro: { testo: BIANCO, tenue: "#8ea2b2", penna: CIANO, timbro: MAGENTA, pennarello: "#2b3a46" },
  },
  caratteri: { titolo: MONO, testo: MONO },
  larghezza: 1.2,
  ombra: (sfocatura, opacita, y = 2) => `0 ${y}px ${sfocatura}px rgba(0,0,0,${opacita})`,
  bagliore: `0 0 16px ${conAlfa(CIANO, 0.38)}`,
  sottotitolo: { sulSet: SOTTOTITOLO, sulleGrafiche: SOTTOTITOLO },
  allineamentoTitoli: "centro",
  grana: { sulSet: 0.06, sulleGrafiche: 0.04 },
  vignetta: {
    sulSet: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)",
    sulleGrafiche: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)",
  },
  transizione: "lampo",
  set: "notturno",
  grafiche: "griglia",
};
