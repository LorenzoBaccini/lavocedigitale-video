import type { NomeLuce } from "../variante.ts";

export interface Luce {
  /** emisfero: cielo, terra, intensita' */
  cielo: string;
  terra: string;
  emisfero: number;
  /** la luce chiave della finestra e il suo riflesso nell'ambiente */
  chiave: string;
  forza: number;
  finestra: string;
  finestraForza: number;
  riempimento: string;
  muro: string;
  fondo: string;
  /** tinta base del rovere, rgb */
  legno: [number, number, number];
}

// Stessa geometria e stesse luci, cambiano solo colori e intensita': nessun costo in piu' per frame.
// Sempre lo stile del video approvato, niente colori sgargianti: l'ambra resta un accento della grafica.
export const LUCI_SCRIVANIA: Record<NomeLuce, Luce> = {
  calda: { cielo: "#c3cad3", terra: "#2a2018", emisfero: 0.5, chiave: "#fff2e2", forza: 1, finestra: "#fff4e6", finestraForza: 1.6, riempimento: "#c9d3df", muro: "#4a443d", fondo: "#14120f", legno: [118, 88, 64] },
  chiara: { cielo: "#c8ced6", terra: "#30271e", emisfero: 0.52, chiave: "#fff4e8", forza: 1, finestra: "#fff6ec", finestraForza: 1.6, riempimento: "#cdd6e0", muro: "#57524b", fondo: "#1a1814", legno: [152, 120, 90] },
  mattino: { cielo: "#cdd8e6", terra: "#22231f", emisfero: 0.55, chiave: "#eef3fb", forza: 1.05, finestra: "#eef4fc", finestraForza: 1.7, riempimento: "#d0d9e4", muro: "#484a4a", fondo: "#121314", legno: [124, 98, 78] },
  sera: { cielo: "#a9adb6", terra: "#2a1e14", emisfero: 0.38, chiave: "#ffe2c4", forza: 0.82, finestra: "#ffe6cc", finestraForza: 1.3, riempimento: "#b9c2ce", muro: "#3e362e", fondo: "#100e0c", legno: [108, 82, 62] },
};
