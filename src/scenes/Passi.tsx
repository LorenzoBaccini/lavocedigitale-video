import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { Occhiello } from "../editoriale/carta/Occhiello";
import { spintaFoglio } from "../editoriale/piani/carta";
import { DISSOLVENZA_PASSO, pianoPassi } from "../editoriale/piani/passi";
import { Pittogramma } from "../editoriale/pittogrammi";
import { fase, uscita } from "../editoriale/regia";
import { Pennarello } from "../editoriale/Segno";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { avanzamento, cerchiatura, lunghezza, percorso } from "../editoriale/tratto";
import { ALTEZZA, FONDO_UTILE, MARGINE, SOTTO_OCCHIELLO, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const CERCHIO = 112;
const SIMBOLO = 96;
const ALTEZZA_MASSIMA = 240;
const RIGHE_TOP = SOTTO_OCCHIELLO;

// I passi su un quaderno a quadretti: ogni numero si cerchia a penna quando la voce arriva al passo, con il suo
// pittogramma piccolo e il testo. Le righe si dividono la zona utile, qualunque sia il loro numero.
export const Passi: React.FC<ScenaDi<"passi">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, passi } = props;
  const piano = pianoPassi(props, durata);
  const conSimbolo = passi.some((x) => x.simbolo);
  const altezza = Math.min(ALTEZZA_MASSIMA, (FONDO_UTILE - 20 - RIGHE_TOP) / passi.length);
  return (
    <Foglio tipo="quadretti" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", justifyContent: allineaFlesso(stile) }}>
        <Occhiello testo={etichetta} opacita={fase(f, 0, 6)} />
      </div>
      <div style={{ position: "absolute", top: RIGHE_TOP, bottom: ALTEZZA - FONDO_UTILE + 20, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: allineaFlesso(stile) }}>
        <div style={{ maxWidth: "100%" }}>
          {passi.map((passo, i) => {
            const da = piano.passi[i];
            const p = fase(f, da, da + DISSOLVENZA_PASSO);
            const giro = cerchiatura(CERCHIO / 2, CERCHIO / 2, CERCHIO / 2 - 10, CERCHIO / 2 - 10, 23 + i);
            return (
              <div key={i} style={{ height: altezza, maxWidth: "100%", display: "flex", alignItems: "center", gap: 26, opacity: p, transform: `translateX(${(1 - uscita(p)) * -14}px)` }}>
                <div style={{ position: "relative", flex: "none", width: CERCHIO, height: CERCHIO }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: 64, color: stile.colori.inchiostro.testo }}>{i + 1}</div>
                  <svg width={CERCHIO} height={CERCHIO} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                    <Pennarello d={percorso(giro)} colore={stile.colori.accentoSuChiaro} spessore={7} progresso={(f - da - 2) / 10} lunghezza={lunghezza(giro)} />
                  </svg>
                </div>
                {/* il posto del pittogramma resta anche a chi non ce l'ha: i testi condividono il bordo sinistro */}
                {conSimbolo && (
                  <div style={{ flex: "none", width: SIMBOLO, height: SIMBOLO }}>
                    {passo.simbolo && <Pittogramma simbolo={passo.simbolo} lato={SIMBOLO} colore={stile.colori.inchiostro.testo} progresso={avanzamento(f, da + 4, 14)} spessore={8} />}
                  </div>
                )}
                <div data-impaginazione="voce" style={{ minWidth: 0, fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: corpo(passo.testo, 58, 22, stile.larghezza, 40), lineHeight: 1.12, color: stile.colori.inchiostro.testo }}>{passo.testo}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Foglio>
  );
};
