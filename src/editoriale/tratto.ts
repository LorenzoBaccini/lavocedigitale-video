// Segni fatti a mano (sottolineatura, cerchiatura): polilinee con un tremolio piccolo e ripetibile.
export type Punto = [number, number];

// generatore pseudo-casuale con seme: lo stesso segno a ogni fotogramma e a ogni render
export const casuale = (seme: number) => {
  let s = Math.max(1, Math.floor(seme)) % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

// Sottolineatura larga `larghezza`: sborda un po' a sinistra, sale appena verso destra, ondeggia di ±1,5 px.
export function sottolineatura(larghezza: number, seme: number, passi = 24): Punto[] {
  const r = casuale(seme);
  const fase = r() * Math.PI * 2;
  const salita = 3 + r() * 4;
  return Array.from({ length: passi + 1 }, (_, i) => {
    const t = i / passi;
    const x = -0.03 * larghezza + t * 1.07 * larghezza;
    const y = -salita * t + 1.5 * Math.sin(fase + t * 5.3) + (r() - 0.5) * 0.8;
    return [x, y];
  });
}

// Cerchiatura intorno a un rettangolo: un giro e un po', il raggio respira e la fine scavalca l'inizio.
export function cerchiatura(cx: number, cy: number, rx: number, ry: number, seme: number, passi = 64): Punto[] {
  const r = casuale(seme);
  const inizio = -2.4 + r() * 0.3;
  const giro = Math.PI * 2 * 1.12;
  const inclinazione = (r() - 0.5) * 0.08;
  const fase = r() * Math.PI * 2;
  return Array.from({ length: passi + 1 }, (_, i) => {
    const t = i / passi;
    const a = inizio + t * giro;
    // la mano si allarga mentre chiude il giro: il secondo passaggio non ricalca il primo
    const k = 1 + 0.035 * Math.sin(3 * a + fase) + 0.06 * t;
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k;
    return [cx + x * Math.cos(inclinazione) - y * Math.sin(inclinazione), cy + x * Math.sin(inclinazione) + y * Math.cos(inclinazione)];
  });
}

// Spunta a penna in un quadrato di lato `lato` con l'angolo in (x, y): breve discesa, poi la risalita lunga che sborda.
export function spunta(x: number, y: number, lato: number, seme: number, passi = 18): Punto[] {
  const r = casuale(seme);
  const a: Punto = [x + lato * (0.12 + r() * 0.06), y + lato * (0.5 + r() * 0.06)];
  const b: Punto = [x + lato * (0.4 + r() * 0.05), y + lato * (0.84 + r() * 0.05)];
  const c: Punto = [x + lato * (1.05 + r() * 0.1), y - lato * (0.12 + r() * 0.08)];
  const tratto = (p: Punto, q: Punto, n: number, curva: number): Punto[] =>
    Array.from({ length: n }, (_, i) => {
      const t = (i + 1) / n;
      const piega = Math.sin(Math.PI * t) * curva;
      return [p[0] + (q[0] - p[0]) * t + piega, p[1] + (q[1] - p[1]) * t - piega * 0.4];
    });
  const discesa = Math.round(passi / 3);
  return [a, ...tratto(a, b, discesa, lato * 0.02), ...tratto(b, c, passi - discesa, -lato * 0.06)];
}

export const lunghezza =(punti: Punto[]) => punti.slice(1).reduce((somma, p, i) => somma + Math.hypot(p[0] - punti[i][0], p[1] - punti[i][1]), 0);

export const percorso = (punti: Punto[]) => punti.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

// Quanto del segno e' tracciato al frame f: la mano parte decisa e rallenta in chiusura.
export function avanzamento(f: number, da: number, durata: number): number {
  const t = Math.min(1, Math.max(0, (f - da) / durata));
  return 1 - (1 - t) ** 2.2;
}

// Riquadro a mano di `larghezza` × `altezza` con l'angolo in (0, 0): quattro lati che ondeggiano di ±2 px, angoli che non
// combaciano e un lato in alto che scavalca l'inizio, un poco piu' in basso.
export function riquadro(larghezza: number, altezza: number, seme: number): Punto[] {
  const r = casuale(seme);
  const fase = r() * Math.PI * 2;
  const angolo = (x: number, y: number): Punto => [x + (r() - 0.5) * 5, y + (r() - 0.5) * 5];
  const vertici: Punto[] = [
    angolo(0, 0),
    angolo(larghezza, 0),
    angolo(larghezza, altezza),
    angolo(0, altezza),
    angolo(0, 0),
    [10 + r() * 18, 2 + r() * 2],
  ];
  const punti: Punto[] = [vertici[0]];
  vertici.slice(1).forEach((q, k) => {
    const p = vertici[k];
    const n = Math.max(2, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 14));
    const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      // l'ultimo punto di ogni lato e' l'angolo: gli altri si spostano di lato, a onda
      const onda = i < n ? 1.8 * Math.sin(fase + k * 2.1 + t * 4.4) + (r() - 0.5) * 0.8 : 0;
      punti.push([p[0] + (q[0] - p[0]) * t - Math.sin(ang) * onda, p[1] + (q[1] - p[1]) * t + Math.cos(ang) * onda]);
    }
  });
  return punti;
}

/** Freccia a pennarello da `a` a `z`: un'asta appena curva e la punta con le due alette, in un solo tratto. */
export function freccia(a: { x: number; y: number }, z: { x: number; y: number }, seme: number, passi = 10): Punto[] {
  const r = casuale(seme);
  const lungo = Math.hypot(z.x - a.x, z.y - a.y);
  const ang = Math.atan2(z.y - a.y, z.x - a.x);
  const curva = (r() - 0.5) * lungo * 0.08;
  const asta: Punto[] = Array.from({ length: passi + 1 }, (_, i) => {
    const t = i / passi;
    const piega = i === passi ? 0 : Math.sin(Math.PI * t) * curva + (i ? (r() - 0.5) * 1.2 : 0);
    return [a.x + (z.x - a.x) * t - Math.sin(ang) * piega, a.y + (z.y - a.y) * t + Math.cos(ang) * piega];
  });
  const ala = (verso: number): Punto => {
    const lato = 34 + r() * 6;
    const g = ang + Math.PI + verso * (0.5 + r() * 0.12);
    return [z.x + Math.cos(g) * lato, z.y + Math.sin(g) * lato];
  };
  return [...asta, ala(1), [z.x, z.y], ala(-1)];
}

/** Una sottolineatura (o un barrato) a pennarello da `a` a `z` nel fotogramma, un poco storta. */
export function trattoFra(a: { x: number; y: number }, z: { x: number; y: number }, seme: number): Punto[] {
  const ang = Math.atan2(z.y - a.y, z.x - a.x);
  return sottolineatura(Math.hypot(z.x - a.x, z.y - a.y), seme).map(([x, y]): Punto => [a.x + x * Math.cos(ang) - y * Math.sin(ang), a.y + x * Math.sin(ang) + y * Math.cos(ang)]);
}

/** Smussa gli angoli di una polilinea con un arco di raggio `raggio`: il tragitto gira all'incrocio, non a spigolo. */
export function smussa(punti: Punto[], raggio: number, passi = 8): Punto[] {
  const verso = (a: Punto, b: Punto): Punto => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const fuori: Punto[] = [punti[0]];
  for (let i = 1; i < punti.length - 1; i++) {
    const [p, v, q] = [punti[i - 1], punti[i], punti[i + 1]];
    const [di, du] = [verso(v, p), verso(v, q)];
    const a: Punto = [v[0] + di[0] * raggio, v[1] + di[1] * raggio];
    const b: Punto = [v[0] + du[0] * raggio, v[1] + du[1] * raggio];
    for (let k = 0; k <= passi; k++) {
      const t = k / passi;
      fuori.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * v[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * v[1] + t * t * b[1]]);
    }
  }
  return [...fuori, punti[punti.length - 1]];
}

/**
 * Il tratteggio di una polilinea: trattini lunghi `pieno` ogni `pieno + vuoto`, ciascuno una polilinea che segue le
 * svolte. Solo i trattini fino alla distanza `fino` dall'inizio, l'ultimo tagliato li': il tragitto che avanza.
 */
export function tratteggio(punti: Punto[], pieno: number, vuoto: number, fino = Infinity): Punto[][] {
  const totale = Math.min(fino, lunghezza(punti));
  // la distanza dall'inizio di ogni vertice, e il punto alla distanza d
  const progressive = punti.map((_, i) => lunghezza(punti.slice(0, i + 1)));
  const a = (d: number): Punto => {
    const i = Math.max(1, progressive.findIndex((x) => x >= d));
    const t = (d - progressive[i - 1]) / (progressive[i] - progressive[i - 1] || 1);
    return [punti[i - 1][0] + (punti[i][0] - punti[i - 1][0]) * t, punti[i - 1][1] + (punti[i][1] - punti[i - 1][1]) * t];
  };
  const trattini: Punto[][] = [];
  for (let da = 0; da < totale; da += pieno + vuoto) {
    const fine = Math.min(da + pieno, totale);
    const svolte = punti.filter((_, i) => progressive[i] > da && progressive[i] < fine);
    trattini.push([a(da), ...svolte, a(fine)]);
  }
  return trattini;
}
