import type { Pezzo } from "../../../storyboard/tipi.ts";
import type { Vec } from "../../../three/proiezione.ts";
import { PORTA_USB } from "../geometria.ts";

// Dove sta ogni oggetto sulla scrivania (scala: 1 unita' ≈ 7 cm, il portatile e' largo 4,4) e il suo punto da indicare.
// Gli oggetti appoggiano sul piano (y = 0) e non si muovono: la camera va da loro.

export type NomeOggetto = "portatile" | "chiavetta" | "smartphone" | "router" | "carta";

export interface Posto {
  posizione: Vec;
  /** rotazione intorno all'asse verticale */
  giro: number;
  /** il punto che `indica` cerchia, nelle coordinate dell'oggetto */
  caldo: Vec;
  /** raggio del cerchio a mano intorno al punto caldo, in unita' del mondo */
  raggio: number;
}

export const CHIAVETTA = { lunghezza: 0.82, larghezza: 0.27, spessore: 0.12, connettore: 0.26 };
export const SMARTPHONE = { larghezza: 1.02, lunghezza: 2.1, spessore: 0.11 };
export const ROUTER = { larghezza: 3.0, profondita: 2.0, altezza: 0.5 };
export const CARTA = { larghezza: 1.22, lunghezza: 0.77, spessore: 0.012 };

export const POSTI: Record<NomeOggetto, Posto> = {
  portatile: { posizione: [0, 0, 0], giro: 0, caldo: [0, 1.5, -1.6], raggio: 0.4 },
  // infilata nella porta sul fianco destro, il connettore dentro
  chiavetta: { posizione: [PORTA_USB[0] + CHIAVETTA.lunghezza / 2, PORTA_USB[1], PORTA_USB[2]], giro: Math.PI, caldo: [-0.08, 0.06, 0], raggio: 0.4 },
  // la riga evidenziata della schermata d'impostazioni (quarta voce, a meta' schermo)
  smartphone: { posizione: [3.3, 0, 1.3], giro: -0.32, caldo: [0, SMARTPHONE.spessore, 0.02], raggio: 0.52 },
  // la fila di spie sul fronte
  router: { posizione: [4.05, 0, -0.5], giro: -0.42, caldo: [-0.75, ROUTER.altezza * 0.55, ROUTER.profondita / 2], raggio: 0.4 },
  // il chip
  carta: { posizione: [3.05, 0, 1.55], giro: 0.38, caldo: [-0.36, CARTA.spessore, -0.04], raggio: 0.2 },
};

/** Punto dell'oggetto → mondo (rotazione intorno a y, poi traslazione). */
export function nelMondo(posto: Posto, [x, y, z]: Vec): Vec {
  const c = Math.cos(posto.giro);
  const s = Math.sin(posto.giro);
  return [posto.posizione[0] + x * c + z * s, posto.posizione[1] + y, posto.posizione[2] - x * s + z * c];
}

// ——— I pezzi della scena documenti: in colonna sul piano davanti al portatile, dall'alto in basso del fotogramma ———
export const LETTORE = { larghezza: 0.95, profondita: 0.85, altezza: 0.2 };
export const LETTERA = { larghezza: 1.35, lunghezza: 0.92, spessore: 0.008 };

/** Mezza larghezza di ogni pezzo, nel mondo: dove finisce a destra (la nota gli si appoggia accanto). */
export const MEZZA_LARGHEZZA: Record<Pezzo, number> = { tessera: CARTA.larghezza / 2, documento: CARTA.larghezza / 2, lettore: LETTORE.larghezza / 2, pin: LETTERA.larghezza / 2 };
export const MEZZA_PROFONDITA: Record<Pezzo, number> = { tessera: CARTA.lunghezza / 2, documento: CARTA.lunghezza / 2, lettore: LETTORE.profondita / 2, pin: LETTERA.lunghezza / 2 };

export const CENTRO_PEZZI: Vec = [0.5, 0, 3.0];
const PASSO_PEZZI = 0.92;

/** Dove appoggiare `n` pezzi: in colonna, un poco sfalsati e girati, come posati a mano. */
export function postiPezzi(n: number): { posizione: Vec; giro: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    posizione: [CENTRO_PEZZI[0] - 0.5 + (i % 2 ? 0.12 : -0.06), 0, CENTRO_PEZZI[2] + (i - (n - 1) / 2) * PASSO_PEZZI] as Vec,
    giro: [0.1, -0.07, 0.13][i] ?? 0,
  }));
}

/** Il punto caldo dell'oggetto, nel mondo. */
export const puntoCaldo = (nome: NomeOggetto): Vec => nelMondo(POSTI[nome], POSTI[nome].caldo);

