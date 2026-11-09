import type { Rettangolo } from "../set/geometria";
import { PULSANTE_PX, SCHERMO_PX } from "../set/geometria";
import type { SchermoTelefono } from "../set/oggetti/disegni";
import { disegnoTelefono, RIGA_EVIDENZIATA } from "../set/oggetti/disegni";
import type { Schermo } from "../set/schermata";
import { disegnoSchermo } from "../set/schermata";
import { TELEFONO_PX } from "../set/telefono";
import { Disegno } from "./Disegno";
import { CartaPiatta, ChiavettaPiatta, RouterPiatto } from "./Illustrazioni";
import type { Misure, Ripresa, Vista } from "./vista";
import { vista } from "./vista";

/** Che cosa mostra lo schermo a tutto quadro: le misure del disegno, il colore attorno, il disegno, il punto da toccare. */
export interface Contenuto {
  misure: Misure;
  /** il colore del riquadro dove il disegno non arriva (combacia con il suo bordo) */
  fondo: string;
  strato: React.ReactNode;
  /** il punto di `indica`: il pulsante, la riga evidenziata, il punto caldo dell'oggetto */
  caldo?: Rettangolo;
  /** il portatile e l'oggetto si toccano col puntatore, il telefono col dito */
  tipo: "portatile" | "telefono" | "oggetto";
}

/** Lo schermo del portatile, lo stesso disegno della texture del set. */
export const contenutoPortatile = (schermo: Schermo, orologio?: string): Contenuto => ({
  misure: SCHERMO_PX,
  fondo: "#1b2230",
  strato: <Disegno w={SCHERMO_PX.w} h={SCHERMO_PX.h} disegna={disegnoSchermo(schermo, orologio)} chiave={JSON.stringify([schermo, orologio])} />,
  caldo: schermo.tipo === "finestra" ? PULSANTE_PX : undefined,
  tipo: "portatile",
});

const FONDO_TELEFONO: Record<SchermoTelefono["tipo"], string> = { blocco: "#1b2230", elenco: "#101113", opzioni: "#f4f2ee" };

/** Lo schermo del telefono: il disegno del set dipinto a 2×, perche' a tutto quadro e' ingrandito. */
export const contenutoTelefono = (s: SchermoTelefono): Contenuto => ({
  misure: TELEFONO_PX,
  fondo: FONDO_TELEFONO[s.tipo],
  strato: (
    <Disegno
      w={TELEFONO_PX.w * 2}
      h={TELEFONO_PX.h * 2}
      disegna={(ctx) => {
        ctx.scale(2, 2);
        disegnoTelefono(s)(ctx);
      }}
      chiave={JSON.stringify(s)}
      style={{ width: TELEFONO_PX.w, height: TELEFONO_PX.h }}
    />
  ),
  caldo: s.tipo === "elenco" ? { x: 32, y: 300 + RIGA_EVIDENZIATA * 132, w: TELEFONO_PX.w - 64, h: 112 } : undefined,
  tipo: "telefono",
});

export type OggettoPiatto = "chiavetta" | "router" | "carta";

const CALDO_OGGETTO: Record<OggettoPiatto, Rettangolo> = {
  chiavetta: { x: 300, y: 300, w: 300, h: 160 },
  router: { x: 266, y: 486, w: 288, h: 48 },
  carta: { x: 122, y: 272, w: 130, h: 100 },
};

/** Un oggetto senza schermo, come scheda illustrata piatta al centro del riquadro. */
export const contenutoOggetto = (nome: OggettoPiatto, f: number): Contenuto => ({
  misure: { w: 1000, h: 760 },
  fondo: "#dfe3e9",
  strato: nome === "chiavetta" ? <ChiavettaPiatta spia={Math.floor(f / 7) % 2 === 1} /> : nome === "router" ? <RouterPiatto lampeggio={Math.floor(f / 9) % 2 === 1} /> : <CartaPiatta />,
  caldo: CALDO_OGGETTO[nome],
  tipo: "oggetto",
});

/** La scala con cui il contenuto si vede intero nel riquadro: il portatile lo copre, il telefono ne prende la larghezza, l'oggetto sta nella parte utile. */
export const scalaInsieme = (c: Contenuto, quadro: Rettangolo, utile: number): number => {
  if (c.tipo === "telefono") return quadro.w / c.misure.w;
  if (c.tipo === "oggetto") return Math.min((quadro.w * 0.86) / c.misure.w, (utile * 0.92) / c.misure.h);
  return Math.max(quadro.w / c.misure.w, quadro.h / c.misure.h);
};

/** La vista del contenuto: il telefono ha i bordi a tinta unita e la camera ci va libera, il resto non mostra mai oltre il disegno. */
export const vistaDi = (c: Contenuto, quadro: Rettangolo, r: Ripresa, centro?: number): Vista => vista(c.misure, quadro, r, centro ?? quadro.y + quadro.h / 2, c.tipo === "telefono");
