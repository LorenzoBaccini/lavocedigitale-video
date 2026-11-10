import type { ScenaDi } from "../../scenes/props.ts";
import type { PianoGancio } from "../piani/gancio.ts";
import { conPeso, fase } from "../regia.ts";
import type { Rettangolo } from "../set/geometria.ts";
import { NOTIFICA_PX, SCHERMO_PX } from "../set/geometria.ts";

/** Il primo piano resta fermo `fermo` frame, poi si allarga in `allarga`: da `FINE_DETTAGLIO` la scena e' quella del gancio. */
export const DETTAGLIO = { fermo: 6, allarga: 22 };
export const FINE_DETTAGLIO = DETTAGLIO.fermo + DETTAGLIO.allarga;
const DURATA_SPINTA = 22;

/** Su che cosa si apre il gancio: la notifica, il titolo della pagina, la barra del desktop, la schermata del telefono, l'oggetto. */
export type Dettaglio = "notifica" | "titolo" | "barra" | "telefono" | "oggetto";

/** Il dettaglio, deterministico dal contenuto: la notifica se c'e' sullo schermo, altrimenti cio' che l'oggetto mostra. */
export function dettaglioDi(s: Pick<ScenaDi<"gancio">, "oggetto" | "schermata">, conNotifica: boolean): Dettaglio {
  if (conNotifica) return "notifica";
  if (s.oggetto === "smartphone") return "telefono";
  if (s.oggetto === "chiavetta" || s.oggetto === "router" || s.oggetto === "carta") return "oggetto";
  return s.oggetto === "portatile" && (s.schermata ?? "sistema") !== "sistema" ? "titolo" : "barra";
}

/**
 * Il dettaglio in pixel del disegno (schermo del portatile, `SCHERMO_PX`, o del telefono, `TELEFONO_PX`); l'oggetto non ne ha
 * uno: ogni resa stringe sul suo punto caldo.
 */
export function riquadroDettaglio(d: Dettaglio, schermata: ScenaDi<"gancio">["schermata"]): Rettangolo | undefined {
  if (d === "notifica") return NOTIFICA_PX;
  // il titolo della pagina comincia a sinistra, sotto la barra del browser se c'e' (vedi `pagina` in set/disegni.ts)
  if (d === "titolo") return { x: 110, y: (schermata === "sito" ? 120 : 0) + 260, w: 1000, h: 330 };
  if (d === "barra") return { x: 0, y: SCHERMO_PX.h - 190, w: 780, h: 190 };
  if (d === "telefono") return { x: 40, y: 600, w: 640, h: 210 };
  return undefined;
}

/** Quanto il primo piano si e' allargato al frame f (0 stretto, 1 la scena del gancio). */
export const allargamento = (f: number): number => conPeso(fase(f, DETTAGLIO.fermo, FINE_DETTAGLIO));

/**
 * Il piano del gancio a dettaglio: il titolo entra quando il primo piano si e' allargato (le parole dette prima arrivano
 * insieme), e la spinta sulla chiave non comincia prima. La notifica alla fine resta dov'e'.
 */
export function pianoDettaglio(piano: PianoGancio, durata: number): PianoGancio {
  const parole = piano.parole.map((p) => ({ ...p, da: Math.max(p.da, FINE_DETTAGLIO) }));
  const sottolinea = Math.min(durata - 12, Math.max(piano.sottolinea, FINE_DETTAGLIO + 4));
  if (piano.notifica !== undefined) return { ...piano, parole, sottolinea };
  const da = Math.max(0, Math.min(Math.max(piano.spinta.da, FINE_DETTAGLIO), durata - DURATA_SPINTA));
  return { ...piano, parole, sottolinea, spinta: { da, a: da + DURATA_SPINTA } };
}
