import { corpo } from "../../anim.ts";
import { ALTEZZA, FONDO_TITOLO, LARGHEZZA_UTILE, TITOLO_TOP } from "../../impaginazione.ts";
import type { PianoGancio } from "../piani/gancio.ts";
import type { Stile } from "../stili/tipi.ts";
import type { Riga } from "../Titolo.tsx";

/** La fascia del gancio a parola: dal titolo in alto fin sopra il sottotitolo; il testo ci sta centrato in verticale. */
export const FASCIA_PAROLA = { alto: TITOLO_TOP, basso: ALTEZZA - FONDO_TITOLO };
const SPAZIO = FASCIA_PAROLA.basso - FASCIA_PAROLA.alto;
// margine sulla stima, che va a capo come il titolo ma con larghezze prudenti
const RIEMPIMENTO = 0.9;
const CRESCITA_MAX = 1.5;
/** La chiave e' almeno tanto piu' grande del resto. */
export const STACCO_CHIAVE = 1.6;
const DURATA_SOTTOLINEATURA = 9;

const LARGHE = new Set([..."mwMW"]);

/**
 * Quanti em occupa una parola in grassetto, stimata con prudenza: le maiuscole e m, w sono piu' larghe. Una parola non va mai
 * a capo. `chiave`: la stima piu' stretta per la riga della chiave, perche' diventi davvero enorme (il controllo
 * d'impaginazione misura quella vera).
 */
export const emDi = (parola: string, chiave = false): number =>
  [...parola].reduce((em, c) => em + (LARGHE.has(c) ? 0.92 : c !== c.toLowerCase() ? 0.74 : chiave ? 0.54 : 0.58), 0);

/** Quante linee fa una riga del titolo: le parole vanno a capo intere, come nel `Titolo` (spazio fra parole 0,24 em). */
export function lineeDi(parole: { t: string }[], size: number, larghezza: number): number {
  let linee = 1;
  let x = 0;
  for (const p of parole) {
    const w = emDi(p.t) * size * larghezza;
    if (x > 0 && x + 0.24 * size + w > LARGHEZZA_UTILE) {
      linee++;
      x = w;
    } else x += (x > 0 ? 0.24 * size : 0) + w;
  }
  return linee;
}

const altezzaDi = (righe: { parole: { t: string }[]; size: number }[], larghezza: number): number =>
  righe.reduce((h, r) => h + lineeDi(r.parole, r.size, larghezza) * r.size * 1.12, 0) + 4 * Math.max(0, righe.length - 1);

/** Le righe del gancio a parola: la domanda grande, la chiave enorme e sottolineata, ogni parola a tempo con la voce. */
export function titoloParola(piano: PianoGancio, stile: Stile): Riga[] {
  const { parole, grande } = piano;
  const L = stile.larghezza;
  const fasce = ([[0, grande[0]], [grande[0], grande[1]], [grande[1], parole.length]] as const)
    .map(([da, a], i) => ({ scelte: parole.slice(da, a), grossa: i === 1 }))
    .filter((r) => r.scelte.length > 0);
  const testo = (r: (typeof fasce)[number]) => r.scelte.map((p) => p.t).join(" ");
  const tetto = (r: (typeof fasce)[number]) => LARGHEZZA_UTILE / (Math.max(...r.scelte.map((p) => emDi(p.t, r.grossa))) * L);
  const chiave = Math.min(...fasce.filter((r) => r.grossa).map((r) => Math.min(tetto(r), corpo(testo(r), 300, 8, L))));
  const partenza = fasce.map((r) => (r.grossa ? chiave : Math.min(corpo(testo(r), 128, 26, L), chiave / STACCO_CHIAVE)));
  const corpi = (k: number) => {
    const sopra = Math.min(...fasce.filter((r) => r.grossa).map((r) => tetto(r)), chiave * k);
    return fasce.map((r, i) => Math.floor(r.grossa ? sopra : Math.min(tetto(r), partenza[i] * k, sopra / STACCO_CHIAVE)));
  };
  const altezza = (c: number[]) => altezzaDi(fasce.map((r, i) => ({ parole: r.scelte, size: c[i] })), L);
  let k = CRESCITA_MAX;
  while (k > 0.3 && altezza(corpi(k)) > SPAZIO * RIEMPIMENTO) k *= 0.95;
  const c = corpi(k);
  return fasce.map((r, i) => ({
    parole: r.scelte,
    size: c[i],
    peso: r.grossa ? 700 : 600,
    ...(r.grossa && { sottolinea: { da: piano.sottolinea, durata: DURATA_SOTTOLINEATURA, colore: stile.colori.accentoSuChiaro, seme: 4 } }),
  }));
}

/** Quanto e' alto il testo del gancio a parola secondo la stima: deve stare nella fascia. */
export const altezzaParola = (righe: Riga[], stile: Stile): number => altezzaDi(righe, stile.larghezza);

// la chiave e' entrata da un secondo (la molla del Titolo simula frame per frame: niente valori enormi); il resto non entra mai
const GIA = -30;
const MAI = 1e6;

/** Le stesse righe con la sola chiave visibile, gia' intera e del colore dato: il fantasma che la voce poi riempie. */
export const fantasmaChiave = (righe: Riga[], colore: string): Riga[] =>
  righe.map((r) => ({ ...r, sottolinea: undefined, parole: r.parole.map((p) => ({ ...p, colore, da: r.sottolinea ? GIA : MAI })) }));
