// La regia comune delle scene editoriali: curve di movimento e la regola del secondo accento.
// Tutto e' funzione pura del frame.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Avanzamento lineare da `da` ad `a`, fermo agli estremi. */
export const fase = (f: number, da: number, a: number) => (a <= da ? (f >= a ? 1 : 0) : clamp01((f - da) / (a - da)));
export const liscio = (t: number) => t * t * (3 - 2 * clamp01(t));
export const uscita = (t: number) => 1 - (1 - clamp01(t)) ** 3;
/** Parte da fermo e arriva con un assestamento leggero (~2 %): il movimento ha un peso. */
export const conPeso = (t: number) => {
  const s = liscio(clamp01(t));
  const c = 0.9;
  return 1 + (c + 1) * (s - 1) ** 3 + c * (s - 1) ** 2;
};

/** Un'inquadratura ferma oltre questi frame (~2,5 s) riceve un secondo accento. */
export const PAUSA_MAX = 75;

/**
 * Accenti da aggiungere perche' fra due cambiamenti visibili non passino piu' di `max` frame:
 * ogni vuoto troppo lungo si spezza in parti uguali. `eventi` sono i frame in cui qualcosa cambia
 * (entra un titolo, si traccia un segno, stacca la camera); la scena dura `durata` frame.
 */
export function accentiMancanti(eventi: number[], durata: number, max = PAUSA_MAX): number[] {
  const punti = [...new Set([0, ...eventi.filter((e) => e >= 0 && e < durata).map(Math.round), durata])].sort((a, b) => a - b);
  return punti.slice(1).flatMap((b, i) => {
    const a = punti[i];
    const parti = Math.ceil((b - a) / max);
    return Array.from({ length: parti - 1 }, (_, k) => Math.round(a + ((b - a) * (k + 1)) / parti));
  });
}

/** Il vuoto piu' lungo fra due cambiamenti visibili, inizio e fine scena compresi. */
export function pausaPiuLunga(eventi: number[], durata: number): number {
  const punti = [...new Set([0, ...eventi.filter((e) => e >= 0 && e < durata), durata])].sort((a, b) => a - b);
  return Math.max(0, ...punti.slice(1).map((b, i) => b - punti[i]));
}
