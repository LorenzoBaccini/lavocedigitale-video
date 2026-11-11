import { SANS } from "../../theme.ts";
import type { Stile, TrattamentoSottotitolo } from "./tipi.ts";

/** Il grigio chiaro attorno allo schermo e sotto le schede. */
export const GRIGIO = "#eceef2";
/** La scheda d'interfaccia delle scene grafiche. */
export const SCHEDA = "#ffffff";
const TESTO = "#15181d";
const TENUE = "#555d6b";
/** Il blu di sistema, scurito quanto basta per stare a 4,5:1 anche sul grigio. */
export const BLU = "#0a63d6";
const ROSSO = "#d42a20";

/** La pillola bianca del sottotitolo: opaca, il testo scuro le basta. */
export const PILLOLA = { colore: SCHEDA, alfa: 1 };

const SOTTOTITOLO: TrattamentoSottotitolo = { testo: TESTO, chiave: BLU, ombra: "none", carattere: SANS, pillola: { fondo: PILLOLA.colore, raggio: 20, imbottitura: "4px 30px 5px" } };

/** Lo schermo: niente 3D, la registrazione stilizzata dello schermo su grigio chiaro; schede d'interfaccia, Inter, blu di sistema. */
export const SCHERMO: Stile = {
  colori: {
    fondo: GRIGIO,
    testo: TESTO,
    tenue: TENUE,
    accento: BLU,
    accentoSuChiaro: BLU,
    superficie: GRIGIO,
    velo: GRIGIO,
    suChiaro: TESTO,
    segnoSuChiaro: ROSSO,
    inchiostro: { testo: TESTO, tenue: TENUE, penna: BLU, timbro: ROSSO, pennarello: TESTO },
  },
  caratteri: { titolo: SANS, testo: SANS },
  larghezza: 1,
  ombra: () => "none",
  bagliore: "none",
  sottotitolo: { sulSet: SOTTOTITOLO, sulleGrafiche: SOTTOTITOLO },
  allineamentoTitoli: "sinistra",
  grana: { sulSet: 0.02, sulleGrafiche: 0.015 },
  vignetta: { sulSet: "none", sulleGrafiche: "none" },
  transizione: "scorrimento",
  set: "schermo",
  grafiche: "scheda",
};
