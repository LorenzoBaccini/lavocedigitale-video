import { Euler, PerspectiveCamera, Vector3 } from "three";

import { ALTEZZA, LARGHEZZA } from "../../impaginazione.ts";
import type { Vec } from "../../three/proiezione.ts";
import { FOV } from "../../three/proiezione.ts";

// Il set unico del video: una scrivania (piano a y = 0), il portatile al centro, il taccuino a sinistra,
// l'oggetto della scena appoggiato a destra, davanti. Tutte le scene 3D guardano lo stesso luogo.

export interface Camera {
  pos: Vec;
  look: Vec;
}

export interface Rettangolo {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ——— Portatile ———
export const BASE = { larghezza: 4.4, spessore: 0.16, profondita: 3 };
export const CERNIERA: Vec = [0, BASE.spessore, -BASE.profondita / 2];
export const INCLINAZIONE = -0.22;
export const CENTRO_SCHERMO_LOCALE: Vec = [0, 1.47, 0.058];
export const SCHERMO = { larghezza: 4.1, altezza: 2.5625 };
export const SCHERMO_PX = { w: 2560, h: 1600 };

// Posizioni in pixel dello schermo (2560×1600, scala 150 %), le stesse usate dai disegni.
// La notifica e' grande come quelle vere a 150 %: nel primo piano il suo testo supera i 34 px del fotogramma.
export const NOTIFICA_PX: Rettangolo = { x: 1800, y: 1196, w: 736, h: 312 };
export const NOTIFICA_SCALA = 2;
export const OROLOGIO_PX: Rettangolo = { x: 2402, y: 1534, w: 140, h: 60 };
// finestra delle impostazioni e il suo pulsante (la scena oggetto con `indica` sul portatile)
export const FINESTRA_PX: Rettangolo = { x: 620, y: 230, w: 1320, h: 1060 };
export const PULSANTE_PX: Rettangolo = { x: 700, y: 760, w: 620, h: 96 };
// il titolo del pannello va a capo in questa colonna, che il primo piano sul pulsante inquadra intera
export const TITOLO_FINESTRA_PX = { x: 1000, w: 520 };
/** Centro orizzontale del primo piano sul pulsante: pulsante e titolo del pannello entrambi in quadro. */
export const CENTRO_PRIMO_PIANO_PX = 1170;
// la porta USB sul fianco destro della base, in coordinate del mondo (a sinistra c'e' il taccuino)
export const PORTA_USB: Vec = [BASE.larghezza / 2, BASE.spessore / 2, 0.55];

const ruota = (v: Vector3) => v.applyEuler(new Euler(INCLINAZIONE, 0, 0));
export const NORMALE = ruota(new Vector3(0, 0, 1));
export const SU = ruota(new Vector3(0, 1, 0));

/** Punto dello schermo in pixel → mondo. */
export const puntoSchermo = (u: number, v: number, z = 0.04): Vector3 =>
  ruota(new Vector3((u / SCHERMO_PX.w - 0.5) * SCHERMO.larghezza, CENTRO_SCHERMO_LOCALE[1] + (0.5 - v / SCHERMO_PX.h) * SCHERMO.altezza, z)).add(new Vector3(...CERNIERA));

export const centroDi = (r: Rettangolo) => puntoSchermo(r.x + r.w / 2, r.y + r.h / 2);

// ——— Taccuino (gli oggetti della scena stanno in oggetti/posti.ts) ———
export const TACCUINO = { posizione: [-3.55, 0, 1.55] as Vec, rotazione: 0.32 };

// ——— Camera ———
const MEZZA_ALTEZZA = Math.tan(((FOV / 2) * Math.PI) / 180);

export const sferica = (centro: Vector3, d: number, az: number, el: number): Vec => [
  centro.x + d * Math.sin(az) * Math.cos(el),
  centro.y + d * Math.sin(el),
  centro.z + d * Math.cos(az) * Math.cos(el),
];

/**
 * Camera in asse con lo schermo del portatile, a distanza `d`: il punto `centro` (pixel dello schermo)
 * cade alla quota `quota` del fotogramma, centrato in orizzontale.
 */
export function inAsse(centro: Vector3, d: number, quota: number): Camera {
  const delta = ((ALTEZZA / 2 - quota) / ALTEZZA) * 2 * d * MEZZA_ALTEZZA;
  const look = centro.clone().addScaledVector(SU, -delta);
  return { pos: look.clone().addScaledVector(NORMALE, d).toArray() as Vec, look: look.toArray() as Vec };
}

/** Distanza in asse a cui un tratto largo `larghezza` (mondo) occupa `px` pixel del fotogramma. */
export const distanzaPer = (larghezza: number, px: number) => (larghezza * LARGHEZZA) / (px * 2 * MEZZA_ALTEZZA * (LARGHEZZA / ALTEZZA));

/** Punto del mondo → pixel del fotogramma, con la stessa camera del canvas. */
export function proietta(p: Vector3, { pos, look }: Camera) {
  const cam = new PerspectiveCamera(FOV, LARGHEZZA / ALTEZZA, 0.1, 1000);
  cam.position.set(...pos);
  cam.lookAt(...look);
  cam.updateMatrixWorld();
  const q = p.clone().project(cam);
  return { x: ((q.x + 1) / 2) * LARGHEZZA, y: ((1 - q.y) / 2) * ALTEZZA };
}

export type Punto2 = { x: number; y: number };

/** Il rettangolo allineato agli assi che contiene i punti. */
export function rettangoloDi(punti: Punto2[]): Rettangolo {
  const xs = punti.map((a) => a.x);
  const ys = punti.map((a) => a.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/** Gli angoli di un rettangolo in pixel di una superficie, portati nel fotogramma, in giro: alto-sinistra, alto-destra, basso-destra, basso-sinistra. */
export const angoliDi = (r: Rettangolo, punto: (u: number, v: number) => Vector3, cam: Camera): Punto2[] =>
  [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x + r.w, r.y + r.h],
    [r.x, r.y + r.h],
  ].map(([u, v]) => proietta(punto(u, v), cam));

export const angoliInQuadro = (r: Rettangolo, cam: Camera) => angoliDi(r, puntoSchermo, cam);

/** Rettangolo dello schermo (pixel) → rettangolo che lo contiene nel fotogramma. */
export const rettangoloInQuadro = (r: Rettangolo, cam: Camera): Rettangolo => rettangoloDi(angoliInQuadro(r, cam));

/**
 * Alza la camera (posizione e punto guardato insieme) finche' nessuno dei `punti` cade sopra la quota `limite` del
 * fotogramma: cosi' lo schermo scende sotto il titolo. Se ci sta gia', la camera resta com'e'.
 */
export const sottoLaQuota = (cam: Camera, punti: Vector3[], limite: number): Camera => spostaVerticale(cam, punti, limite, 1);

/** Il contrario: abbassa la camera finche' nessuno dei `punti` cade sotto la quota `limite` (lo schermo sale sopra il titolo in basso). */
export const sopraLaQuota = (cam: Camera, punti: Vector3[], limite: number): Camera => spostaVerticale(cam, punti, limite, -1);

function spostaVerticale(cam: Camera, punti: Vector3[], limite: number, verso: 1 | -1): Camera {
  let c = cam;
  for (let i = 0; i < 4; i++) {
    const ys = punti.map((p) => proietta(p, c).y);
    const fuori = verso === 1 ? limite - Math.min(...ys) : Math.max(...ys) - limite;
    if (fuori <= 1) return c;
    const d = Math.hypot(...c.pos.map((v, k) => v - c.look[k]));
    const dy = (verso * fuori * 2 * d * MEZZA_ALTEZZA) / ALTEZZA;
    c = { pos: [c.pos[0], c.pos[1] + dy, c.pos[2]], look: [c.look[0], c.look[1] + dy, c.look[2]] };
  }
  return c;
}

/**
 * Tiene i punti `alti` sotto la quota `alto` e i `bassi` sopra la quota `basso` del fotogramma: lo schermo sta fra il
 * testo in alto e quello in basso. Se e' piu' alto della fascia, la camera arretra quanto serve (in modo continuo:
 * fotogrammi vicini danno camere vicine, niente scatti), poi si sposta in verticale.
 */
export function fraLeQuote(cam: Camera, alti: Vector3[], bassi: Vector3[], alto: number, basso: number): Camera {
  let c = cam;
  const fascia = basso - alto;
  for (let i = 0; i < 4; i++) {
    const altezza = Math.max(...bassi.map((p) => proietta(p, c).y)) - Math.min(...alti.map((p) => proietta(p, c).y));
    if (altezza <= fascia) break;
    const k = (altezza / fascia) * 1.01;
    c = { pos: c.pos.map((v, j) => c.look[j] + (v - c.look[j]) * k) as Vec, look: c.look };
  }
  return sottoLaQuota(sopraLaQuota(c, bassi, basso), alti, alto);
}

/** Interpola due camere (posizione e punto guardato). */
export const fraCamere = (a: Camera, b: Camera, t: number): Camera => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * t) as Vec,
  look: a.look.map((v, i) => v + (b.look[i] - v) * t) as Vec,
});
