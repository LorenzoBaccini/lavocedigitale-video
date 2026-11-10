import { NOMI_TEMI } from "../../suoni/sottofondo.ts";
import type { NomeTema } from "../../suoni/sottofondo.ts";
import { impronta } from "./impronta.ts";
import { NOMI_STILI } from "./stili/tipi.ts";
import type { NomeStile } from "./stili/tipi.ts";

export const LUCI = ["calda", "chiara", "mattino", "sera"] as const;
export const APERTURE = ["classica", "radente", "alta"] as const;
export const GANCI = ["scena", "parola", "dettaglio", "diviso"] as const;
export const CHIUSURE = ["cartolina", "integrata"] as const;
/** l'indice della frase finale parlata in `FRASI_CHIUSURA` (storyboard/tipi.ts) */
export const FRASI_FINALI = [0, 1, 2] as const;
export const DURATE = ["corta", "media", "lunga"] as const;

export type NomeLuce = (typeof LUCI)[number];
export type NomeApertura = (typeof APERTURE)[number];
export type NomeGancio = (typeof GANCI)[number];
export type NomeChiusura = (typeof CHIUSURE)[number];
export type FraseFinale = (typeof FRASI_FINALI)[number];
export type NomeDurata = (typeof DURATE)[number];

/** L'aspetto di un video: tutto cio' che la pipeline sceglie dallo slug, indipendente dal copione. */
export interface Variante {
  musica: NomeTema;
  luce: NomeLuce;
  apertura: NomeApertura;
  stile: NomeStile;
  gancio: NomeGancio;
  chiusura: NomeChiusura;
  fraseFinale: FraseFinale;
  durata: NomeDurata;
}

export type Dimensione = keyof Variante;
export type Valori = { [K in Dimensione]: readonly Variante[K][] };

/** L'aspetto del video approvato (windows10): e' quello di chi non dichiara una variante. */
export const VARIANTE_BASE: Variante = { musica: "caldo", luce: "calda", apertura: "classica", stile: "scrivania", gancio: "scena", chiusura: "cartolina", fraseFinale: 2, durata: "media" };

/** Tutti i valori validi: le props e le opzioni del controllo d'impaginazione possono forzarne uno qualsiasi. */
export const DIMENSIONI: Valori = { musica: NOMI_TEMI, luce: LUCI, apertura: APERTURE, stile: NOMI_STILI, gancio: GANCI, chiusura: CHIUSURE, fraseFinale: FRASI_FINALI, durata: DURATE };

// Solo i valori gia' costruiti: la pipeline non deve pubblicare uno stile, un gancio o una chiusura ancora segnaposto.
export const ATTIVI: Valori = { ...DIMENSIONI, durata: ["media"] };

/** Quanti video recenti escludono i loro valori; musica, luce e apertura n-1: in n video di fila passano tutte. */
export const PROFONDITA: { [K in Dimensione]: number } = {
  musica: NOMI_TEMI.length - 1,
  luce: LUCI.length - 1,
  apertura: APERTURE.length - 1,
  stile: 2,
  gancio: 2,
  chiusura: 1,
  fraseFinale: 1,
  durata: 1,
};

// I video pubblicati prima degli stili erano tutti scrivania: una voce senza stile lo esclude.
const valoreStorico = <K extends Dimensione>(v: Partial<Variante>, dim: K): Variante[K] | undefined =>
  dim === "stile" ? ((v.stile ?? "scrivania") as Variante[K]) : v[dim];

function scegli<K extends Dimensione>(dim: K, slug: string, recenti: Partial<Variante>[], attivi: Valori): Variante[K] {
  const opzioni = attivi[dim];
  // con meno valori attivi che video da escludere si accorcia la memoria, un video alla volta: l'ultimo resta escluso finche' si puo'
  for (let profondita = PROFONDITA[dim]; profondita > 0; profondita--) {
    const usate = new Set(recenti.slice(0, profondita).map((v) => valoreStorico(v, dim)));
    const libere = opzioni.filter((o) => !usate.has(o));
    if (libere.length > 0) return libere[impronta(`${slug}:${dim}`) % libere.length];
  }
  return opzioni[impronta(`${slug}:${dim}`) % opzioni.length];
}

const NOMI_DIMENSIONI = Object.keys(DIMENSIONI) as Dimensione[];

const perDimensione = (valore: <K extends Dimensione>(k: K) => Variante[K]): Variante =>
  Object.fromEntries(NOMI_DIMENSIONI.map((k) => [k, valore(k)])) as unknown as Variante;

/**
 * La variante del video: deterministica dallo slug, diversa dalle ultime usate.
 * `recenti` va dal piu' recente; campi assenti o sconosciuti non escludono niente, tranne `stile` assente (vale scrivania).
 * `attivi` e' per i test: la pipeline sceglie sempre fra `ATTIVI`.
 */
export function scegliVariante(slug: string, recenti: Partial<Variante>[], attivi: Valori = ATTIVI): Variante {
  return perDimensione((k) => scegli(k, slug, recenti, attivi));
}

/** La variante delle props, con l'aspetto del video approvato per ogni campo assente o sconosciuto. */
export function varianteDi(v: Partial<Variante> | undefined): Variante {
  return perDimensione((k) => (v?.[k] !== undefined && DIMENSIONI[k].includes(v[k] as never) ? (v[k] as Variante[typeof k]) : VARIANTE_BASE[k]));
}
