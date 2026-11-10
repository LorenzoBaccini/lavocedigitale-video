import type { ScenaDi } from "../../scenes/props.ts";
import type { PianoGancio } from "../piani/gancio.ts";
import type { Effetto } from "../piano.ts";
import { conPeso, fase } from "../regia.ts";
import type { Rettangolo } from "../set/geometria.ts";
import { riquadroTitoloPagina, SCHEDA_BROWSER } from "../set/disegni.ts";
import { NOTIFICA_PX, SCHERMO_PX } from "../set/geometria.ts";

/** Il primo piano resta fermo `fermo` frame, poi si allarga in `allarga`: da `FINE_DETTAGLIO` la scena e' quella del gancio. */
export const DETTAGLIO = { fermo: 6, allarga: 22 };
export const FINE_DETTAGLIO = DETTAGLIO.fermo + DETTAGLIO.allarga;
const DURATA_SPINTA = 22;

/** Su che cosa si apre il gancio: la notifica, il titolo della pagina, la barra del desktop, la schermata del telefono, l'oggetto. */
export type Dettaglio = "notifica" | "titolo" | "barra" | "telefono" | "oggetto";

/**
 * Se la notifica dell'allarme che segue e' sullo schermo del gancio: sul set sempre (sta sul portatile, che c'e' sempre); a
 * tutto quadro solo quando lo schermo e' quello del portatile (portatile o nessun oggetto).
 */
export const notificaSulloSchermo = (s: Pick<ScenaDi<"gancio">, "oggetto" | "contesto">, aTuttoQuadro: boolean): boolean =>
  s.contesto.messaggioSeguente !== undefined && (!aTuttoQuadro || s.oggetto === "portatile" || s.oggetto === "nessuno");

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
export function riquadroDettaglio(d: Dettaglio, s: Pick<ScenaDi<"gancio">, "schermata" | "titolo">): Rettangolo | undefined {
  if (d === "notifica") return NOTIFICA_PX;
  if (d === "titolo") {
    const r = riquadroTitoloPagina(s.titolo, s.schermata === "app" ? "app" : "sito");
    return { x: r.x - MARGINE_DETTAGLIO, y: r.y - MARGINE_DETTAGLIO, w: r.w + 2 * MARGINE_DETTAGLIO, h: r.h + 2 * MARGINE_DETTAGLIO };
  }
  if (d === "barra") return { x: 0, y: SCHERMO_PX.h - 190, w: 780, h: 190 };
  if (d === "telefono") return { x: 50, y: 610, w: 520, h: 190 };
  return undefined;
}

const MARGINE_SCHEDA = 24;

/**
 * Il dettaglio a tutto quadro: sul sito la scheda del browser col titolo (il titolo grande, intero, sarebbe largo quanto la
 * scena e il primo piano non si distinguerebbe), altrimenti lo stesso dettaglio del set.
 */
export function riquadroDettaglioSchermo(d: Dettaglio, s: Pick<ScenaDi<"gancio">, "schermata" | "titolo">): Rettangolo | undefined {
  if (d !== "titolo" || s.schermata !== "sito") return riquadroDettaglio(d, s);
  const m = MARGINE_SCHEDA;
  return { x: SCHEDA_BROWSER.x - m, y: SCHEDA_BROWSER.y - m, w: SCHEDA_BROWSER.w + 2 * m, h: SCHEDA_BROWSER.h + 2 * m };
}

/** Lo spazio attorno al titolo della pagina nel primo piano: il titolo non e' mai tagliato. */
export const MARGINE_DETTAGLIO = 70;

/** Aperto sulla notifica (solo se e' sullo schermo, `notificaSulloSchermo`), il suo suono va sul primo fotogramma: alla fine sembrerebbe una seconda notifica. */
export const suoniDettaglio = (suoni: Effetto[]): Effetto[] => suoni.map((e) => (e.suono === "notifica" ? { ...e, da: 0 } : e));

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
