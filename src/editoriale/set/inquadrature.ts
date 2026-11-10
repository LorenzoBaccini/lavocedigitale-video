import { Vector3 } from "three";

import { ALTEZZA } from "../../impaginazione.ts";
import type { Vec } from "../../three/proiezione.ts";
import type { Dettaglio } from "../ganci/dettaglio.ts";
import type { NomeApertura } from "../variante.ts";
import type { Camera, Rettangolo } from "./geometria.ts";
import { centroDi, distanzaPer, inAsse, SCHERMO, SCHERMO_PX, sferica } from "./geometria.ts";
import type { NomeOggetto } from "./oggetti/posti.ts";
import { SCHERMO_TELEFONO, sopraIlTelefono, TELEFONO_PX } from "./telefono.ts";

// Le inquadrature del set: per ogni oggetto una larga (la scrivania, l'oggetto nel suo posto) e una stretta (l'oggetto in primo piano).
// Le scene si muovono fra queste, con un solo movimento per inquadratura; gli stacchi in asse si fanno con `avvicina`.

interface Orbita {
  centro: Vec;
  d: number;
  az: number;
  el: number;
}

const camera = ({ centro, d, az, el }: Orbita): Camera => ({ pos: sferica(new Vector3(...centro), d, az, el), look: centro });

const LARGA: Record<NomeOggetto | "nessuno", Orbita> = {
  portatile: { centro: [0.35, 2.0, -0.2], d: 19.2, az: 0.41, el: 0.34 },
  nessuno: { centro: [0.35, 2.7, -0.2], d: 20.5, az: -0.3, el: 0.36 },
  chiavetta: { centro: [1.0, 1.3, 0.1], d: 17.5, az: 0.55, el: 0.34 },
  smartphone: { centro: [1.7, 1.2, 0.5], d: 18.5, az: 0.48, el: 0.5 },
  router: { centro: [2.0, 1.3, -0.4], d: 19, az: 0.6, el: 0.38 },
  carta: { centro: [1.6, 1.1, 0.6], d: 18, az: 0.42, el: 0.52 },
};

const STRETTA: Record<NomeOggetto | "nessuno", Orbita> = {
  portatile: { centro: [0, 1.55, -1.35], d: 11.5, az: 0.3, el: 0.3 },
  nessuno: { centro: [0.2, 1.4, -0.6], d: 14, az: -0.22, el: 0.3 },
  chiavetta: { centro: [2.75, 0.14, 0.55], d: 6.8, az: 1.1, el: 0.36 },
  smartphone: { centro: [3.15, 0.05, 0.55], d: 7.6, az: 0.12, el: 1.2 },
  router: { centro: [3.75, 0.55, -0.15], d: 9.5, az: 0.45, el: 0.34 },
  carta: { centro: [3.05, 0.0, 1.6], d: 4.4, az: 0.2, el: 1.12 },
};

export const larga = (nome: NomeOggetto | "nessuno"): Camera => camera(LARGA[nome]);

// Le aperture del gancio: la larga girata attorno allo stesso centro, piu' bassa o piu' alta.
const APERTURA: Record<NomeApertura, { az: number; el: number; d: number }> = {
  classica: { az: 0, el: 0, d: 1 },
  radente: { az: 0.22, el: -0.14, d: 0.92 },
  alta: { az: -0.3, el: 0.22, d: 1.04 },
};

/** L'inquadratura d'apertura del gancio: la larga dell'oggetto vista dal punto della variante. */
export const apertura = (nome: NomeOggetto | "nessuno", tipo: NomeApertura): Camera => {
  const o = LARGA[nome];
  const a = APERTURA[tipo];
  return camera({ centro: o.centro, az: o.az + a.az, el: o.el + a.el, d: o.d * a.d });
};
export const stretta = (nome: NomeOggetto | "nessuno"): Camera => camera(STRETTA[nome]);

/** Stacco in asse: la camera si avvicina al punto guardato di un fattore (0,88 = il 12 % piu' vicino). */
export const avvicina = ({ pos, look }: Camera, k: number): Camera => ({ pos: pos.map((p, i) => look[i] + (p - look[i]) * k) as Vec, look });

/** Deriva quasi impercettibile: la camera non e' mai inchiodata, ma non si nota che si muove. */
export const deriva = (cam: Camera, t: number, quanto = 0.04): Camera => avvicina(cam, 1 - quanto * Math.min(1, Math.max(0, t)));

// il dettaglio non riempie il quadro: attorno restano la cornice, il set e la luce dello stile
const LARGO_DETTAGLIO = 820;

/**
 * Il primo piano d'apertura del gancio a dettaglio: in asse sullo schermo del portatile (`riquadro` in pixel dello schermo),
 * dall'alto sulla schermata del telefono, o l'inquadratura stretta dell'oggetto, ancora piu' vicina.
 */
export function primoPiano(d: Dettaglio, riquadro: Rettangolo | undefined, nome: NomeOggetto | "nessuno"): Camera {
  if (d === "oggetto" || !riquadro) return avvicina(stretta(nome), 0.5);
  if (d === "telefono") return sopraIlTelefono(riquadro.x + riquadro.w / 2, riquadro.y + riquadro.h / 2, distanzaPer((riquadro.w / TELEFONO_PX.w) * SCHERMO_TELEFONO.larghezza, LARGO_DETTAGLIO), 1.2);
  return inAsse(centroDi(riquadro), distanzaPer((riquadro.w / SCHERMO_PX.w) * SCHERMO.larghezza, LARGO_DETTAGLIO), ALTEZZA / 2);
}

/** Da un primo piano a un'inquadratura larga: il punto guardato in linea retta, la distanza in proporzione (lo zoom sembra uniforme). */
export function allarga(da: Camera, a: Camera, t: number): Camera {
  const look = da.look.map((v, i) => v + (a.look[i] - v) * t) as Vec;
  const verso = (c: Camera) => new Vector3(...c.pos).sub(new Vector3(...c.look));
  const [u, w] = [verso(da), verso(a)];
  const distanza = u.length() * (w.length() / u.length()) ** t;
  const dir = u.clone().normalize().lerp(w.clone().normalize(), t).normalize();
  return { pos: new Vector3(...look).addScaledVector(dir, distanza).toArray() as Vec, look };
}
