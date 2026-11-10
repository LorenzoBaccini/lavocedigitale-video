import { useContext } from "react";
import { useCurrentFrame } from "remotion";

import { ENTRATA_CHIUSURA, INDIRIZZO, pianoChiusura, TESTATA } from "../editoriale/piani/chiusura";
import { fase, uscita } from "../editoriale/regia";
import { useStile } from "../editoriale/stili";
import { conAlfa } from "../editoriale/stili/alfa";
import { Titolo } from "../editoriale/Titolo";
import { LOGO } from "../impaginazione";
import { LogoMark } from "../Logo";
import { LivelloVoce } from "../voce";
import type { ScenaDi } from "./props";

/** La fascia in alto: attorno al logo, sopra i titoli delle scene (che partono da TITOLO_TOP); i testi a meta' del logo. */
export const FASCIA = { y: 200, altezza: 166 };
const TESTI_X = LOGO.x + LOGO.lato + 40;

// La chiusura integrata: sopra l'ultima scena, ferma (vedi Ferma), una fascia nei colori dello stile cresce dal logo,
// che resta al suo posto, e porta testata e indirizzo coi tempi della cartolina.
export const ChiusuraIntegrata: React.FC<ScenaDi<"chiusura">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const livello = useContext(LivelloVoce);
  const piano = pianoChiusura(props, props.durata);
  const t = uscita(fase(f, piano.testata, piano.testata + ENTRATA_CHIUSURA));
  const centro = LOGO.y + (LOGO.lato * 0.75) / 2;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: FASCIA.y, height: FASCIA.altezza, background: conAlfa(stile.colori.velo, 0.94), boxShadow: `0 10px 34px ${conAlfa("#000000", 0.28)}`, transform: `scaleX(${t})`, transformOrigin: "0 50%" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: stile.colori.accento }} />
      </div>
      <div style={{ position: "absolute", top: LOGO.y, left: LOGO.x }}>
        <LogoMark size={LOGO.lato} color={stile.colori.testo} livello={livello} />
      </div>
      <div style={{ position: "absolute", left: TESTI_X, top: centro, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <div data-impaginazione="testata" style={{ fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: 34, lineHeight: 1.1, color: stile.colori.tenue, opacity: t, transform: `translateX(${(1 - t) * -24}px)` }}>{TESTATA}</div>
        <Titolo
          nome="indirizzo"
          f={f}
          righe={[{ parole: [{ t: INDIRIZZO, da: piano.indirizzo }], size: 56, font: stile.caratteri.testo, peso: 700, sottolinea: { da: piano.sottolinea, durata: 10, colore: stile.colori.accento, seme: 8 } }]}
          style={{ alignSelf: "flex-start" }}
        />
      </div>
    </>
  );
};
