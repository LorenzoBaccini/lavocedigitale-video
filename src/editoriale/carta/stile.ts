import type { Scena } from "../../storyboard/tipi.ts";

// Le scene grafiche sono fogli sulla stessa scrivania, ripresi dall'alto: inchiostro su carta, la stessa luce dalla finestra.

/** Le scene disegnate su carta: sopra di loro sottotitolo e logo passano all'inchiostro. */
export const SU_CARTA: ReadonlySet<Scena["tipo"]> = new Set(["data", "checklist", "numero", "confronto", "citazione", "simbolo", "passi", "flusso", "teaser", "chiusura"]);

/** la carta del ritaglio di giornale della citazione */
export const CARTA_RITAGLIO = "#EDE6D4";

export type TipoCarta = "quadretti" | "giornale" | "agenda" | "liscia";
