import { AbsoluteFill, useCurrentFrame } from "remotion";

import { FONDO_UTILE, MARGINE } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import type { Pezzo } from "../../storyboard/tipi";
import { pianoDocumenti } from "../piani/documenti";
import { conPeso, fase, mix, uscita } from "../regia";
import type { Rettangolo } from "../set/geometria";
import { Ingombro } from "../set/Ingombro";
import { sopraIlTitolo } from "../set/misureOcchiello";
import { COLONNA_NOTA } from "../set/nota";
import { NotaAccanto } from "../set/NotaAccanto";
import { documento, letteraPin, tessera } from "../set/oggetti/disegni";
import { useStile } from "../stili";
import { titoloDocumenti } from "../testate/documenti";
import { fineTitoloAlto } from "../testate/quote";
import { Disegno } from "./Disegno";
import { LettorePiatto } from "./Illustrazioni";
import { Testata } from "./Testata";
import { angoli } from "./vista";

const STACCO = 40;
const FRA_SCHEDE = 36;
/** La colonna delle schede: non piu' larga di cosi', e lontana dalle note quanto basta per la freccia. */
const LARGHEZZA_MASSIMA = 420;
const SFALSA = 28;

/** Le misure del disegno di ciascun pezzo: la sua forma, e la scheda. */
const PEZZO: Record<Pezzo, { w: number; h: number; raggio: number }> = {
  tessera: { w: 976, h: 616, raggio: 36 },
  documento: { w: 976, h: 616, raggio: 36 },
  pin: { w: 880, h: 600, raggio: 8 },
  lettore: { w: 700, h: 500, raggio: 0 },
};
const DISEGNO = { tessera, documento, pin: letteraPin } as const;

const Scheda: React.FC<{ pezzo: Pezzo; r: Rettangolo; entrata: number }> = ({ pezzo, r, entrata }) => {
  const { w, h, raggio } = PEZZO[pezzo];
  const ombra = pezzo === "lettore" ? { filter: "drop-shadow(0 12px 18px rgba(20,24,30,0.25))" } : { boxShadow: "0 12px 28px rgba(20,24,30,0.22)", borderRadius: raggio * (r.w / w), overflow: "hidden" as const };
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity: entrata, transform: `translateY(${(1 - entrata) * 24}px)`, ...ombra }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${r.w / w})`, transformOrigin: "0 0" }}>
        {pezzo === "lettore" ? <LettorePiatto /> : <Disegno w={w} h={h} disegna={DISEGNO[pezzo]} chiave={pezzo} />}
      </div>
    </div>
  );
};

// I pezzi come schede illustrate piatte, in colonna a sinistra, sul grigio; le note a destra con la freccia a pennarello
// arrivano quando la voce nomina ciascun pezzo. In alto occhiello e titolo.
export const DocumentiSchermo: React.FC<ScenaDi<"documenti">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, pezzi } = props;
  const piano = pianoDocumenti(props, durata);
  const righe = titoloDocumenti(props, piano, stile);
  const alto = fineTitoloAlto(props.titolo, righe, stile, sopraIlTitolo(etichetta)) + STACCO;
  const fino = FONDO_UTILE - STACCO;
  const proporzioni = pezzi.map((p) => PEZZO[p.oggetto].h / PEZZO[p.oggetto].w);
  const larghezza = Math.min(LARGHEZZA_MASSIMA, (fino - alto - FRA_SCHEDE * (pezzi.length - 1)) / proporzioni.reduce((a, b) => a + b, 0));
  const altezze = proporzioni.map((p) => p * larghezza);
  const totale = altezze.reduce((a, b) => a + b, 0) + FRA_SCHEDE * (pezzi.length - 1);
  // la camera si avvicina appena alla colonna (dal suo centro), gli stacchi in asse un poco di piu'
  const k = mix(1, 1.03, uscita(fase(f, 0, durata))) * 1.015 ** piano.stacchi.filter((s) => f >= s).length;
  const cx = MARGINE + larghezza / 2;
  const cy = (alto + fino) / 2;
  let y = cy - totale / 2;
  const schede = altezze.map((h, i) => {
    const r = { x: MARGINE + (i % 2 ? SFALSA : 0), y, w: larghezza, h };
    y += h + FRA_SCHEDE;
    return { x: cx + (r.x - cx) * k, y: cy + (r.y - cy) * k, w: r.w * k, h: r.h * k };
  });
  return (
    <AbsoluteFill style={{ background: stile.colori.superficie }}>
      {pezzi.map((p, i) => (
        <Scheda key={p.oggetto} pezzo={p.oggetto} r={schede[i]} entrata={conPeso(fase(f, 2 + i * 4, 12 + i * 4))} />
      ))}
      {schede.map((r, i) => (
        <Ingombro key={i} nome={pezzi[i].oggetto} angoli={angoli(r)} pieno />
      ))}
      {pezzi.map((p, i) => {
        const r = schede[i];
        return <NotaAccanto key={p.oggetto} nome={`nota-${i + 1}`} testo={p.nota} x={r.x + r.w + 6} y={r.y + r.h / 2} sinistra={Math.max(COLONNA_NOTA, r.x + r.w + 70)} da={piano.note[i]} f={f} seme={41 + i} />;
      })}
      <Testata f={f} etichetta={etichetta} righe={righe} />
    </AbsoluteFill>
  );
};
