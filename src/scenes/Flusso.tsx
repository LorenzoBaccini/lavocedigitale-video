import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { Occhiello } from "../editoriale/carta/Occhiello";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoFlusso } from "../editoriale/piani/flusso";
import { Pittogramma } from "../editoriale/pittogrammi";
import { fase, uscita } from "../editoriale/regia";
import { Pennarello } from "../editoriale/Segno";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { avanzamento, freccia, lunghezza, percorso, riquadro } from "../editoriale/tratto";
import { ALTEZZA, FONDO_UTILE, LARGHEZZA, MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

/** i riquadri vanno da margine a margine, in ogni stile */
const LARGHEZZA_RIQUADRO = LARGHEZZA - 2 * MARGINE;
const ALTEZZA_MASSIMA = 200;
/** lo spazio fra due riquadri, dove sta la freccia */
const FRA_RIQUADRI = 130;
/** il respiro fra la freccia e i due riquadri */
const ARIA_FRECCIA = 10;
const PADDING = 44;
const GAP = 26;
/** larghezza media di una lettera in rapporto al corpo: per centrare il blocco, non per misurare */
const LARGHEZZA_LETTERA = 0.56;
const SIMBOLO = 88;
/** sotto l'occhiello (36 px su una riga) e un po' di aria */
const NODI_TOP = TITOLO_TOP + 90;

// Il flusso su un foglio liscio: i riquadri incolonnati dall'alto in basso, uniti da frecce a pennarello che si
// tracciano quando arriva il nodo dopo; l'ultimo, il punto d'arrivo, ha il riquadro nel colore d'accento.
export const Flusso: React.FC<ScenaDi<"flusso">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, nodi } = props;
  const piano = pianoFlusso(props, durata);
  const conSimbolo = nodi.some((x) => x.simbolo);
  const centrato = allineaFlesso(stile) === "center";
  const altezza = Math.min(ALTEZZA_MASSIMA, (FONDO_UTILE - 20 - NODI_TOP - (nodi.length - 1) * FRA_RIQUADRI) / nodi.length);
  const totale = nodi.length * altezza + (nodi.length - 1) * FRA_RIQUADRI;
  const corpoNodo = (testo: string) => corpo(testo, 56, 20, stile.larghezza, 40);
  // con i pittogrammi le righe partono tutte dallo stesso bordo; a centro foglio, il bordo che centra la riga piu' larga
  const blocco = SIMBOLO + GAP + Math.max(...nodi.map((x) => x.testo.length * corpoNodo(x.testo) * LARGHEZZA_LETTERA));
  const sinistra = centrato && conSimbolo ? Math.max(PADDING, (LARGHEZZA_RIQUADRO - blocco) / 2) : PADDING;
  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", justifyContent: allineaFlesso(stile) }}>
        <Occhiello testo={etichetta} opacita={fase(f, 0, 6)} />
      </div>
      <div style={{ position: "absolute", top: NODI_TOP, bottom: ALTEZZA - FONDO_UTILE + 20, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "relative", width: LARGHEZZA_RIQUADRO, height: totale }}>
          {nodi.map((nodo, i) => {
            const da = piano.nodi[i];
            const ultimo = i === nodi.length - 1;
            const giro = riquadro(LARGHEZZA_RIQUADRO, altezza, 31 + i);
            const top = i * (altezza + FRA_RIQUADRI);
            const p = fase(f, da + 3, da + 9);
            const asta = freccia({ x: LARGHEZZA_RIQUADRO / 2, y: 0 }, { x: LARGHEZZA_RIQUADRO / 2, y: FRA_RIQUADRI - 2 * ARIA_FRECCIA }, 41 + i);
            return (
              <div key={i}>
                <div style={{ position: "absolute", top, left: 0, width: LARGHEZZA_RIQUADRO, height: altezza, display: "flex", alignItems: "center", justifyContent: centrato && !conSimbolo ? "center" : "flex-start", gap: GAP, padding: `0 ${PADDING}px 0 ${sinistra}px`, boxSizing: "border-box" }}>
                  <svg width={LARGHEZZA_RIQUADRO} height={altezza} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                    <Pennarello d={percorso(giro)} colore={ultimo ? stile.colori.accentoSuChiaro : stile.colori.inchiostro.testo} spessore={ultimo ? 9 : 6} progresso={(f - da) / 12} lunghezza={lunghezza(giro)} />
                  </svg>
                  {/* il posto del pittogramma resta anche a chi non ce l'ha: i testi condividono il bordo sinistro */}
                  {conSimbolo && (
                    <div style={{ flex: "none", width: SIMBOLO, height: SIMBOLO }}>
                      {nodo.simbolo && <Pittogramma simbolo={nodo.simbolo} lato={SIMBOLO} colore={ultimo ? stile.colori.accentoSuChiaro : stile.colori.inchiostro.testo} progresso={avanzamento(f, da + 4, 14)} spessore={8} />}
                    </div>
                  )}
                  <div data-impaginazione="voce" style={{ minWidth: 0, fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: corpoNodo(nodo.testo), lineHeight: 1.12, color: stile.colori.inchiostro.testo, opacity: p, transform: `translateY(${(1 - uscita(p)) * 10}px)` }}>{nodo.testo}</div>
                </div>
                {i < nodi.length - 1 && (
                  <svg width={LARGHEZZA_RIQUADRO} height={FRA_RIQUADRI - 2 * ARIA_FRECCIA} style={{ position: "absolute", left: 0, top: top + altezza + ARIA_FRECCIA, overflow: "visible" }}>
                    <Pennarello d={percorso(asta)} colore={stile.colori.inchiostro.testo} spessore={8} progresso={(f - piano.frecce[i]) / 10} lunghezza={lunghezza(asta)} />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Foglio>
  );
};
