export const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
export const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];

export interface Mese {
  mese: string;
  anno: number;
  giorno: number;
  /** le caselle della pagina, settimana per settimana da lunedi': il numero del giorno o null */
  celle: (number | null)[];
  /** indice della casella del giorno */
  casella: number;
}

// La pagina del mese di un'agenda per la data AAAA-MM-GG: settimane da lunedi', caselle vuote prima del primo e dopo l'ultimo.
export function paginaMese(data: string): Mese {
  const [anno, m, giorno] = data.split("-").map(Number);
  const primo = (new Date(Date.UTC(anno, m - 1, 1)).getUTCDay() + 6) % 7;
  const giorni = new Date(Date.UTC(anno, m, 0)).getUTCDate();
  const celle: (number | null)[] = [...Array(primo).fill(null), ...Array.from({ length: giorni }, (_, i) => i + 1)];
  while (celle.length % 7) celle.push(null);
  return { mese: MESI[m - 1], anno, giorno, celle, casella: primo + giorno - 1 };
}
