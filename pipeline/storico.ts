import { dispositivoDi, schermataDi } from "../src/editoriale/set/ambiente.ts";
import type { Variante } from "../src/editoriale/variante.ts";
import type { Storyboard } from "../src/storyboard/tipi.ts";
import { VIDEO_CONFRONTATI } from "../src/storyboard/valida.ts";

/** Chiave nel bucket delle immagini. Fuori da `video/`: la scadenza degli mp4 non deve toccarla. */
export const CHIAVE_STORICO = "video-storico.json";
/** Quanti video tengono il riassunto completo e quanti slug si ricordano per non ripubblicare. */
export const MAX_RIASSUNTI = 10;
export const MAX_SLUG = 200;

export interface ScenaStorico {
  tipo: string;
  dispositivo?: string;
  schermata?: string;
}

export interface VoceStorico {
  slug: string;
  /** AAAA-MM-GG della pubblicazione */
  data: string;
  scene: ScenaStorico[];
  /** parziale solo se il file e' stato toccato a mano: i campi mancanti non escludono niente */
  variante: Partial<Variante>;
}

/** Tutto dal piu' recente. */
export interface Storico {
  recenti: VoceStorico[];
  pubblicati: string[];
}

export const STORICO_VUOTO: Storico = { recenti: [], pubblicati: [] };

const èVoce = (v: unknown): v is VoceStorico => {
  const o = v as Partial<VoceStorico> | null;
  return typeof o?.slug === "string" && Array.isArray(o.scene) && o.scene.every((s) => typeof s?.tipo === "string");
};

/**
 * Lo storico dal testo del file; `null` vuol dire che il file non esiste ancora (storico vuoto).
 * Un testo che non e' uno storico lancia un errore: senza l'elenco dei pubblicati non si sa se il video c'e' gia'.
 */
export function analizzaStorico(testo: string | null): Storico {
  if (testo === null) return STORICO_VUOTO;
  let json: { recenti?: unknown; pubblicati?: unknown };
  try {
    json = JSON.parse(testo);
  } catch {
    throw new Error("storico illeggibile: non è JSON");
  }
  if (!Array.isArray(json?.pubblicati) || !Array.isArray(json.recenti)) throw new Error("storico illeggibile: mancano recenti o pubblicati");
  return {
    recenti: json.recenti.filter(èVoce).map((v) => ({ ...v, variante: typeof v.variante === "object" && v.variante !== null ? v.variante : {} })),
    pubblicati: json.pubblicati.filter((s): s is string => typeof s === "string"),
  };
}

/** Il riassunto di un video: sequenza delle scene con dispositivo e schermata decisi come nel render, e la variante. */
export function riassunto(storyboard: Storyboard, variante: Variante, data: string): VoceStorico {
  const scene = storyboard.frasi.map(({ scena, testo }): ScenaStorico => {
    if (scena.tipo === "allarme" || scena.tipo === "rischio") return { tipo: scena.tipo, dispositivo: dispositivoDi(scena, testo) };
    if (scena.tipo === "gancio" || scena.tipo === "oggetto") return { tipo: scena.tipo, schermata: schermataDi(scena, testo) };
    return { tipo: scena.tipo };
  });
  return { slug: storyboard.slug, data, scene, variante };
}

export function aggiungi(storico: Storico, voce: VoceStorico): Storico {
  return {
    recenti: [voce, ...storico.recenti.filter((v) => v.slug !== voce.slug)].slice(0, MAX_RIASSUNTI),
    pubblicati: [voce.slug, ...storico.pubblicati.filter((s) => s !== voce.slug)].slice(0, MAX_SLUG),
  };
}

/** Le sequenze di tipi (chiusura esclusa) degli ultimi video, per il prompt e per il controllo di varieta'. */
export const sequenzeRecenti = (storico: Storico): string[][] =>
  storico.recenti.slice(0, VIDEO_CONFRONTATI).map((v) => v.scene.map((s) => s.tipo).filter((t) => t !== "chiusura"));
