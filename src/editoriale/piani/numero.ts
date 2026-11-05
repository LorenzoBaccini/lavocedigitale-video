import type { ScenaDi } from "../../scenes/props.ts";
import type { TestoAschermo } from "../piano.ts";
import { quandoDice } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export interface PianoNumero extends PianoCarta {
  numero: number;
  sottolinea: number;
  unita?: number;
  nota?: number;
}

// La cifra stampata grande, come in un'infografica di giornale: entra con la voce, il pennarello la sottolinea
// sulla chiave; sotto l'unita' e la nota in corsivo.
export function pianoNumero(s: ScenaDi<"numero">, durata: number): PianoNumero {
  const { voce } = s;
  const numero = Math.max(4, Math.min(durata - 40, quandoDice(voce, s.numero, 8)));
  const chiave = voce.parole[voce.chiave]?.da ?? numero + 10;
  const sottolinea = Math.min(durata - 14, Math.max(numero + 10, chiave + 3));
  const unita = s.unita ? numero + 8 : undefined;
  const nota = s.nota ? Math.min(durata - 16, Math.max(sottolinea + 10, Math.round(durata * 0.45))) : undefined;
  const testi: TestoAschermo[] = [
    { testo: s.etichetta, da: 4 },
    { testo: s.numero, da: numero + 3 },
    ...(s.unita && unita !== undefined ? [{ testo: s.unita, da: unita + 4 }] : []),
    ...(s.nota && nota !== undefined ? [{ testo: s.nota, da: nota + 4 }] : []),
  ];
  const eventi = [4, numero, sottolinea, ...[unita, nota].filter((e): e is number => e !== undefined)];
  return { numero, sottolinea, unita, nota, ...suCarta(testi, [], eventi, durata, s.contesto) };
}
