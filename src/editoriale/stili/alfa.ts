/** Un colore `#rrggbb` con l'opacita' data, come `rgba(r,g,b,a)`. */
export function conAlfa(colore: string, alfa: number): string {
  const n = Number.parseInt(colore.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}
