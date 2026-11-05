import { NOMI_TEMI } from "../../suoni/sottofondo.ts";
import type { NomeTema } from "../../suoni/sottofondo.ts";

export const LUCI = ["calda", "chiara", "mattino", "sera"] as const;
export const APERTURE = ["classica", "radente", "alta"] as const;

export type NomeLuce = (typeof LUCI)[number];
export type NomeApertura = (typeof APERTURE)[number];

/** L'aspetto di un video: tema musicale, luce della scrivania, inquadratura d'apertura del gancio. */
export interface Variante {
  musica: NomeTema;
  luce: NomeLuce;
  apertura: NomeApertura;
}

/** L'aspetto del video approvato (windows10): e' quello di chi non dichiara una variante. */
export const VARIANTE_BASE: Variante = { musica: "caldo", luce: "calda", apertura: "classica" };

export const DIMENSIONI: { [K in keyof Variante]: readonly Variante[K][] } = { musica: NOMI_TEMI, luce: LUCI, apertura: APERTURE };

/** FNV-1a a 32 bit: lo stesso slug da' sempre la stessa scelta. */
function impronta(testo: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < testo.length; i++) h = Math.imul(h ^ testo.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

function scegli<K extends keyof Variante>(dim: K, slug: string, recenti: Partial<Variante>[]): Variante[K] {
  const opzioni = DIMENSIONI[dim];
  // si escludono i valori degli ultimi n-1 video: in n video di fila si passa da tutte le opzioni
  const usate = new Set(recenti.slice(0, opzioni.length - 1).map((v) => v[dim]));
  const libere = opzioni.filter((o) => !usate.has(o));
  return libere[impronta(`${slug}:${dim}`) % libere.length];
}

/**
 * La variante del video: deterministica dallo slug, diversa dalle ultime usate.
 * `recenti` va dal piu' recente; voci senza variante o con valori sconosciuti non escludono niente.
 */
export function scegliVariante(slug: string, recenti: Partial<Variante>[]): Variante {
  return { musica: scegli("musica", slug, recenti), luce: scegli("luce", slug, recenti), apertura: scegli("apertura", slug, recenti) };
}

/** La variante delle props, con l'aspetto del video approvato per ogni campo assente o sconosciuto. */
export function varianteDi(v: Partial<Variante> | undefined): Variante {
  const tieni = <K extends keyof Variante>(k: K): Variante[K] => (v?.[k] !== undefined && DIMENSIONI[k].includes(v[k] as never) ? (v[k] as Variante[K]) : VARIANTE_BASE[k]);
  return { musica: tieni("musica"), luce: tieni("luce"), apertura: tieni("apertura") };
}
