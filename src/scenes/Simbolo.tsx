import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { Occhiello } from "../editoriale/carta/Occhiello";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoSimbolo, TRACCIA_SIMBOLO } from "../editoriale/piani/simbolo";
import { Pittogramma } from "../editoriale/pittogrammi";
import { fase } from "../editoriale/regia";
import { SegnoInQuadro } from "../editoriale/Segno";
import { allineaFlesso, useStile } from "../editoriale/stili";
import { avanzamento, trattoFra } from "../editoriale/tratto";
import { Titolo } from "../editoriale/Titolo";
import { LARGHEZZA, MARGINE, SOTTO_OCCHIELLO, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const LATO = 520;
const SIMBOLO_TOP = SOTTO_OCCHIELLO;
const TITOLO_SOTTO = SIMBOLO_TOP + LATO + 50;

// Il simbolo: un pittogramma grande tracciato a mano sul foglio, sotto il titolo con la chiave; se la cosa manca o non
// vale piu', una diagonale a pennarello lo barra.
export const Simbolo: React.FC<ScenaDi<"simbolo">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, simbolo, titolo } = props;
  const piano = pianoSimbolo(props, durata);
  const x = allineaFlesso(stile) === "center" ? (LARGHEZZA - LATO) / 2 : MARGINE;
  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", justifyContent: allineaFlesso(stile) }}>
        <Occhiello testo={etichetta} opacita={fase(f, 0, 6)} />
      </div>
      <div style={{ position: "absolute", top: SIMBOLO_TOP, left: x }}>
        <Pittogramma simbolo={simbolo} lato={LATO} colore={stile.colori.inchiostro.testo} progresso={avanzamento(f, piano.simbolo, TRACCIA_SIMBOLO)} />
      </div>
      {piano.barra !== undefined && (
        <SegnoInQuadro
          punti={trattoFra({ x: x + LATO * 0.1, y: SIMBOLO_TOP + LATO * 0.12 }, { x: x + LATO * 0.9, y: SIMBOLO_TOP + LATO * 0.88 }, 17)}
          colore={stile.colori.accentoSuChiaro}
          spessore={26}
          progresso={(f - piano.barra) / 12}
        />
      )}
      <Titolo
        nome="titolo"
        f={f}
        tinta="grafica"
        righe={[{ parole: piano.parole, size: corpo(titolo, 116, 16, stile.larghezza), peso: 700 }]}
        style={{ position: "absolute", top: TITOLO_SOTTO, left: MARGINE, right: MARGINE }}
      />
    </Foglio>
  );
};
