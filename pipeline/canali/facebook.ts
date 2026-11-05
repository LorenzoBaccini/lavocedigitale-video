const GRAPH_API = "https://graph.facebook.com/v25.0";

export interface FacebookResult {
  ok: boolean;
  postId?: string;
  error?: string;
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
 * e finish (pubblica con la descrizione). Limite: 30 Reel via API ogni 24 ore.
 * Env: FB_PAGE_ID e FB_PAGE_TOKEN (token di pagina, scope `pages_manage_posts`).
 */
export async function postReelToFacebook(videoUrl: string, description: string): Promise<FacebookResult> {
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
    return { ok: true, postId: typeof r.post_id === "string" ? r.post_id : videoId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
