import { AbsoluteFill, useCurrentFrame } from "remotion";

import { corpo, pop } from "./anim";
import { ETICHETTE_GANCIO, inchiostroSu } from "./editoriale/marchio";
import { clamp01 } from "./editoriale/regia";
import { SU_CARTA } from "./editoriale/carta/stile";
import { scenaFerma } from "./editoriale/fermo";
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
  // con la chiusura integrata sotto la fascia si vede ancora l'ultima scena di contenuto
  const ferma = chiusura ? scenaFerma(storyboard.frasi.map((fr) => fr.scena.tipo), variante.chiusura) : undefined;
  const visibile = storyboard.frasi[ferma ?? i].scena.tipo;
  // il gancio a parola sta sulla superficie delle grafiche; col blocco del diviso il logo prende il colore del blocco
  const gancio = visibile === "gancio" ? variante.gancio : undefined;
  const grafica = SU_CARTA.has(visibile) || gancio === "parola";
  const pienoBlocco = gancio === "diviso" ? pienoDiviso(f - linea.inizi[i]) : 0;
  const sotto = grafica ? stile.sottotitolo.sulleGrafiche : stile.sottotitolo.sulSet;
  const { blocco, locale, ridondante: scritto } = sottotitoloAlFrame(storyboard, timing, linea, f);
  // a dettaglio il titolo aspetta che il primo piano si allarghi: fino ad allora la voce ha il sottotitolo
  // con la chiusura integrata la frase sta nella fascia: niente sottotitolo
  const ridondante = ferma !== undefined || (scritto && !(gancio === "dettaglio" && locale < FINE_DETTAGLIO));
  // anticipo di 2 frame: al cambio di blocco il sottotitolo non resta mai trasparente
  const entrata = pop(locale, blocco.da - 2, 16);
  // una riga sola: il corpo scende con la lunghezza del blocco, cosi' il sottotitolo resta nella sua fascia
  const testoBlocco = blocco.parole.map((p) => p.t).join(" ");
  const size = corpo(testoBlocco, 84, 18, stile.larghezza, 44);
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
      {stile.nastro && (i === 0 || chiusura) && (
        // il nastro segnaletico della rubrica: apre e chiude il video, sopra il logo e lontano dai contenuti
        <div style={{ position: "absolute", top: 92, left: -60, right: -60, height: 84, transform: `rotate(-3deg) translateX(${(1 - pop(f - linea.inizi[i], 0, 14)) * -40}px)`, background: `repeating-linear-gradient(-45deg, ${stile.colori.accento} 0 44px, ${stile.colori.fondo} 44px 88px)`, boxShadow: "0 10px 30px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div data-impaginazione="nastro" style={{ background: stile.colori.accento, color: inchiostroSu(stile.colori.accento), fontFamily: stile.caratteri.titolo, fontSize: 46, letterSpacing: 3, padding: "8px 30px" }}>{stile.nastro}</div>
        </div>
      )}
      {i === 0 && !stile.nastro && (
        // l'etichetta di rubrica: c'e' gia' al fotogramma 0, che e' anche l'anteprima del Reel
        <div style={{ position: "absolute", top: 130, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div data-impaginazione="etichetta" style={{ fontFamily: stile.caratteri.testo, fontWeight: 900, fontSize: 64 / stile.larghezza, letterSpacing: 1, padding: "12px 34px", borderRadius: 14, background: stile.colori.accento, color: inchiostroSu(stile.colori.accento), boxShadow: "0 10px 30px rgba(0,0,0,0.35)", transform: `rotate(-3deg) scale(${0.92 + 0.08 * pop(f, 0, 9) + 0.025 * Math.sin(f / 5)})` }}>
            {ETICHETTE_GANCIO[variante.gancioTesto]}
          </div>
        </div>
      )}
      {!ridondante && (
        <div data-impaginazione="sottotitolo" style={{ position: "absolute", bottom: SOTTOTITOLO_BASSO, left: MARGINE, right: MARGINE, display: "flex", justifyContent: "center", opacity: Math.min(1, entrata * 1.5), transform: `scale(${0.92 + 0.08 * entrata})` }}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "nowrap", whiteSpace: "nowrap", gap: "0 18px", fontFamily: sotto.carattere ?? stile.caratteri.testo, fontWeight: 800, fontSize: size, lineHeight: 1.15, letterSpacing: -1, color: sotto.testo, textShadow: sotto.ombra, ...(sotto.pillola && { background: sotto.pillola.fondo, borderRadius: sotto.pillola.raggio, padding: sotto.pillola.imbottitura }) }}>
            {blocco.parole.map((p, j) => {
              // la parola compare quando la voce la dice (il posto e' gia' tenuto: il blocco non si sposta); la chiave scatta piu' forte
              const t = p.da === undefined ? 1 : clamp01((locale - p.da) / 8);
              const detta = p.da === undefined || locale >= p.da;
              const scatto = 1 + (p.chiave ? 0.14 : 0.06) * Math.sin(Math.PI * t);
              return (
                <span key={j} style={{ display: "inline-block", opacity: detta ? 1 : 0, transform: `scale(${scatto})`, ...(p.chiave && { background: stile.colori.accento, color: inchiostroSu(stile.colori.accento), textShadow: "none", padding: "0 14px", borderRadius: 12 }) }}>{p.t}</span>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
