import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

import type { Variante } from "../src/editoriale/variante.ts";
import { APERTURE, ATTIVI, DIMENSIONI, VARIANTE_BASE, varianteDi } from "../src/editoriale/variante.ts";
import type { Misura } from "../src/impaginazione.ts";
import { PREFISSO_MISURA, problemiImpaginazione, ZONE } from "../src/impaginazione.ts";
import { costruisciLinea } from "../src/linea.ts";
import type { PropsNotizia } from "../src/Notizia.tsx";
import type { Storyboard } from "../src/storyboard/tipi.ts";
import { FPS } from "../src/theme.ts";
import { èPrincipale } from "./principale.ts";

const GL_PREDEFINITO = "swangle";

/**
 * I fotogrammi misurati di una scena: poco dopo l'inizio (la camera parte spesso piu' vicina), a meta' e alla fine;
 * con `passo` anche uno ogni `passo` frame, per provare tutta l'animazione a mano.
 */
export function momentiDi(inizio: number, durata: number, passo?: number): [string, number][] {
  const base: [string, number][] = [["inizio", inizio + Math.min(8, durata - 1)], ["metà", inizio + Math.floor(durata / 2)], ["fine", inizio + durata - 1]];
  const fitti: [string, number][] = [];
  for (let k = 0; passo && k < durata; k += passo) fitti.push([`+${k}`, inizio + k]);
  return [...fitti, ...base].sort((a, b) => a[1] - b[1]).filter((m, i, tutti) => i === 0 || m[1] !== tutti[i - 1][1]);
}

/**
 * Via scelta: `renderStill` con la prop `misuraImpaginazione`, che fa scrivere in console a `MisuraImpaginazione`
 * i rettangoli dei nodi `data-impaginazione`; qui li si legge con `onBrowserLog`.
 * Va lanciato con la radice del repo come cwd. Con `cartellaStill` salva il fotogramma di fine frase di ogni scena; con `solo`
 * misura solo le scene di quel tipo.
 */
export async function controllaImpaginazione(props: PropsNotizia, cartellaStill?: string, passo?: number, solo?: string): Promise<string[]> {
  const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
  const chromiumOptions = { gl: (process.env.RENDER_GL ?? GL_PREDEFINITO) as "angle" };
  const browser = await openBrowser("chrome", { chromiumOptions, logLevel: "error" });
  const inputProps = { ...props, misuraImpaginazione: true };
  const linea = costruisciLinea(props.timing, FPS);
  const problemi: string[] = [];
  try {
    const composition = await selectComposition({ serveUrl, id: "notizia", inputProps, puppeteerInstance: browser, chromiumOptions, logLevel: "error" });
    for (const [i, frase] of props.storyboard.frasi.entries()) {
      if (solo && frase.scena.tipo !== solo) continue;
      const momenti = momentiDi(linea.inizi[i], linea.durate[i], passo);
      for (const [momento, frame] of momenti) {
        let misure: Misura[] | undefined;
        const { buffer } = await renderStill({
          composition, serveUrl, frame, inputProps, chromiumOptions, puppeteerInstance: browser, output: null, logLevel: "error",
          onBrowserLog: ({ text }) => {
            if (!text.startsWith(PREFISSO_MISURA)) return;
            const letto = JSON.parse(text.slice(PREFISSO_MISURA.length)) as { frame: number; misure: Misura[] };
            if (letto.frame === frame) misure = letto.misure;
          },
        });
        const dove = `frase ${i + 1} (${frase.scena.tipo}), ${momento}`;
        if (!misure) problemi.push(`${dove}: misura non ricevuta`);
        else problemi.push(...problemiImpaginazione(misure, ZONE).map((p) => `${dove}: ${p}`));
        if (cartellaStill && momento === "fine" && buffer) {
          mkdirSync(cartellaStill, { recursive: true });
          writeFileSync(join(cartellaStill, `scena-${i + 1}-${frase.scena.tipo}.png`), buffer);
        }
      }
    }
  } finally {
    await browser.close({ silent: true });
  }
  return problemi;
}

// Gli storyboard senza voce (fixture tutte-le-scene) girano con 3 s a frase e i wav della fixture.
function propsDa(file: string, secondi = 3): PropsNotizia {
  const letto = JSON.parse(readFileSync(file, "utf8")) as PropsNotizia | Storyboard;
  if ("storyboard" in letto) return letto;
  const clips = letto.frasi.map((_, i) => ({ file: `s${i % 8}.wav`, secondi, inviluppo: Array(Math.round(secondi * FPS)).fill(0.5) }));
  return { storyboard: letto, timing: { voce: "elevenlabs", clips }, audioBase: "audio/fixture" };
}

const FORZABILI = ["stile", "gancio", "chiusura", "durata"] as const;

/**
 * La variante da controllare: quella delle props, con i campi di `--variante=luce:sera,apertura:alta` (valori sconosciuti
 * ignorati) e di `--stile= --gancio= --chiusura= --durata=` (un valore sconosciuto e' un errore: si controllerebbe altro).
 */
export function varianteDaArgomenti(argomenti: string[], base: Variante | undefined): Variante {
  const valore = (nome: string) => argomenti.find((a) => a.startsWith(`--${nome}=`))?.slice(nome.length + 3);
  const campi: Record<string, unknown> = Object.fromEntries((valore("variante") ?? "").split(",").filter(Boolean).map((c) => c.split(":")));
  if (campi.fraseFinale !== undefined) campi.fraseFinale = Number(campi.fraseFinale);
  for (const k of FORZABILI) {
    const v = valore(k);
    if (v === undefined) continue;
    if (!DIMENSIONI[k].includes(v as never)) throw new Error(`--${k}=${v}: valori ammessi ${DIMENSIONI[k].join(", ")}`);
    campi[k] = v;
  }
  return varianteDi({ ...base, ...campi });
}

/** I valori forzati ma non ancora costruiti: il fotogramma mostra quello di base, un controllo pulito non vale per loro. */
export function avvisiNonAttivi(v: Variante): string[] {
  return FORZABILI.filter((k) => !ATTIVI[k].includes(v[k] as never)).map((k) => `${k} ${v[k]} non ancora attivo: si vede ${VARIANTE_BASE[k]}`);
}

// Uso: node --experimental-strip-types pipeline/controlla-impaginazione.ts <props.json|storyboard.json> [cartella-still]
//        [--variante=musica:chiaro,luce:sera,apertura:alta] [--stile=…] [--gancio=…] [--chiusura=…] [--durata=…]
//        [--ogni-apertura] [--passo=N] [--secondi=N] [--scene=gancio]
// --secondi: durata delle frasi di uno storyboard senza voce (3 di default). --scene: misura solo le scene di quel tipo.
// Con --ogni-apertura il controllo gira una volta per ogni inquadratura d'apertura del gancio.
if (èPrincipale(import.meta.url)) {
  const argomenti = process.argv.slice(2);
  const [file, cartellaStill] = argomenti.filter((a) => !a.startsWith("--")).map((a) => resolve(a));
  if (!file) throw new Error("uso: controlla-impaginazione.ts <props.json|storyboard.json> [cartella-still] [--variante=…] [--stile=…] [--ogni-apertura]");
  const props = propsDa(file, Number(argomenti.find((a) => a.startsWith("--secondi="))?.slice("--secondi=".length)) || undefined);
  const variante = varianteDaArgomenti(argomenti, props.variante);
  for (const avviso of avvisiNonAttivi(variante)) console.warn(`attenzione: ${avviso}`);
  const aperture = argomenti.includes("--ogni-apertura") ? APERTURE : [variante.apertura];
  const passo = Number(argomenti.find((a) => a.startsWith("--passo="))?.slice("--passo=".length)) || undefined;
  const solo = argomenti.find((a) => a.startsWith("--scene="))?.slice("--scene=".length);
  process.chdir(fileURLToPath(new URL("..", import.meta.url)));
  const problemi: string[] = [];
  for (const apertura of aperture) {
    const v = { ...variante, apertura };
    const trovati = await controllaImpaginazione({ ...props, variante: v }, cartellaStill && aperture.length > 1 ? join(cartellaStill, apertura) : cartellaStill, passo, solo);
    problemi.push(...trovati.map((p) => (aperture.length > 1 ? `apertura ${apertura}: ${p}` : p)));
    console.log(`variante ${v.stile}/${v.gancio}/${v.chiusura}/${v.durata} ${v.musica}/${v.luce}/${v.apertura}: ${trovati.length ? `${trovati.length} problemi` : "pulita"}`);
  }
  console.log(problemi.length ? problemi.join("\n") : "impaginazione pulita");
  if (problemi.length) process.exitCode = 1;
}
