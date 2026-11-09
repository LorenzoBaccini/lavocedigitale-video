import { NOTTE } from "./notte";
import { SCHERMO } from "./schermo";
import { SCRIVANIA } from "./scrivania";
import { studio, tintaDi } from "./studio";
import type { NomeStile, Stile } from "./tipi";

export type { Allineamento, Grafiche, NomeSet, NomeStile, Stile, Transizione, TrattamentoSottotitolo } from "./tipi";
export { NOMI_STILI } from "./tipi";
export { StileVideo, useStile } from "./StileVideo";
export { allineaFlesso, allineaTesto } from "./allinea";

// studio qui e' la tinta cobalto; il video vero prende la sua dallo slug (stileDelVideo).
export const STILI: Record<NomeStile, Stile> = { scrivania: SCRIVANIA, studio: studio("cobalto"), notte: NOTTE, schermo: SCHERMO };

/** Lo stile di un video: quello della variante, con le scelte che dipendono dallo slug (la tinta dello studio). */
export const stileDelVideo = (nome: NomeStile, slug: string): Stile => (nome === "studio" ? studio(tintaDi(slug)) : STILI[nome]);
