import type { Voce } from "../editoriale/voce";
import type { Scena } from "../storyboard/tipi";

/** Le scene vicine: servono alla continuita' (la notifica che arriva alla fine del gancio, lo stacco in asse). */
export interface Contesto {
  precedente?: Scena["tipo"];
  prossima?: Scena["tipo"];
  /** il messaggio della notifica dell'allarme che segue, perche' il gancio la faccia arrivare */
  messaggioSeguente?: string;
  /** e la sua intestazione */
  mittenteSeguente?: string;
  azioneSeguente?: string;
  /** la data dell'orologio sugli schermi (`storyboard.orologio`) */
  orologio?: string;
}

// Ogni scena riceve la sua durata in frame, la frase detta con i tempi della voce e le scene vicine.
export type PropsScena<S> = S & { durata: number; voce: Voce; contesto: Contesto };

export type ScenaDi<T extends Scena["tipo"]> = PropsScena<Extract<Scena, { tipo: T }>>;
