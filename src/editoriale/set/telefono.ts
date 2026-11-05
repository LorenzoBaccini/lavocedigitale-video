import { Vector3 } from "three";

import type { Vec } from "../../three/proiezione.ts";
import type { Camera, Rettangolo } from "./geometria.ts";
import { FONDO_UTILE } from "../../impaginazione.ts";
import { angoliDi, fraLeQuote, rettangoloDi, sferica } from "./geometria.ts";
import { nelMondo, POSTI, SMARTPHONE } from "./oggetti/posti.ts";

export const TELEFONO_PX = { w: 720, h: 1480 };
export const SCHERMO_TELEFONO = { larghezza: SMARTPHONE.larghezza - 0.1, lunghezza: SMARTPHONE.lunghezza - 0.12 };

/** La notifica sulla schermata di blocco: riga dell'app, poi il messaggio in grassetto. */
export const NOTIFICA_TELEFONO_PX: Rettangolo = { x: 36, y: 640, w: 648, h: 330 };
export const CORPO_NOTIFICA_TELEFONO = 42;
export const RIGA_NOTIFICA_TELEFONO = { prima: 150, passo: 56 };

/** I pulsanti della schermata d'accesso della scena telefono, uno sotto l'altro. */
export const opzionePx = (i: number): Rettangolo => ({ x: 56, y: 560 + i * 200, w: 608, h: 156 });

/** Punto della schermata (pixel) → mondo, appena sopra il vetro. */
export function puntoTelefono(u: number, v: number, alto = 0.004): Vector3 {
  const locale: Vec = [(u / TELEFONO_PX.w - 0.5) * SCHERMO_TELEFONO.larghezza, SMARTPHONE.spessore + alto, (v / TELEFONO_PX.h - 0.5) * SCHERMO_TELEFONO.lunghezza];
  return new Vector3(...nelMondo(POSTI.smartphone, locale));
}

export const angoliTelefono = (r: Rettangolo, cam: Camera) => angoliDi(r, (u, v) => puntoTelefono(u, v), cam);

/** Rettangolo della schermata → rettangolo che lo contiene nel fotogramma. */
export const rettangoloTelefono = (r: Rettangolo, cam: Camera): Rettangolo => rettangoloDi(angoliTelefono(r, cam));

/** Gli angoli dello schermo intero del telefono nel fotogramma. */
export const angoliSchermoTelefono = (cam: Camera) => angoliTelefono({ x: 0, y: 0, ...TELEFONO_PX }, cam);

/**
 * Camera dall'alto sul telefono: guarda il punto `(u, v)` della schermata da `d`, quasi a piombo (`el`), con il lato lungo
 * del telefono in verticale nel fotogramma, girato di `giro` radianti perche' non sembri una scansione.
 */
export function sopraIlTelefono(u: number, v: number, d: number, el: number, giro = 0.1): Camera {
  const centro = puntoTelefono(u, v, 0);
  return { pos: sferica(centro, d, POSTI.smartphone.giro + giro, el), look: centro.toArray() as Vec };
}

/** Spazio fra i titoli e il bordo del telefono, e fra l'ultima opzione e i sottotitoli. */
const STACCO = 30;

/**
 * La camera della scena telefono: dall'alto sulle opzioni, si avvicina appena (`t` da 0 a 1, `k` per gli stacchi in
 * asse). In ogni fotogramma il bordo alto del telefono resta sotto i titoli (`sottoITitoli`) e il fondo dell'ultima
 * opzione sopra i sottotitoli; se non ci sta, la camera arretra.
 */
export function cameraOpzioni(t: number, k: number, sottoITitoli: number, opzioni: number): Camera {
  const d = 6.3 + (5.9 - 6.3) * t;
  const base = sopraIlTelefono(360, 560, d, 1.16, 0.13);
  const vicina: Camera = { pos: base.pos.map((v, i) => base.look[i] + (v - base.look[i]) * k) as Vec, look: base.look };
  const ultima = opzionePx(opzioni - 1);
  const alti = [puntoTelefono(0, 0), puntoTelefono(TELEFONO_PX.w, 0)];
  const bassi = [puntoTelefono(ultima.x, ultima.y + ultima.h), puntoTelefono(ultima.x + ultima.w, ultima.y + ultima.h)];
  return fraLeQuote(vicina, alti, bassi, sottoITitoli + STACCO, FONDO_UTILE - STACCO);
}
