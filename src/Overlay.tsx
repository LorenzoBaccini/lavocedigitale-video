import { AbsoluteFill, useCurrentFrame } from "remotion";

import { pop } from "./anim";
import { INCHIOSTRO, SU_CARTA } from "./editoriale/carta/stile";
import { LOGO, MARGINE, SOTTOTITOLO_BASSO } from "./impaginazione";
import type { Linea } from "./linea";
import { livelloVoce, scenaAlFrame } from "./linea";
import { LogoMark } from "./Logo";
import { sottotitoloAlFrame } from "./sottotitoloAlFrame";
import type { Storyboard } from "./storyboard/tipi";
import { C, SANS } from "./theme";
import type { Timing } from "./timing";

// Elementi fissi su tutte le scene: grana, vignettatura, barra di avanzamento, logo vivo, sottotitolo.
export const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>")`;

export const Overlay: React.FC<{ storyboard: Storyboard; timing: Timing; linea: Linea }> = ({ storyboard, timing, linea }) => {
  const f = useCurrentFrame();
  const i = scenaAlFrame(linea, f);
  const frase = storyboard.frasi[i];
  const chiusura = frase.scena.tipo === "chiusura";
  // sui fogli il sottotitolo e il logo sono d'inchiostro, senza ombra
  const carta = SU_CARTA.has(frase.scena.tipo);
  const { blocco, locale, ridondante } = sottotitoloAlFrame(storyboard, timing, linea, f);
  // anticipo di 2 frame: al cambio di blocco il sottotitolo non resta mai trasparente
  const entrata = pop(locale, blocco.da - 2, 16);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: carta ? 0.05 : 0.08, mixBlendMode: "overlay", backgroundPosition: `${(f * 37) % 300}px ${(f * 53) % 300}px` }} />
      <AbsoluteFill style={{ background: carta ? "radial-gradient(ellipse at 50% 45%, transparent 62%, rgba(40,25,10,0.22) 100%)" : "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(f / linea.totale) * 100}%`, background: C.amber }} />
      {!chiusura && (
        <div style={{ position: "absolute", top: LOGO.y, left: LOGO.x }}>
          <LogoMark size={LOGO.lato} color={carta ? INCHIOSTRO.testo : C.paper} livello={livelloVoce(timing, linea, f)} />
        </div>
      )}
      {!ridondante && (
        <div data-impaginazione="sottotitolo" style={{ position: "absolute", bottom: SOTTOTITOLO_BASSO, left: MARGINE, right: MARGINE, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px", fontFamily: SANS, fontWeight: 800, fontSize: 64, lineHeight: 1.15, letterSpacing: -1, color: carta ? INCHIOSTRO.testo : C.paper, textShadow: carta ? "none" : "0 4px 24px rgba(0,0,0,0.85)", opacity: Math.min(1, entrata * 1.5), transform: `scale(${0.92 + 0.08 * entrata})` }}>
          {blocco.parole.map((p, j) => (
            <span key={j} style={{ color: p.chiave ? (carta ? INCHIOSTRO.ambra : C.amber) : undefined }}>{p.t}</span>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
