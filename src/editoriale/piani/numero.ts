import type { ScenaDi } from "../../scenes/props.ts";
import type { TestoAschermo } from "../piano.ts";
import { interoEntro } from "../lettura.ts";
import { quandoDice, quandoDiceUna } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

/** L'unita' entra tanti frame dopo la cifra. */
const DOPO_CIFRA = 8;
/** In quanti frame unita' e nota entrano in dissolvenza: da li' sono intere. */
export const DISSOLVENZA_SOTTO = 8;

/** Oltre questi frame di foglio senza cifra, la cifra entra subito e conta fino al valore detto. */
const ATTESA_MASSIMA = 24;
/** Il frame in cui parte il conteggio. */
const INIZIO_CONTA = 6;

/** Il conteggio della cifra: da 0 al frame `da` fino al valore pieno al frame `a`. */
export interface Conta {
  da: number;
  a: number;
}

// solo interi, con i punti delle migliaia e una percentuale in fondo: «1 su 3» o «2,5» restano fermi
const CONTABILE = /^(\d{1,3}(?:\.\d{3})+|\d+)(%?)$/;

const migliaia = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** La cifra come si legge al frame `f`: durante il conteggio sale in fretta e rallenta arrivando, poi resta piena. */
export function cifraAl(numero: string, f: number, conta: Conta | undefined): string {
  const m = CONTABILE.exec(numero);
  if (!conta || !m || f >= conta.a) return numero;
  const valore = Number(m[1].replace(/\./g, ""));
  const t = Math.max(0, Math.min(1, (f - conta.da) / Math.max(1, conta.a - conta.da)));
  const n = Math.round(valore * (1 - (1 - t) ** 3));
  return `${m[1].includes(".") ? migliaia(n) : String(n)}${m[2]}`;
}

export interface PianoNumero extends PianoCarta {
  numero: number;
  /** se la voce dice la cifra tardi: la cifra entra a `conta.da` e conta fino a `conta.a` */
  conta?: Conta;
  sottolinea: number;
  unita?: number;
  nota?: number;
}

// La cifra stampata grande, come in un'infografica di giornale: entra con la voce, il pennarello la sottolinea
// sulla chiave; sotto l'unita' e la nota in corsivo. Cifra, unita' e nota restano da leggere prima dello stacco: se la
// voce le dice tardi, entrano prima. La nota detta prima della cifra entra con la voce: «un lampeggio ogni trentasei
// secondi vale cento» lasciava il foglio vuoto per tre secondi (contatore, 12 nov 2026).
export function pianoNumero(s: ScenaDi<"numero">, durata: number): PianoNumero {
  const { voce } = s;
  const tetto = Math.min(durata - 40, interoEntro(s.numero, durata) - 3, s.unita ? interoEntro(s.unita, durata) - DOPO_CIFRA - DISSOLVENZA_SOTTO : Infinity);
  const numero = Math.max(4, Math.min(tetto, quandoDice(voce, s.numero, 8)));
  const chiave = voce.parole[voce.chiave]?.da ?? numero + 10;
  const sottolinea = Math.min(durata - 14, Math.max(numero + 10, chiave + 3));
  const unita = s.unita ? numero + DOPO_CIFRA : undefined;
  const detta = s.nota ? quandoDiceUna(voce, s.nota, Infinity) : Infinity;
  const primaDellaCifra = detta < numero ? Math.max(4, detta) : Infinity;
  const nota = s.nota ? Math.min(durata - 16, interoEntro(s.nota, durata) - DISSOLVENZA_SOTTO, Math.max(sottolinea + 10, Math.round(durata * 0.45)), primaDellaCifra) : undefined;
  const testi: TestoAschermo[] = [
    { testo: s.etichetta, da: 4 },
    { testo: s.numero, da: numero + 3 },
    ...(s.unita && unita !== undefined ? [{ testo: s.unita, da: unita + DISSOLVENZA_SOTTO }] : []),
    ...(s.nota && nota !== undefined ? [{ testo: s.nota, da: nota + DISSOLVENZA_SOTTO }] : []),
  ];
  const eventi = [4, numero, sottolinea, ...[unita, nota].filter((e): e is number => e !== undefined)];
  // la cifra detta tardi lasciava il foglio vuoto (Motors Scam, 26 nov 2026): entra subito e conta fino alla voce
  const conta = numero > ATTESA_MASSIMA && CONTABILE.test(s.numero) ? { da: INIZIO_CONTA, a: numero } : undefined;
  return { numero, sottolinea, unita, nota, conta, ...suCarta(testi, [], eventi, durata, s.contesto) };
}
