import { normalizza } from "../sottotitoli.ts";
import { testoAschermo } from "../testoAschermo.ts";
import { interoEntro } from "./lettura.ts";
import type { Voce } from "./voce.ts";

/** Una parola di un titolo con il frame in cui la voce la dice (o in cui entra, se la voce non la dice). */
export interface ParolaTitolo {
  t: string;
  da: number;
}

// le parole entrano due frame prima di essere dette; intere tre frame dopo
const ANTICIPO = 2;
/** Frame in cui la parola e' interamente a schermo (vedi `Titolo`). */
export const intera = (p: { da: number }) => p.da - ANTICIPO + 3;

/**
 * Parole di un testo scritto (titolo, evidenza…) con i loro tempi: se la voce dice la parola (in ordine), entra con lei;
 * altrimenti `passo` frame dopo la precedente. La prima parola non entra prima di `inizio`.
 */
export function paroleTitolo(testo: string, voce: Voce, inizio: number, passo = 3): ParolaTitolo[] {
  const scritte = paroleScritte(testo);
  let cursore = 0;
  let ultimo = inizio - passo;
  return scritte.map((t) => {
    const n = normalizza(t);
    let da = ultimo + passo;
    for (let i = cursore; n && i < voce.parole.length; i++) {
      if (normalizza(voce.parole[i].t) === n) {
        // la voce la dice piu' avanti: la parola aspetta lei
        if (voce.parole[i].da >= da) da = voce.parole[i].da;
        cursore = i + 1;
        break;
      }
    }
    ultimo = da;
    return { t, da };
  });
}

/**
 * Indici delle parole del titolo che ripetono la chiave detta (le prime parole di `chiave`, dalla piu' lunga sequenza
 * che il titolo contiene); se il titolo non la contiene, la sua ultima parola.
 */
export function paroleInAccento(titolo: { t: string }[], chiave: string[]): number[] {
  const n = titolo.map((p) => normalizza(p.t));
  const c = chiave.map(normalizza).filter(Boolean);
  for (let lung = Math.min(3, c.length); lung > 0; lung--) {
    for (let i = 0; i + lung <= n.length; i++) {
      if (c.slice(0, lung).every((w, j) => n[i + j] === w)) return Array.from({ length: lung }, (_, j) => i + j);
    }
  }
  return titolo.length ? [titolo.length - 1] : [];
}

/** Le parole di un testo come le scrive lo schermo. */
const paroleScritte = (testo: string) => testoAschermo(testo).split(/\s+/).filter(Boolean);

/** L'ultimo frame in cui puo' entrare l'ultima parola di `testo` perche' il testo, intero, resti da leggere (vedi `lettura`). */
export const ultimaEntro = (testo: string, durata: number) => interoEntro(paroleScritte(testo).join(" "), durata) + ANTICIPO - 3;

/** Come `entroIl`, col limite anche della lettura: il titolo e' intero in tempo per leggerlo prima dello stacco. */
export const entroLettura = (parole: ParolaTitolo[], durata: number, limite = Infinity): ParolaTitolo[] =>
  entroIl(parole, Math.min(limite, ultimaEntro(testoDi(parole), durata)));

/**
 * Parole che seguono la voce una a una (la frase detta del gancio): l'ultima resta da leggere prima dello stacco. Se la
 * voce la dice tardi, lei e quelle subito prima anticipano quanto basta, `passo` frame l'una dall'altra; le altre restano
 * sulla voce.
 */
export function codaInTempo(parole: ParolaTitolo[], durata: number, passo = 2): ParolaTitolo[] {
  let tetto = parole.length ? ultimaEntro(parole[parole.length - 1].t, durata) : 0;
  const fuori = [...parole];
  for (let i = fuori.length - 1; i >= 0 && fuori[i].da > tetto; i--) {
    fuori[i] = { ...fuori[i], da: Math.max(0, tetto) };
    tetto = fuori[i].da - passo;
  }
  return fuori;
}

/** Se l'ultima parola entrerebbe oltre `limite`, i tempi si comprimono verso l'inizio: il titolo e' intero prima dello stacco. */
export function entroIl(parole: ParolaTitolo[], limite: number): ParolaTitolo[] {
  const ultimo = parole[parole.length - 1]?.da ?? 0;
  if (ultimo <= limite) return parole;
  const primo = Math.min(parole[0].da, limite);
  return parole.map((p) => ({ ...p, da: Math.round(primo + ((p.da - parole[0].da) * (limite - primo)) / Math.max(1, ultimo - parole[0].da)) }));
}

// larghezza media di un carattere del serif, in em; stima per eccesso (meglio una riga in piu' che una in meno)
const CARATTERE = 0.52;

/**
 * Altezza stimata di un blocco di righe del `Titolo` largo `larghezza`: ogni riga va a capo quante volte serve.
 * `carattere` e' la larghezza dei caratteri dello stile (`Stile.larghezza`) rispetto al serif.
 * Serve prima del fotogramma (la camera ne tiene conto); la misura vera la fa il controllo d'impaginazione.
 */
export function altezzaRighe(righe: { testo: string; size: number }[], larghezza = 920, carattere = 1): number {
  const linee = righe.map((r) => Math.max(1, Math.ceil((r.testo.length * r.size * CARATTERE * carattere) / larghezza)) * r.size * 1.12);
  return linee.reduce((a, b) => a + b, 0) + 4 * Math.max(0, righe.length - 1);
}

/** Testo delle parole, per il controllo di ridondanza. */
export const testoDi = (parole: { t: string }[]) => parole.map((p) => p.t).join(" ");

/** Frame in cui l'ultima parola e' a schermo. */
export const fineDi = (parole: { da: number }[]) => (parole.length ? intera(parole[parole.length - 1]) : 0);
