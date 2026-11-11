import type { ScenaDi } from "../../scenes/props.ts";
import type { TestoAschermo } from "../piano.ts";
import { interoEntro } from "../lettura.ts";
import { quandoDice } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

/** L'unita' entra tanti frame dopo la cifra. */
const DOPO_CIFRA = 8;
/** In quanti frame unita' e nota entrano in dissolvenza: da li' sono intere. */
export const DISSOLVENZA_SOTTO = 8;

export interface PianoNumero extends PianoCarta {
  numero: number;
  sottolinea: number;
  unita?: number;
  nota?: number;
}

// La cifra stampata grande, come in un'infografica di giornale: entra con la voce, il pennarello la sottolinea
// sulla chiave; sotto l'unita' e la nota in corsivo. Cifra, unita' e nota restano da leggere prima dello stacco: se la
// voce le dice tardi, entrano prima.
export function pianoNumero(s: ScenaDi<"numero">, durata: number): PianoNumero {
  const { voce } = s;
  const tetto = Math.min(durata - 40, interoEntro(s.numero, durata) - 3, s.unita ? interoEntro(s.unita, durata) - DOPO_CIFRA - DISSOLVENZA_SOTTO : Infinity);
  const numero = Math.max(4, Math.min(tetto, quandoDice(voce, s.numero, 8)));
  const chiave = voce.parole[voce.chiave]?.da ?? numero + 10;
  const sottolinea = Math.min(durata - 14, Math.max(numero + 10, chiave + 3));
  const unita = s.unita ? numero + DOPO_CIFRA : undefined;
  const nota = s.nota ? Math.min(durata - 16, interoEntro(s.nota, durata) - DISSOLVENZA_SOTTO, Math.max(sottolinea + 10, Math.round(durata * 0.45))) : undefined;
  const testi: TestoAschermo[] = [
    { testo: s.etichetta, da: 4 },
    { testo: s.numero, da: numero + 3 },
    ...(s.unita && unita !== undefined ? [{ testo: s.unita, da: unita + DISSOLVENZA_SOTTO }] : []),
    ...(s.nota && nota !== undefined ? [{ testo: s.nota, da: nota + DISSOLVENZA_SOTTO }] : []),
  ];
  const eventi = [4, numero, sottolinea, ...[unita, nota].filter((e): e is number => e !== undefined)];
  return { numero, sottolinea, unita, nota, ...suCarta(testi, [], eventi, durata, s.contesto) };
}
