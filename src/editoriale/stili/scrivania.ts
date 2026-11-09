import { SANS, SERIF } from "../../theme";
import type { Stile } from "./tipi";

const CARTA_CHIARA = "#FAFAF7";
const AMBRA = "#D97706";
const INCHIOSTRO = "#1E1C19";
const AMBRA_STAMPATA = "#B45A04";

/** Lo stile del video approvato: rovere, fogli di carta, Lora e Inter, ambra. */
export const SCRIVANIA: Stile = {
  colori: {
    fondo: "#08090b",
    testo: CARTA_CHIARA,
    tenue: "#E7E1D5",
    accento: AMBRA,
    accentoSuChiaro: AMBRA_STAMPATA,
    superficie: "#4a3324",
    velo: "#0a0908",
    suChiaro: INCHIOSTRO,
    segnoSuChiaro: AMBRA,
    inchiostro: { testo: INCHIOSTRO, tenue: "#5E5A52", penna: "#1F3A8A", timbro: "#A3271F", pennarello: "#191919" },
  },
  caratteri: { titolo: SERIF, testo: SANS },
  larghezza: 1,
  ombra: (sfocatura, opacita, y = 2) => `0 ${y}px ${sfocatura}px rgba(0,0,0,${opacita})`,
  bagliore: "none",
  sottotitolo: {
    sulSet: { testo: CARTA_CHIARA, chiave: AMBRA, ombra: "0 4px 24px rgba(0,0,0,0.85)" },
    sulleGrafiche: { testo: INCHIOSTRO, chiave: AMBRA_STAMPATA, ombra: "none" },
  },
  allineamentoTitoli: "centro",
  grana: { sulSet: 0.08, sulleGrafiche: 0.05 },
  vignetta: {
    sulSet: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
    sulleGrafiche: "radial-gradient(ellipse at 50% 45%, transparent 62%, rgba(40,25,10,0.22) 100%)",
  },
  transizione: "taglio",
  set: "scrivania",
  grafiche: "carta",
};
