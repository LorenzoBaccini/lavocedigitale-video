import type { NomeDurata } from "../editoriale/variante.ts";

export type Oggetto = "portatile" | "chiavetta" | "smartphone" | "router" | "carta" | "nessuno";

export const OGGETTI: readonly Oggetto[] = ["portatile", "chiavetta", "smartphone", "router", "carta", "nessuno"];

/** Il dispositivo su cui si vede la schermata di `allarme` e `rischio`. */
export type Dispositivo = "portatile" | "smartphone";
export const DISPOSITIVI: readonly Dispositivo[] = ["portatile", "smartphone"];

/** Che cosa mostra lo schermo: il sistema (desktop, impostazioni), una pagina web, un'app. */
export type Schermata = "sistema" | "sito" | "app";
export const SCHERMATE: readonly Schermata[] = ["sistema", "sito", "app"];

/** Le cose che la scena `documenti` appoggia sul tavolo. */
export type Pezzo = "tessera" | "documento" | "lettore" | "pin";
export const PEZZI: readonly Pezzo[] = ["tessera", "documento", "lettore", "pin"];

export interface Voce {
  grande: string;
  piccolo: string;
}

export interface Confronto {
  titolo: string;
  valore: string;
}

export interface PezzoSulTavolo {
  oggetto: Pezzo;
  nota: string;
}

export type Scena =
  | { tipo: "gancio"; titolo: string; evidenza: string; sottotitolo: string; oggetto: Oggetto; schermata?: Schermata }
  | { tipo: "allarme"; sopra: string; titolo: string; notifica?: string; mittente?: string; azione?: string; dispositivo?: Dispositivo }
  | { tipo: "oggetto"; etichetta: string; titolo: string; evidenza?: string; conferma?: string; indica?: string; oggetto: Oggetto; schermata?: Schermata; menu?: string[] }
  | { tipo: "data"; etichetta: string; data: string; barrato?: string; timbro?: string }
  | { tipo: "checklist"; etichetta: string; voci: Voce[]; oggetto: Oggetto }
  | { tipo: "rischio"; sopra: string; titolo: string; dispositivo?: Dispositivo }
  | { tipo: "telefono"; etichetta: string; titolo: string; opzioni: string[]; esclusa?: string }
  | { tipo: "documenti"; etichetta: string; titolo: string; pezzi: PezzoSulTavolo[] }
  | { tipo: "teaser"; testo: string }
  | { tipo: "numero"; etichetta: string; numero: string; unita?: string; nota?: string }
  | { tipo: "confronto"; etichetta: string; a: Confronto; b: Confronto }
  | { tipo: "citazione"; testo: string; fonte: string }
  | { tipo: "chiusura" };

export interface Frase {
  testo: string;
  chiave: string;
  scena: Scena;
}

export interface Storyboard {
  slug: string;
  /** la data dell'orologio sugli schermi (AAAA-MM-GG); senza, l'orologio mostra solo l'ora */
  orologio?: string;
  frasi: Frase[];
}

/** L'ultima frase che Claude scrive e la validazione pretende; la pipeline la sostituisce con una di `FRASI_CHIUSURA`. */
export const TESTO_CHIUSURA = "Trovi tutto su la voce digitale punto it, il link è nel post.";

/**
 * Le frasi finali dette davvero, indicizzate da `fraseFinale` della variante, con la loro chiave. Corte: l'indirizzo
 * e' scritto nella cartolina e nella fascia, non serve dirlo ogni volta.
 */
export const FRASI_CHIUSURA = [
  { testo: "Tutto su la voce digitale punto it.", chiave: "la voce digitale punto it" },
  { testo: "Link nel post.", chiave: "Link nel post" },
  { testo: "Il resto è nel link del post.", chiave: "link del post" },
] as const;

export interface LimitiDurata {
  /** chiusura inclusa */
  frasi: { min: number; max: number };
  /** contate sul copione di Claude, che finisce con `TESTO_CHIUSURA`: la frase finale piu' corta arriva dopo */
  parole: { min: number; max: number };
  /** circa, a 2,35 parole al secondo: lo legge solo il prompt */
  secondi: { min: number; max: number };
}

/** Frasi e parole del copione per ogni durata della variante: il prompt chiede quella scelta, la validazione la applica. */
export const LIMITI_DURATA: Record<NomeDurata, LimitiDurata> = {
  corta: { frasi: { min: 4, max: 5 }, parole: { min: 32, max: 46 }, secondi: { min: 15, max: 21 } },
  media: { frasi: { min: 6, max: 8 }, parole: { min: 50, max: 72 }, secondi: { min: 23, max: 32 } },
  lunga: { frasi: { min: 8, max: 9 }, parole: { min: 72, max: 88 }, secondi: { min: 32, max: 40 } },
};

export const LIMITI = {
  testoFrase: 160,
  titolo: 24,
  evidenza: 16,
  etichetta: 32,
  barrato: 26,
  sottotitolo: 36,
  conferma: 28,
  indica: 28,
  chiave: 18,
  voci: { min: 2, max: 3 },
  grande: 18,
  piccolo: 34,
  numero: 8,
  testoTeaser: 40,
  testoCitazione: 110,
  notifica: 64,
  mittente: 28,
  azione: 28,
  menu: { min: 1, max: 5 },
  voceMenu: 18,
  opzioni: { min: 2, max: 3 },
  opzione: 24,
  pezzi: { min: 2, max: 3 },
  notaPezzo: 24,
  /** la parola piu' lunga di `indica` e delle note dei pezzi: oltre non sta nella colonna della nota (`set/nota.ts`) */
  parolaNota: 15,
} as const;
