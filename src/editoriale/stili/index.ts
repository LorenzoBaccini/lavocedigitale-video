import { SCRIVANIA } from "./scrivania";
import type { NomeStile, Stile } from "./tipi";

export type { Allineamento, NomeStile, Stile, Transizione, TrattamentoSottotitolo } from "./tipi";
export { NOMI_STILI } from "./tipi";
export { StileVideo, useStile } from "./StileVideo";

// studio, notte e schermo hanno l'aspetto di scrivania finche' non arrivano i loro token: la pipeline non li sceglie (ATTIVI in variante.ts).
export const STILI: Record<NomeStile, Stile> = { scrivania: SCRIVANIA, studio: SCRIVANIA, notte: SCRIVANIA, schermo: SCRIVANIA };
