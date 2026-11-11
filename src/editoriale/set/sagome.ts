import { Vector3 } from "three";

import { ALTEZZA, LARGHEZZA } from "../../impaginazione.ts";
import type { Camera, Punto2 } from "./geometria.ts";
import { davanti, NORMALE, puntoSchermo, SCHERMO_PX } from "./geometria.ts";

// Le sagome di tazza e pianta per il controllo d'impaginazione: punti del mondo che le contengono, e quando lo schermo
// del portatile le nasconde.

/** Le foglie della pianta: [giro intorno al vaso, inclinazione, altezza]. */
export const FOGLIE: [number, number, number][] = [
  [0.2, 0.12, 1.6], [1.1, 0.3, 1.2], [2.0, 0.22, 1.45], [2.9, 0.34, 1.1], [3.8, 0.18, 1.5], [4.7, 0.3, 1.15], [5.6, 0.24, 1.35],
];
/** Quanto la foglia sta fuori dall'asse del vaso alla base, e quanto e' larga. */
export const FOGLIA = { scarto: 0.08, raggio: 0.17 };

const anello = (cx: number, y: number, cz: number, r: number, n = 12) =>
  Array.from({ length: n }, (_, i) => new Vector3(cx + r * Math.cos((2 * Math.PI * i) / n), y, cz + r * Math.sin((2 * Math.PI * i) / n)));

/** La tazza: un cilindro largo quanto corpo e manico insieme. */
export const sagomaTazza = ([x, , z]: readonly number[], raggio: number, altezza: number, manico: number): Vector3[] => [
  ...anello(x, 0, z, raggio + manico),
  ...anello(x, altezza, z, raggio + manico),
];

/** La pianta: il vaso (con l'orlo) e la punta di ogni foglia, allargata della sua mezza larghezza. */
export function sagomaPianta([x, , z]: readonly number[], raggio: number, vaso: number): Vector3[] {
  const punte = FOGLIE.flatMap(([giro, inclinazione, alta]) => {
    // rotazione intorno a z (inclinazione) e poi intorno a y (giro), come il gruppo della foglia
    const px = FOGLIA.scarto * Math.cos(inclinazione) - alta * Math.sin(inclinazione);
    const py = FOGLIA.scarto * Math.sin(inclinazione) + alta * Math.cos(inclinazione);
    return anello(x + px * Math.cos(giro), vaso + py, z - px * Math.sin(giro), FOGLIA.raggio, 6);
  });
  return [...anello(x, 0, z, raggio * 1.08), ...anello(x, vaso, z, raggio * 1.08), ...punte];
}

const croce = (a: Punto2, b: Punto2, c: Punto2) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/** I punti tenuti dentro il fotogramma (Sutherland-Hodgman sull'involucro). */
function nelFotogramma(poligono: Punto2[]): Punto2[] {
  const lati: [(p: Punto2) => boolean, (a: Punto2, b: Punto2) => Punto2][] = [
    [(p) => p.x >= 0, (a, b) => ({ x: 0, y: a.y + ((b.y - a.y) * (0 - a.x)) / (b.x - a.x) })],
    [(p) => p.x <= LARGHEZZA, (a, b) => ({ x: LARGHEZZA, y: a.y + ((b.y - a.y) * (LARGHEZZA - a.x)) / (b.x - a.x) })],
    [(p) => p.y >= 0, (a, b) => ({ x: a.x + ((b.x - a.x) * (0 - a.y)) / (b.y - a.y), y: 0 })],
    [(p) => p.y <= ALTEZZA, (a, b) => ({ x: a.x + ((b.x - a.x) * (ALTEZZA - a.y)) / (b.y - a.y), y: ALTEZZA })],
  ];
  let uscita = poligono;
  for (const [dentro, taglia] of lati) {
    const entrata = uscita;
    uscita = [];
    entrata.forEach((p, i) => {
      const q = entrata[(i + 1) % entrata.length];
      if (dentro(p)) uscita.push(p);
      if (dentro(p) !== dentro(q)) uscita.push(taglia(p, q));
    });
  }
  return uscita;
}

/** L'involucro convesso, in giro. */
export function involucro(punti: Punto2[]): Punto2[] {
  const p = [...punti].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const meta = (lista: Punto2[]) => {
    const h: Punto2[] = [];
    for (const q of lista) {
      while (h.length >= 2 && croce(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...meta(p), ...meta([...p].reverse())];
}

const dentroConvesso = (q: Punto2, poli: Punto2[]) => {
  const segni = poli.map((a, i) => Math.sign(croce(a, poli[(i + 1) % poli.length], q)));
  return segni.every((s) => s >= 0) || segni.every((s) => s <= 0);
};

/**
 * Gli angoli della sagoma nel fotogramma, o niente se non si vede: fuori quadro, dietro la camera, o tutta dietro lo
 * schermo del portatile (la parte nel fotogramma cade dentro lo schermo e la sagoma sta oltre il suo piano).
 */
export function sagomaInQuadro(punti: Vector3[], cam: Camera): Punto2[] | undefined {
  const proiettati = davanti(punti, cam);
  if (!proiettati) return undefined;
  const visibile = nelFotogramma(involucro(proiettati));
  if (visibile.length < 3) return undefined;
  const centro = puntoSchermo(SCHERMO_PX.w / 2, SCHERMO_PX.h / 2);
  const oltre = (p: Vector3) => p.clone().sub(centro).dot(NORMALE) < 0;
  const schermo = davanti([puntoSchermo(0, 0), puntoSchermo(SCHERMO_PX.w, 0), puntoSchermo(SCHERMO_PX.w, SCHERMO_PX.h), puntoSchermo(0, SCHERMO_PX.h)], cam);
  const nascosta = schermo && !oltre(new Vector3(...cam.pos)) && punti.every(oltre) && visibile.every((q) => dentroConvesso(q, schermo));
  return nascosta ? undefined : visibile;
}
