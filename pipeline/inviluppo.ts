/** RMS per frame della clip, normalizzato sul picco (0..1): muove il logo e stima i tempi delle fixture senza parole. */
export function inviluppo(parlato: ArrayLike<number>, sr: number, codaCampioni: number, fps: number): number[] {
  // Senza togliere l'offset DC la base si alza e la bocca resta socchiusa nei silenzi.
  // La media è quella del parlato: la coda di silenzio resta a zero.
  const n = parlato.length;
  let media = 0;
  for (let i = 0; i < n; i++) media += parlato[i] / n;
  const totale = n + codaCampioni;
  const passo = Math.floor(sr / fps);
  const rms: number[] = [];
  for (let inizio = 0; inizio < totale; inizio += passo) {
    const fine = Math.min(inizio + passo, totale);
    let somma = 0;
    for (let i = inizio; i < Math.min(fine, n); i++) somma += (parlato[i] - media) ** 2;
    rms.push(Math.sqrt(somma / (fine - inizio)));
  }
  const massimo = Math.max(0, ...rms);
  // Sotto 1e-6 è solo rumore di arrotondamento (clip costante): resta tutto a zero.
  const picco = massimo >= 1e-6 ? massimo : Infinity;
  return rms.map((v) => Math.round((v / picco) * 1000) / 1000);
}
