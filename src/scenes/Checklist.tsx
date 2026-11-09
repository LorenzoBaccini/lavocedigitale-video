import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoChecklist, RITARDO_SPUNTA } from "../editoriale/piani/checklist";
import { fase, uscita } from "../editoriale/regia";
import { Pennarello } from "../editoriale/Segno";
import { useStile } from "../editoriale/stili";
import { casuale, lunghezza, percorso, spunta } from "../editoriale/tratto";
import { FONDO_SCENA, MARGINE, RESPIRO, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const CASELLA = 96;

// quadratino tracciato a penna: quattro lati appena storti, che si chiudono scavalcando l'angolo
const casella = (seme: number) => {
  const r = casuale(seme);
  const j = () => (r() - 0.5) * 4;
  const l = CASELLA - 8;
  return `M${4 + j()} ${4 + j()} L${4 + l + j()} ${4 + j()} L${4 + l + j()} ${4 + l + j()} L${4 + j()} ${4 + l + j()} Z`;
};

// La lista su un quaderno a quadretti: ogni voce si scrive quando la voce la nomina, la penna blu la spunta.
export const Checklist: React.FC<ScenaDi<"checklist">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, voci } = props;
  const piano = pianoChecklist(props, durata);
  const entrata = fase(f, 0, 8);
  return (
    <Foglio tipo="quadretti" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, bottom: FONDO_SCENA + RESPIRO, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div data-impaginazione="titolo" style={{ maxWidth: "100%", textAlign: "center", fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: Math.max(58, corpo(etichetta, 84, 20)), lineHeight: 1.12, color: stile.colori.inchiostro.testo, opacity: entrata, transform: `translateY(${(1 - uscita(entrata)) * 16}px)` }}>{etichetta}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 84, maxWidth: "100%", paddingBottom: 20 }}>
          {voci.map((v, i) => {
            const p = fase(f, piano.voci[i], piano.voci[i] + 7);
            const segno = spunta(4, 6, CASELLA - 10, 31 + i);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, opacity: p, transform: `translateX(${(1 - uscita(p)) * -14}px)` }}>
                <svg width={CASELLA} height={CASELLA} style={{ flex: "none", overflow: "visible" }}>
                  <path d={casella(17 + i)} fill="none" stroke={stile.colori.inchiostro.testo} strokeWidth={3} strokeLinejoin="round" opacity={0.85} />
                  <Pennarello d={percorso(segno)} colore={stile.colori.inchiostro.penna} spessore={7} progresso={(f - piano.voci[i] - RITARDO_SPUNTA) / 8} lunghezza={lunghezza(segno)} />
                </svg>
                <div style={{ minWidth: 0 }}>
                  <div data-impaginazione="voce" style={{ fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: corpo(v.grande, 86, 13), lineHeight: 1.1, color: stile.colori.inchiostro.testo }}>{v.grande}</div>
                  <div data-impaginazione="voce" style={{ fontFamily: stile.caratteri.testo, fontWeight: 500, fontSize: 44, lineHeight: 1.25, color: stile.colori.inchiostro.tenue, marginTop: 6 }}>{v.piccolo}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Foglio>
  );
};
