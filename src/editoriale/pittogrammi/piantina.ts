import type { Punto } from "../tratto.ts";
import { casuale } from "../tratto.ts";

// Una piantina di quartiere inventata, nel riquadro 1000×1000: nessuna geografia vera, solo un disegno che si legge
// come una mappa. Isolati su una griglia storta, una strada principale curva che la attraversa, a volte l'ansa di un
// fiume in un angolo. Lo stesso seme da' sempre la stessa piantina.

export interface Piantina {
  /** i due cigli della strada principale */
  strade: string[];
  /** il contorno di ogni isolato, chiuso */
  isolati: string[];
  /** le due rive del fiume; vuoto se il quartiere non ne ha */
  fiume: string[];
}

const LATO = 1000;
/** Mezza larghezza delle vie fra gli isolati. */
const MEZZA_VIA = 16;
/** Mezza larghezza della strada principale e del fiume. */
const MEZZA_STRADA = 24;
const MEZZO_FIUME = 30;
/** Quanti punti per disegnare una curva. */
const CAMPIONI = 64;

const dentroIlRiquadro = (v: number) => Math.min(LATO, Math.max(0, v));
const tracciato = (punti: Punto[], chiuso: boolean) =>
  punti.map(([x, y], i) => `${i ? "L" : "M"}${dentroIlRiquadro(x).toFixed(1)} ${dentroIlRiquadro(y).toFixed(1)}`).join(" ") + (chiuso ? " Z" : "");

/** Una via della griglia: una retta da un bordo all'altro, un poco storta. */
interface Via {
  inizio: number;
  fine: number;
}

/** Le vie di una direzione: i due bordi del riquadro e, fra loro, `n - 1` vie spostate a caso dalla loro posizione regolare. */
const vie = (n: number, r: () => number): Via[] =>
  Array.from({ length: n + 1 }, (_, k) => {
    if (k === 0 || k === n) return { inizio: (k * LATO) / n, fine: (k * LATO) / n };
    const inizio = (k * LATO) / n + (r() - 0.5) * 0.3 * (LATO / n);
    return { inizio, fine: inizio + (r() - 0.5) * 0.45 * (LATO / n) };
  });

// l'incrocio di una via verticale (x da `v.inizio` in alto a `v.fine` in basso) con una orizzontale (y da sinistra a destra)
function incrocio(v: Via, o: Via): Punto {
  const kv = (v.fine - v.inizio) / LATO;
  const ko = (o.fine - o.inizio) / LATO;
  const x = (v.inizio + kv * o.inizio) / (1 - kv * ko);
  return [x, o.inizio + ko * x];
}

// rientra ogni angolo verso il centro: fra due isolati resta la via
function rientra(angoli: Punto[], di: number, r: () => number): Punto[] {
  const cx = angoli.reduce((s, p) => s + p[0], 0) / angoli.length;
  const cy = angoli.reduce((s, p) => s + p[1], 0) / angoli.length;
  return angoli.map(([x, y]) => {
    const d = Math.hypot(cx - x, cy - y) || 1;
    const k = (di * Math.SQRT2) / d;
    return [x + (cx - x) * k + (r() - 0.5) * 6, y + (cy - y) * k + (r() - 0.5) * 6];
  });
}

/** Il punto della curva di Bezier cubica al parametro t. */
const bezier = (p: Punto[], t: number): Punto => {
  const u = 1 - t;
  const c = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [c.reduce((s, k, i) => s + k * p[i][0], 0), c.reduce((s, k, i) => s + k * p[i][1], 0)];
};

/** Le due sponde di una curva: la linea di mezzo spostata di `mezza` da una parte e dall'altra, con un'onda leggera. */
function sponde(mezzo: Punto[], mezza: number, onda: number, r: () => number): [Punto[], Punto[]] {
  const fase = r() * Math.PI * 2;
  const lato = (verso: number) =>
    mezzo.map(([x, y], i): Punto => {
      const [ax, ay] = mezzo[Math.max(0, i - 1)];
      const [bx, by] = mezzo[Math.min(mezzo.length - 1, i + 1)];
      const l = Math.hypot(bx - ax, by - ay) || 1;
      const m = mezza + onda * Math.sin(fase + i * 0.4 + verso);
      return [x - ((by - ay) / l) * m * verso, y + ((bx - ax) / l) * m * verso];
    });
  return [lato(1), lato(-1)];
}

const dentro = (q: Punto, poli: Punto[]) => {
  const segni = poli.map((a, i) => {
    const b = poli[(i + 1) % poli.length];
    return Math.sign((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]));
  });
  return segni.every((s) => s >= 0) || segni.every((s) => s <= 0);
};

// l'isolato tocca la fascia larga `mezza` attorno alla linea di mezzo: un suo angolo o il centro ci cade dentro, o
// la linea gli passa in mezzo
function tocca(isolato: Punto[], mezzo: Punto[], mezza: number): boolean {
  const cx = isolato.reduce((s, p) => s + p[0], 0) / isolato.length;
  const cy = isolato.reduce((s, p) => s + p[1], 0) / isolato.length;
  const vicino = (p: Punto) => mezzo.some((m) => Math.hypot(m[0] - p[0], m[1] - p[1]) < mezza);
  return [...isolato, [cx, cy] as Punto].some(vicino) || mezzo.some((m) => dentro(m, isolato));
}

// specchia la curva o la ruota di un quarto: la strada e il fiume non vanno sempre nello stesso verso
const gira = (punti: Punto[], specchiaX: boolean, specchiaY: boolean, scambia: boolean): Punto[] =>
  punti.map(([x, y]) => {
    const [a, b] = scambia ? [y, x] : [x, y];
    return [specchiaX ? LATO - a : a, specchiaY ? LATO - b : b];
  });

export function piantina(seme: number): Piantina {
  const r = casuale(seme);
  const colonne = vie(6 + Math.floor(r() * 2), r);
  const righe = vie(6 + Math.floor(r() * 2), r);

  // la strada principale: una S da un bordo all'opposto, orizzontale o verticale
  const da = 250 + r() * 220;
  const a = 530 + r() * 220;
  const curva: Punto[] = [[-20, da], [330, dentroIlRiquadro(da + (r() - 0.5) * 520)], [670, dentroIlRiquadro(a + (r() - 0.5) * 520)], [LATO + 20, a]];
  const strada = gira(Array.from({ length: CAMPIONI + 1 }, (_, i) => bezier(curva, i / CAMPIONI)), r() < 0.5, false, r() < 0.5);

  // l'ansa del fiume, una volta su due, in un angolo: entra dal bordo in alto ed esce da quello a destra
  const conFiume = r() < 0.5;
  const ingresso = 600 + r() * 180;
  const uscita = 220 + r() * 180;
  const ansa: Punto[] = [[ingresso, -20], [ingresso + 30, uscita * 0.75], [LATO - (LATO - ingresso) * 0.55, uscita + 40], [LATO + 20, uscita]];
  const fiume = conFiume ? gira(Array.from({ length: CAMPIONI + 1 }, (_, i) => bezier(ansa, i / CAMPIONI)), r() < 0.5, r() < 0.5, false) : [];

  const isolati: Punto[][] = [];
  for (let i = 0; i < colonne.length - 1; i++) {
    for (let j = 0; j < righe.length - 1; j++) {
      const angoli = [incrocio(colonne[i], righe[j]), incrocio(colonne[i + 1], righe[j]), incrocio(colonne[i + 1], righe[j + 1]), incrocio(colonne[i], righe[j + 1])];
      // qualche isolato e' tagliato in due da un vicolo, lungo il lato piu' lungo
      const lungo = Math.hypot(angoli[1][0] - angoli[0][0], angoli[1][1] - angoli[0][1]) > Math.hypot(angoli[3][0] - angoli[0][0], angoli[3][1] - angoli[0][1]);
      const meta = (p: Punto, q: Punto): Punto => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const pezzi =
        r() < 0.25
          ? lungo
            ? [[angoli[0], meta(angoli[0], angoli[1]), meta(angoli[3], angoli[2]), angoli[3]], [meta(angoli[0], angoli[1]), angoli[1], angoli[2], meta(angoli[3], angoli[2])]]
            : [[angoli[0], angoli[1], meta(angoli[1], angoli[2]), meta(angoli[0], angoli[3])], [meta(angoli[0], angoli[3]), meta(angoli[1], angoli[2]), angoli[2], angoli[3]]]
          : [angoli];
      for (const pezzo of pezzi) {
        const isolato = rientra(pezzo as Punto[], pezzi.length > 1 ? MEZZA_VIA * 0.75 : MEZZA_VIA, r);
        if (tocca(isolato, strada, MEZZA_STRADA + 10)) continue;
        if (conFiume && tocca(isolato, fiume, MEZZO_FIUME + 12)) continue;
        isolati.push(isolato);
      }
    }
  }

  return {
    strade: sponde(strada, MEZZA_STRADA, 1.5, r).map((s) => tracciato(s, false)),
    isolati: isolati.map((p) => tracciato(p, true)),
    fiume: conFiume ? sponde(fiume, MEZZO_FIUME, 5, r).map((s) => tracciato(s, false)) : [],
  };
}
