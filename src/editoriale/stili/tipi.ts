export const NOMI_STILI = ["scrivania", "studio", "notte", "schermo"] as const;
export type NomeStile = (typeof NOMI_STILI)[number];

/** Come si passa da una scena all'altra. */
export type Transizione = "taglio" | "spinta" | "lampo";
export type Allineamento = "centro" | "sinistra";

/** Il sottotitolo in una delle due situazioni (sopra il set, sopra le scene grafiche). */
export interface TrattamentoSottotitolo {
  testo: string;
  /** la parola chiave */
  chiave: string;
  /** `text-shadow` CSS, "none" per nessuna */
  ombra: string;
  /** la pillola dietro il testo; assente: il testo sta direttamente sulla scena */
  pillola?: { fondo: string; raggio: number; imbottitura: string };
}

/** L'aspetto di un video al di la' del contenuto: colori, caratteri, sottotitolo, titoli, grana, transizioni. */
export interface Stile {
  colori: {
    /** dietro le scene */
    fondo: string;
    /** il testo sopra il set */
    testo: string;
    /** occhielli e testi secondari sopra il set */
    tenue: string;
    accento: string;
    /** l'accento sulle scene grafiche chiare, piu' scuro per il contrasto */
    accentoSuChiaro: string;
    /** il piano attorno alle scene grafiche */
    superficie: string;
    /** il testo sulle scene grafiche e i segni a mano sopra */
    inchiostro: { testo: string; tenue: string; penna: string; timbro: string; pennarello: string };
  };
  caratteri: { titolo: string; testo: string };
  /** `text-shadow` dei testi sopra il set */
  ombra: (sfocatura: number, opacita: number, y?: number) => string;
  sottotitolo: { sulSet: TrattamentoSottotitolo; sulleGrafiche: TrattamentoSottotitolo };
  allineamentoTitoli: Allineamento;
  /** opacita' della grana */
  grana: { sulSet: number; sulleGrafiche: number };
  /** `background` CSS della vignettatura */
  vignetta: { sulSet: string; sulleGrafiche: string };
  transizione: Transizione;
}
