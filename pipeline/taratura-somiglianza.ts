import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

import type { PropsNotizia } from "../src/Notizia.tsx";
import { FPS } from "../src/theme.ts";
import { renderFotogrammi } from "./controlla-impaginazione.ts";
import { èPrincipale } from "./principale.ts";
import type { Impronta } from "./somiglianza.ts";
import { distanza, ffmpeg, fotogrammiFissi, improntaFotogramma } from "./somiglianza.ts";

/** L'impronta di un mp4 gia' fatto, con gli stessi fotogrammi fissi: per tarare la soglia sui video pubblicati. */
export async function improntaMp4(file: string): Promise<Impronta> {
  const conta = await new Promise<number>((risolvi, rifiuta) => {
    const figlio = spawn("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", file]);
    let out = "";
    figlio.stdout.on("data", (d) => (out += d));
    figlio.on("error", rifiuta);
    // il csv di ffprobe puo' finire con una virgola: Number() darebbe NaN
    figlio.on("close", () => risolvi(parseInt(out, 10)));
  });
  if (!(conta > 0)) throw new Error(`${file}: numero di fotogrammi illeggibile`);
  const impronta: string[] = [];
  for (const frame of fotogrammiFissi(conta, FPS)) {
    const png = await ffmpeg(["-ss", (frame / FPS).toFixed(3), "-i", file, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "pipe:1"]);
    impronta.push(await improntaFotogramma(png));
  }
  return impronta;
}

/** `props.json@notte/parola` forza stile e gancio, come farebbe un tentativo della pipeline. */
function propsDa(argomento: string): PropsNotizia {
  const [file, forzata] = argomento.split("@");
  const props = JSON.parse(readFileSync(file, "utf8")) as PropsNotizia;
  if (!forzata) return props;
  const [stile, gancio] = forzata.split("/");
  return { ...props, variante: { ...props.variante, ...(stile && { stile }), ...(gancio && { gancio }) } as PropsNotizia["variante"] };
}

// Uso, dalla radice del repo: node --experimental-strip-types pipeline/taratura-somiglianza.ts <video.mp4|props.json[@stile/gancio]>[=etichetta] …
// Stampa per ognuno impronta e secondi, poi la matrice delle distanze.
if (èPrincipale(import.meta.url)) {
  const voci: { etichetta: string; impronta: Impronta }[] = [];
  for (const a of process.argv.slice(2)) {
    const [sorgente, etichetta = basename(sorgente)] = a.split("=");
    const inizio = Date.now();
    const impronta = sorgente.endsWith(".mp4") ? await improntaMp4(sorgente) : await Promise.all((await renderFotogrammi(propsDa(sorgente))).map(improntaFotogramma));
    console.log(JSON.stringify({ etichetta, impronta, secondi: (Date.now() - inizio) / 1000 }));
    voci.push({ etichetta, impronta });
  }
  const larghezza = Math.max(...voci.map((v) => v.etichetta.length));
  console.log(`${"".padEnd(larghezza)} ${voci.map((_, i) => String(i + 1).padStart(4)).join(" ")}`);
  for (const [i, r] of voci.entries()) console.log(`${`${i + 1} ${r.etichetta}`.padEnd(larghezza + 3)} ${voci.map((c) => distanza(r.impronta, c.impronta).toFixed(2)).join(" ")}`);
}
