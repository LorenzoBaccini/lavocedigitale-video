import { ALTEZZA } from "../../impaginazione.ts";
import { clamp01, fase, liscio } from "../regia.ts";
import { contrasto, mescola } from "../stili/colore.ts";
import type { Stile } from "../stili/tipi.ts";
import type { Riga } from "../Titolo.tsx";

/** Il blocco resta pieno `fermo` frame, sale fino al titolo in `sale`, poi svanisce in `svanisce`: entro un secondo. */
export const DIVISO = { fermo: 10, sale: 10, svanisce: 8 };
export const FINE_DIVISO = DIVISO.fermo + DIVISO.sale + DIVISO.svanisce;

/** Quanto il blocco e' ancora pieno al frame f (1 pieno, 0 svanito). */
export const pienoDiviso = (f: number): number => 1 - clamp01((f - DIVISO.fermo - DIVISO.sale) / DIVISO.svanisce);

/** Il blocco al frame f: il bordo basso (dalla meta' del fotogramma alla quota sotto il titolo), quanto e' salito (0..1), quanto e' ancora pieno. */
export function bloccoDiviso(f: number, limite: number): { basso: number; sale: number; pieno: number } {
  const alto = Math.max(ALTEZZA / 2, limite);
  const sale = liscio(fase(f, DIVISO.fermo, DIVISO.fermo + DIVISO.sale));
  return { basso: alto + (limite - alto) * sale, sale, pieno: pienoDiviso(f) };
}

/** I colori del blocco: l'accento dello stile, e sopra il colore dello stile che ci si legge meglio (titolo e logo). */
export function coloriDiviso(stile: Stile): { fondo: string; testo: string } {
  const { fondo, superficie, velo, testo, inchiostro } = stile.colori;
  const candidati = [fondo, velo, superficie, testo, inchiostro.testo];
  const migliore = candidati.reduce((a, b) => (contrasto(b, stile.colori.accento) > contrasto(a, stile.colori.accento) ? b : a));
  return { fondo: stile.colori.accento, testo: migliore };
}

/** Le righe del titolo tinte per il blocco: col blocco pieno il colore del blocco, poi quello di sempre (testo e sottolineatura). */
export function tingiPerBlocco(righe: Riga[], stile: Stile, pieno: number): Riga[] {
  if (pieno <= 0) return righe;
  const { testo } = coloriDiviso(stile);
  const colore = mescola(stile.colori.testo, testo, pieno);
  return righe.map((r) => ({
    ...r,
    parole: r.parole.map((p) => ({ ...p, colore })),
    ...(r.sottolinea && { sottolinea: { ...r.sottolinea, colore: mescola(r.sottolinea.colore, testo, pieno) } }),
  }));
}
