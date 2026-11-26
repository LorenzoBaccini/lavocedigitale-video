import type { Storyboard, Tono } from "./tipi.ts";

/** Le emozioni che spingono a condividere (Berger e Milkman 2012), piu' `utilità` quando l'articolo non ne regge una. */
export type TipoEmozione = "ansia" | "indignazione" | "stupore" | "utilità";
export const EMOZIONI: readonly TipoEmozione[] = ["ansia", "indignazione", "stupore", "utilità"];

export interface Emozione {
  tipo: TipoEmozione;
  /** il passo dell'articolo che la genera, copiato alla lettera */
  fatto: string;
}

export const LIMITI_FATTO = { min: 20, max: 220 } as const;

/** I toni con cui il gancio puo' aprire ciascuna emozione: l'apertura e' dove l'emozione si sente. */
export const TONI_GANCIO: Record<TipoEmozione, readonly Tono[]> = {
  ansia: ["deciso", "serio", "drammatico", "sussurrato", "sorpreso"],
  indignazione: ["deciso", "serio", "ironico", "sospirando", "sorpreso", "drammatico"],
  stupore: ["deciso", "sorpreso", "curioso", "sussurrato", "malizioso", "entusiasta"],
  utilità: ["deciso", "curioso", "malizioso", "sorpreso", "sospirando", "entusiasta"],
};

/** I toni che tradiscono l'emozione in qualunque frase: non si ride di chi rischia, non si drammatizza un consiglio. */
export const TONI_VIETATI: Record<TipoEmozione, readonly Tono[]> = {
  ansia: ["ridendo"],
  indignazione: ["ridendo"],
  stupore: [],
  utilità: ["drammatico"],
};

/** Parole che promettono piu' di quanto il video dia: ammesse solo se le usa l'articolo. */
const ESCHE = [
  /\bincredibil[ei]\b/,
  /\bpazzesc[oaih]\w*\b/,
  /\bscioccant[ei]\b/,
  /\bshock\b/,
  /\bsconvolgent[ei]\b/,
  /\bclamoros[oaie]\b/,
  /\bdevastant[ei]\b/,
  /\bterrificant[ei]\b/,
  /\bda brividi\b/,
  /\bnon ci crederai\b/,
  /\bnessuno (?:te lo|ti) dice\b/,
];

const normalizza = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[«»“”„]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const senzaBordi = (s: string): string => s.replace(/^[\s"'.,;:…]+|[\s"'.,;:…]+$/g, "");

const èDizionario = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * L'emozione del copione e' vera solo se un passo dell'articolo la genera: `fatto` deve esserci alla lettera,
 * il gancio la apre con un tono coerente e nessuna frase usa esche che l'articolo non usa.
 */
export function erroriEmozione(storyboard: Storyboard, testoArticolo: string): string[] {
  const e: unknown = (storyboard as { emozione?: unknown }).emozione;
  const articolo = normalizza(testoArticolo);
  const errori: string[] = [];

  for (const [i, f] of storyboard.frasi.entries()) {
    const testo = normalizza(f.testo);
    for (const esca of ESCHE) {
      const parola = esca.exec(testo)?.[0];
      if (parola && !esca.test(articolo)) errori.push(`frasi[${i}].testo: «${parola}» promette più del fatto e l'articolo non lo dice: racconta il fatto, l'emozione arriva da sé`);
    }
  }

  if (!èDizionario(e)) return [...errori, "emozione: oggetto { tipo, fatto } obbligatorio"];
  if (!EMOZIONI.includes(e.tipo as TipoEmozione)) return [...errori, `emozione.tipo: uno fra ${EMOZIONI.join(", ")}`];
  const tipo = e.tipo as TipoEmozione;

  if (typeof e.fatto !== "string") errori.push("emozione.fatto: testo obbligatorio");
  else {
    const fatto = senzaBordi(normalizza(e.fatto));
    if (fatto.length < LIMITI_FATTO.min || fatto.length > LIMITI_FATTO.max) {
      errori.push(`emozione.fatto: ${fatto.length} caratteri, da ${LIMITI_FATTO.min} a ${LIMITI_FATTO.max}`);
    } else if (!articolo.includes(fatto)) {
      errori.push(`emozione.fatto: non è nell'articolo alla lettera; copia il passo che genera ${tipo}, oppure scegli «utilità»`);
    }
  }

  const gancio = storyboard.frasi[0]?.tono ?? "deciso";
  if (!TONI_GANCIO[tipo].includes(gancio)) errori.push(`frasi[0].tono: «${gancio}» non apre ${tipo}; usa uno fra ${TONI_GANCIO[tipo].join(", ")}`);
  for (const [i, f] of storyboard.frasi.entries()) {
    if (f.tono && TONI_VIETATI[tipo].includes(f.tono)) errori.push(`frasi[${i}].tono: «${f.tono}» stona con ${tipo}`);
  }
  return errori;
}
