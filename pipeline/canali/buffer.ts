const BUFFER_API = "https://api.buffer.com/";

export interface BufferResult {
  ok: boolean;
  postId?: string;
  error?: string;
  /** il post e' uscito ma non come voluto (il thread col link) */
  avviso?: string;
}

const MUTAZIONE = `
  mutation PostToX($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    }
  }`;

/**
 * Posta su X passando da Buffer (piano Free: X non ha piu' un tier gratuito), con il video allegato.
 * Buffer vuole `assets: [{ video: { url } }]` e l'URL deve restare raggiungibile finche' X non l'ha
 * scaricato. `mode: shareNow` pubblica subito, fuori dalla coda. Con il `commento` esce un thread: il video nel primo
 * post, il link nella risposta (developers.buffer.com, esempio «create threaded post»). Se Buffer rifiuta il thread
 * esce il solo video col link nel testo, con un avviso.
 * Env: BUFFER_API_KEY (permessi account:read + posts:write) e BUFFER_X_CHANNEL_ID.
 */
export async function postVideoToX(text: string, videoUrl: string, commento?: string): Promise<BufferResult> {
  const key = process.env.BUFFER_API_KEY;
  const channelId = process.env.BUFFER_X_CHANNEL_ID;
  if (!key || !channelId) {
    return { ok: false, error: "BUFFER_API_KEY o BUFFER_X_CHANNEL_ID non impostati" };
  }
  const assets = [{ video: { url: videoUrl } }];
  const base = { text, channelId, schedulingType: "automatic", mode: "shareNow", assets };
  if (!commento) return crea(key, base);
  const thread = await crea(key, { ...base, metadata: { twitter: { thread: [{ text, assets }, { text: commento }] } } });
  if (thread.ok) return thread;
  const solo = await crea(key, { ...base, text: `${text}\n\n${commento}` });
  return solo.ok ? { ...solo, avviso: `thread non riuscito, link nel testo (${thread.error})` } : solo;
}

async function crea(key: string, input: Record<string, unknown>): Promise<BufferResult> {
  try {
    const res = await fetch(BUFFER_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: MUTAZIONE, variables: { input } }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: { createPost?: { post?: { id?: string }; message?: string } };
      errors?: Array<{ message: string }>;
    };
    if (!res.ok || body.errors?.length) {
      const msg = body.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
      return { ok: false, error: `Buffer: ${msg}` };
    }
    const result = body.data?.createPost;
    if (result?.message) return { ok: false, error: `Buffer: ${result.message}` };
    return { ok: true, postId: result?.post?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
