import { useContext } from "react";
import { useCurrentFrame } from "remotion";

import { attaccoChiusura, ENTRATA_CHIUSURA, INDIRIZZO, pianoChiusura } from "../editoriale/piani/chiusura";
import { fase, uscita } from "../editoriale/regia";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { conAlfa } from "../editoriale/stili/alfa";
import { Titolo } from "../editoriale/Titolo";
import { FONDO_UTILE, LARGHEZZA, MARGINE } from "../impaginazione";
import { LogoMark } from "../Logo";
import { LivelloVoce } from "../voce";
import type { ScenaDi } from "./props";

/**
 * La fascia nel terzo basso: parte appena sotto il fondo della scena (i titoli delle scene finiscono sopra FONDO_UTILE)
 * e prende il posto del sottotitolo, che durante la chiusura integrata non c'e'.
 */
export const FASCIA = { y: FONDO_UTILE - 10, altezza: 290 };
/** Quanto si scurisce la scena ferma sotto la fascia. */
const VELO_FERMA = 0.35;

// La chiusura integrata: sopra l'ultima scena, ferma (vedi Ferma) e un po' velata, entra la fascia nei colori dello
// stile col logo, l'attacco della frase detta e l'indirizzo grande, coi tempi della cartolina.
export const ChiusuraIntegrata: React.FC<ScenaDi<"chiusura">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const livello = useContext(LivelloVoce);
  const piano = pianoChiusura(props, props.durata);
  const t = uscita(fase(f, piano.testata, piano.testata + ENTRATA_CHIUSURA));
  const attacco = attaccoChiusura(props.voce.parole);
  const allinea = allineaFlesso(stile);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: conAlfa(stile.colori.velo, VELO_FERMA * t) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: FASCIA.y, height: FASCIA.altezza, background: conAlfa(stile.colori.velo, 0.95), boxShadow: `0 -12px 40px ${conAlfa("#000000", 0.3)}`, transform: `translateY(${(1 - t) * FASCIA.altezza}px)`, opacity: t }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 8, background: stile.colori.accento }} />
      </div>
      {/* l'ingombro della fascia per il controllo d'impaginazione: nessun testo della scena ferma ci deve stare sotto */}
      <div data-ingombro="fascia" data-pieno="1" style={{ position: "absolute", left: 0, top: FASCIA.y, width: LARGHEZZA, height: FASCIA.altezza, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: MARGINE, right: MARGINE, top: FASCIA.y + 24, display: "flex", flexDirection: "column", alignItems: allinea, gap: 4, opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, maxWidth: "100%" }}>
          <LogoMark size={180} color={stile.colori.testo} livello={livello} />
          {attacco && (
            <div data-impaginazione="sottotitolo" style={{ fontFamily: stile.caratteri.testo, fontWeight: 700, fontSize: 46 / stile.larghezza, lineHeight: 1.1, color: stile.colori.tenue }}>
              {attacco}
            </div>
          )}
        </div>
        <Titolo
          nome="sottotitolo"
          f={f}
          righe={[{ parole: [{ t: INDIRIZZO, da: piano.indirizzo }], size: 88, font: stile.caratteri.testo, peso: 800, sottolinea: { da: piano.sottolinea, durata: 10, colore: stile.colori.accento, seme: 8 } }]}
          style={{ alignSelf: allinea }}
        />
      </div>
    </>
  );
};
