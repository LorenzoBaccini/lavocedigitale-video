const TELEGRAM_API = "https://api.telegram.org";
const LIMITE_TESTO = 4000; // Telegram rifiuta con 400 oltre i 4096 caratteri: meglio un resoconto tagliato che nessuno

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

/**
 * Messaggio di solo testo nella chat privata del proprietario: il resoconto della pipeline.
 * Env: TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID.
 */
export async function sendMessageToOwner(text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID non impostati" };
  }
  const testo = text.length > LIMITE_TESTO ? `${Array.from(text).slice(0, LIMITE_TESTO - 1).join("")}…` : text;
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: testo, disable_web_page_preview: true }),
    });
    if (!res.ok) return { ok: false, error: `Telegram sendMessage ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (e) {
    // Attenzione: l'errore di fetch non deve riportare l'URL, che contiene il token.
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
