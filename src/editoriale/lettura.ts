// Il tempo di lettura dei testi a schermo: ogni testo, intero, resta abbastanza da leggerlo prima dello stacco.
// La voce porta i testi quando li dice; se li direbbe troppo tardi, il testo la anticipa (mai il contrario).

/** Frame per leggere un testo: 1,2 s fino a una dozzina di caratteri, poi 0,05 s a carattere, al piu' 1,8 s. */
export const lettura = (testo: string): number => Math.min(54, Math.max(36, Math.round(18 + 1.5 * testo.length)));

/** Nessun testo chiede piu' di questa quota della scena: la lettura scala con la durata solo sotto i 108 frame (3,6 s). */
export const QUOTA_LETTURA = 0.5;
/** Sopra questa durata (frame) ogni testo ha la sua lettura piena. */
export const SCENA_PIENA = Math.ceil(54 / QUOTA_LETTURA);

/** La lettura di un testo in una scena lunga `durata` frame. */
export const letturaIn = (testo: string, durata: number): number => Math.min(lettura(testo), Math.round(durata * QUOTA_LETTURA));

/** L'ultimo frame in cui il testo puo' diventare intero, perche' resti da leggere fino allo stacco. */
export const interoEntro = (testo: string, durata: number): number => durata - letturaIn(testo, durata);

/**
 * I tetti di una sequenza di elementi (passi, nodi, voci, note): `ultimi[i]` e' il frame piu' tardo in cui l'elemento i
 * puo' entrare da solo; ciascuno lascia `distanza` frame a quelli che seguono. Mai prima di `primo + i * distanza`:
 * nelle scene cortissime vince la distanza.
 */
export function inSequenza(ultimi: number[], distanza: number, primo = -Infinity): number[] {
  const tetti = [...ultimi];
  for (let i = tetti.length - 2; i >= 0; i--) tetti[i] = Math.min(tetti[i], tetti[i + 1] - distanza);
  return tetti.map((t, i) => Math.max(primo + i * distanza, t));
}
