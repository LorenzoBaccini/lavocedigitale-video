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

export const TESTO_CHIUSURA = "Trovi tutto su la voce digitale punto it, il link è nel post.";

export const LIMITI = {
  frasi: { min: 6, max: 8 },
  testoFrase: 160,
  paroleCopione: { min: 50, max: 78 },
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
} as const;
