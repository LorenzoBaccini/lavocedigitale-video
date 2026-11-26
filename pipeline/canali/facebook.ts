const GRAPH_API = "https://graph.facebook.com/v25.0";

export interface FacebookResult {
  ok: boolean;
  postId?: string;
  error?: string;
  /** il reel e' uscito ma qualcosa di contorno no (il commento col link) */
  avviso?: string;
}

async function graphPost(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`${GRAPH_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = body.error as { message?: string } | undefined;
    throw new Error(`Facebook ${path} ${res.status}: ${err?.message ?? JSON.stringify(body)}`);
  }
  return body;
}

/**
 * Pubblica un Reel sulla pagina in tre fasi: start (crea il video e restituisce l'id), upload
 * (Facebook scarica il file dal nostro URL https, che deve restare raggiungibile fino alla fine)
 * e finish (pubblica con la descrizione). Poi il `commento` col link sotto il reel: se non passa il link va in
 * fondo alla descrizione; il reel resta comunque e torna un avviso. Limite: 30 Reel via API ogni 24 ore.
 * Env: FB_PAGE_ID e FB_PAGE_TOKEN (token di pagina, scope `pages_manage_posts`; per il commento anche
 * `pages_manage_engagement`).
 */
export async function postReelToFacebook(videoUrl: string, description: string, commento?: string): Promise<FacebookResult> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) {
    return { ok: false, error: "FB_PAGE_ID o FB_PAGE_TOKEN non impostati" };
  }

  try {
    const start = await graphPost(`/${pageId}/video_reels`, { upload_phase: "start", access_token: token });
    const videoId = typeof start.video_id === "string" ? start.video_id : undefined;
    if (!videoId) throw new Error(`Facebook video_reels start: video_id mancante (${JSON.stringify(start)})`);

    const upload = await fetch(`https://rupload.facebook.com/video-upload/v25.0/${videoId}`, {
      method: "POST",
      headers: { Authorization: `OAuth ${token}`, file_url: videoUrl },
    });
    const uploadBody = (await upload.json().catch(() => ({}))) as Record<string, unknown>;
    if (!upload.ok || uploadBody.success === false) {
      throw new Error(`Facebook upload reel ${upload.status}: ${JSON.stringify(uploadBody)}`);
    }

    const r = await graphPost(`/${pageId}/video_reels`, {
      upload_phase: "finish",
      video_id: videoId,
      video_state: "PUBLISHED",
      description,
      access_token: token,
    });
    const postId = typeof r.post_id === "string" ? r.post_id : videoId;
    if (!commento) return { ok: true, postId };
    try {
      await graphPost(`/${videoId}/comments`, { message: commento, access_token: token });
      return { ok: true, postId };
    } catch (e) {
      const perche = e instanceof Error ? e.message : String(e);
      // senza `pages_manage_engagement` il commento non passa: il link va in fondo alla descrizione, che basta
      // `pages_manage_posts` (Motors Scam, 26 nov 2026: reel uscito senza link)
      try {
        await graphPost(`/${videoId}`, { description: `${description}\n\n${commento}`, access_token: token });
        return { ok: true, postId, avviso: `commento col link non pubblicato, link nella descrizione (${perche})` };
      } catch (e2) {
        return { ok: true, postId, avviso: `reel senza link: commento (${perche}) e descrizione (${e2 instanceof Error ? e2.message : String(e2)}) non riusciti` };
      }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
