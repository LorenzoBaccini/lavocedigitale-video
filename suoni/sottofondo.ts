// Il sottofondo musicale: un loop calmo da notiziario esplicativo, tutto sintetizzato (nessun file con diritti).
// Pad lento con voci scordate di poco, tasti pizzicati sulle note dell'accordo, un basso morbido;
// quattro accordi, filtrato in basso, un po' di larghezza stereo e una coda di riverbero.
// Nessuna melodia: sta sotto la voce. Il loop non ha giunture (si genera due volte e si tiene il secondo giro).
// I temi cambiano tonalita', tempo e tocco dei tasti, cosi' un video non suona come il precedente.

export const SR = 48_000;

interface Accordo {
  radice: number;
  voci: number[];
}

export interface Tema {
  bpm: number;
  /** radice, poi le voci del pad (midi) */
  accordi: Accordo[];
  /** per ogni ottavo della battuta, la voce dell'accordo suonata dai tasti; null e' una pausa */
  giro: (number | null)[];
  /** i tempi della battuta su cui entra il basso */
  bassi: number[];
  /** decadimento dei tasti: base e aumento per armonica; piu' basso = suono piu' lungo e tondo */
  caduta: [number, number];
  armoniche: number;
  taglio: { tasti: number; pad: number };
  seme: number;
}

export const NOMI_TEMI = ["caldo", "chiaro", "notturno"] as const;
export type NomeTema = (typeof NOMI_TEMI)[number];

export const TEMI: Record<NomeTema, Tema> = {
  // Do maj9, La min9, Fa maj9, Sol 6/9 a 96 BPM, tasti in ottavi: il tema del video approvato
  caldo: {
    bpm: 96,
    accordi: [
      { radice: 48, voci: [55, 59, 62, 64] },
      { radice: 45, voci: [52, 55, 59, 60] },
      { radice: 41, voci: [53, 57, 60, 64] },
      { radice: 43, voci: [55, 57, 59, 62] },
    ],
    giro: [0, 1, 2, 1, 3, 1, 2, 0],
    bassi: [0, 2],
    caduta: [2.4, 2.2],
    armoniche: 5,
    taglio: { tasti: 3200, pad: 1500 },
    seme: 97,
  },
  // Re maj9, Si min9, Sol maj9, La sus a 84 BPM, tasti in quarti, piu' lunghi e tondi
  chiaro: {
    bpm: 84,
    accordi: [
      { radice: 50, voci: [57, 61, 64, 66] },
      { radice: 47, voci: [54, 57, 61, 62] },
      { radice: 43, voci: [54, 57, 59, 62] },
      { radice: 45, voci: [52, 57, 59, 62] },
    ],
    giro: [0, null, 2, null, 1, null, 3, null],
    bassi: [0],
    caduta: [1.3, 1.6],
    armoniche: 3,
    taglio: { tasti: 2600, pad: 1800 },
    seme: 31,
  },
  // La min9, Fa maj7, Do maj7, Mi min7 a 100 BPM, tasti sincopati e piu' scuri
  notturno: {
    bpm: 100,
    accordi: [
      { radice: 45, voci: [52, 55, 59, 60] },
      { radice: 41, voci: [53, 57, 60, 64] },
      { radice: 48, voci: [55, 59, 60, 64] },
      { radice: 40, voci: [55, 59, 62, 64] },
    ],
    giro: [0, null, 1, 2, null, 1, 3, null],
    bassi: [0, 2.5],
    caduta: [2.0, 2.6],
    armoniche: 4,
    taglio: { tasti: 2200, pad: 1300 },
    seme: 53,
  },
};

const battito = (t: Tema) => 60 / t.bpm;
export const durataLoop = (t: Tema) => t.accordi.length * 4 * battito(t);
/** Livello del loop: ~17 dB sotto la voce (-21 dBFS), che il ducking porta a ~23 dB mentre si parla. */
export const RMS_DB = -38;

/** Il file del tema, in `suoni/editoriale/`: il tema del video approvato tiene il nome di sempre. */
export const fileTema = (nome: NomeTema) => (nome === "caldo" ? "sottofondo" : `sottofondo-${nome}`);

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const cent = (c: number) => 2 ** (c / 1200);

function casuale(seme: number) {
  let s = seme;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function passaBasso(x: Float64Array, taglio: number): Float64Array {
  const a = Math.exp((-2 * Math.PI * taglio) / SR);
  const y = new Float64Array(x.length);
  let v = 0;
  let w = 0;
  // due poli: piu' morbido di uno, senza risonanza
  for (let i = 0; i < x.length; i++) {
    v = (1 - a) * x[i] + a * v;
    w = (1 - a) * v + a * w;
    y[i] = w;
  }
  return y;
}

/** Riverbero di Schroeder: quattro pettini smorzati in parallelo, due passa-tutto in serie. */
function riverbero(x: Float64Array, scarto: number): Float64Array {
  const pettini = [29.7, 37.1, 41.1, 43.7].map((ms) => Math.round(((ms + scarto) * SR) / 1000));
  const y = new Float64Array(x.length);
  for (const d of pettini) {
    const buf = new Float64Array(d);
    let k = 0;
    let lp = 0;
    for (let i = 0; i < x.length; i++) {
      const out = buf[k];
      lp = 0.6 * out + 0.4 * lp;
      buf[k] = x[i] + 0.84 * lp;
      y[i] += out / pettini.length;
      k = (k + 1) % d;
    }
  }
  for (const ms of [5, 1.7]) {
    const d = Math.round((ms * SR) / 1000);
    const buf = new Float64Array(d);
    let k = 0;
    for (let i = 0; i < y.length; i++) {
      const b = buf[k];
      const v = y[i] + 0.7 * b;
      buf[k] = v;
      y[i] = b - 0.7 * v;
      k = (k + 1) % d;
    }
  }
  return y;
}

/** Inviluppo a coseno rialzato: sale in `su` secondi, tiene, scende in `giu` secondi. */
const morbido = (t: number, durata: number, su: number, giu: number) => {
  if (t < 0 || t > durata + giu) return 0;
  const a = t < su ? 0.5 - 0.5 * Math.cos((Math.PI * t) / su) : 1;
  const r = t > durata ? 0.5 + 0.5 * Math.cos((Math.PI * (t - durata)) / giu) : 1;
  return a * r;
};

/** Il loop stereo del tema, al livello RMS_DB. */
export function sottofondo(tema: Tema = TEMI.caldo): [Float64Array, Float64Array] {
  const BATTITO = battito(tema);
  const BATTUTA = 4 * BATTITO;
  const DURATA_LOOP = durataLoop(tema);
  const giri = 2;
  const n = Math.round(DURATA_LOOP * SR);
  const tot = n * giri;
  const canali = [new Float64Array(tot), new Float64Array(tot)];
  const tasti = [new Float64Array(tot), new Float64Array(tot)];
  const r = casuale(tema.seme);

  for (let g = 0; g < giri; g++) {
    tema.accordi.forEach((accordo, a) => {
      const t0 = g * DURATA_LOOP + a * BATTUTA;
      // pad: ogni voce sono tre oscillatori scordati di pochi cent, diversi a sinistra e a destra
      accordo.voci.forEach((m) => {
        const f = hz(m);
        [[-7, 0, 4], [-4, 0, 7]].forEach((scordi, c) => {
          const i0 = Math.round(t0 * SR);
          const fine = Math.min(tot, Math.round((t0 + BATTUTA + 0.9) * SR));
          for (let i = i0; i < fine; i++) {
            const t = i / SR - t0;
            const env = morbido(t, BATTUTA, 0.7, 0.9) * 0.11;
            let v = 0;
            for (const s of scordi) {
              const ph = 2 * Math.PI * f * cent(s) * t;
              v += Math.sin(ph) + 0.18 * Math.sin(3 * ph) + 0.06 * Math.sin(5 * ph);
            }
            canali[c][i] += env * v;
          }
        });
      });
      // basso morbido
      for (const tempo of tema.bassi) {
        const tb = t0 + tempo * BATTITO;
        const f = hz(accordo.radice - 12 + (accordo.radice < 44 ? 12 : 0));
        const i0 = Math.round(tb * SR);
        const fine = Math.min(tot, Math.round((tb + 2 * BATTITO) * SR));
        for (let i = i0; i < fine; i++) {
          const t = i / SR - tb;
          const env = (1 - Math.exp(-t / 0.025)) * Math.exp(-t / 0.55) * 0.5;
          const v = env * (Math.sin(2 * Math.PI * f * t) + 0.22 * Math.sin(4 * Math.PI * f * t));
          canali[0][i] += v;
          canali[1][i] += v;
        }
      }
      // tasti pizzicati sulle note dell'accordo, un'ottava su, piano e un po' sciolti
      tema.giro.forEach((k, o) => {
        if (k === null) return;
        const to = t0 + o * (BATTITO / 2) + (o % 2 ? 0.012 : 0);
        const f = hz(accordo.voci[k] + 12);
        const forza = 0.5 + 0.3 * r();
        const pan = o % 2 ? 0.62 : 0.38;
        const i0 = Math.round(to * SR);
        const fine = Math.min(tot, Math.round((to + 1.1) * SR));
        for (let i = i0; i < fine; i++) {
          const t = i / SR - to;
          let v = 0;
          for (let h = 1; h <= tema.armoniche; h++) v += (Math.sin(2 * Math.PI * f * h * t) / h ** 1.6) * Math.exp(-t * (tema.caduta[0] + tema.caduta[1] * h));
          v *= (1 - Math.exp(-t / 0.004)) * forza * 0.16;
          tasti[0][i] += v * (1 - pan) * 2;
          tasti[1][i] += v * pan * 2;
        }
      });
    });
  }

  const misti = canali.map((c, ch) => {
    const pizzicati = passaBasso(tasti[ch], tema.taglio.tasti);
    const asciutto = passaBasso(c, tema.taglio.pad).map((v, i) => v + pizzicati[i]);
    const umido = riverbero(asciutto, ch * 1.3);
    return asciutto.map((v, i) => v + 0.32 * umido[i]);
  });
  // il secondo giro: dentro c'e' gia' la coda del primo, quindi la fine si attacca all'inizio senza scalino
  const giro2 = misti.map((c) => c.slice(n, 2 * n));
  const rms = Math.sqrt(giro2.reduce((s, c) => s + c.reduce((t, v) => t + v * v, 0), 0) / (2 * n));
  const k = 10 ** (RMS_DB / 20) / rms;
  return giro2.map((c) => c.map((v) => v * k)) as [Float64Array, Float64Array];
}
