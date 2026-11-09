import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { Occhiello } from "../editoriale/carta/Occhiello";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoNumero } from "../editoriale/piani/numero";
import { fase, uscita } from "../editoriale/regia";
import { useStile } from "../editoriale/stili";
import { Titolo } from "../editoriale/Titolo";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

// La cifra: stampata grande su carta di giornale, sottolineata a pennarello, con l'unita' e la nota sotto.
export const Numero: React.FC<ScenaDi<"numero">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, numero, unita, nota } = props;
  const piano = pianoNumero(props, durata);
  const pu = piano.unita === undefined ? 0 : fase(f, piano.unita, piano.unita + 8);
  const pn = piano.nota === undefined ? 0 : fase(f, piano.nota, piano.nota + 8);
  return (
    <Foglio tipo="giornale" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Occhiello testo={etichetta} opacita={fase(f, 0, 6)} />
        <div style={{ width: 120, height: 3, background: stile.colori.inchiostro.testo, opacity: 0.7, margin: "30px 0 150px" }} />
        <Titolo
          nome="numero"
          f={f}
          tinta="grafica"
          righe={[{ parole: [{ t: numero, da: piano.numero }], size: corpo(numero, 270, 6), peso: 700, sottolinea: { da: piano.sottolinea, durata: 10, colore: stile.colori.accentoSuChiaro, seme: 6 } }]}
          style={{ alignSelf: "stretch" }}
        />
        {unita && (
          <div data-impaginazione="unita" style={{ marginTop: 44, maxWidth: "100%", textAlign: "center", fontFamily: stile.caratteri.titolo, fontWeight: 600, fontSize: Math.max(48, corpo(unita, 68, 22)), lineHeight: 1.15, color: stile.colori.inchiostro.testo, opacity: pu, transform: `translateY(${(1 - uscita(pu)) * 12}px)` }}>{unita}</div>
        )}
        {nota && (
          <div data-impaginazione="nota" style={{ marginTop: 26, maxWidth: "100%", textAlign: "center", fontFamily: stile.caratteri.titolo, fontStyle: "italic", fontWeight: 500, fontSize: Math.max(38, corpo(nota, 48, 30)), lineHeight: 1.2, color: stile.colori.inchiostro.tenue, opacity: pn }}>{nota}</div>
        )}
      </div>
    </Foglio>
  );
};
