import { Vector3 } from "three";

import type { Reperto } from "../../../storyboard/tipi.ts";
import { LARGHEZZA, MARGINE } from "../../../impaginazione.ts";
import type { Camera } from "../geometria.ts";
import { proietta, rettangoloDi } from "../geometria.ts";

/** Il volume che il reperto puo' occupare, reazione compresa (le meta' della carta che si allontanano, l'arco che sale). */
export interface Sagoma {
  larghezza: number;
  altezza: number;
  profondita: number;
}

export const SAGOME: Record<Reperto, Sagoma> = {
  telefono: { larghezza: 1.1, altezza: 2.2, profondita: 0.14 },
  chiamata: { larghezza: 1.1, altezza: 2.2, profondita: 0.14 },
  email: { larghezza: 2.6, altezza: 1.95, profondita: 0.5 },
  soldi: { larghezza: 3.0, altezza: 2.2, profondita: 0.8 },
  carta: { larghezza: 2.95, altezza: 1.85, profondita: 0.12 },
  lucchetto: { larghezza: 2.0, altezza: 2.4, profondita: 0.6 },
};

/** Il reperto galleggia sopra il piano: il suo centro sta a questa quota sopra il fondo della sagoma. */
export const centroReperto = (s: Sagoma) => new Vector3(0, s.altezza / 2 + 0.6, 0);

// la camera guarda il reperto quasi di fronte, appena dall'alto: si vede il piano sotto, non lo scorcio
const ELEVAZIONE = 0.1;
// margine fra il reperto e la fascia: la spinta lenta della camera lo avvicina di poco
const RESPIRO = 1.06;

/** Gli otto spigoli della sagoma girata di `giro` intorno all'asse verticale, nel mondo. */
export function angoliReperto(s: Sagoma, giro: number): Vector3[] {
  const c = centroReperto(s);
  return [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => new Vector3((x * s.larghezza) / 2, (y * s.altezza) / 2, (z * s.profondita) / 2).applyAxisAngle(new Vector3(0, 1, 0), giro).add(c))));
}

/** La camera da cui il reperto, girato fino a ±0,4, sta tutto fra le quote `alto` e `basso` e dentro i margini. */
export function inquadraReperto(s: Sagoma, alto: number, basso: number): Camera {
  const centro = centroReperto(s);
  const punti = [-0.4, 0, 0.4].flatMap((g) => angoliReperto(s, g));
  const fascia = { w: LARGHEZZA - 2 * MARGINE, h: basso - alto };
  let d = 10;
  let dy = 0;
  const cam = (): Camera => {
    const look = centro.clone().add(new Vector3(0, dy, 0));
    return { pos: [look.x, look.y + d * Math.sin(ELEVAZIONE), look.z + d * Math.cos(ELEVAZIONE)], look: look.toArray() as Camera["look"] };
  };
  for (let i = 0; i < 6; i++) {
    const r = rettangoloDi(punti.map((p) => proietta(p, cam())));
    d *= Math.max(r.h / fascia.h, r.w / fascia.w) * RESPIRO;
    const q = rettangoloDi(punti.map((p) => proietta(p, cam())));
    // un pixel del fotogramma, nel mondo, alla distanza del reperto
    const perPx = s.altezza / Math.max(1, rettangoloDi(angoliReperto(s, 0).map((p) => proietta(p, cam()))).h);
    dy -= (q.y + q.h / 2 - (alto + basso) / 2) * perPx;
  }
  return cam();
}
