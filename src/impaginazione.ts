// L'unica regola d'impaginazione del video 1080×1920: margini, zone e controllo dei rettangoli misurati.
export const LARGHEZZA = 1080;
export const ALTEZZA = 1920;
export const MARGINE = 80;
export const LARGHEZZA_UTILE = LARGHEZZA - 2 * MARGINE;

// le barre del logo hanno 8/128 di vuoto a sinistra: a 70 px il segno visibile cade sul margine
export const LOGO = { x: 70, y: 260, lato: 120 };
export const TITOLO_TOP = 380;
export const SOTTOTITOLO_BASSO = 400;
export const FONDO_SCENA = 560;
export const FONDO_UTILE = ALTEZZA - FONDO_SCENA;
// i serif hanno discendenti oltre la riga: un testo appoggiato su FONDO_SCENA si alza di tanto per non toccare il sottotitolo
export const RESPIRO = 18;

export interface Rettangolo {
  x: number;
  y: number;
  larghezza: number;
  altezza: number;
}

export interface Misura extends Rettangolo {
  nome: string;
  /** solo sugli ingombri 3D (vedi README.md) */
  ingombro?: "bordo" | "pieno";
  /** gli angoli proiettati dell'ingombro; il rettangolo e' solo il suo contorno allineato agli assi */
  poligono?: [number, number][];
  suChiaro?: boolean;
}

export interface Zone {
  utile: Rettangolo;
  logo: Rettangolo;
  sottotitolo: Rettangolo;
}

export const ZONE: Zone = {
  utile: { x: MARGINE, y: 0, larghezza: LARGHEZZA_UTILE, altezza: ALTEZZA },
  logo: { x: LOGO.x, y: LOGO.y, larghezza: LOGO.lato, altezza: LOGO.lato * 0.75 },
  sottotitolo: { x: MARGINE, y: FONDO_UTILE, larghezza: LARGHEZZA_UTILE, altezza: FONDO_SCENA - SOTTOTITOLO_BASSO },
};

/** Prefisso della riga di console con cui il fotogramma di controllo consegna le misure. */
export const PREFISSO_MISURA = "IMPAGINAZIONE ";

const TOLLERANZA = 2;

const siSovrappongono = (a: Rettangolo, b: Rettangolo) =>
  a.x + TOLLERANZA < b.x + b.larghezza && b.x + TOLLERANZA < a.x + a.larghezza && a.y + TOLLERANZA < b.y + b.altezza && b.y + TOLLERANZA < a.y + a.altezza;

const px = (n: number) => Math.round(n);

type P = [number, number];

const croce = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** L'involucro convesso dei punti, in senso orario sullo schermo (y in giu'). */
export function involucro(punti: P[]): P[] {
  const p = [...punti].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const meta = (lista: P[]) => {
    const h: P[] = [];
    for (const q of lista) {
      while (h.length >= 2 && croce(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...meta(p), ...meta([...p].reverse())];
}

const angoliDi = (r: Rettangolo, margine: number): P[] => [
  [r.x + margine, r.y + margine],
  [r.x + r.larghezza - margine, r.y + margine],
  [r.x + r.larghezza - margine, r.y + r.altezza - margine],
  [r.x + margine, r.y + r.altezza - margine],
];

const dentro = (q: P, poli: P[]) => poli.every((a, i) => croce(a, poli[(i + 1) % poli.length], q) >= 0);

// separazione sugli assi dei lati di entrambi: due convessi si toccano se nessun asse li separa
function siToccanoConvessi(a: P[], b: P[]): boolean {
  for (const poli of [a, b]) {
    for (let i = 0; i < poli.length; i++) {
      const [x1, y1] = poli[i];
      const [x2, y2] = poli[(i + 1) % poli.length];
      const asse: P = [y1 - y2, x2 - x1];
      const proietta = (pp: P[]) => pp.map((q) => q[0] * asse[0] + q[1] * asse[1]);
      const pa = proietta(a), pb = proietta(b);
      if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
    }
  }
  return true;
}

/** Il rapporto fra un testo e un ingombro (poligono convesso): fuori, dentro, o a cavallo del bordo. */
export function rapporto(testo: Rettangolo, poligono: P[]): "fuori" | "dentro" | "a cavallo" {
  const poli = involucro(poligono);
  if (!siToccanoConvessi(angoliDi(testo, TOLLERANZA), poli)) return "fuori";
  return angoliDi(testo, TOLLERANZA).every((q) => dentro(q, poli)) ? "dentro" : "a cavallo";
}

/** I testi della scena che toccano lo schermo o l'oggetto 3D: a cavallo del suo bordo, o sopra se l'ingombro e' pieno. */
export function problemiIngombri(misure: Misura[]): string[] {
  const ingombri = misure.filter((m) => m.ingombro);
  const testi = misure.filter((m) => !m.ingombro && m.nome !== "sottotitolo");
  return testi.flatMap((t) =>
    ingombri.flatMap((g) => {
      const r = rapporto(t, g.poligono ?? angoliDi(g, 0));
      if (r === "fuori") return [];
      const dove = `(y ${px(t.y)}–${px(t.y + t.altezza)}, ${g.nome} ${px(g.y)}–${px(g.y + g.altezza)})`;
      if (g.ingombro === "pieno" && !(t.suChiaro && r === "dentro")) return [`${t.nome}: sopra ${g.nome} ${dove}`];
      return r === "dentro" ? [] : [`${t.nome}: a cavallo del bordo di ${g.nome} ${dove}`];
    }),
  );
}

export function problemiImpaginazione(misure: Misura[], zone: Zone): string[] {
  return [...problemiTesti(misure.filter((m) => !m.ingombro), zone), ...problemiIngombri(misure)];
}

function problemiTesti(misure: Misura[], zone: Zone): string[] {
  const { utile } = zone;
  return misure.flatMap((m) => {
    const problemi: string[] = [];
    if (m.x < utile.x - TOLLERANZA || m.x + m.larghezza > utile.x + utile.larghezza + TOLLERANZA || m.y < utile.y - TOLLERANZA || m.y + m.altezza > utile.y + utile.altezza + TOLLERANZA) {
      problemi.push(`${m.nome}: fuori dai margini (x ${px(m.x)}–${px(m.x + m.larghezza)}, utile ${utile.x}–${utile.x + utile.larghezza})`);
    }
    if (m.nome === "sottotitolo") {
      if (m.y < zone.sottotitolo.y - TOLLERANZA) problemi.push(`sottotitolo: sale sopra la sua zona (y ${px(m.y)}, zona da ${zone.sottotitolo.y})`);
      if (siSovrappongono(m, zone.logo)) problemi.push("sottotitolo: si sovrappone al logo");
      return problemi;
    }
    if (siSovrappongono(m, zone.sottotitolo)) problemi.push(`${m.nome}: si sovrappone alla zona del sottotitolo (y ${px(m.y)}–${px(m.y + m.altezza)})`);
    if (siSovrappongono(m, zone.logo)) problemi.push(`${m.nome}: si sovrappone al logo (y ${px(m.y)}–${px(m.y + m.altezza)})`);
    return problemi;
  });
}
