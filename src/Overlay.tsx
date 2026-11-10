import { AbsoluteFill, useCurrentFrame } from "remotion";

import { pop } from "./anim";
import { SU_CARTA } from "./editoriale/carta/stile";
import { FINE_DETTAGLIO } from "./editoriale/ganci/dettaglio";
import { coloriDiviso, pienoDiviso } from "./editoriale/ganci/diviso";
import { useStile } from "./editoriale/stili";
import { mescola } from "./editoriale/stili/colore";
import { useVariante } from "./editoriale/VarianteVideo";
import { LOGO, MARGINE, SOTTOTITOLO_BASSO } from "./impaginazione";
import type { Linea } from "./linea";
import { livelloVoce, scenaAlFrame } from "./linea";
import { LogoMark } from "./Logo";
import { sottotitoloAlFrame } from "./sottotitoloAlFrame";
import type { Storyboard } from "./storyboard/tipi";
import type { Timing } from "./timing";

// Elementi fissi su tutte le scene: grana, vignettatura, barra di avanzamento, logo vivo, sottotitolo.
export const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>")`;

export const Overlay: React.FC<{ storyboard: Storyboard; timing: Timing; linea: Linea }> = ({ storyboard, timing, linea }) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const i = scenaAlFrame(linea, f);
  const frase = storyboard.frasi[i];
  const chiusura = frase.scena.tipo === "chiusura";
  // sulle scene grafiche sottotitolo e logo prendono l'inchiostro dello stile
  const variante = useVariante();
  // il gancio a parola sta sulla superficie delle grafiche; col blocco del diviso il logo prende il colore del blocco
  const gancio = frase.scena.tipo === "gancio" ? variante.gancio : undefined;
  const grafica = SU_CARTA.has(frase.scena.tipo) || gancio === "parola";
  const pienoBlocco = gancio === "diviso" ? pienoDiviso(f - linea.inizi[i]) : 0;
  const sotto = grafica ? stile.sottotitolo.sulleGrafiche : stile.sottotitolo.sulSet;
  const { blocco, locale, ridondante: scritto } = sottotitoloAlFrame(storyboard, timing, linea, f);
  // a dettaglio il titolo aspetta che il primo piano si allarghi: fino ad allora la voce ha il sottotitolo
  const ridondante = scritto && !(gancio === "dettaglio" && locale < FINE_DETTAGLIO);
  // anticipo di 2 frame: al cambio di blocco il sottotitolo non resta mai trasparente
  const entrata = pop(locale, blocco.da - 2, 16);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: grafica ? stile.grana.sulleGrafiche : stile.grana.sulSet, mixBlendMode: "overlay", backgroundPosition: `${(f * 37) % 300}px ${(f * 53) % 300}px` }} />
      <AbsoluteFill style={{ background: grafica ? stile.vignetta.sulleGrafiche : stile.vignetta.sulSet }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(f / linea.totale) * 100}%`, background: stile.colori.accento }} />
      {!chiusura && (
        <div style={{ position: "absolute", top: LOGO.y, left: LOGO.x }}>
          <LogoMark size={LOGO.lato} color={grafica ? stile.colori.inchiostro.testo : pienoBlocco > 0 ? mescola(stile.colori.testo, coloriDiviso(stile).testo, pienoBlocco) : stile.colori.testo} livello={livelloVoce(timing, linea, f)} />
        </div>
      )}
      {!ridondante && (
        <div data-impaginazione="sottotitolo" style={{ position: "absolute", bottom: SOTTOTITOLO_BASSO, left: MARGINE, right: MARGINE, display: "flex", justifyContent: "center", opacity: Math.min(1, entrata * 1.5), transform: `scale(${0.92 + 0.08 * entrata})` }}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px", fontFamily: sotto.carattere ?? stile.caratteri.testo, fontWeight: 800, fontSize: 64, lineHeight: 1.15, letterSpacing: -1, color: sotto.testo, textShadow: sotto.ombra, ...(sotto.pillola && { background: sotto.pillola.fondo, borderRadius: sotto.pillola.raggio, padding: sotto.pillola.imbottitura }) }}>
            {blocco.parole.map((p, j) => (
              <span key={j} style={{ color: p.chiave ? sotto.chiave : undefined, textShadow: p.chiave ? sotto.bagliore : undefined }}>{p.t}</span>
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
