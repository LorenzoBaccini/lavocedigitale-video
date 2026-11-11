import type { ScenaDi } from "../../scenes/props.ts";
import { normalizza } from "../../sottotitoli.ts";
import { testoAschermo } from "../../testoAschermo.ts";
import { interoEntro } from "../lettura.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { fineDi, paroleTitolo, testoDi } from "../titoli.ts";
import type { Voce } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export interface PianoCitazione extends PianoCarta {
  parole: ParolaTitolo[];
  fonte: number;
  sottolinea: number;
}

const INIZIO = 6;
const PASSO = 2;
/** In quanti frame la fonte entra in dissolvenza: da li' e' intera. */
export const DISSOLVENZA_FONTE = 8;
/** Quota delle parole della citazione che la voce deve dire, in ordine, perche' la citazione segua la voce. */
export const QUOTA_LETTA = 0.7;

/** Quante parole della citazione la voce dice, nello stesso ordine. */
function paroleDette(scritte: string[], voce: Voce): number {
  let cursore = 0;
  let dette = 0;
  for (const t of scritte) {
    const n = normalizza(t);
    const i = voce.parole.findIndex((p, k) => k >= cursore && n !== "" && normalizza(p.t) === n);
    if (i >= 0) {
      dette++;
      cursore = i + 1;
    }
  }
  return dette;
}

/**
 * I tempi delle parole della citazione. Segue la voce solo se la voce legge la citazione (quasi tutte le parole, in
 * ordine) e la prima parola cade con l'inizio del parlato; altrimenti si compone subito, a ritmo di lettura.
 * Il virgolettato non aspetta mai la voce: una parola comune («il», «e») detta piu' avanti lo bloccava (prova sul runner).
 */
export function paroleCitazione(testo: string, voce: Voce): ParolaTitolo[] {
  const scritte = testoAschermo(testo).split(/\s+/).filter(Boolean);
  const lettura = scritte.map((t, i) => ({ t, da: INIZIO + i * PASSO }));
  const allineate = paroleTitolo(testo, voce, INIZIO, PASSO);
  const inizioParlato = voce.parole[0]?.da ?? 0;
  const letta = scritte.length > 0 && paroleDette(scritte, voce) / scritte.length >= QUOTA_LETTA;
  const inSincrono = (allineate[0]?.da ?? INIZIO) <= Math.max(INIZIO, inizioParlato) + PASSO;
  return letta && inSincrono ? allineate : lettura;
}

// Il ritaglio di giornale con la frase riportata alla lettera: le parole si compongono da subito a ritmo di lettura
// (con la voce solo se la voce la legge dall'inizio), poi la fonte; il pennarello sottolinea l'ultima riga.
export function pianoCitazione(s: ScenaDi<"citazione">, durata: number): PianoCitazione {
  const parole = paroleCitazione(s.testo, s.voce);
  // la fonte (intera a dissolvenza finita) e la citazione prima di lei restano da leggere prima dello stacco
  const tettoFonte = Math.min(durata - 16, interoEntro(s.fonte, durata) - DISSOLVENZA_FONTE);
  const limite = Math.min(durata - 24, interoEntro(testoDi(parole), durata), tettoFonte - 6);
  const fine = Math.min(limite, fineDi(parole));
  // se la frase e' lunga si compone piu' in fretta: deve essere intera in tempo per leggerla
  const scala = fineDi(parole) > limite ? Math.max(0, limite - 6) / Math.max(1, fineDi(parole)) : 1;
  const tempi = parole.map((p) => ({ ...p, da: Math.round(p.da * scala) }));
  const fonte = Math.min(tettoFonte, fine + 6);
  const sottolinea = Math.min(durata - 10, fonte + 8);
  const testi = [
    { testo: testoDi(tempi), da: fineDi(tempi) },
    { testo: s.fonte, da: fonte + DISSOLVENZA_FONTE },
  ];
  return { parole: tempi, fonte, sottolinea, ...suCarta(testi, [], [...tempi.map((p) => p.da), fonte, sottolinea], durata, s.contesto) };
}
