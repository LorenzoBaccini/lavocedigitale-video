import { useContext } from "react";
import { useCurrentFrame } from "remotion";

import { Foglio } from "../editoriale/carta/Foglio";
import { spintaFoglio } from "../editoriale/piani/carta";
import { domandaScritta, ENTRATA_CHIUSURA, INDIRIZZO, INVITO, pianoChiusura } from "../editoriale/piani/chiusura";
import { fase, uscita } from "../editoriale/regia";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { MARGINE } from "../impaginazione";
import { LogoMark } from "../Logo";
import { LivelloVoce } from "../voce";
import type { ScenaDi } from "./props";

// La chiusura: la domanda a chi guarda, grande; sotto l'invito a commentare con la freccia verso i commenti; in fondo
// il marchio e l'indirizzo, piccoli.
export const Chiusura: React.FC<ScenaDi<"chiusura">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const livello = useContext(LivelloVoce);
  const { durata } = props;
  const piano = pianoChiusura(props, durata);
  const domanda = domandaScritta(props);
  const t = uscita(fase(f, 0, piano.domanda));
  const invito = uscita(fase(f, piano.invito, piano.invito + ENTRATA_CHIUSURA));
  const allinea = allineaFlesso(stile);
  const inchiostro = stile.colori.inchiostro.testo;
  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: 470, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: allinea }}>
        <div data-impaginazione="titolo" style={{ fontFamily: stile.caratteri.titolo, fontWeight: 800, fontSize: (domanda.length <= 40 ? 96 : 82) / stile.larghezza, lineHeight: 1.12, color: inchiostro, textAlign: allinea === "center" ? "center" : "left", opacity: t, transform: `translateY(${(1 - t) * 24}px) scale(${0.94 + 0.06 * t})` }}>
          {domanda}
        </div>
        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: allinea, opacity: invito, transform: `translateY(${(1 - invito) * 20}px)` }}>
          <div data-impaginazione="invito" style={{ fontFamily: stile.caratteri.testo, fontWeight: 800, fontSize: 56 / stile.larghezza, color: stile.colori.accentoSuChiaro }}>{INVITO}</div>
          <svg width={70} height={90} viewBox="0 0 70 90" style={{ marginTop: 18, transform: `translateY(${Math.sin((f - piano.invito) / 4) * 10}px)` }}>
            <path d="M35 6 V74 M10 52 L35 80 L60 52" fill="none" stroke={stile.colori.accentoSuChiaro} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1180, left: MARGINE, right: MARGINE, display: "flex", alignItems: "center", justifyContent: allinea, gap: 22, opacity: 0.75 * t }}>
        <LogoMark size={90} color={inchiostro} livello={livello} />
        <div data-impaginazione="indirizzo" style={{ fontFamily: stile.caratteri.testo, fontWeight: 700, fontSize: 44 / stile.larghezza, color: inchiostro }}>{INDIRIZZO}</div>
      </div>
    </Foglio>
  );
};
