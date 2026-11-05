const BUFFER_API = "https://api.buffer.com/";

export interface BufferResult {
  ok: boolean;
  postId?: string;
  error?: string;
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
 * scaricato. `mode: shareNow` pubblica subito, fuori dalla coda.
 * Env: BUFFER_API_KEY (permessi account:read + posts:write) e BUFFER_X_CHANNEL_ID.
 */
export async function postVideoToX(text: string, videoUrl: string): Promise<BufferResult> {
  const key = process.env.BUFFER_API_KEY;
  const channelId = process.env.BUFFER_X_CHANNEL_ID;
  if (!key || !channelId) {
    return { ok: false, error: "BUFFER_API_KEY o BUFFER_X_CHANNEL_ID non impostati" };
  }

  try {
    const res = await fetch(BUFFER_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: MUTAZIONE,
        variables: {
          input: { text, channelId, schedulingType: "automatic", mode: "shareNow", assets: [{ video: { url: videoUrl } }] },
        },
      }),
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
