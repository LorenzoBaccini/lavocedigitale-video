import type { Dispositivo, Schermata } from "../../storyboard/tipi.ts";

// Le parole sono le stesse elencate in agent-video.md (regola 17): se cambi qui, cambia anche lì.
const parole = (elenco: string) => new RegExp(`(?<![\\p{L}])(${elenco})(?![\\p{L}])`, "iu");
const SUL_TELEFONO = parole("app|smartphone|telefon[oi]|telefonin[oi]|cellular[ei]");
const SUL_WEB = parole("sit[oi]|portal[ei]|pagin[ae] web");
const IN_APP = parole("app");
const SICUREZZA = parole("sicurezza|protezione|antivirus");

export const dispositivoDi = (scena: { dispositivo?: Dispositivo }, testo: string): Dispositivo =>
  scena.dispositivo ?? (SUL_TELEFONO.test(testo) ? "smartphone" : "portatile");

export const schermataDi = (scena: { schermata?: Schermata }, testo: string): Schermata =>
  scena.schermata ?? (SUL_WEB.test(testo) ? "sito" : IN_APP.test(testo) ? "app" : "sistema");

/** L'icona della notifica sul portatile: lo scudo solo per un avviso di sicurezza, altrimenti un quadrato neutro. */
export const iconaNotifica = (mittente: string): "scudo" | "neutra" => (SICUREZZA.test(mittente) ? "scudo" : "neutra");

/** «14/10/2025» da «2025-10-14». */
export const dataOrologio = (iso: string): string => iso.split("-").reverse().join("/");
