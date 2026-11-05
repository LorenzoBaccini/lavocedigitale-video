import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { SU_CARTA_TINTA } from "../editoriale/carta/Occhiello";
import { INCHIOSTRO } from "../editoriale/carta/stile";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoTeaser } from "../editoriale/piani/teaser";
import { SegnoInQuadro } from "../editoriale/Segno";
import { Titolo } from "../editoriale/Titolo";
import { casuale, sottolineatura } from "../editoriale/tratto";
import { LARGHEZZA, MARGINE, TITOLO_TOP } from "../impaginazione";
import { SERIF } from "../theme";
import type { ScenaDi } from "./props";

const RIGHE = [{ y: 960, w: 780 }, { y: 1050, w: 840 }, { y: 1140, w: 560 }];
const PER_RIGA = 10;

// parole stampate in piccolo, rese come sagome grigie: il testo c'e', ma non si legge
const sagome = (w: number, seme: number) => {
  const r = casuale(seme);
  const parole: number[] = [];
  let tot = 0;
  while (tot < w) {
    const l = 40 + r() * 110;
    parole.push(Math.min(l, w - tot));
    tot += l + 16;
  }
  return parole;
};

// Il teaser: la frase sul quaderno e, sotto, le righe che spiegano il trucco coperte a pennarello: sta nell'articolo.
export const Teaser: React.FC<ScenaDi<"teaser">> = (props) => {
  const f = useCurrentFrame();
  const { durata, testo } = props;
  const piano = pianoTeaser(props, durata);
  return (
    <Foglio tipo="quadretti" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <Titolo nome="testo" f={f} tinta={SU_CARTA_TINTA} righe={[{ parole: piano.parole, size: Math.max(60, corpo(testo, 84, 26)), font: SERIF, peso: 700 }]} style={{ position: "absolute", top: TITOLO_TOP + 150, left: MARGINE, right: MARGINE }} />
      {RIGHE.map((riga, i) => (
        <div key={i} style={{ position: "absolute", top: riga.y, left: (LARGHEZZA - riga.w) / 2, width: riga.w, display: "flex", gap: 16 }}>
          {sagome(riga.w, 41 + i).map((l, j) => (
            <div key={j} style={{ width: l, height: 22, marginTop: 9, borderRadius: 6, background: INCHIOSTRO.tenue, opacity: 0.32 }} />
          ))}
        </div>
      ))}
      {RIGHE.map((riga, i) => {
        const punti = sottolineatura(riga.w + 10, 51 + i).map(([x, y]) => [(LARGHEZZA - riga.w) / 2 - 5 + x, riga.y + 22 + y * 0.6] as [number, number]);
        return <SegnoInQuadro key={`o${i}`} punti={punti} colore={INCHIOSTRO.pennarello} spessore={46} progresso={(f - piano.omissis[i]) / PER_RIGA} />;
      })}
    </Foglio>
  );
};
