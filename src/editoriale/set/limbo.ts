/** Dove il pavimento comincia a curvare, il raggio della curva, fin dove arrivano pavimento e parete. */
export const LIMBO = { piega: -3, raggio: 3, davanti: 40, alto: 40 };

/**
 * Il profilo del limbo nel piano (z, y), dal davanti verso il fondo: pavimento a quota 0, quarto di cerchio,
 * parete verticale a z = piega - raggio. Il fondale si estrude lungo x.
 */
export function profiloLimbo(passi = 24): [number, number][] {
  const { piega, raggio, davanti, alto } = LIMBO;
  const punti: [number, number][] = [[davanti, 0], [piega, 0]];
  for (let i = 1; i <= passi; i++) {
    const a = (i / passi) * (Math.PI / 2);
    punti.push([piega - raggio * Math.sin(a), raggio * (1 - Math.cos(a))]);
  }
  punti.push([piega - raggio, alto]);
  return punti;
}
