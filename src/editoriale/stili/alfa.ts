/** Un colore `#rrggbb` con l'opacita' data, come `rgba(r,g,b,a)`. */
export function conAlfa(colore: string, alfa: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(colore)) throw new Error(`conAlfa vuole un colore #rrggbb, non ${colore}`);
  const n = Number.parseInt(colore.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}
