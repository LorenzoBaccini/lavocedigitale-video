import { readFileSync } from "node:fs";

/**
 * L'articolo come arriva dal sito nell'input `articolo` del workflow_dispatch: il testo e' gia'
 * senza HTML. Nessuna lettura dal database.
 */
export interface ArticoloVideo {
  slug: string;
  titolo: string;
  sottotitolo: string;
  testo: string;
  url: string;
  tags: string[];
}

const SITO = "https://lavocedigitale.it";

/** Lo slug decide percorsi su disco e chiavi su S3: solo minuscole, cifre e trattini singoli. */
export const slugValido = (slug: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

const stringa = (v: unknown, campo: string, max: number, errori: string[], vuota = false): string => {
  if (typeof v !== "string" || (!vuota && v.trim() === "")) errori.push(`${campo}: manca o non è testo`);
  else if (v.length > max) errori.push(`${campo}: oltre ${max} caratteri`);
  return typeof v === "string" ? v : "";
};

/** Controlla il payload: e' dato esterno, finisce in percorsi, nel prompt e nei post. */
export function validaArticolo(dato: unknown): { ok: true; articolo: ArticoloVideo } | { ok: false; errori: string[] } {
  if (typeof dato !== "object" || dato === null || Array.isArray(dato)) return { ok: false, errori: ["articolo: non è un oggetto"] };
  const d = dato as Record<string, unknown>;
  const errori: string[] = [];
  const slug = stringa(d.slug, "slug", 120, errori);
  if (slug && !slugValido(slug)) errori.push("slug: solo minuscole, cifre e trattini");
  const titolo = stringa(d.titolo, "titolo", 200, errori);
  const sottotitolo = stringa(d.sottotitolo, "sottotitolo", 400, errori, true);
  const testo = stringa(d.testo, "testo", 60_000, errori);
  const url = stringa(d.url, "url", 300, errori);
  // il link va nei post: solo la pagina dell'articolo sul sito, /<categoria>/<slug>
  const percorso = url.startsWith(`${SITO}/`) ? url.slice(SITO.length) : "";
  if (url && !(/^\/[a-z0-9-]+\/[a-z0-9-]+$/.test(percorso) && percorso.endsWith(`/${slug}`))) {
    errori.push("url: non è la pagina dell'articolo su lavocedigitale.it");
  }
  const tags = d.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 20 || tags.some((t) => typeof t !== "string" || t.length > 60)) {
    errori.push("tags: al massimo 20 tag di testo");
  }
  if (errori.length > 0) return { ok: false, errori };
  return { ok: true, articolo: { slug, titolo, sottotitolo, testo, url, tags: tags as string[] } };
}

/** Legge e valida l'articolo dal file JSON scritto dal workflow. */
export function leggiArticolo(file: string): ArticoloVideo {
  let dato: unknown;
  try {
    dato = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`articolo: JSON non leggibile (${e instanceof Error ? e.message : String(e)})`);
  }
  const esito = validaArticolo(dato);
  if (!esito.ok) throw new Error(`articolo non valido: ${esito.errori.join("; ")}`);
  return esito.articolo;
}
