import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import { Foglio } from "../editoriale/carta/Foglio";
import { CARTA_RITAGLIO } from "../editoriale/carta/stile";
import { spintaFoglio } from "../editoriale/piani/carta";
import { pianoCitazione } from "../editoriale/piani/citazione";
import { fase } from "../editoriale/regia";
import { SegnoInQuadro } from "../editoriale/Segno";
import { allineaTesto, useStile } from "../editoriale/stili";
import { Titolo } from "../editoriale/Titolo";
import { sottolineatura } from "../editoriale/tratto";
import { LARGHEZZA } from "../impaginazione";
import type { ScenaDi } from "./props";

const ALTO = 600;
const RITAGLIO = { x: 70, w: LARGHEZZA - 140 };
// bordo strappato del ritaglio: un poligono con i denti irregolari in alto e in basso
const STRAPPO = (() => {
  const punti: string[] = [];
  for (let i = 0; i <= 40; i++) punti.push(`${(i / 40) * 100}% ${(i % 2 ? 1.2 : 0) + ((i * 37) % 5) * 0.25}%`);
  for (let i = 40; i >= 0; i--) punti.push(`${(i / 40) * 100}% ${100 - (i % 2 ? 1.2 : 0) - ((i * 53) % 5) * 0.25}%`);
  return `polygon(${punti.join(", ")})`;
})();

// La citazione: un ritaglio di giornale appoggiato sul foglio, la frase che si compone a ritmo di lettura,
// la fonte sotto; a lato, il segno a pennarello di chi l'ha letta e l'ha segnata.
export const Citazione: React.FC<ScenaDi<"citazione">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, testo, fonte } = props;
  const piano = pianoCitazione(props, durata);
  const size = corpo(testo, 66, 70, stile.larghezza, 50);
  const righe = Math.ceil((testo.length * size * 0.44) / (RITAGLIO.w - 120));
  const alto = righe * size * 1.12;
  // sul poster niente ritaglio di giornale: la frase sta sulla tinta
  const ritaglio: React.CSSProperties = stile.grafiche === "carta" ? { background: CARTA_RITAGLIO, clipPath: STRAPPO, boxShadow: stile.ombra(24, 0.25, 10), transform: "rotate(-0.8deg)" } : {};
  const margine = sottolineatura(alto + 20, 27).map(([x, y]) => [RITAGLIO.x + 30 + y, ALTO + 120 + x] as [number, number]);
  return (
    <Foglio tipo="liscia" spinta={spintaFoglio(f, durata, piano.stacchi)}>
      <div style={{ position: "absolute", top: ALTO, left: RITAGLIO.x, width: RITAGLIO.w, padding: "120px 60px 60px", ...ritaglio }}>
        <div style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: allineaTesto(stile), fontFamily: stile.caratteri.titolo, fontWeight: 700, fontSize: 130, lineHeight: 1, color: stile.colori.accentoSuChiaro, opacity: 0.9 }}>«</div>
        <Titolo nome="citazione" f={f} tinta="grafica" righe={[{ parole: piano.parole, size, peso: 500, corsivo: true }]} style={{ position: "relative" }} />
        <div data-impaginazione="fonte" style={{ marginTop: 34, textAlign: allineaTesto(stile), fontFamily: stile.caratteri.testo, fontWeight: 600, fontSize: 34, letterSpacing: "0.08em", textTransform: "uppercase", color: stile.colori.inchiostro.tenue, opacity: fase(f, piano.fonte, piano.fonte + 8) }}>— {fonte}</div>
      </div>
      <SegnoInQuadro punti={margine} colore={stile.colori.accentoSuChiaro} spessore={8} progresso={(f - piano.sottolinea) / 12} />
    </Foglio>
  );
};
