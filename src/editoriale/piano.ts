// Il piano di una scena editoriale: cosa scrive a schermo e quando, quali foley suonano, quando cambia l'inquadratura.
// Le scene disegnano dal loro piano; il sottotitolo lo legge per non ripetere quello che e' gia' scritto,
// la composizione per mixare i foley, i test per controllare che nessuna inquadratura resti ferma troppo.

/** Un testo scritto a schermo, intero dal frame `da`, nell'ordine di lettura. */
export interface TestoAschermo {
  testo: string;
  da: number;
}

/** Nomi dei foley generati da `suoni/foley.ts`. */
// i segni a mano (pennarello, penna) sono muti: il loro fruscio sulle parole evidenziate disturbava la voce
export type NomeFoley = "notifica" | "tonfo" | "timbro" | "clic" | "carta";

export interface Effetto {
  da: number;
  suono: NomeFoley;
  volume?: number;
}

export interface Piano {
  testi: TestoAschermo[];
  suoni: Effetto[];
  /** frame in cui qualcosa di visibile cambia: entrate, segni, stacchi, movimenti di camera */
  eventi: number[];
}

/** I testi gia' interamente a schermo al frame `locale`, in ordine di lettura. */
export const titoliVisibili = (testi: TestoAschermo[], locale: number): string[] => testi.filter((t) => locale >= t.da).map((t) => t.testo);
