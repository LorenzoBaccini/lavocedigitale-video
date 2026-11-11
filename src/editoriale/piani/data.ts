import type { ScenaDi } from "../../scenes/props.ts";
import type { Mese } from "../carta/calendario.ts";
import { paginaMese } from "../carta/calendario.ts";
import type { Effetto, TestoAschermo } from "../piano.ts";
import { interoEntro } from "../lettura.ts";
import { quandoDice } from "../voce.ts";
import type { PianoCarta } from "./carta.ts";
import { suCarta } from "./carta.ts";

export interface PianoData extends PianoCarta {
  pagina: Mese;
  /** il pennarello cerchia il giorno */
  cerchio: number;
  /** il testo barrato si scrive, poi si barra */
  scritto?: number;
  barra?: number;
  timbro?: number;
}

// La data: la pagina del mese di un'agenda. Il giorno si cerchia a pennarello quando la voce lo dice; sotto, scritto
// a mano, cio' che finisce (`barrato`) viene barrato sulla voce; il timbro, se c'e', batte per ultimo.
export function pianoData(s: ScenaDi<"data">, durata: number): PianoData {
  const { voce } = s;
  const pagina = paginaMese(s.data);
  // il testo barrato (intero 4 frame dopo) e il timbro (2 dopo) restano da leggere; ognuno lascia il posto a chi segue
  const tettoTimbro = s.timbro ? Math.min(durata - 12, interoEntro(s.timbro, durata) - 2) : Infinity;
  const tettoBarra = Math.min(durata - 24, tettoTimbro - 16);
  const tettoScritto = s.barrato ? interoEntro(s.barrato, durata) - 4 : Infinity;
  const giorno = quandoDice(voce, `${pagina.giorno} ${pagina.mese}`, quandoDice(voce, String(pagina.giorno), Math.round(durata * 0.2)));
  const cerchio = Math.max(6, Math.min(durata - 30, s.barrato ? Math.min(tettoBarra - 20, tettoScritto - 8) : Infinity, giorno));
  const barra = s.barrato ? Math.min(tettoBarra, Math.max(cerchio + 20, quandoDice(voce, s.barrato, Math.round(durata * 0.6)))) : undefined;
  const scritto = barra !== undefined ? Math.min(tettoScritto, Math.max(cerchio + 8, barra - 16)) : undefined;
  const timbro = s.timbro ? Math.min(tettoTimbro, (barra ?? Math.round(durata * 0.55)) + 16) : undefined;
  const testi: TestoAschermo[] = [
    { testo: s.etichetta, da: 4 },
    { testo: `${pagina.mese} ${pagina.anno}`, da: 4 },
    ...(s.barrato && scritto !== undefined ? [{ testo: s.barrato, da: scritto + 4 }] : []),
    ...(s.timbro && timbro !== undefined ? [{ testo: s.timbro, da: timbro + 2 }] : []),
  ];
  const suoni: Effetto[] = [
    ...(timbro !== undefined ? [{ da: timbro, suono: "timbro" as const }] : []),
  ];
  const eventi = [4, cerchio, ...[scritto, barra, timbro].filter((e): e is number => e !== undefined)];
  return { pagina, cerchio, scritto, barra, timbro, ...suCarta(testi, suoni, eventi, durata, s.contesto) };
}
