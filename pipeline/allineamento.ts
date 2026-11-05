import { normalizza } from "../src/sottotitoli.ts";

/** L'`alignment` di ElevenLabs `with-timestamps`: un tempo d'inizio e di fine per carattere, in secondi. */
export interface Allineamento {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ParolaAllineata {
  testo: string;
  inizio: number;
  fine: number;
}

const LETTERA = /[\p{L}\p{N}]/u;

const arrotonda = (s: number) => Math.round(s * 1000) / 1000;

// I tempi vanno dalla prima all'ultima lettera: la voce allunga il segno di punteggiatura fino alla parola dopo.
function parola(caratteri: string[], inizi: number[], fini: number[], da: number, a: number): ParolaAllineata {
  const indici = Array.from({ length: a - da }, (_, k) => da + k);
  const lettere = indici.filter((i) => LETTERA.test(caratteri[i]));
  const dentro = lettere.length ? lettere : indici;
  return { testo: caratteri.slice(da, a).join(""), inizio: inizi[dentro[0]], fine: fini[dentro[dentro.length - 1]] };
}

export function paroleDaAllineamento(allineamento: Allineamento): ParolaAllineata[] {
  const { characters: c, character_start_times_seconds: inizi, character_end_times_seconds: fini } = allineamento;
  const parole: ParolaAllineata[] = [];
  let da = -1;
  for (let i = 0; i <= c.length; i++) {
    const spazio = i === c.length || /\s/u.test(c[i]);
    if (!spazio && da < 0) da = i;
    if (spazio && da >= 0) {
      parole.push(parola(c, inizi, fini, da, i));
      da = -1;
    }
  }
  return parole;
}

/** Assegna le parole della voce alle frasi, in ordine; il testo resta quello dello storyboard. */
export function frasiDaParole(parole: ParolaAllineata[], frasi: string[]): ParolaAllineata[][] {
  const copione = frasi.map((f) => f.split(/\s+/).filter(Boolean));
  const attese = copione.flat().length;
  if (attese !== parole.length) {
    throw new Error(`voce non allineata: ${attese} parole nel copione, ${parole.length} nell'allineamento`);
  }
  let k = 0;
  return copione.map((testi) =>
    testi.map((testo) => {
      const p = parole[k++];
      if (normalizza(testo) !== normalizza(p.testo)) {
        throw new Error(`voce non allineata: la parola ${k} del copione è «${testo}», la voce ha «${p.testo}»`);
      }
      return { ...p, testo };
    }),
  );
}

/** Secondi in cui tagliare fra una frase e la successiva: a metà della pausa fra le due. */
export function tagliFrasi(frasi: ParolaAllineata[][]): number[] {
  return frasi.slice(1).map((f, i) => arrotonda((frasi[i][frasi[i].length - 1].fine + f[0].inizio) / 2));
}
