import { useContext } from "react";
import { useCurrentFrame } from "remotion";

import { Foglio } from "../editoriale/carta/Foglio";
import { SU_CARTA_TINTA } from "../editoriale/carta/Occhiello";
import { INCHIOSTRO } from "../editoriale/carta/stile";
import { spintaFoglio } from "../editoriale/piani/carta";
import { INDIRIZZO, pianoChiusura, TESTATA } from "../editoriale/piani/chiusura";
import { fase, uscita } from "../editoriale/regia";
import { Titolo } from "../editoriale/Titolo";
import { MARGINE } from "../impaginazione";
import { LogoMark } from "../Logo";
import { SANS, SERIF } from "../theme";
import { LivelloVoce } from "../voce";
import type { ScenaDi } from "./props";

// La chiusura: il marchio stampato (le barre seguono la voce), la testata, l'indirizzo sottolineato a pennarello. Niente aloni.
export const Chiusura: React.FC<ScenaDi<"chiusura">> = (props) => {
  const f = useCurrentFrame();
  const livello = useContext(LivelloVoce);
  const { durata } = props;
  const piano = pianoChiusura(props, durata);
  const t = fase(f, piano.testata, piano.testata + 10);
  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: 600, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ opacity: t, transform: `translateY(${(1 - uscita(t)) * 14}px)` }}>
          <LogoMark size={300} color={INCHIOSTRO.testo} livello={livello} />
        </div>
        <div data-impaginazione="titolo" style={{ marginTop: 40, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.1, color: INCHIOSTRO.testo, opacity: t }}>{TESTATA}</div>
        <div style={{ width: 120, height: 3, background: INCHIOSTRO.testo, opacity: 0.6 * t, margin: "34px 0 30px" }} />
        <Titolo
          nome="indirizzo"
          f={f}
          tinta={SU_CARTA_TINTA}
          righe={[{ parole: [{ t: INDIRIZZO, da: piano.indirizzo }], size: 68, font: SANS, peso: 600, sottolinea: { da: piano.sottolinea, durata: 10, colore: INCHIOSTRO.ambra, seme: 8 } }]}
          style={{ alignSelf: "stretch" }}
        />
      </div>
    </Foglio>
  );
};
