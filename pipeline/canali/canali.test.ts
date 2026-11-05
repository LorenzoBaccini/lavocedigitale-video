import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { postReelToFacebook } from "./facebook.ts";
import { postVideoToX } from "./buffer.ts";
import { sendMessageToOwner } from "./telegram.ts";

interface Call {
  url: string;
  init: RequestInit;
}

const realFetch = globalThis.fetch;
const ENV_KEYS = [
  "FB_PAGE_ID",
  "FB_PAGE_TOKEN",
  "BUFFER_API_KEY",
  "BUFFER_X_CHANNEL_ID",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
];
let calls: Call[] = [];

function fakeFetch(responses: Array<{ status?: number; body: unknown }>): void {
  calls = [];
  let i = 0;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const r = responses[Math.min(i++, responses.length - 1)];
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
  }) as typeof fetch;
}

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const VIDEO = "https://example.com/x.mp4";

test("il reel fa start, upload con file_url, finish PUBLISHED", async () => {
  process.env.FB_PAGE_ID = "123";
  process.env.FB_PAGE_TOKEN = "tok";
  fakeFetch([
    { body: { video_id: "v1", upload_url: "https://rupload.facebook.com/x" } },
    { body: { success: true } },
    { body: { success: true, post_id: "p1" } },
  ]);

  const r = await postReelToFacebook(VIDEO, "testo https://lavocedigitale.it/a");

  assert.equal(r.ok, true);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, "https://graph.facebook.com/v25.0/123/video_reels");
  assert.match(String(calls[0].init.body), /upload_phase=start/);
  assert.equal(calls[1].url, "https://rupload.facebook.com/video-upload/v25.0/v1");
  const h = calls[1].init.headers as Record<string, string>;
  assert.equal(h.Authorization, "OAuth tok");
  assert.equal(h.file_url, VIDEO);
  assert.equal(calls[2].url, "https://graph.facebook.com/v25.0/123/video_reels");
  const finish = String(calls[2].init.body);
  assert.match(finish, /upload_phase=finish/);
  assert.match(finish, /video_state=PUBLISHED/);
  assert.match(finish, /video_id=v1/);
  assert.match(finish, /description=testo/);
});

test("il reel restituisce ok false se lo start fallisce", async () => {
  process.env.FB_PAGE_ID = "123";
  process.env.FB_PAGE_TOKEN = "tok";
  fakeFetch([{ status: 400, body: { error: { message: "token scaduto" } } }]);

  const r = await postReelToFacebook(VIDEO, "t");

  assert.equal(r.ok, false);
  assert.match(r.error ?? "", /token scaduto/);
  assert.equal(calls.length, 1);
});

test("postVideoToX manda l'asset video", async () => {
  process.env.BUFFER_API_KEY = "k";
  process.env.BUFFER_X_CHANNEL_ID = "c";
  fakeFetch([{ body: { data: { createPost: { post: { id: "b1" } } } } }]);

  const r = await postVideoToX("ciao", VIDEO);

  assert.deepEqual(r, { ok: true, postId: "b1" });
  assert.match(String(calls[0].init.body), /"assets":\[\{"video":\{"url":"https:\/\/example.com\/x.mp4"\}\}\]/);
});

test("sendMessageToOwner usa sendMessage e la chat privata", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "T";
  process.env.TELEGRAM_CHAT_ID = "42";
  fakeFetch([{ body: { ok: true } }]);

  const r = await sendMessageToOwner("resoconto");

  assert.equal(r.ok, true);
  assert.equal(calls[0].url, "https://api.telegram.org/botT/sendMessage");
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.chat_id, "42");
  assert.equal(body.text, "resoconto");
});

test("sendMessageToOwner tronca a 4000 caratteri con i puntini", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "T";
  process.env.TELEGRAM_CHAT_ID = "42";
  fakeFetch([{ body: { ok: true } }]);

  await sendMessageToOwner("x".repeat(6000));

  const { text } = JSON.parse(String(calls[0].init.body));
  assert.equal(text.length, 4000);
  assert.ok(text.endsWith("…"));
});

test("sendMessageToOwner non tocca un testo entro il limite", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "T";
  process.env.TELEGRAM_CHAT_ID = "42";
  fakeFetch([{ body: { ok: true } }]);

  await sendMessageToOwner("y".repeat(4000));

  assert.equal(JSON.parse(String(calls[0].init.body)).text, "y".repeat(4000));
});

test("senza env restituiscono ok false senza chiamare fetch", async () => {
  fakeFetch([{ body: {} }]);

  const results = [
    await postReelToFacebook(VIDEO, "t"),
    await postVideoToX("t", VIDEO),
    await sendMessageToOwner("t"),
  ];

  for (const r of results) assert.equal(r.ok, false);
  assert.equal(calls.length, 0);
});
