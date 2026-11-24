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

/** I pittogrammi disegnati a tratto: un insieme chiuso, generico, senza marchi. */
export type Simbolo = "lucchetto" | "batteria" | "wifi" | "segnale" | "posizione" | "altoparlante" | "documento" | "euro" | "calendario" | "scudo";
export const SIMBOLI: readonly Simbolo[] = ["lucchetto", "batteria", "wifi", "segnale", "posizione", "altoparlante", "documento", "euro", "calendario", "scudo"];

/** Un passo della scena `passi`: il testo e, se serve, un pittogramma piccolo. */
export interface Passo {
  testo: string;
  simbolo?: Simbolo;
}

/** Un nodo della scena `flusso`: il testo e, se serve, un pittogramma piccolo. */
export interface Nodo {
  testo: string;
  simbolo?: Simbolo;
}

/** Il segno sulla piantina della scena `mappa`: lo spillo su un punto, una zona cerchiata, un tragitto da A a B. */
export type FormaMappa = "punto" | "area" | "percorso";
export const FORME_MAPPA: readonly FormaMappa[] = ["punto", "area", "percorso"];

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
  | { tipo: "passi"; etichetta: string; passi: Passo[] }
  | { tipo: "flusso"; etichetta: string; nodi: Nodo[] }
  /** `luoghi`: uno con `punto` e `area`, due (partenza e arrivo) con `percorso` */
  | { tipo: "mappa"; etichetta: string; titolo: string; forma: FormaMappa; luoghi: string[] }
  | { tipo: "simbolo"; etichetta: string; simbolo: Simbolo; titolo: string; barrato?: boolean }
  | { tipo: "chiusura" };

/** Come la voce dice la frase: diventa un tag di eleven_v3 davanti alla frase, mai nel `testo`. */
export type Tono = "deciso" | "entusiasta" | "curioso" | "serio" | "sussurrato" | "sorpreso" | "ironico";
export const TONI: readonly Tono[] = ["deciso", "entusiasta", "curioso", "serio", "sussurrato", "sorpreso", "ironico"];
export const TAG_TONO: Record<Tono, string> = {
  deciso: "",
  entusiasta: "[excited]",
  curioso: "[curious]",
  serio: "[serious]",
  sussurrato: "[whispers]",
  sorpreso: "[surprised]",
  ironico: "[sarcastic]",
};
/** I toni che stancano se ripetuti: al massimo `LIMITI.toniMarcati` per video. */
export const TONI_MARCATI: readonly Tono[] = ["sussurrato", "ironico"];

export interface Frase {
  testo: string;
  chiave: string;
  scena: Scena;
  /** assente: `deciso` */
  tono?: Tono;
}

export interface Storyboard {
  slug: string;
  /** la data dell'orologio sugli schermi (AAAA-MM-GG); senza, l'orologio mostra solo l'ora */
  orologio?: string;
  frasi: Frase[];
}

export interface LimitiDurata {
  /** domanda finale inclusa */
  frasi: { min: number; max: number };
  /** tutte le frasi, domanda finale compresa */
  parole: { min: number; max: number };
  /** circa, a 2,6 parole al secondo (voce a 1,1x): lo legge solo il prompt */
  secondi: { min: number; max: number };
}

/** Frasi e parole dette per ogni durata della variante: il prompt chiede quella scelta, la validazione la applica. */
export const LIMITI_DURATA: Record<NomeDurata, LimitiDurata> = {
  corta: { frasi: { min: 4, max: 5 }, parole: { min: 28, max: 40 }, secondi: { min: 11, max: 16 } },
  media: { frasi: { min: 5, max: 7 }, parole: { min: 40, max: 56 }, secondi: { min: 16, max: 22 } },
  lunga: { frasi: { min: 7, max: 8 }, parole: { min: 56, max: 72 }, secondi: { min: 22, max: 28 } },
};

export const contaParole = (testo: string): number => testo.trim().split(/\s+/).filter(Boolean).length;

export const LIMITI = {
  testoFrase: 160,
  /** il gancio: un'affermazione che si legge in un colpo d'occhio */
  gancioParole: 10,
  /** la domanda finale a chi guarda */
  domandaParole: 12,
  /** oltre, la domanda non sta nella fascia della chiusura integrata */
  domandaCaratteri: 80,
  toniMarcati: 2,
  titolo: 24,
  evidenza: 16,
  etichetta: 32,
  barrato: 26,
  sottotitolo: 36,
  conferma: 28,
  indica: 28,
  chiave: 18,
  voci: { min: 2, max: 3 },
  passi: { min: 2, max: 4 },
  passo: 28,
  nodi: { min: 2, max: 3 },
  nodo: 18,
  luogo: 20,
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
