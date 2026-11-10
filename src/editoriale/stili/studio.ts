import { GROTESK } from "../../theme.ts";
import { improntaMescolata } from "../impronta.ts";
import { conAlfa } from "./alfa.ts";
import { mescola } from "./colore.ts";
import type { Stile } from "./tipi.ts";

/** Una tinta del fondale e l'accento che ci spicca sopra. */
export interface TintaStudio {
  fondo: string;
  accento: string;
}

const BIANCO = "#ffffff";
const SCURO = "#14171c";

// Toni dello spec scuriti quanto basta per il testo bianco: sul set il testo passa sopra il fondale e sopra i dispositivi
// scuri, e solo il bianco con l'ombra regge su entrambi. Ogni testo del video e' sopra i 34 px (testo grande per WCAG,
// soglia 3:1); accenti chiari per lo stesso motivo.
export const TINTE = {
  cobalto: { fondo: "#2f4ba0", accento: "#ffc94d" },
  salvia: { fondo: "#5f8b73", accento: "#ffe9a0" },
  terracotta: { fondo: "#bf5a33", accento: "#ffe7a6" },
  senape: { fondo: "#b07a14", accento: "#d6efff" },
  lavanda: { fondo: "#7b70c4", accento: "#ffe9a0" },
} as const satisfies Record<string, TintaStudio>;

export type NomeTinta = keyof typeof TINTE;
export const NOMI_TINTE = Object.keys(TINTE) as NomeTinta[];

/** La tinta del fondale di un video: deterministica dallo slug, scorrelata dalle scelte della variante. */
export const tintaDi = (slug: string): NomeTinta => NOMI_TINTE[improntaMescolata(`tinta:${slug}`) % NOMI_TINTE.length];

/** La pillola scura del sottotitolo: colore e opacita'. */
export const PILLOLA = { colore: "#0e1014", alfa: 0.9 };
const CHIAVE = "#ffc94d";

/** Lo studio: fondale continuo a tinta unita, poster a colore pieno, Space Grotesk, titoli a sinistra, spinta laterale. */
export function studio(nome: NomeTinta): Stile {
  const t: TintaStudio = TINTE[nome];
  const sottotitolo = { testo: BIANCO, chiave: CHIAVE, ombra: "none", pillola: { fondo: conAlfa(PILLOLA.colore, PILLOLA.alfa), raggio: 30, imbottitura: "4px 30px 5px" } };
  return {
    colori: {
      fondo: t.fondo,
      testo: BIANCO,
      tenue: mescola(BIANCO, t.fondo, 0.12),
      accento: t.accento,
      accentoSuChiaro: t.accento,
      superficie: t.fondo,
      velo: mescola(t.fondo, "#000000", 0.25),
      suChiaro: SCURO,
      // gli accenti dello studio sono chiari: sullo schermo bianco del telefono sparirebbero
      segnoSuChiaro: "#d9401f",
      inchiostro: { testo: BIANCO, tenue: mescola(BIANCO, t.fondo, 0.12), penna: t.accento, timbro: t.accento, pennarello: mescola(t.fondo, "#000000", 0.55) },
    },
    caratteri: { titolo: GROTESK, testo: GROTESK },
    larghezza: 1,
    ombra: (sfocatura, opacita, y = 2) => `0 ${y}px ${sfocatura}px rgba(0,0,0,${opacita * 0.7})`,
    bagliore: "none",
    sottotitolo: { sulSet: sottotitolo, sulleGrafiche: sottotitolo },
    allineamentoTitoli: "sinistra",
    grana: { sulSet: 0.035, sulleGrafiche: 0.025 },
    vignetta: { sulSet: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(0,0,0,0.16) 100%)", sulleGrafiche: "none" },
    transizione: "spinta",
    set: "fondale",
    grafiche: "poster",
  };
}
