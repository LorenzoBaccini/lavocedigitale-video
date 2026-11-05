import { test } from "node:test";
import assert from "node:assert/strict";

import { argomentiTaglio, chiaveElevenLabs, chiediAElevenLabs, MODELLO, VOCE_ID } from "./voce-elevenlabs.ts";

const CHIAVE = "sk_finta_123";
const ALLINEAMENTO = { characters: ["a"], character_start_times_seconds: [0], character_end_times_seconds: [0.1] };
const OK = { audio_base64: Buffer.from("mp3").toString("base64"), alignment: ALLINEAMENTO };

const risposta = (stato: number, corpo: unknown) =>
  new Response(typeof corpo === "string" ? corpo : JSON.stringify(corpo), { status: stato });

function finto(...risposte: Response[]) {
  const chiamate: { url: string; init: RequestInit }[] = [];
  const chiama = async (url: string | URL | Request, init?: RequestInit) => {
    chiamate.push({ url: String(url), init: init ?? {} });
    const r = risposte.shift();
    if (!r) throw new Error("nessuna risposta prevista");
    return r;
  };
  return { chiama: chiama as typeof fetch, chiamate };
}

test("una chiamata con voce, modello, lingua e chiave nell'intestazione", async () => {
  const f = finto(risposta(200, OK));
  const r = await chiediAElevenLabs("Ciao a tutti.", CHIAVE, f.chiama, 0);
  assert.equal(r.audio.toString(), "mp3");
  assert.deepEqual(r.allineamento, ALLINEAMENTO);
  assert.equal(f.chiamate.length, 1);
  const { url, init } = f.chiamate[0];
  assert.equal(url, `https://api.elevenlabs.io/v1/text-to-speech/${VOCE_ID}/with-timestamps?output_format=mp3_44100_128`);
  assert.equal((init.headers as Record<string, string>)["xi-api-key"], CHIAVE);
  assert.deepEqual(JSON.parse(init.body as string), { text: "Ciao a tutti.", model_id: MODELLO, language_code: "it" });
  assert.ok(init.signal);
});

test("su 429 e 5xx riprova una volta sola", async () => {
  const f = finto(risposta(429, "too many"), risposta(200, OK));
  await chiediAElevenLabs("x", CHIAVE, f.chiama, 0);
  assert.equal(f.chiamate.length, 2);

  const g = finto(risposta(503, "giù"), risposta(502, "ancora giù"));
  await assert.rejects(chiediAElevenLabs("x", CHIAVE, g.chiama, 0), /HTTP 502: ancora giù/);
  assert.equal(g.chiamate.length, 2);
});

test("su un altro errore non riprova, e la chiave non finisce nel messaggio", async () => {
  const f = finto(risposta(401, `{"detail":"invalid key ${CHIAVE}"}`));
  await assert.rejects(chiediAElevenLabs("x", CHIAVE, f.chiama, 0), (e: Error) => {
    assert.match(e.message, /^HTTP 401: /);
    assert.ok(!e.message.includes(CHIAVE));
    return true;
  });
  assert.equal(f.chiamate.length, 1);
});

test("una risposta senza audio o allineamento è un errore", async () => {
  const f = finto(risposta(200, { audio_base64: "" }));
  await assert.rejects(chiediAElevenLabs("x", CHIAVE, f.chiama, 0), /risposta senza audio o allineamento/);
});

test("senza ELEVENLABS_API_KEY l'errore lo dice", () => {
  assert.throws(() => chiaveElevenLabs({}), /ELEVENLABS_API_KEY non configurata/);
  assert.equal(chiaveElevenLabs({ ELEVENLABS_API_KEY: " k " }), "k");
});

test("il taglio è esatto al campione, con dissolvenze di 10 ms e senza silenzio aggiunto", () => {
  const a = argomentiTaglio("voce.mp3", "s1.wav", 1.69, 4.2);
  assert.deepEqual(a.slice(0, 4), ["-y", "-v", "error", "-i"]);
  assert.equal(a[a.indexOf("-af") + 1], "atrim=start=1.69:end=4.2,asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=2.5:d=0.01");
  assert.equal(a.at(-1), "s1.wav");
});
