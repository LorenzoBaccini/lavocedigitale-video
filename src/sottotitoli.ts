export interface Parola {
  t: string;
  chiave: boolean;
}

export interface Blocco {
  parole: Parola[];
  da: number;
  a: number;
}

export const normalizza = (parola: string) => parola.normalize("NFC").toLocaleLowerCase("it").replace(/[^\p{L}\p{N}]/gu, "");

const FINE_PROPOSIZIONE = /[,.;:?!]$/;
const NUMERO = /^\d+([.,]\d+)?$/;
const MESI = new Set(["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]);
const UNITA = new Set(["gb", "mb", "tb", "kb", "ghz", "mhz", "hz", "mah", "w", "kw", "kwh", "mm", "cm", "km", "kg", "euro", "€", "%", "pollici", "mp", "fps"]);

// Giorno mese anno, numero e unità, nome e versione ("Windows 10"): fra le due parole non si va a capo.
function legate(a: string, b: string): boolean {
  if (FINE_PROPOSIZIONE.test(a)) return false;
  const x = a.toLocaleLowerCase("it");
  const y = b.toLocaleLowerCase("it").replace(/[,.;:?!]+$/, "");
  if (NUMERO.test(x)) return MESI.has(y) || UNITA.has(y);
  return NUMERO.test(y) && (MESI.has(x) || /^\p{Lu}/u.test(a));
}

function marcaChiave(parole: string[], chiave: string): boolean[] {
  const cercate = chiave.split(/\s+/).map(normalizza).filter(Boolean);
  const norm = parole.map(normalizza);
  const segnate = parole.map(() => false);
  if (!cercate.length) return segnate;
  for (let i = 0; i + cercate.length <= norm.length; i++) {
    if (cercate.every((c, j) => norm[i + j] === c)) cercate.forEach((_, j) => (segnate[i + j] = true));
  }
  return segnate;
}

function costoBlocco(n: number, totale: number, legato: boolean): number {
  if (n === totale && n === 1) return 0;
  if (n === 1) return 10;
  if (n === 5 && !legato) return Infinity;
  if (n > 5) return legato ? 50 : Infinity;
  return (n - 3) ** 2 + 0.5;
}

// Blocchi da 2-4 parole, il più vicino possibile a 3 e il meno possibile; i tagli cadono solo fra parole non legate.
function dimensioni(parole: string[]): number[] {
  const n = parole.length;
  const taglio = (i: number) => i === n || !legate(parole[i - 1], parole[i]);
  const migliore: { costo: number; prima: number }[] = Array.from({ length: n + 1 }, () => ({ costo: Infinity, prima: 0 }));
  migliore[n].costo = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (i > 0 && !taglio(i)) continue;
    // a parità di costo vince il blocco più lungo in testa
    for (let j = n; j > i; j--) {
      if (!taglio(j)) continue;
      const legato = parole.slice(i, j - 1).some((p, k) => legate(p, parole[i + k + 1]));
      const costo = costoBlocco(j - i, n, legato) + migliore[j].costo;
      if (costo < migliore[i].costo) migliore[i] = { costo, prima: j - i };
    }
  }
  const lunghezze: number[] = [];
  for (let i = 0; i < n; i += migliore[i].prima) lunghezze.push(migliore[i].prima);
  return lunghezze;
}

function proposizioni(parole: string[]): string[][] {
  const gruppi: string[][] = [];
  let inizio = 0;
  parole.forEach((p, i) => {
    if (FINE_PROPOSIZIONE.test(p) || i === parole.length - 1) {
      gruppi.push(parole.slice(inizio, i + 1));
      inizio = i + 1;
    }
  });
  return gruppi;
}

/** `inizi`: il frame in cui la voce dice ogni parola; senza, i blocchi si spartiscono la clip in proporzione ai caratteri. */
export function blocchiSottotitolo(testo: string, chiave: string, frames: number, inizi?: number[]): Blocco[] {
  const parole = testo.split(/\s+/).filter(Boolean);
  const segnate = marcaChiave(parole, chiave);
  const gruppi: Parola[][] = [];
  let i = 0;
  for (const n of proposizioni(parole).flatMap(dimensioni)) {
    gruppi.push(parole.slice(i, i + n).map((t, j) => ({ t, chiave: segnate[i + j] })));
    i += n;
  }
  if (inizi?.length === parole.length) {
    // il primo blocco parte da 0, gli altri alla loro prima parola, sempre almeno un frame dopo il precedente
    const entrate: number[] = [];
    let prima = 0;
    for (const g of gruppi) {
      entrate.push(entrate.length ? Math.max(entrate[entrate.length - 1] + 1, inizi[prima]) : 0);
      prima += g.length;
    }
    return gruppi.map((parole, j) => ({ parole, da: entrate[j], a: entrate[j + 1] ?? frames }));
  }
  const caratteri = gruppi.map((g) => g.reduce((s, p) => s + p.t.length, 0));
  const totale = caratteri.reduce((a, b) => a + b, 0) || 1;
  let cumulati = 0;
  return gruppi.map((parole, j) => {
    const da = Math.round((frames * cumulati) / totale);
    cumulati += caratteri[j];
    return { parole, da, a: j === gruppi.length - 1 ? frames : Math.round((frames * cumulati) / totale) };
  });
}
