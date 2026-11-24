import { contrasto } from "./stili/colore.ts";
import type { NomeGancioTesto } from "./variante.ts";

/** L'etichetta di rubrica che il gancio porta in alto: dice subito che tipo di video e', come una serie. */
export const ETICHETTE_GANCIO: Record<NomeGancioTesto, string> = {
  errore: "ERRORE DA EVITARE",
  segreto: "IL TRUCCO",
  posta: "ATTENZIONE",
  smentita: "FALSO MITO",
  situazione: "TI È SUCCESSO?",
};

const NERO = "#0b0b0b";
const BIANCO = "#ffffff";

/** Il colore del testo sopra un fondo pieno: nero o bianco, quello che si legge meglio. */
export const inchiostroSu = (fondo: string): string => (contrasto(NERO, fondo) >= contrasto(BIANCO, fondo) ? NERO : BIANCO);
