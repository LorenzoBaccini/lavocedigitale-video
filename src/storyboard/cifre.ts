import type { Scena, Storyboard } from "./tipi.ts";

const MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

const UNITA: Record<string, number> = {
  zero: 0, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9,
  dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16,
  diciassette: 17, diciotto: 18, diciannove: 19,
};

const DECINE: Record<string, number> = {
  venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90,
};

type Parziale = { valore: number; resto: string };

const perLunghezza = (voci: string[]): string[] => [...voci].sort((a, b) => b.length - a.length);

const unita = (s: string): Parziale | null => {
  for (const p of perLunghezza(Object.keys(UNITA))) {
    if (s.startsWith(p)) return { valore: UNITA[p], resto: s.slice(p.length) };
  }
  return null;
};

const sotto100 = (s: string): Parziale | null => {
  for (const [d, v] of Object.entries(DECINE)) {
    if (s.startsWith(d)) {
      const u = unita(s.slice(d.length));
      return u && u.valore >= 1 && u.valore <= 9 ? { valore: v + u.valore, resto: u.resto } : { valore: v, resto: s.slice(d.length) };
    }
    const radice = d.slice(0, -1);
    if (s.startsWith(radice)) {
      const u = unita(s.slice(radice.length));
      if (u && (u.valore === 1 || u.valore === 8)) return { valore: v + u.valore, resto: u.resto };
    }
  }
  return unita(s);
};

const sotto1000 = (s: string): Parziale | null => {
  const cento = s.match(/^(due|tre|quattro|cinque|sei|sette|otto|nove)?(?:cent(?=ott)|cento)/);
  if (!cento) return sotto100(s);
  const base = (cento[1] ? UNITA[cento[1]] : 1) * 100;
  const resto = s.slice(cento[0].length);
  const coda = resto ? sotto100(resto) : null;
  return coda ? { valore: base + coda.valore, resto: coda.resto } : { valore: base, resto };
};

export const paroleInNumero = (testo: string): number | null => {
  let s = testo.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (!/^[a-z]+$/.test(s)) return null;

  let migliaia = 0;
  if (s.startsWith("mille")) {
    migliaia = 1000;
    s = s.slice(5);
  } else {
    const i = s.indexOf("mila");
    if (i > 0) {
      const moltiplicatore = sotto1000(s.slice(0, i));
      if (!moltiplicatore || moltiplicatore.resto !== "" || moltiplicatore.valore < 2) return null;
      migliaia = moltiplicatore.valore * 1000;
      s = s.slice(i + 4);
    }
  }

  if (s === "") return migliaia > 0 ? migliaia : null;
  const coda = sotto1000(s);
  return coda && coda.resto === "" ? migliaia + coda.valore : null;
};

const cifraInNumero = (token: string): number => {
  if (token.includes(",")) return Number(token.replaceAll(".", "").replace(",", "."));
  return /^\d{1,3}(\.\d{3})+$/.test(token) ? Number(token.replaceAll(".", "")) : Number(token);
};

const DATA_NUMERICA = /\d{1,2}[./]\d{1,2}[./]\d{4}/;

// Una sigla mescola lettere e cifre nella stessa parola: 2FA, 5G, H2O, Wi-Fi 6E, 8GB.
const SIGLA = /(?<![\p{L}\d])(?=[\p{L}\d]*\p{L})(?=[\p{L}\d]*\d)[\p{L}\d]+(?![\p{L}\d])/gu;

// Gli ordinali in lettere valgono come numeri solo dalla parte dell'articolo: nello storyboard «secondo»
// vuol dire spesso «stando a», e chiederlo come 2 darebbe falsi allarmi.
const ORDINALI: Record<string, number> = {
  second: 2, terz: 3, quart: 4, quint: 5, sest: 6, settim: 7, ottav: 8, non: 9, decim: 10,
};
const ordinale = (parola: string): number | null => {
  const m = parola.match(/^(\p{L}+)[oaie]$/u);
  return m && Object.hasOwn(ORDINALI, m[1]) ? ORDINALI[m[1]] : null;
};

/** I numeri dell'articolo, compresi gli ordinali in lettere («seconda» → 2). */
export const numeriDellArticolo = (testo: string): number[] => [
  ...numeriDaTesto(testo),
  ...[...testo.toLowerCase().matchAll(/\p{L}+/gu)].map(([p]) => ordinale(p)).filter((n): n is number => n !== null),
];

/**
 * Cio' che un testo dello storyboard chiede all'articolo: i numeri fuori dalle sigle, e le sigle intere.
 * Una sigla va bene se l'articolo la scrive uguale o se ha il suo numero («2FA» con «due fattori»).
 */
export function richiesteDi(testo: string): { numeri: number[]; sigle: { sigla: string; numeri: number[] }[] } {
  const sigle = [...testo.matchAll(SIGLA)].map(([s]) => ({ sigla: s, numeri: numeriDaTesto(s) }));
  return { numeri: numeriDaTesto(testo.replace(SIGLA, " ")), sigle };
}
export const QUOTIDIANE = new Set(["uno", "una", "zero", "sei"]);

const mesiNumerici = (testo: string): number[] =>
  [...testo.matchAll(new RegExp(DATA_NUMERICA, "g"))].map(([d]) => Number(d.split(/[./]/)[1]));

export const numeriDaTesto = (testo: string): number[] => {
  const numeri: number[] = [];
  for (const [token] of testo.matchAll(/\d{1,2}[./]\d{1,2}[./]\d{4}|\d[\d.,]*\d|\d|\p{L}+/gu)) {
    if (DATA_NUMERICA.test(token) && /^\d/.test(token)) {
      numeri.push(...token.split(/[./]/).map(Number));
      continue;
    }
    if (QUOTIDIANE.has(token.toLowerCase())) continue;
    const n = /^\d/.test(token) ? cifraInNumero(token) : paroleInNumero(token.toLowerCase());
    if (n !== null && !Number.isNaN(n)) numeri.push(n);
  }
  return numeri;
};

const stringhe = (valore: unknown): string[] => {
  if (typeof valore === "string") return [valore];
  if (Array.isArray(valore)) return valore.flatMap(stringhe);
  if (valore && typeof valore === "object") return Object.values(valore).flatMap(stringhe);
  return [];
};

const testiDellaScena = (scena: Scena): string[] => {
  const { tipo: _tipo, ...campi } = scena;
  if (scena.tipo === "data") {
    const { data: _data, ...altri } = campi as Extract<Scena, { tipo: "data" }>;
    return stringhe(altri);
  }
  return stringhe(campi);
};

export const cifreMancanti = (sb: Storyboard, testoArticolo: string): string[] => {
  const nellArticolo = new Set(numeriDellArticolo(testoArticolo));
  const articolo = testoArticolo.toLowerCase();
  const sigleArticolo = new Set([...testoArticolo.matchAll(SIGLA)].map(([s]) => s.toLowerCase()));
  const mesiInCifre = new Set(mesiNumerici(testoArticolo));
  const mancanti: string[] = [];

  sb.frasi.forEach((frase, i) => {
    const etichetta = `frase ${i + 1}`;
    const richieste: { nome: string; presente: boolean }[] = [];

    const testi = [frase.testo, ...testiDellaScena(frase.scena)].map(richiesteDi);
    const numeri = testi.flatMap((t) => t.numeri);
    for (const n of new Set(numeri.filter((x) => x !== 1))) richieste.push({ nome: String(n), presente: nellArticolo.has(n) });
    for (const { sigla, numeri: suoi } of testi.flatMap((t) => t.sigle)) {
      const presente = sigleArticolo.has(sigla.toLowerCase()) || suoi.every((n) => n === 1 || nellArticolo.has(n));
      richieste.push({ nome: sigla, presente });
    }

    if (frase.scena.tipo === "data") {
      const [anno, mese, giorno] = frase.scena.data.split("-").map(Number);
      const nomeMese = MESI[mese - 1];
      if (giorno !== 1) richieste.push({ nome: String(giorno), presente: nellArticolo.has(giorno) });
      richieste.push({ nome: String(anno), presente: nellArticolo.has(anno) });
      richieste.push({ nome: nomeMese, presente: mesiInCifre.has(mese) || new RegExp(`(?<!\\p{L})${nomeMese}(?!\\p{L})`, "u").test(articolo) });
    }

    const viste = new Set<string>();
    for (const { nome, presente } of richieste) {
      if (presente || viste.has(nome)) continue;
      viste.add(nome);
      mancanti.push(`${etichetta}: ${nome} non è nell'articolo`);
    }
  });

  return mancanti;
};
