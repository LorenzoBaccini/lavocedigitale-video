import { SCRIVANIA } from "./scrivania";
import { studio, tintaDi } from "./studio";
import type { NomeStile, Stile } from "./tipi";

export type { Allineamento, Grafiche, NomeSet, NomeStile, Stile, Transizione, TrattamentoSottotitolo } from "./tipi";
export { NOMI_STILI } from "./tipi";
export { StileVideo, useStile } from "./StileVideo";
export { allineaFlesso, allineaTesto } from "./allinea";

// notte e schermo hanno l'aspetto di scrivania finche' non arrivano i loro token: la pipeline non li sceglie (ATTIVI in variante.ts).
// studio qui e' la tinta cobalto; il video vero prende la sua dallo slug (stileDelVideo).
export const STILI: Record<NomeStile, Stile> = { scrivania: SCRIVANIA, studio: studio("cobalto"), notte: SCRIVANIA, schermo: SCRIVANIA };

/** Lo stile di un video: quello della variante, con le scelte che dipendono dallo slug (la tinta dello studio). */
export const stileDelVideo = (nome: NomeStile, slug: string): Stile => (nome === "studio" ? studio(tintaDi(slug)) : STILI[nome]);
