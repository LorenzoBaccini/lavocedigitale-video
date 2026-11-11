const canali = (colore: string): [number, number, number] => {
  if (!/^#[0-9a-f]{6}$/i.test(colore)) throw new Error(`colore #rrggbb atteso, non ${colore}`);
  const n = Number.parseInt(colore.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const esadecimale = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** `a` verso `b` di `t` (0..1), in #rrggbb. */
export const mescola = (a: string, b: string, t: number): string => {
  const [x, y] = [canali(a), canali(b)];
  return esadecimale(x.map((v, i) => v + (y[i] - v) * t));
};

/** `sopra` con opacita' `alfa` appoggiato su `sotto`. */
export const sovrapponi = (sopra: string, alfa: number, sotto: string): string => mescola(sotto, sopra, alfa);

const luminanza = (colore: string) => {
  const [r, g, b] = canali(colore).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Il rapporto di contrasto WCAG fra due colori #rrggbb (1..21). */
export const contrasto = (a: string, b: string): number => {
  const [x, y] = [luminanza(a), luminanza(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
