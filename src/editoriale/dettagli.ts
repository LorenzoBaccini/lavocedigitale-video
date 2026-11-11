import { improntaMescolata } from "./impronta.ts";
import { contrasto, mescola, sovrapponi } from "./stili/colore.ts";
import type { Stile } from "./stili/tipi.ts";

/** Le finiture del telefono: il colore della cornice in alluminio. */
export const FINITURE = { grafite: "#5d6168", argento: "#b9bdc3", blu: "#3c4c66", sabbia: "#a8957a" } as const;
export type NomeFinitura = keyof typeof FINITURE;
export const NOMI_FINITURE = Object.keys(FINITURE) as NomeFinitura[];

export const OGGETTI_SCRIVANIA = ["taccuino", "tazza", "pianta"] as const;
export type OggettoScrivania = (typeof OGGETTI_SCRIVANIA)[number];

/** Come si annota la notifica dell'allarme: cerchio sull'app e sottolineature, solo le sottolineature, nessun segno. */
export const SEGNI_NOTIFICA = ["cerchio", "sottolinea", "nessuno"] as const;
export type SegnoNotifica = (typeof SEGNI_NOTIFICA)[number];

/** Lo sfondo della schermata di blocco: tinta unita, con un alone al centro che si spegne prima dei bordi. */
export interface SfondoBlocco {
  fondo: string;
  /** il colore dell'alone; assente: tinta unita */
  alone?: string;
}

/** I dettagli che cambiano da un video all'altro senza essere una scelta della variante. */
export interface Dettagli {
  /** l'ora sugli schermi, «HH:MM» */
  ora: string;
  finitura: NomeFinitura;
  sfondo: SfondoBlocco;
  /** gli oggetti di scena sulla scrivania (solo il set scrivania) */
  oggetti: readonly OggettoScrivania[];
  /** i segni a mano sulla notifica dell'allarme */
  segnoNotifica: SegnoNotifica;
}

/** I dettagli del video approvato: la regressione a pixel e chi forza le props li usa. */
export const DETTAGLI_BASE: Dettagli = { ora: "10:24", finitura: "grafite", sfondo: { fondo: "#1b2230" }, oggetti: ["taccuino"], segnoNotifica: "cerchio" };

/** Quanto e' forte l'alone al centro della schermata di blocco. */
export const ALFA_ALONE = 0.26;
/** Il buio di partenza degli sfondi: ogni tinta dello stile ci si mescola, cosi' il testo bianco si legge sempre. */
export const BUIO = "#10131a";

/** Il testo piu' debole della schermata di blocco: il titolo #f3f4f6 sul riquadro bianco al 12 %. */
export const leggibile = (sotto: string) => contrasto("#f3f4f6", sovrapponi("#ffffff", 0.12, sotto)) >= 5;

/** `tinta` mescolata al buio fino a `quanto`, meno se serve perche' il testo si legga anche al centro dell'alone. */
function sfondo(tinta: string, quanto: number, alone?: string): SfondoBlocco {
  for (let k = quanto; k > 0; k -= 0.02) {
    const fondo = mescola(BUIO, tinta, k);
    if (leggibile(fondo) && (!alone || leggibile(sovrapponi(alone, ALFA_ALONE, fondo)))) return alone ? { fondo, alone } : { fondo };
  }
  // il buio da solo regge (il test lo prova); l'alone no: se nemmeno a quantita' zero si legge, si toglie
  return alone && leggibile(sovrapponi(alone, ALFA_ALONE, BUIO)) ? { fondo: BUIO, alone } : { fondo: BUIO };
}

// quanto della tinta entra nel buio, e se c'e' l'alone (della stessa tinta)
const RICETTE: [number, boolean][] = [[0.18, true], [0.5, false], [0.24, true], [0.3, false]];

/** I quattro sfondi possibili della schermata di blocco: le prime quattro tinte diverse della tavolozza dello stile. */
export const sfondiBlocco = ({ colori }: Stile): SfondoBlocco[] => {
  const tinte = [...new Set([colori.accento, colori.superficie, colori.inchiostro.timbro, colori.segnoSuChiaro, colori.inchiostro.penna, colori.tenue])];
  if (tinte.length < RICETTE.length) throw new Error(`sfondiBlocco: la tavolozza ha ${tinte.length} tinte diverse, ne servono ${RICETTE.length}`);
  return RICETTE.map(([quanto, alone], i) => sfondo(tinte[i], quanto, alone ? tinte[i] : undefined));
};

// 07:00-22:59: un telefono guardato di notte fonda stonerebbe
const PRIMO_MINUTO = 7 * 60;
const MINUTI = 16 * 60;

const scelta = (slug: string, chiave: string, n: number) => improntaMescolata(`${slug}:${chiave}`) % n;

/** L'ora «HH:MM» di uno slug, fra le 07:00 e le 22:59. */
export function oraDi(slug: string): string {
  const m = PRIMO_MINUTO + scelta(slug, "ora", MINUTI);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** I dettagli di un video: deterministici dallo slug, lo sfondo del blocco dai colori dello stile. Niente storico. */
export function dettagliDi(slug: string, stile: Stile): Dettagli {
  const sfondi = sfondiBlocco(stile);
  return {
    ora: oraDi(slug),
    finitura: NOMI_FINITURE[scelta(slug, "telefono", NOMI_FINITURE.length)],
    sfondo: sfondi[scelta(slug, "blocco", sfondi.length)],
    // due su tre: si lascia fuori uno degli oggetti
    oggetti: OGGETTI_SCRIVANIA.filter((_, i) => i !== scelta(slug, "scrivania", OGGETTI_SCRIVANIA.length)),
    segnoNotifica: SEGNI_NOTIFICA[scelta(slug, "segno", SEGNI_NOTIFICA.length)],
  };
}
