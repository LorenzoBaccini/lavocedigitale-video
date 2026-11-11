import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { coloreFoglio, Foglio } from "../editoriale/carta/Foglio";
import { Occhiello } from "../editoriale/carta/Occhiello";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoMappa } from "../editoriale/piani/mappa";
import { piantina, Pittogramma } from "../editoriale/pittogrammi";
import { improntaMescolata } from "../editoriale/impronta";
import { conPeso, fase, uscita } from "../editoriale/regia";
import { Pennarello } from "../editoriale/Segno";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { conAlfa } from "../editoriale/stili/alfa";
import { Titolo } from "../editoriale/Titolo";
import type { Punto } from "../editoriale/tratto";
import { avanzamento, casuale, cerchiatura, lunghezza, percorso, riquadro, smussa, tratteggio } from "../editoriale/tratto";
import { ALTEZZA, FONDO_TITOLO, LARGHEZZA_UTILE, MARGINE, SOTTO_OCCHIELLO, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

/** Le etichette dei luoghi restano almeno a tanto dal bordo del riquadro. */
const ARIA = 28;
const MAPPA_TOP = SOTTO_OCCHIELLO;
/** Dove stanno piantina e titolo, uno sopra l'altro: dall'occhiello al fondo dei titoli. */
const SPAZIO = ALTEZZA - FONDO_TITOLO - MAPPA_TOP;
/** Fra la piantina e il titolo. */
const FRA = 40;
/** Le righe del titolo per cui la piantina lascia sempre posto: un titolo di 24 caratteri puo' andare a capo. */
const RIGHE_TITOLO = 2;
/** L'interlinea del `Titolo` e lo spazio fra due righe. */
const INTERLINEA_TITOLO = 1.12;
const FRA_RIGHE = 4;
const SPILLO = 150;
/** La punta dello spillo nel riquadro 100×100 del pittogramma `posizione`. */
const PUNTA = { x: 0.5, y: 0.88 };
/** Larghezza media di una lettera del testo in grassetto in rapporto al corpo (piu' larga di quella del `Flusso`: qui si stima per eccesso), per tenere l'etichetta nel riquadro, non per misurare. */
const LARGHEZZA_LETTERA = 0.6;
/** In rapporto al lato: ci sta un luogo di 20 caratteri su una riga, anche col monospazio della notte. */
const LARGHEZZA_ETICHETTA = 0.72;
const CORPO_LUOGO = 36;
/** Il tragitto a trattini: pieno, vuoto. */
const TRATTINO = [24, 15] as const;

/** Un'etichetta nel riquadro: `x` e' il bordo da cui parte (o il centro), `y` la cima o, con `sopra`, il fondo. */
interface Etichetta {
  testo: string;
  da: number;
  x: number;
  y: number;
  ancora: "sinistra" | "centro" | "destra";
  sopra?: boolean;
}

// La mappa su un foglio liscio: una piantina di quartiere inventata appare in dissolvenza in un riquadro quadrato, poi
// la mano segna il luogo nell'accento (lo spillo che cade, la zona cerchiata, il tragitto a trattini da A a B) e le
// etichette dei luoghi arrivano con la voce, dentro il riquadro; sotto, il titolo con la chiave.
export const Mappa: React.FC<ScenaDi<"mappa">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, titolo, forma, luoghi } = props;
  const piano = pianoMappa(props, durata);
  // la piantina e' grande quanto lascia il titolo, sempre su due righe: se ne usa una, il blocco resta centrato in altezza;
  // in larghezza piantina e titolo partono dal bordo dei titoli dello stile, come nel `Simbolo`
  const corpoTitolo = corpo(titolo, 116, 16, stile.larghezza);
  const lato = Math.floor(SPAZIO - FRA - RIGHE_TITOLO * corpoTitolo * INTERLINEA_TITOLO - (RIGHE_TITOLO - 1) * FRA_RIGHE);
  const larghezzaEtichetta = lato * LARGHEZZA_ETICHETTA;
  const seme = improntaMescolata(etichetta + titolo);
  const disegno = piantina(seme);
  const bordo = riquadro(lato, lato, (seme % 89) + 3);
  const r = casuale(seme + 1);
  const scosta = (ampiezza: number) => (r() - 0.5) * ampiezza * lato;
  const accento = stile.colori.accentoSuChiaro;
  const tenue = stile.colori.inchiostro.tenue;
  // le etichette si staccano dalle linee della piantina con lo stesso fondo del foglio
  const carta = coloreFoglio(stile, "liscia");
  // mai sotto il corpo minimo leggibile su telefono; 28 e' l'imbottitura dell'etichetta, a destra e a sinistra
  const corpoLuogo = Math.max(34, Math.round(CORPO_LUOGO / stile.larghezza));
  const largo = (testo: string) => Math.min(larghezzaEtichetta, testo.length * LARGHEZZA_LETTERA * corpoLuogo * stile.larghezza + 28);

  // il segno e dove stanno le etichette, nelle coordinate del riquadro
  let segno: React.ReactNode = null;
  let etichette: Etichetta[] = [];
  if (forma === "punto") {
    const p: Punto = [lato / 2 + scosta(0.16), lato * 0.46 + scosta(0.1)];
    const caduta = conPeso(fase(f, piano.segno, piano.segno + 7));
    const atterrato = fase(f, piano.segno + 6, piano.segno + 10);
    segno = (
      <>
        <svg width={lato} height={lato} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {atterrato > 0 && <ellipse cx={p[0]} cy={p[1]} rx={22 + 10 * uscita(atterrato)} ry={8 + 3 * uscita(atterrato)} fill="none" stroke={accento} strokeWidth={5} opacity={0.85 * atterrato} />}
        </svg>
        {f >= piano.segno && (
          <div style={{ position: "absolute", left: p[0] - SPILLO * PUNTA.x, top: p[1] - SPILLO * PUNTA.y - (1 - caduta) * 140, opacity: fase(f, piano.segno, piano.segno + 3) }}>
            <Pittogramma simbolo="posizione" lato={SPILLO} colore={accento} progresso={1} spessore={7} />
          </div>
        )}
      </>
    );
    etichette = [{ testo: luoghi[0], da: piano.luoghi[0], x: p[0], y: p[1] + 26, ancora: "centro" }];
  } else if (forma === "area") {
    const [cx, cy, rx, ry] = [lato / 2 + scosta(0.12), lato * 0.42 + scosta(0.08), lato * 0.25, lato * 0.17];
    const giro = cerchiatura(cx, cy, rx, ry, seme % 997);
    segno = (
      <svg width={lato} height={lato} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* la zona si colora dentro il primo giro della mano, non oltre il tratto */}
        <path d={`${percorso(giro.slice(0, Math.round(giro.length / 1.12)))} Z`} fill={conAlfa(accento, 0.16)} opacity={fase(f, piano.segno + 6, piano.segno + 14)} />
        <Pennarello d={percorso(giro)} colore={accento} spessore={9} progresso={(f - piano.segno) / 14} lunghezza={lunghezza(giro)} />
      </svg>
    );
    etichette = [{ testo: luoghi[0], da: piano.luoghi[0], x: cx, y: cy + ry * 1.18 + 16, ancora: "centro" }];
  } else {
    const a: Punto = [lato * 0.2 + scosta(0.08), lato * 0.3 + scosta(0.08)];
    const b: Punto = [lato * 0.8 + scosta(0.08), lato * 0.7 + scosta(0.08)];
    const svolta = lato / 2 + scosta(0.2);
    const tragitto = smussa([a, [svolta, a[1]], [svolta, b[1]], b], 44);
    const arrivo = Math.max(8, piano.luoghi[1] - piano.segno);
    const fatto = avanzamento(f, piano.segno, arrivo) * lunghezza(tragitto);
    const comparsa = (da: number) => uscita(fase(f, da, da + 5));
    segno = (
      <svg width={lato} height={lato} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {f >= piano.segno && tratteggio(tragitto, TRATTINO[0], TRATTINO[1], fatto).map((t, i) => <Pennarello key={i} d={percorso(t)} colore={accento} spessore={9} progresso={1} lunghezza={lunghezza(t)} />)}
        <circle cx={a[0]} cy={a[1]} r={12 * comparsa(piano.segno)} fill={accento} />
        <circle cx={b[0]} cy={b[1]} r={22 * comparsa(piano.luoghi[1])} fill="none" stroke={accento} strokeWidth={6} />
        <circle cx={b[0]} cy={b[1]} r={10 * comparsa(piano.luoghi[1])} fill={accento} />
      </svg>
    );
    etichette = [
      { testo: luoghi[0], da: piano.luoghi[0], x: a[0] - 26, y: a[1] - 26, ancora: "sinistra", sopra: true },
      { testo: luoghi[1], da: piano.luoghi[1], x: b[0] + 26, y: b[1] + 30, ancora: "destra" },
    ];
  }

  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", justifyContent: allineaFlesso(stile) }}>
        <Occhiello testo={etichetta} opacita={fase(f, 0, 6)} />
      </div>
      <div style={{ position: "absolute", top: MAPPA_TOP, bottom: FONDO_TITOLO, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: allineaFlesso(stile), gap: FRA }}>
        <div style={{ position: "relative", flex: "none", width: lato, height: lato }}>
          {/* il controllo d'impaginazione vuole le etichette dentro questo bordo, cioe' a ARIA / 2 dal riquadro */}
          <div data-ingombro="piantina" style={{ position: "absolute", inset: ARIA / 2, pointerEvents: "none" }} />
          <svg width={lato} height={lato} viewBox="0 0 1000 1000" style={{ position: "absolute", left: 0, top: 0, opacity: fase(f, piano.piantina, piano.piantina + 12) }}>
            {disegno.fiume.map((d, i) => <path key={`f${i}`} d={d} fill="none" stroke={tenue} strokeWidth={4} strokeLinecap="round" opacity={0.7} />)}
            {disegno.isolati.map((d, i) => <path key={`i${i}`} d={d} fill={conAlfa(tenue, 0.1)} stroke={tenue} strokeWidth={3.4} strokeLinejoin="round" opacity={0.75} />)}
            {disegno.strade.map((d, i) => <path key={`s${i}`} d={d} fill="none" stroke={tenue} strokeWidth={5} strokeLinecap="round" opacity={0.9} />)}
          </svg>
          <svg width={lato} height={lato} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <Pennarello d={percorso(bordo)} colore={tenue} spessore={5} progresso={(f - piano.piantina) / 14} lunghezza={lunghezza(bordo)} />
          </svg>
          {segno}
          {etichette.map((e, i) => {
            const w = largo(e.testo);
            const sinistra = e.ancora === "centro" ? e.x - w / 2 : e.ancora === "destra" ? e.x - w : e.x;
            const x = Math.min(lato - ARIA - w, Math.max(ARIA, sinistra));
            const p = fase(f, e.da, e.da + 6);
            return (
              <div key={i} style={{ position: "absolute", left: x, width: w, ...(e.sopra ? { bottom: lato - e.y } : { top: e.y }), display: "flex", justifyContent: e.ancora === "centro" ? "center" : e.ancora === "destra" ? "flex-end" : "flex-start", opacity: p, transform: `translateY(${(1 - uscita(p)) * (e.sopra ? 8 : -8)}px) rotate(${i ? 1.2 : -1.5}deg)` }}>
                <div data-impaginazione="luogo" style={{ maxWidth: w, boxSizing: "border-box", padding: "4px 14px 6px", borderRadius: 10, background: conAlfa(carta, 0.92), fontFamily: stile.caratteri.testo, fontWeight: 650, fontSize: corpoLuogo, lineHeight: 1.15, textAlign: e.ancora === "centro" ? "center" : e.ancora === "destra" ? "right" : "left", color: stile.colori.inchiostro.testo }}>
                  {e.testo}
                </div>
              </div>
            );
          })}
        </div>
        <Titolo
          nome="titolo"
          f={f}
          tinta="grafica"
          righe={[{ parole: piano.parole, size: corpoTitolo, peso: 700 }]}
          style={{ alignSelf: "stretch", width: LARGHEZZA_UTILE }}
        />
      </div>
    </Foglio>
  );
};
