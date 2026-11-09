import { Vector3 } from "three";
import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { pianoDocumenti } from "../editoriale/piani/documenti";
import { fase, mix, uscita } from "../editoriale/regia";
import type { Camera, Punto2 } from "../editoriale/set/geometria";
import { proietta, sferica } from "../editoriale/set/geometria";
import { Ingombro } from "../editoriale/set/Ingombro";
import { avvicina } from "../editoriale/set/inquadrature";
import { PezziSulTavolo } from "../editoriale/set/oggetti/Pezzi";
import { CENTRO_PEZZI, MEZZA_LARGHEZZA, MEZZA_PROFONDITA, postiPezzi } from "../editoriale/set/oggetti/posti";
import { NotaAccanto } from "../editoriale/set/NotaAccanto";
import { Occhiello } from "../editoriale/set/Occhiello";
import { SPAZIO_OCCHIELLO } from "../editoriale/set/misureOcchiello";
import { Scrivania } from "../editoriale/set/Scrivania";
import { Velo } from "../editoriale/set/Velo";
import { useStile } from "../editoriale/stili";
import type { Riga } from "../editoriale/Titolo";
import { Titolo } from "../editoriale/Titolo";
import { MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const GUARDA = new Vector3(CENTRO_PEZZI[0], 0, CENTRO_PEZZI[2] - 0.22);
const NOTA_DA = 600;

// I pezzi sul tavolo, dall'alto: la colonna a sinistra, le note a destra con una freccia a pennarello verso ciascuno,
// che arrivano quando la voce li nomina. Occhiello e titolo in alto.
export const Documenti: React.FC<ScenaDi<"documenti">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, etichetta, pezzi } = props;
  const piano = pianoDocumenti(props, durata);
  const base: Camera = { pos: sferica(GUARDA, mix(11.4, 10.8, uscita(fase(f, 0, durata))), 0.07, 1.2), look: GUARDA.toArray() as Camera["look"] };
  const cam = avvicina(base, 0.93 ** piano.stacchi.filter((s) => f >= s).length);
  const posti = postiPezzi(pezzi.length);
  const sulTavolo = pezzi.map((p, i) => ({ oggetto: p.oggetto, ...posti[i] }));

  const punti = sulTavolo.map(({ oggetto, posizione }) => {
    const [x, , z] = posizione;
    const c = proietta(new Vector3(x, 0.05, z), cam);
    const destra = proietta(new Vector3(x + MEZZA_LARGHEZZA[oggetto], 0.05, z), cam);
    return { c, destra };
  });
  const impronte: Punto2[][] = sulTavolo.map(({ oggetto, posizione: [x, , z], giro }) => {
    const [mx, mz] = [MEZZA_LARGHEZZA[oggetto], MEZZA_PROFONDITA[oggetto]];
    return [[-mx, -mz], [mx, -mz], [mx, mz], [-mx, mz]].map(([u, v]) => proietta(new Vector3(x + u * Math.cos(giro) + v * Math.sin(giro), 0.1, z - u * Math.sin(giro) + v * Math.cos(giro)), cam));
  });

  const righe: Riga[] = [
    {
      parole: piano.titolo.map((p, i) => (piano.accento.includes(i) ? { ...p, colore: stile.colori.accento } : p)),
      size: corpo(props.titolo, 104, 16),
      peso: 700,
    },
  ];
  return (
    <>
      <Scrivania camera={cam} orologio={props.contesto.orologio}>
        <PezziSulTavolo pezzi={sulTavolo} />
      </Scrivania>
      <Velo alto={0.62} basso={0.5} />
      {impronte.map((angoli, i) => <Ingombro key={i} nome={pezzi[i].oggetto} angoli={angoli} pieno />)}
      {pezzi.map((p, i) => (
        <NotaAccanto key={p.oggetto} nome={`nota-${i + 1}`} testo={p.nota} x={punti[i].destra.x} y={punti[i].destra.y} sinistra={Math.max(NOTA_DA, punti[i].destra.x + 70)} da={piano.note[i]} f={f} seme={41 + i} />
      ))}
      <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: "center", gap: SPAZIO_OCCHIELLO }}>
        <Occhiello f={f} testo={etichetta} />
        <Titolo nome="titolo" f={f} righe={righe} style={{ alignSelf: "stretch" }} />
      </div>
    </>
  );
};
