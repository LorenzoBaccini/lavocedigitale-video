import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Variante } from "../src/editoriale/variante.ts";
import { scegliVariante } from "../src/editoriale/variante.ts";
import { costruisciLinea } from "../src/linea.ts";
import type { PropsNotizia } from "../src/Notizia.tsx";
import { conFraseFinale } from "../src/storyboard/fraseFinale.ts";
import type { Storyboard } from "../src/storyboard/tipi.ts";
import { FPS } from "../src/theme.ts";
import type { Timing } from "../src/timing.ts";
import type { ArticoloVideo } from "./articolo.ts";
import { slugValido } from "./articolo.ts";
import type { BufferResult } from "./canali/buffer.ts";
import type { FacebookResult } from "./canali/facebook.ts";
import type { TelegramResult } from "./canali/telegram.ts";
import { buildVideoPost } from "./post-video.ts";
import { èPrincipale } from "./principale.ts";
import type { Impronta } from "./somiglianza.ts";
import { scegliDiversa } from "./somiglianza.ts";
import type { Storico } from "./storico.ts";
import { argomentiElenco, chiavePresente } from "./s3.ts";
import { aggiungi, analizzaStorico, CHIAVE_STORICO, riassunto, sequenzeRecenti, STORICO_VUOTO } from "./storico.ts";
import type { Misura } from "./storyboard.ts";
import { StoryboardScartato } from "./storyboard.ts";

const URL_VIDEO = "https://lavocedigitale.it/images/video";

export interface Dipendenze {
  leggiArticolo: (slug: string) => Promise<ArticoloVideo>;
  esisteVideo: (slug: string) => Promise<boolean>;
  /** Il testo dello storico dei video; `null` se il file non esiste ancora. Lancia un errore se non si legge. */
  leggiStorico: () => Promise<string | null>;
  scriviStorico: (testo: string) => Promise<void>;
  /** Lancia un errore se manca la chiave di ElevenLabs: va saputo prima di spendere la chiamata a Claude. */
  verificaChiave: () => void;
  /** `recenti`: le sequenze di scene degli ultimi video, che lo storyboard non deve ripetere; `misura`: durata e frase finale della variante. */
  scriviStoryboard: (a: ArticoloVideo, recenti: string[][], misura: Misura) => Promise<Storyboard>;
  /** ElevenLabs: un wav per frase e `timing.json` nella cartella. Lancia un errore se la voce non arriva. */
  voce: (storyboard: Storyboard, cartella: string) => Promise<Timing>;
  /** Genera i suoni in `public/suoni` (fuori da git): servono già ai fotogrammi del controllo d'impaginazione. */
  generaSuoni: () => void;
  /** Restituisce i problemi d'impaginazione trovati sui fotogrammi di controllo; vuoto se è tutto a posto. */
  controllaImpaginazione: (props: PropsNotizia) => Promise<string[]>;
  /** L'impronta dei sei fotogrammi fissi (somiglianza.ts). Un errore salta il controllo, non la pubblicazione. */
  impronta: (props: PropsNotizia) => Promise<Impronta>;
  render: (props: PropsNotizia, uscita: string) => Promise<void>;
  /** Restituisce l'URL pubblico del video caricato. */
  caricaVideo: (file: string, slug: string) => Promise<string>;
  postReelToFacebook: (videoUrl: string, description: string) => Promise<FacebookResult>;
  postVideoToX: (text: string, videoUrl: string) => Promise<BufferResult>;
  sendMessageToOwner: (text: string) => Promise<TelegramResult>;
}

export interface Esito {
  stato: "pubblicato" | "prova" | "saltato" | "errore";
  motivo?: string;
  voce?: Timing["voce"];
  variante?: Variante;
  righe: string[];
  durata?: number;
  tempi: { storyboard?: number; voce?: number; somiglianza?: number; render?: number };
  file?: string;
}

/** Percorsi relativi alla radice del pacchetto, che fa da cwd. */
export const percorsi = (slug: string) => ({
  audioBase: `audio/${slug}`,
  cartellaAudio: `public/audio/${slug}`,
  cartellaLavoro: `out/${slug}`,
  video: `out/${slug}/${slug}.mp4`,
});

export const urlPubblico = (slug: string): string => `${URL_VIDEO}/${slug}.mp4`;

export { slugValido };

const oggi = (): string => new Date().toISOString().slice(0, 10);

const messaggio = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function cronometra<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const inizio = Date.now();
  const valore = await fn();
  return [valore, Math.round((Date.now() - inizio) / 1000)];
}

async function canale(nome: string, pubblica: () => Promise<{ ok: boolean; postId?: string; error?: string }>): Promise<string> {
  try {
    const r = await pubblica();
    return r.ok ? `✓ ${nome}: pubblicato (${r.postId ?? "id n/d"})` : `✗ ${nome}: ${r.error}`;
  } catch (e) {
    return `✗ ${nome}: ${messaggio(e)}`;
  }
}

export const rigaVariante = (v: Variante): string =>
  [`stile ${v.stile}`, `gancio ${v.gancio}`, `chiusura ${v.chiusura}`, `frase finale ${v.fraseFinale + 1}`, `durata ${v.durata}`, `musica ${v.musica}`, `luce ${v.luce}`, `apertura ${v.apertura}`].join(" · ");

export function resoconto(slug: string, esito: Esito): string {
  const t = esito.tempi;
  const tempi = [
    t.storyboard !== undefined && `storyboard ${t.storyboard} s`,
    t.voce !== undefined && `voce ${t.voce} s`,
    t.somiglianza !== undefined && `somiglianza ${t.somiglianza} s`,
    t.render !== undefined && `render ${t.render} s`,
  ].filter(Boolean);
  return [
    `Video social: ${slug}`,
    `Stato: ${esito.stato}`,
    esito.motivo && `Motivo: ${esito.motivo}`,
    esito.voce && `Voce: ${esito.voce}`,
    esito.variante && `Variante: ${rigaVariante(esito.variante)}`,
    esito.durata !== undefined && `Durata: ${esito.durata.toFixed(1)} s`,
    tempi.length > 0 && `Tempi: ${tempi.join(" · ")}`,
    esito.file && `File: ${esito.file}`,
    ...esito.righe,
  ]
    .filter(Boolean)
    .join("\n");
}

const PROBLEMI_MOSTRATI = 5;

// Lo stesso problema esce a metà e a fine frase, con coordinate di poco diverse: si conta una volta sola.
function riassumiProblemi(problemi: string[]): string {
  const unici = [...new Map(problemi.map((p) => {
    const senzaMomento = p.replace(/, (inizio|metà|fine|\+\d+):/, ":");
    return [senzaMomento.replace(/ \([^()]*\)$/, ""), senzaMomento] as const;
  })).values()];
  const resto = unici.length - PROBLEMI_MOSTRATI;
  return unici.slice(0, PROBLEMI_MOSTRATI).join("; ") + (resto > 0 ? `; e altri ${resto}` : "");
}

async function produci(slug: string, opz: { prova: boolean }, dip: Dipendenze, esito: Esito): Promise<void> {
  if (!slugValido(slug)) {
    Object.assign(esito, { stato: "errore", motivo: "slug non valido" });
    return;
  }
  const articolo = await dip.leggiArticolo(slug);
  if (articolo.slug !== slug) {
    Object.assign(esito, { stato: "errore", motivo: "lo slug dell'articolo non è quello del lancio" });
    return;
  }
  // Lo storico dice se il video c'e' gia' anche dopo che l'mp4 e' scaduto su S3: se non si legge non si pubblica.
  let storico: Storico;
  try {
    storico = analizzaStorico(await dip.leggiStorico());
  } catch (e) {
    if (!opz.prova) {
      Object.assign(esito, { stato: "saltato", motivo: `storico dei video non leggibile, non si rischia un doppio post: ${messaggio(e)}` });
      return;
    }
    esito.righe.push(`✗ Storico: ${messaggio(e)} (in prova si va avanti senza)`);
    storico = STORICO_VUOTO;
  }
  // In prova non si carica niente: un video già pubblicato non impedisce di riguardarlo.
  if (!opz.prova && storico.pubblicati.includes(slug)) {
    Object.assign(esito, { stato: "saltato", motivo: "il video è già stato pubblicato (storico)" });
    return;
  }
  if (!opz.prova && (await dip.esisteVideo(slug))) {
    Object.assign(esito, { stato: "saltato", motivo: "il video esiste già" });
    return;
  }

  try {
    dip.verificaChiave();
  } catch (e) {
    esito.righe.push(`✗ ElevenLabs: ${messaggio(e)}`);
    Object.assign(esito, { stato: "saltato", motivo: `voce non generata: ${messaggio(e)}` });
    return;
  }

  // Dipende solo dallo slug e dallo storico: prima dello storyboard, che ne riceve la durata.
  const variante = scegliVariante(slug, storico.recenti.map((v) => v.variante));
  esito.variante = variante;

  let storyboard: Storyboard;
  try {
    [storyboard, esito.tempi.storyboard] = await cronometra(() => dip.scriviStoryboard(articolo, sequenzeRecenti(storico), { durata: variante.durata, fraseFinale: variante.fraseFinale }));
    // la validazione ha visto la frase del copione: la frase finale della variante la sostituisce prima della voce
    storyboard = conFraseFinale({ ...storyboard, slug }, variante.fraseFinale);
  } catch (e) {
    if (!(e instanceof StoryboardScartato)) throw e;
    Object.assign(esito, { stato: "saltato", motivo: e.motivo });
    return;
  }

  const p = percorsi(slug);
  let timing: Timing;
  const inizioVoce = Date.now();
  try {
    [timing, esito.tempi.voce] = await cronometra(() => dip.voce(storyboard, p.cartellaAudio));
  } catch (e) {
    esito.tempi.voce = Math.round((Date.now() - inizioVoce) / 1000);
    esito.righe.push(`✗ ElevenLabs: ${messaggio(e)}`);
    Object.assign(esito, { stato: "saltato", motivo: `voce non generata: ${messaggio(e)}` });
    return;
  }
  esito.voce = timing.voce;

  const conVariante = (v: Variante): PropsNotizia => ({ storyboard, timing, audioBase: p.audioBase, variante: v });
  dip.generaSuoni();
  const problemi = await dip.controllaImpaginazione(conVariante(variante));
  if (problemi.length > 0) {
    Object.assign(esito, { stato: "saltato", motivo: `impaginazione: ${riassumiProblemi(problemi)}` });
    return;
  }

  // voce e storyboard sono gia' pagati: la somiglianza cambia solo stile e gancio
  const [scelta, secondiSomiglianza] = await cronometra(() =>
    scegliDiversa({
      slug,
      variante,
      recenti: storico.recenti,
      impronta: (v) => dip.impronta(conVariante(v)),
      controllaImpaginazione: (v) => dip.controllaImpaginazione(conVariante(v)),
    }),
  );
  esito.tempi.somiglianza = secondiSomiglianza;
  esito.righe.push(scelta.riga);
  esito.variante = scelta.variante;
  const props = conVariante(scelta.variante);

  [, esito.tempi.render] = await cronometra(() => dip.render(props, p.video));
  esito.durata = costruisciLinea(timing, FPS).totale / FPS;

  if (opz.prova) {
    Object.assign(esito, { stato: "prova", file: p.video });
    return;
  }

  const url = await dip.caricaVideo(p.video, slug);
  esito.file = url;
  const testo = buildVideoPost(articolo, storyboard);
  const aMano = `Il post va fatto a mano con l'URL dell'mp4: ${url}\nTesto: ${testo}`;
  // Prima dei post: senza lo slug nello storico, dopo la scadenza dell'mp4 un nuovo lancio ripubblicherebbe.
  const errStorico = await scriviConUnRitentativo(() => dip.scriviStorico(JSON.stringify(aggiungi(storico, riassunto(storyboard, scelta.variante, oggi(), scelta.impronta)))));
  if (errStorico) {
    esito.righe.push(`✗ Storico: ${errStorico}`, `Nessun post: senza lo storico un nuovo lancio fra 7 giorni ripubblicherebbe. ${aMano}`);
    Object.assign(esito, { stato: "errore", motivo: "storico non scritto, post non fatti per non rischiare un doppio post" });
    return;
  }
  // In sequenza e ognuno nel suo try: un canale che fallisce non ferma l'altro.
  esito.righe.push(await canale("Facebook", () => dip.postReelToFacebook(url, testo)));
  esito.righe.push(await canale("X", () => dip.postVideoToX(testo, url)));
  const almenoUno = esito.righe.some((r) => r.startsWith("✓"));
  if (almenoUno) {
    esito.stato = "pubblicato";
    return;
  }
  esito.righe.push(
    `Un nuovo lancio verrebbe saltato: il video è già nello storico e su S3. ${aMano}`,
  );
  Object.assign(esito, { stato: "errore", motivo: "nessun canale ha pubblicato" });
}

async function scriviConUnRitentativo(scrivi: () => Promise<void>): Promise<string | undefined> {
  try {
    await scrivi();
    return undefined;
  } catch {
    try {
      await scrivi();
      return undefined;
    } catch (e) {
      return messaggio(e);
    }
  }
}

/** Lascia al workflow il segno che il resoconto e' partito: il suo ultimo step allora non ne manda un altro. */
function segnaInviato(): void {
  const file = process.env.RESOCONTO_INVIATO;
  if (!file) return;
  try {
    writeFileSync(file, "1");
  } catch (e) {
    console.error(`segno del resoconto: ${messaggio(e)}`);
  }
}

async function avvisa(slug: string, dip: Dipendenze, esito: Esito): Promise<void> {
  try {
    const r = await dip.sendMessageToOwner(resoconto(slug, esito));
    if (r.ok) segnaInviato();
    else console.error(`Telegram: ${r.error}`);
  } catch (e) {
    console.error(`Telegram: ${messaggio(e)}`);
  }
}

export async function eseguiPipeline(slug: string, opz: { prova: boolean }, dip: Dipendenze): Promise<Esito> {
  const esito: Esito = { stato: "errore", righe: [], tempi: {} };
  try {
    await produci(slug, opz, dip, esito);
  } catch (e) {
    Object.assign(esito, { stato: "errore", motivo: messaggio(e) });
  }
  await avvisa(slug, dip, esito);
  return esito;
}

type Invia = (testo: string) => Promise<TelegramResult>;

/** Per i fallimenti fuori da `eseguiPipeline` (articolo mancante o non valido, import fallito): l'errore arriva comunque su Telegram. */
export async function avvisaFallimento(
  slug: string | undefined,
  errore: unknown,
  invia?: Invia,
): Promise<void> {
  try {
    const manda = invia ?? (await import("./canali/telegram.ts")).sendMessageToOwner;
    const r = await manda([`Video social: ${slug ?? "slug n/d"}`, "Stato: errore", `Motivo: ${messaggio(errore)}`].join("\n"));
    if (r.ok) segnaInviato();
    else console.error(`Telegram: ${r.error}`);
  } catch (e) {
    console.error(`Telegram: ${messaggio(e)}`);
  }
}

function esegui(comando: string, argomenti: string[], eredita = true): Promise<{ codice: number; out: string; err: string }> {
  return new Promise((risolvi, rifiuta) => {
    const figlio = spawn(comando, argomenti, { stdio: eredita ? "inherit" : ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    figlio.stdout?.on("data", (d) => (out += d));
    figlio.stderr?.on("data", (d) => (err += d));
    figlio.on("error", rifiuta);
    figlio.on("close", (codice) => risolvi({ codice: codice ?? 1, out, err }));
  });
}

function bucket(): string {
  const b = process.env.S3_BUCKET_IMAGES;
  if (!b) throw new Error("S3_BUCKET_IMAGES non configurata");
  return b;
}

/** Errore se l'elenco non si legge (permessi, bucket, rete): un'assenza va dimostrata, non dedotta. */
async function esisteChiave(chiave: string): Promise<boolean> {
  const r = await esegui("aws", argomentiElenco(bucket(), chiave), false);
  if (r.codice !== 0) throw new Error(`elenco di ${chiave}: ${r.err.trim()}`);
  return chiavePresente(r.out, chiave);
}

async function dipendenzeVere(articolo: ArticoloVideo): Promise<Dipendenze> {
  const { scriviStoryboard, chiediAClaude } = await import("./storyboard.ts");
  const { renderVideo } = await import("./render.ts");
  const { controllaImpaginazione, renderFotogrammi } = await import("./controlla-impaginazione.ts");
  const { improntaFotogramma } = await import("./somiglianza.ts");
  const { voceElevenLabs, chiaveElevenLabs } = await import("./voce-elevenlabs.ts");
  const { generaFoley } = await import("../suoni/foley.ts");
  const { postReelToFacebook } = await import("./canali/facebook.ts");
  const { postVideoToX } = await import("./canali/buffer.ts");
  const { sendMessageToOwner } = await import("./canali/telegram.ts");

  return {
    leggiArticolo: async () => articolo,
    esisteVideo: (slug) => esisteChiave(`video/${slug}.mp4`),
    leggiStorico: async () => {
      if (!(await esisteChiave(CHIAVE_STORICO))) return null;
      const r = await esegui("aws", ["s3", "cp", `s3://${bucket()}/${CHIAVE_STORICO}`, "-"], false);
      if (r.codice === 0) return r.out;
      throw new Error(`lettura dello storico: ${r.err.trim()}`);
    },
    scriviStorico: async (testo) => {
      const file = "out/storico.json";
      writeFileSync(file, testo);
      const r = await esegui("aws", ["s3", "cp", file, `s3://${bucket()}/${CHIAVE_STORICO}`, "--content-type", "application/json", "--cache-control", "no-store"], false);
      if (r.codice !== 0) throw new Error(`scrittura dello storico: ${r.err.trim()}`);
    },
    verificaChiave: () => void chiaveElevenLabs(),
    // ogni risposta di Claude resta su disco prima dei controlli: finisce nell'artifact anche se scartata
    scriviStoryboard: (a, recenti, misura) =>
      scriviStoryboard(a, chiediAClaude, misura, recenti, (risposta, n) => writeFileSync(join(percorsi(a.slug).cartellaLavoro, `storyboard-claude-${n}.txt`), risposta)),
    voce: (storyboard, cartella) => {
      writeFileSync(join(percorsi(storyboard.slug).cartellaLavoro, "storyboard.json"), JSON.stringify(storyboard, null, 2));
      return voceElevenLabs(storyboard, cartella);
    },
    generaSuoni: () => void generaFoley(),
    // props.json si scrive gia' qui: se il controllo scarta il video, l'artifact del workflow lo porta con se'
    controllaImpaginazione: (props) => {
      writeFileSync(join(percorsi(props.storyboard.slug).cartellaLavoro, "props.json"), JSON.stringify(props));
      return controllaImpaginazione(props);
    },
    impronta: async (props) => {
      const impronta: string[] = [];
      for (const png of await renderFotogrammi(props)) impronta.push(await improntaFotogramma(png));
      return impronta;
    },
    render: async (props, uscita) => {
      const file = join(dirname(uscita), "props.json");
      writeFileSync(file, JSON.stringify(props));
      await renderVideo(file, uscita);
    },
    caricaVideo: async (file, slug) => {
      const r = await esegui("aws", [
        "s3", "cp", file, `s3://${bucket()}/video/${slug}.mp4`,
        "--content-type", "video/mp4",
        "--cache-control", "public, max-age=31536000, immutable",
      ]);
      if (r.codice !== 0) throw new Error(`aws s3 cp è uscito con codice ${r.codice}`);
      return urlPubblico(slug);
    },
    postReelToFacebook,
    postVideoToX,
    sendMessageToOwner,
  };
}

// Uso: node --experimental-strip-types pipeline/main.ts <articolo.json> [--prova]
if (èPrincipale(import.meta.url)) {
  const argomenti = process.argv.slice(2);
  const file = argomenti.find((a) => !a.startsWith("--"));
  let slug: string | undefined;
  try {
    if (!file) throw new Error("uso: main.ts <articolo.json> [--prova]");
    const { leggiArticolo } = await import("./articolo.ts");
    const articolo = leggiArticolo(resolve(file));
    slug = articolo.slug;
    process.chdir(fileURLToPath(new URL("..", import.meta.url)));
    mkdirSync(percorsi(slug).cartellaLavoro, { recursive: true });
    // nell'artifact del workflow: un nuovo lancio a mano riparte da qui
    writeFileSync(join(percorsi(slug).cartellaLavoro, "articolo.json"), JSON.stringify(articolo));

    const esito = await eseguiPipeline(slug, { prova: argomenti.includes("--prova") }, await dipendenzeVere(articolo));
    console.log(resoconto(slug, esito));
    if (esito.stato === "errore") process.exitCode = 1;
  } catch (e) {
    console.error(messaggio(e));
    await avvisaFallimento(slug, e);
    process.exitCode = 1;
  }
}
