import type { Clip } from "./timing.ts";

export interface TempoParola {
  parola: string;
  da: number;
  a: number;
}

const SOGLIA = 0.05;
const PAUSA_MINIMA = 3;

// Sillabe italiane approssimate: un gruppo di vocali vale una sillaba.
export const sillabe = (parola: string) => Math.max(1, (parola.toLocaleLowerCase("it").match(/[aeiouàèéìíòóùú]+/g) ?? []).length);

// I frame in cui la voce parla davvero: fra il primo e l'ultimo sopra soglia, tolte le pause di almeno PAUSA_MINIMA frame.
export function framesParlati(inviluppo: number[], soglia = SOGLIA): number[] {
  const sopra = inviluppo.map((v) => v >= soglia);
  const inizio = sopra.indexOf(true);
  if (inizio < 0) return [];
  const fine = sopra.lastIndexOf(true);
  const parlati: number[] = [];
  for (let i = inizio; i <= fine; i++) {
    if (sopra[i]) {
      parlati.push(i);
      continue;
    }
    let j = i;
    while (!sopra[j]) j++;
    if (j - i < PAUSA_MINIMA) for (let k = i; k < j; k++) parlati.push(k);
    i = j - 1;
  }
  return parlati;
}

// Stima dei tempi per parola, in frame della clip: le sillabe si spartiscono in proporzione i frame parlati.
// Serve solo alle fixture senza i tempi della voce: vedi `tempiParole`.
export function stimaTempiParole(testo: string, inviluppo: number[]): TempoParola[] {
  const parole = testo.split(/\s+/).filter(Boolean);
  const parlati = framesParlati(inviluppo);
  if (!parlati.length) return parole.map((parola) => ({ parola, da: 0, a: inviluppo.length }));
  const pesi = parole.map(sillabe);
  const totale = pesi.reduce((a, b) => a + b, 0);
  // la parola i copre i frame parlati [inizio, fine): dopo una pausa la successiva riparte oltre il silenzio
  const indice = (quota: number) => Math.min(parlati.length, Math.round(quota * parlati.length));
  let cumulate = 0;
  return parole.map((parola, i) => {
    const inizio = indice(cumulate / totale);
    cumulate += pesi[i];
    const fine = Math.max(inizio + 1, indice(cumulate / totale));
    return { parola, da: parlati[Math.min(inizio, parlati.length - 1)], a: parlati[Math.min(fine, parlati.length) - 1] + 1 };
  });
}

/** Tempi per parola in frame della clip: quelli della voce se ci sono, altrimenti la stima. */
export function tempiParole(testo: string, clip: Clip, fps: number): TempoParola[] {
  if (!clip.parole) return stimaTempiParole(testo, clip.inviluppo);
  return clip.parole.map((p) => {
    const da = Math.round(p.da * fps);
    return { parola: p.t, da, a: Math.max(da + 1, Math.round(p.a * fps)) };
  });
}
