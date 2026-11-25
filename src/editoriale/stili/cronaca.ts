import { ARCHIVO, ARCHIVO_BLACK } from "../../theme.ts";
import { conAlfa } from "./alfa.ts";
import type { Stile, TrattamentoSottotitolo } from "./tipi.ts";

/** Fondo: inchiostro viola-notte. */
const NOTTE_VIOLA = "#14112a";
/** Il piano delle scene grafiche, sotto la griglia. */
const PIANO = "#1b1638";
const CARTA = "#f6f3ff";
/** Il giallo del nastro segnaletico: la firma della rubrica e la parola da ricordare. */
export const NASTRO = "#ffd23f";
/** Il rosso del pericolo. */
export const SIRENA = "#ff4b2b";

export const PILLOLA_CRONACA = { colore: "#0c0a1c", alfa: 0.88 };

const SOTTOTITOLO: TrattamentoSottotitolo = { testo: CARTA, chiave: NASTRO, ombra: "none", carattere: ARCHIVO, pillola: { fondo: conAlfa(PILLOLA_CRONACA.colore, PILLOLA_CRONACA.alfa), raggio: 12, imbottitura: "4px 30px 5px" } };

/** Cronaca Digitale: notte viola, nastro segnaletico giallo, sirena rossa, Archivo Black in maiuscolo, set notturno. */
export const CRONACA: Stile = {
  colori: {
    fondo: NOTTE_VIOLA,
    testo: CARTA,
    tenue: "#b3acd8",
    accento: NASTRO,
    accentoSuChiaro: NASTRO,
    superficie: PIANO,
    velo: "#0c0a1c",
    suChiaro: NOTTE_VIOLA,
    segnoSuChiaro: "#d6331a",
    inchiostro: { testo: CARTA, tenue: "#b3acd8", penna: NASTRO, timbro: SIRENA, pennarello: "#3a3170" },
  },
  caratteri: { titolo: ARCHIVO_BLACK, testo: ARCHIVO },
  // Archivo Black in maiuscolo e' piu' largo di Lora e Inter: i corpi stimati scendono di tanto
  larghezza: 1.25,
  ombra: (sfocatura, opacita, y = 2) => `0 ${y}px ${sfocatura}px rgba(0,0,0,${opacita})`,
  bagliore: "none",
  sottotitolo: { sulSet: SOTTOTITOLO, sulleGrafiche: SOTTOTITOLO },
  allineamentoTitoli: "centro",
  grana: { sulSet: 0.05, sulleGrafiche: 0.04 },
  vignetta: {
    sulSet: "radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(8,6,20,0.6) 100%)",
    sulleGrafiche: "radial-gradient(120% 70% at 50% 38%, rgba(70,55,150,0.35) 0%, transparent 60%)",
  },
  transizione: "spinta",
  set: "notturno",
  grafiche: "griglia",
  luciSet: { sinistra: SIRENA, destra: "#7b5cff" },
  maiuscole: true,
  nastro: "CRONACA DIGITALE",
};
