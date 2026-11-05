import type { Scena } from "../../storyboard/tipi.ts";

// Le scene grafiche sono fogli sulla stessa scrivania, ripresi dall'alto: inchiostro su carta, la stessa luce dalla finestra.

/** Le scene disegnate su carta: sopra di loro sottotitolo e logo passano all'inchiostro. */
export const SU_CARTA: ReadonlySet<Scena["tipo"]> = new Set(["data", "checklist", "numero", "confronto", "citazione", "teaser", "chiusura"]);

export const INCHIOSTRO = {
  testo: "#1E1C19",
  tenue: "#5E5A52",
  /** ambra stampata: piu' scura dell'ambra a schermo, per il contrasto sulla carta */
  ambra: "#B45A04",
  /** penna a sfera per le spunte */
  penna: "#1F3A8A",
  /** inchiostro del timbro */
  timbro: "#A3271F",
  /** pennarello nero degli omissis */
  pennarello: "#191919",
};

export type TipoCarta = "quadretti" | "giornale" | "agenda" | "liscia";
