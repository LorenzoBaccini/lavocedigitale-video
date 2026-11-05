import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { availableParallelism } from "node:os";

import { èPrincipale } from "./principale.ts";

const COMPOSIZIONE = "notizia";
const GL_PREDEFINITO = "swangle";

// Remotion di default usa metà dei processori: sul runner (2 vCPU) vorrebbe dire un frame alla volta.
export function argomentiRender(props: string, uscita: string, gl: string, processori = availableParallelism()): string[] {
  return ["remotion", "render", "src/index.ts", COMPOSIZIONE, uscita, `--props=${props}`, `--gl=${gl}`, "--codec=h264", `--concurrency=${processori}`];
}

/**
 * GOP chiuso di 2 s (60 frame a 30 fps) e audio AAC 48 kHz stereo: i requisiti dei Reel Facebook.
 * Il `scale` serve perché Remotion esce in yuvj420p (full range) e senza finirebbe fuori specifica.
 */
export function argomentiFinitura(ingresso: string, uscita: string): string[] {
  return [
    "-y", "-i", ingresso,
    "-vf", "scale=out_range=tv",
    "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-g", "60", "-keyint_min", "60", "-sc_threshold", "0",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    uscita,
  ];
}

function esegui(comando: string, argomenti: string[]): Promise<void> {
  return new Promise((risolvi, rifiuta) => {
    const figlio = spawn(comando, argomenti, { stdio: "inherit" });
    figlio.on("error", rifiuta);
    figlio.on("close", (codice) =>
      codice === 0 ? risolvi() : rifiuta(new Error(`${comando} è uscito con codice ${codice}`)),
    );
  });
}

/** Va lanciato con la radice del repo come cwd. I suoni in `public/suoni` devono esistere già (`generaFoley`). */
export async function renderVideo(props: string, uscita: string): Promise<{ secondi: number }> {
  const inizio = Date.now();
  const grezzo = `${uscita}.grezzo.mp4`;
  try {
    await esegui("npx", argomentiRender(props, grezzo, process.env.RENDER_GL ?? GL_PREDEFINITO));
    await esegui("ffmpeg", argomentiFinitura(grezzo, uscita));
  } finally {
    rmSync(grezzo, { force: true });
  }
  return { secondi: (Date.now() - inizio) / 1000 };
}

// Uso: node --experimental-strip-types pipeline/render.ts <props.json> <uscita.mp4>
if (èPrincipale(import.meta.url)) {
  const [props, uscita] = process.argv.slice(2);
  if (!props || !uscita) throw new Error("uso: render.ts <props.json> <uscita.mp4>");
  const { secondi } = await renderVideo(props, uscita);
  console.log(`RENDER_SECONDI=${secondi.toFixed(1)}`);
}
