import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { Storyboard } from "../src/storyboard/tipi.ts";
import { FPS } from "../src/theme.ts";
import type { Timing } from "../src/timing.ts";
import { problemiTiming } from "../src/timing.ts";
import type { Allineamento } from "./allineamento.ts";
import { frasiDaParole, paroleDaAllineamento, tagliFrasi } from "./allineamento.ts";
import { inviluppo } from "./inviluppo.ts";
import { èPrincipale } from "./principale.ts";

/** Nicola Lorusso, decisione del 4 novembre. */
export const VOCE_ID = "sKbNSlHXq99bttvf8rRF";
export const MODELLO = "eleven_v3";
const URL_VOCE = `https://api.elevenlabs.io/v1/text-to-speech/${VOCE_ID}/with-timestamps?output_format=mp3_44100_128`;
const TIMEOUT_MS = 120_000;
const PAUSA_RIPROVA_MS = 5_000;
const SR = 44_100;
const DISSOLVENZA_S = 0.01;
// Silenzio aggiunto in coda a ogni clip: nessuno. Il taglio cade a metà della pausa naturale fra le frasi,
// e il respiro dei cambi di scena lo dà la regia, non il silenzio.
const CODA_S = 0;

const arrotonda = (s: number) => Math.round(s * 1000) / 1000;

export function chiaveElevenLabs(env: Record<string, string | undefined> = process.env): string {
  const chiave = env.ELEVENLABS_API_KEY?.trim();
  if (!chiave) throw new Error("ELEVENLABS_API_KEY non configurata");
  return chiave;
}

/** Una sola generazione per tutto il copione: ogni chiamata consuma crediti, si riprova solo su 429 e 5xx. */
export async function chiediAElevenLabs(
  testo: string,
  chiave: string,
  chiama: typeof fetch = fetch,
  pausaRiprovaMs = PAUSA_RIPROVA_MS,
): Promise<{ audio: Buffer; allineamento: Allineamento }> {
  for (let tentativo = 1; ; tentativo++) {
    const r = await chiama(URL_VOCE, {
      method: "POST",
      headers: { "xi-api-key": chiave, "Content-Type": "application/json" },
      body: JSON.stringify({ text: testo, model_id: MODELLO, language_code: "it" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (r.ok) {
      const dati = (await r.json()) as { audio_base64?: string; alignment?: Allineamento };
      if (!dati.audio_base64 || !dati.alignment?.characters?.length) throw new Error("risposta senza audio o allineamento");
      return { audio: Buffer.from(dati.audio_base64, "base64"), allineamento: dati.alignment };
    }
    // La chiave non deve mai finire nei messaggi, neanche se il corpo dell'errore la ripete.
    const corpo = (await r.text()).replaceAll(chiave, "***").slice(0, 200);
    if (tentativo < 2 && (r.status === 429 || r.status >= 500)) {
      await new Promise((risolvi) => setTimeout(risolvi, pausaRiprovaMs));
      continue;
    }
    throw new Error(`HTTP ${r.status}: ${corpo}`);
  }
}

/** Ritaglio esatto al campione (`atrim`, non `-ss`), dissolvenza di 10 ms ai bordi, poi la coda di silenzio. */
export function argomentiTaglio(mp3: string, wav: string, inizio: number, fine: number): string[] {
  const filtro = [
    `atrim=start=${inizio}:end=${fine}`,
    "asetpts=PTS-STARTPTS",
    `afade=t=in:d=${DISSOLVENZA_S}`,
    `afade=t=out:st=${arrotonda(fine - inizio - DISSOLVENZA_S)}:d=${DISSOLVENZA_S}`,
    ...(CODA_S > 0 ? [`apad=pad_dur=${CODA_S}`] : []),
  ].join(",");
  return ["-y", "-v", "error", "-i", mp3, "-af", filtro, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", wav];
}

function ffmpeg(argomenti: string[]): Promise<Buffer> {
  return new Promise((risolvi, rifiuta) => {
    const figlio = spawn("ffmpeg", argomenti, { stdio: ["ignore", "pipe", "pipe"] });
    const uscita: Buffer[] = [];
    let err = "";
    figlio.stdout.on("data", (d: Buffer) => uscita.push(d));
    figlio.stderr.on("data", (d) => (err += d));
    figlio.on("error", rifiuta);
    figlio.on("close", (codice) => (codice === 0 ? risolvi(Buffer.concat(uscita)) : rifiuta(new Error(`ffmpeg è uscito con codice ${codice}: ${err.trim().slice(0, 200)}`))));
  });
}

async function campioni(mp3: string): Promise<Float32Array> {
  const pcm = await ffmpeg(["-v", "error", "-i", mp3, "-f", "f32le", "-ac", "1", "-ar", String(SR), "pipe:1"]);
  return new Float32Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 4));
}

/** Dall'audio del copione intero alle clip per frase: `s{i}.wav`, più `timing.json` con inviluppo e tempi per parola. */
export async function scriviVoce(audio: Buffer, allineamento: Allineamento, frasi: string[], cartella: string): Promise<Timing> {
  mkdirSync(cartella, { recursive: true });
  const mp3 = join(cartella, "voce.mp3");
  writeFileSync(mp3, audio);
  writeFileSync(join(cartella, "allineamento.json"), JSON.stringify(allineamento));

  const perFrase = frasiDaParole(paroleDaAllineamento(allineamento), frasi);
  const pcm = await campioni(mp3);
  const confini = [0, ...tagliFrasi(perFrase), arrotonda(pcm.length / SR)];
  const clips: Timing["clips"] = [];
  for (const [i, parole] of perFrase.entries()) {
    const [inizio, fine] = [confini[i], confini[i + 1]];
    const file = `s${i}.wav`;
    await ffmpeg(argomentiTaglio(mp3, join(cartella, file), inizio, fine));
    clips.push({
      file,
      secondi: arrotonda(fine - inizio + CODA_S),
      inviluppo: inviluppo(pcm.subarray(Math.round(inizio * SR), Math.round(fine * SR)), SR, Math.round(CODA_S * SR), FPS),
      parole: parole.map((p) => ({ t: p.testo, da: arrotonda(p.inizio - inizio), a: arrotonda(p.fine - inizio) })),
    });
  }

  const timing: Timing = { voce: "elevenlabs", clips };
  const problemi = problemiTiming(timing, frasi);
  if (problemi.length) throw new Error(`timing non valido: ${problemi.join("; ")}`);
  writeFileSync(join(cartella, "timing.json"), JSON.stringify(timing, null, 2));
  return timing;
}

export async function voceElevenLabs(storyboard: Storyboard, cartella: string): Promise<Timing> {
  const frasi = storyboard.frasi.map((f) => f.testo);
  const { audio, allineamento } = await chiediAElevenLabs(frasi.join(" "), chiaveElevenLabs());
  return scriviVoce(audio, allineamento, frasi, cartella);
}

// Uso: node --experimental-strip-types pipeline/voce-elevenlabs.ts <storyboard.json> <cartella> [--riusa]
// --riusa rifà clip e timing da voce.mp3 e allineamento.json già nella cartella, senza chiamare ElevenLabs.
if (èPrincipale(import.meta.url)) {
  const argomenti = process.argv.slice(2);
  const [file, cartella] = argomenti.filter((a) => !a.startsWith("--")).map((a) => resolve(a));
  if (!file || !cartella) throw new Error("uso: voce-elevenlabs.ts <storyboard.json> <cartella> [--riusa]");
  const storyboard = JSON.parse(readFileSync(file, "utf8")) as Storyboard;
  const mp3 = join(cartella, "voce.mp3");
  const salvato = join(cartella, "allineamento.json");
  let timing: Timing;
  if (argomenti.includes("--riusa")) {
    if (!existsSync(mp3) || !existsSync(salvato)) throw new Error(`--riusa: mancano voce.mp3 o allineamento.json in ${cartella}`);
    const allineamento = JSON.parse(readFileSync(salvato, "utf8")) as Allineamento;
    timing = await scriviVoce(readFileSync(mp3), allineamento, storyboard.frasi.map((f) => f.testo), cartella);
  } else {
    timing = await voceElevenLabs(storyboard, cartella);
  }
  console.log(timing.clips.map((c, i) => `s${i}.wav ${c.secondi} s, ${c.parole?.length ?? 0} parole`).join("\n"));
}
