import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Variante } from "../src/editoriale/variante.ts";
import { VARIANTE_BASE } from "../src/editoriale/variante.ts";
import type { PropsNotizia } from "../src/Notizia.tsx";
import type { Storyboard } from "../src/storyboard/tipi.ts";
import type { Timing } from "../src/timing.ts";
import type { ArticoloVideo } from "./articolo.ts";
import { avvisaFallimento, eseguiPipeline, slugValido, type Dipendenze } from "./main.ts";
import { buildVideoPost } from "./post-video.ts";
import { StoryboardScartato } from "./storyboard.ts";

const SLUG = "installare-windows-10-usb-dopo-fine-supporto";
const URL_VIDEO = `https://lavocedigitale.it/images/video/${SLUG}.mp4`;

const articolo: ArticoloVideo = {
  slug: SLUG,
  titolo: "Installare Windows 10 da USB dopo la fine del supporto",
  sottotitolo: "Si può ancora fare",
  testo: "Dal 14 ottobre 2025 niente aggiornamenti.",
  url: `https://lavocedigitale.it/software/${SLUG}`,
  tags: ["windows-10", "usb"],
};

const storyboard = JSON.parse(
  readFileSync(new URL("../fixtures/windows10.storyboard.json", import.meta.url), "utf8"),
) as Storyboard;

const timing = (): Timing => ({
  voce: "elevenlabs",
  clips: storyboard.frasi.map(() => ({ file: "s.wav", secondi: 3.5, inviluppo: [0] })),
});

function finte(sovrascrivi: Partial<Dipendenze> = {}) {
  const chiamate: Record<string, unknown[][]> = {};
  const registra =
    <A extends unknown[], R>(nome: string, fn: (...a: A) => R) =>
    (...a: A): R => {
      (chiamate[nome] ??= []).push(a);
      return fn(...a);
    };
  const base: Dipendenze = {
    leggiArticolo: async () => articolo,
    esisteVideo: async () => false,
    leggiStorico: async () => null,
    scriviStorico: async () => {},
    scriviStoryboard: async () => storyboard,
    verificaChiave: () => {},
    voce: async () => timing(),
    generaSuoni: () => {},
    controllaImpaginazione: async () => [],
    render: async () => {},
    caricaVideo: async () => URL_VIDEO,
    postReelToFacebook: async () => ({ ok: true, postId: "fb1" }),
    postVideoToX: async () => ({ ok: true, postId: "x1" }),
    sendMessageToOwner: async () => ({ ok: true }),
  };
  const unite = { ...base, ...sovrascrivi };
  const dip = Object.fromEntries(
    Object.entries(unite).map(([nome, fn]) => [nome, registra(nome, fn as (...a: unknown[]) => unknown)]),
  ) as unknown as Dipendenze;
  return { dip, chiamate, n: (nome: keyof Dipendenze) => chiamate[nome]?.length ?? 0 };
}

test("salta se il video esiste già", async () => {
  const f = finte({ esisteVideo: async () => true });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "saltato");
  assert.equal(f.n("scriviStoryboard"), 0);
  assert.equal(f.n("sendMessageToOwner"), 1);
});

test("un articolo con un altro slug si ferma prima dello storyboard", async () => {
  const f = finte({ leggiArticolo: async () => ({ ...articolo, slug: "altro-articolo" }) });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "errore");
  assert.equal(f.n("scriviStoryboard"), 0);
  assert.equal(f.n("sendMessageToOwner"), 1);
});

test("storyboard scartato chiude con il motivo", async () => {
  const f = finte({
    scriviStoryboard: async () => {
      throw new StoryboardScartato("cifre che non sono nell'articolo: 12");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "saltato");
  assert.equal(esito.motivo, "cifre che non sono nell'articolo: 12");
  assert.equal(f.n("voce"), 0);
  assert.match(f.chiamate.sendMessageToOwner[0][0] as string, /cifre che non sono nell'articolo: 12/);
});

test("se ElevenLabs fallisce salta con il motivo", async () => {
  const f = finte({
    voce: async () => {
      throw new Error("HTTP 401: invalid_api_key");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "saltato");
  assert.equal(esito.motivo, "voce non generata: HTTP 401: invalid_api_key");
  assert.equal(f.n("render"), 0);
  assert.equal(f.n("caricaVideo"), 0);
  assert.equal(f.n("postReelToFacebook"), 0);
  assert.equal(f.n("postVideoToX"), 0);
  assert.equal(f.n("sendMessageToOwner"), 1);
  assert.match(f.chiamate.sendMessageToOwner[0][0] as string, /voce non generata: HTTP 401: invalid_api_key/);
});

test("se l'impaginazione ha problemi salta", async () => {
  const f = finte({ controllaImpaginazione: async () => ["frase 3 (oggetto), fine: conferma: fuori dai margini"] });
  const esito = await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal(esito.stato, "saltato");
  assert.match(esito.motivo ?? "", /impaginazione: frase 3 \(oggetto\): conferma: fuori dai margini/);
  assert.equal(f.n("render"), 0);
  assert.equal(f.n("sendMessageToOwner"), 1);
  assert.match(f.chiamate.sendMessageToOwner[0][0] as string, /conferma: fuori dai margini/);
});

test("i problemi d'impaginazione si contano una volta e nel motivo ne vanno al massimo 5", async () => {
  const problemi = Array.from({ length: 8 }, (_, i) => [
    `frase ${i + 1} (allarme), metà: titolo: si sovrappone alla zona del sottotitolo (y 1193–1374)`,
    `frase ${i + 1} (allarme), fine: titolo: si sovrappone alla zona del sottotitolo (y 1194–1375)`,
  ]).flat();
  const f = finte({ controllaImpaginazione: async () => problemi });
  const esito = await eseguiPipeline(SLUG, { prova: true }, f.dip);
  const motivo = esito.motivo ?? "";
  assert.equal(motivo.match(/si sovrappone/g)?.length, 5);
  assert.match(motivo, /^impaginazione: frase 1 \(allarme\): titolo: si sovrappone/);
  assert.match(motivo, /e altri 3$/);
});

test("un crash del controllo d'impaginazione chiude con errore notificato e senza render", async () => {
  const f = finte({
    controllaImpaginazione: async () => {
      throw new Error("Failed to launch the browser process");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "errore");
  assert.match(esito.motivo ?? "", /Failed to launch the browser process/);
  assert.equal(f.n("render"), 0);
  assert.equal(f.n("caricaVideo"), 0);
  assert.equal(f.n("sendMessageToOwner"), 1);
  assert.match(f.chiamate.sendMessageToOwner[0][0] as string, /Failed to launch the browser process/);
});

test("il controllo d'impaginazione gira sulle props del render, dopo la voce", async () => {
  const f = finte();
  await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal(f.n("controllaImpaginazione"), 1);
  assert.deepEqual(f.chiamate.controllaImpaginazione[0][0], f.chiamate.render[0][0]);
});

test("in prova non pubblica e manda solo su Telegram", async () => {
  const f = finte();
  const esito = await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal(esito.stato, "prova");
  assert.equal(f.n("postReelToFacebook"), 0);
  assert.equal(f.n("postVideoToX"), 0);
  assert.equal(f.n("caricaVideo"), 0);
  assert.equal(f.n("sendMessageToOwner"), 1);
  assert.match(f.chiamate.sendMessageToOwner[0][0] as string, new RegExp(`out/${SLUG}/${SLUG}\\.mp4`));
});

test("un canale che fallisce non ferma l'altro", async () => {
  const f = finte({
    postReelToFacebook: async () => {
      throw new Error("Graph 500");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(f.n("postVideoToX"), 1);
  assert.ok(esito.righe.some((r) => r.startsWith("✗ Facebook")));
  assert.ok(esito.righe.some((r) => r.startsWith("✓ X")));
  assert.equal(esito.stato, "pubblicato");
});

test("pubblica con il testo del video (non quello del post dell'articolo) e l'URL pubblico dell'mp4", async () => {
  const f = finte();
  await eseguiPipeline(SLUG, { prova: false }, f.dip);
  const [url, testo] = f.chiamate.postReelToFacebook[0] as [string, string];
  assert.equal(url, URL_VIDEO);
  assert.equal(testo, buildVideoPost(articolo, storyboard));
  assert.ok(!testo.startsWith(articolo.titolo));
  assert.ok(testo.includes(`https://lavocedigitale.it/software/${SLUG}`));
  assert.deepEqual(f.chiamate.postVideoToX[0], [testo, URL_VIDEO]);
});

test("se nessun canale pubblica lo stato è errore", async () => {
  const f = finte({
    postReelToFacebook: async () => ({ ok: false, error: "token scaduto" }),
    postVideoToX: async () => ({ ok: false, error: "Buffer giù" }),
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "errore");
  assert.ok(esito.righe.includes("✗ Facebook: token scaduto"));
});

test("un errore imprevisto chiude con stato errore e messaggio Telegram", async () => {
  const f = finte({
    render: async () => {
      throw new Error("remotion è uscito con codice 1");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "errore");
  assert.match(esito.motivo ?? "", /remotion/);
  assert.equal(f.n("caricaVideo"), 0);
  assert.equal(f.n("sendMessageToOwner"), 1);
});

test("il resoconto riporta slug, stato, voce, durata e tempi", async () => {
  const f = finte();
  await eseguiPipeline(SLUG, { prova: true }, f.dip);
  const testo = f.chiamate.sendMessageToOwner[0][0] as string;
  assert.ok(testo.includes(SLUG));
  assert.match(testo, /Stato: prova/);
  assert.match(testo, /Voce: elevenlabs/);
  // 8 clip da 3,5 s più 1,2 s di coda sulla chiusura
  assert.match(testo, /Durata: 29\.2 s/);
  assert.match(testo, /storyboard \d+ s · voce \d+ s · render \d+ s/);
});

test("pubblicato: il resoconto è solo testo con URL dell'mp4 e id dei post", async () => {
  const f = finte();
  await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(f.n("sendMessageToOwner"), 1);
  const testo = f.chiamate.sendMessageToOwner[0][0] as string;
  assert.ok(testo.includes(URL_VIDEO));
  assert.match(testo, /✓ Facebook: pubblicato \(fb1\)/);
  assert.match(testo, /✓ X: pubblicato \(x1\)/);
});

test("voce fallita: il resoconto ha il tempo e la riga ElevenLabs", async () => {
  const f = finte({
    voce: async () => {
      throw new Error("HTTP 401: invalid_api_key");
    },
  });
  await eseguiPipeline(SLUG, { prova: false }, f.dip);
  const testo = f.chiamate.sendMessageToOwner[0][0] as string;
  assert.match(testo, /voce \d+ s/);
  assert.match(testo, /✗ ElevenLabs: HTTP 401: invalid_api_key/);
});

test("nessun canale pubblica: il resoconto dice che il rilancio salterebbe e che il post è a mano", async () => {
  const f = finte({
    postReelToFacebook: async () => ({ ok: false, error: "token scaduto" }),
    postVideoToX: async () => ({ ok: false, error: "Buffer giù" }),
  });
  await eseguiPipeline(SLUG, { prova: false }, f.dip);
  const testo = f.chiamate.sendMessageToOwner[0][0] as string;
  assert.match(testo, /nuovo lancio verrebbe saltato/);
  assert.match(testo, /già nello storico e su S3/);
  assert.match(testo, /a mano/);
  assert.ok(testo.includes(URL_VIDEO));
});

test("fallimento prima della pipeline: Telegram riceve slug ed errore", async () => {
  const inviati: string[] = [];
  await avvisaFallimento(SLUG, new Error("import fallito"), async (t) => {
    inviati.push(t);
    return { ok: true };
  });
  assert.equal(inviati.length, 1);
  assert.ok(inviati[0].includes(SLUG));
  assert.match(inviati[0], /import fallito/);
});

test("fallimento prima di conoscere lo slug: il messaggio lo dice", async () => {
  const inviati: string[] = [];
  await avvisaFallimento(undefined, new Error("articolo non valido: slug"), async (t) => {
    inviati.push(t);
    return { ok: true };
  });
  assert.match(inviati[0], /slug n\/d/);
  assert.match(inviati[0], /articolo non valido/);
});

test("i suoni si generano prima del controllo d'impaginazione, che viene prima del render", async () => {
  const ordine: string[] = [];
  const f = finte({
    generaSuoni: () => void ordine.push("suoni"),
    controllaImpaginazione: async () => (ordine.push("impaginazione"), []),
    render: async () => void ordine.push("render"),
  });
  await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.deepEqual(ordine, ["suoni", "impaginazione", "render"]);
});

test("senza chiave ElevenLabs salta prima di chiamare Claude e lo dice su Telegram", async () => {
  const f = finte({
    verificaChiave: () => {
      throw new Error("ELEVENLABS_API_KEY non configurata");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "saltato");
  assert.match(esito.motivo ?? "", /ELEVENLABS_API_KEY/);
  assert.equal(f.n("scriviStoryboard"), 0);
  assert.equal(f.n("voce"), 0);
  assert.match(String(f.chiamate.sendMessageToOwner[0][0]), /ELEVENLABS_API_KEY/);
});

const voceStorico = (slug: string, variante: Partial<Variante>, tipi: string[]) => ({
  slug,
  data: "2026-11-01",
  scene: tipi.map((tipo) => ({ tipo })),
  variante,
});

test("senza storico (file mai scritto) produce, e dopo l'upload scrive lo storico con il riassunto del video", async () => {
  const ordine: string[] = [];
  const f = finte({
    caricaVideo: async () => (ordine.push("upload"), URL_VIDEO),
    scriviStorico: async () => void ordine.push("storico"),
    postReelToFacebook: async () => (ordine.push("facebook"), { ok: true, postId: "fb1" }),
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "pubblicato");
  assert.deepEqual(ordine, ["upload", "storico", "facebook"]);
  const scritto = JSON.parse(f.chiamate.scriviStorico[0][0] as string);
  assert.deepEqual(scritto.pubblicati, [SLUG]);
  assert.equal(scritto.recenti[0].slug, SLUG);
  assert.deepEqual(scritto.recenti[0].scene.map((s: { tipo: string }) => s.tipo).slice(0, 3), ["gancio", "allarme", "data"]);
  assert.equal(scritto.recenti[0].scene[1].dispositivo, "portatile");
  assert.deepEqual(scritto.recenti[0].variante, esito.variante);
});

test("in prova legge lo storico ma non lo scrive", async () => {
  const f = finte();
  await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal(f.n("leggiStorico"), 1);
  assert.equal(f.n("scriviStorico"), 0);
});

test("se l'upload fallisce lo storico non si scrive", async () => {
  const f = finte({
    caricaVideo: async () => {
      throw new Error("aws s3 cp è uscito con codice 1");
    },
  });
  await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(f.n("scriviStorico"), 0);
});

test("uno slug gia' nello storico salta anche se l'mp4 e' scaduto su S3", async () => {
  const storico = { recenti: [], pubblicati: ["altro", SLUG] };
  const f = finte({ leggiStorico: async () => JSON.stringify(storico) });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "saltato");
  assert.match(esito.motivo ?? "", /già stato pubblicato/);
  assert.equal(f.n("scriviStoryboard"), 0);
});

test("storico che non si legge per errore: niente video, e il motivo arriva su Telegram", async () => {
  for (const leggiStorico of [
    async () => {
      throw new Error("lettura dello storico: AccessDenied");
    },
    async () => "{ rotto",
  ]) {
    const f = finte({ leggiStorico });
    const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
    assert.equal(esito.stato, "saltato");
    assert.match(esito.motivo ?? "", /storico dei video non leggibile/);
    assert.equal(f.n("scriviStoryboard"), 0);
    assert.match(String(f.chiamate.sendMessageToOwner[0][0]), /storico dei video non leggibile/);
  }
});

test("in prova uno storico illeggibile non ferma la prova", async () => {
  const f = finte({ leggiStorico: async () => "{ rotto" });
  const esito = await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal(esito.stato, "prova");
  assert.ok(esito.righe.some((r) => r.startsWith("✗ Storico: storico illeggibile")));
});

test("le sequenze dei recenti vanno allo storyboard, la variante evita le ultime e arriva al render", async () => {
  const recenti = [
    voceStorico("b", { musica: "chiaro", luce: "sera", apertura: "radente" }, ["gancio", "telefono", "chiusura"]),
    voceStorico("a", VARIANTE_BASE, ["gancio", "data", "chiusura"]),
  ];
  const f = finte({ leggiStorico: async () => JSON.stringify({ recenti, pubblicati: ["b", "a"] }) });
  const esito = await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.deepEqual(f.chiamate.scriviStoryboard[0][1], [["gancio", "telefono"], ["gancio", "data"]]);
  assert.equal(esito.variante?.musica, "notturno");
  assert.equal(esito.variante?.apertura, "alta");
  assert.ok(!["sera", "calda"].includes(esito.variante?.luce ?? ""));
  assert.deepEqual((f.chiamate.render[0][0] as PropsNotizia).variante, esito.variante);
  assert.match(String(f.chiamate.sendMessageToOwner[0][0]), /Variante: stile schermo · gancio scena · chiusura cartolina · frase finale \d · durata media · musica notturno/);
});

test("la variante si sceglie prima dello storyboard: c'e' nel resoconto anche se lo storyboard viene scartato", async () => {
  const f = finte({
    scriviStoryboard: async () => {
      throw new StoryboardScartato("cifre non nell'articolo");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal(esito.stato, "saltato");
  assert.equal(esito.variante?.stile, "schermo");
  assert.equal(esito.variante?.durata, "media");
  assert.match(String(f.chiamate.sendMessageToOwner[0][0]), /Variante: stile schermo/);
});

test("lo storico registra stile, gancio, chiusura, frase finale e durata; le voci vecchie senza quei campi non fanno cadere la scelta", async () => {
  const recenti = [voceStorico("a", { musica: "chiaro", luce: "sera", apertura: "radente" }, ["gancio", "data", "chiusura"])];
  const f = finte({ leggiStorico: async () => JSON.stringify({ recenti, pubblicati: ["a"] }) });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "pubblicato");
  const variante = JSON.parse(f.chiamate.scriviStorico[0][0] as string).recenti[0].variante;
  assert.deepEqual(Object.keys(variante).sort(), ["apertura", "chiusura", "durata", "fraseFinale", "gancio", "luce", "musica", "stile"]);
  assert.deepEqual(variante, esito.variante);
});

test("lo storico conserva i riassunti degli ultimi 10 e gli slug degli ultimi 200", async () => {
  const recenti = Array.from({ length: 10 }, (_, i) => voceStorico(`v${i}`, VARIANTE_BASE, ["gancio", "numero"]));
  const pubblicati = Array.from({ length: 200 }, (_, i) => `v${i}`);
  const f = finte({ leggiStorico: async () => JSON.stringify({ recenti, pubblicati }) });
  await eseguiPipeline(SLUG, { prova: false }, f.dip);
  const scritto = JSON.parse(f.chiamate.scriviStorico[0][0] as string);
  assert.equal(scritto.recenti.length, 10);
  assert.equal(scritto.recenti[0].slug, SLUG);
  assert.equal(scritto.pubblicati.length, 200);
  assert.equal(scritto.pubblicati[0], SLUG);
  assert.equal(scritto.pubblicati.at(-1), "v198");
});

test("se lo storico non si scrive neanche al secondo tentativo non si posta: errore e post a mano su Telegram", async () => {
  const f = finte({
    scriviStorico: async () => {
      throw new Error("scrittura dello storico: AccessDenied");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "errore");
  assert.match(esito.motivo ?? "", /storico non scritto, post non fatti/);
  assert.equal(f.n("scriviStorico"), 2);
  assert.equal(f.n("postReelToFacebook"), 0);
  assert.equal(f.n("postVideoToX"), 0);
  const testo = String(f.chiamate.sendMessageToOwner[0][0]);
  assert.match(testo, /✗ Storico: scrittura dello storico: AccessDenied/);
  assert.ok(testo.includes(URL_VIDEO));
  assert.match(testo, /a mano/);
});

test("se lo storico si scrive al secondo tentativo si pubblica", async () => {
  let volte = 0;
  const f = finte({
    scriviStorico: async () => {
      if (++volte === 1) throw new Error("rete");
    },
  });
  const esito = await eseguiPipeline(SLUG, { prova: false }, f.dip);
  assert.equal(esito.stato, "pubblicato");
  assert.equal(f.n("postReelToFacebook"), 1);
});

test("uno slug che non e' uno slug si ferma prima di leggere qualsiasi cosa", async () => {
  for (const slug of ["../etc", "Maiuscole", "a--b", ""]) {
    const f = finte();
    const esito = await eseguiPipeline(slug, { prova: true }, f.dip);
    assert.equal(esito.stato, "errore", slug);
    assert.equal(f.n("leggiArticolo"), 0);
  }
  assert.equal(slugValido(SLUG), true);
});

test("i percorsi usano lo slug vero anche se lo storyboard ne porta un altro", async () => {
  const f = finte({ scriviStoryboard: async () => ({ ...storyboard, slug: "../altro" }) });
  await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal((f.chiamate.render[0][0] as PropsNotizia).storyboard.slug, SLUG);
  assert.equal((f.chiamate.voce[0][0] as Storyboard).slug, SLUG);
  assert.equal(f.chiamate.render[0][1], `out/${SLUG}/${SLUG}.mp4`);
});

test("una voce dello storico con la variante rovinata non fa cadere la scelta", async () => {
  const recenti = [{ slug: "a", data: "2026-11-01", scene: [{ tipo: "gancio" }], variante: null }];
  const f = finte({ leggiStorico: async () => JSON.stringify({ recenti, pubblicati: ["a"] }) });
  const esito = await eseguiPipeline(SLUG, { prova: true }, f.dip);
  assert.equal(esito.stato, "prova");
  assert.ok(esito.variante);
});

test("a resoconto inviato lascia il segno per l'ultimo step del workflow, non se Telegram fallisce", async () => {
  const segno = join(mkdtempSync(join(tmpdir(), "resoconto-")), "inviato");
  process.env.RESOCONTO_INVIATO = segno;
  try {
    await eseguiPipeline(SLUG, { prova: true }, finte({ sendMessageToOwner: async () => ({ ok: false, error: "giù" }) }).dip);
    assert.equal(existsSync(segno), false);
    await eseguiPipeline(SLUG, { prova: true }, finte().dip);
    assert.equal(existsSync(segno), true);
  } finally {
    delete process.env.RESOCONTO_INVIATO;
  }
});
