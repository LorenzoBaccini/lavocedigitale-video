import type { Storyboard } from "../src/storyboard/tipi.ts";
import { testoAschermo } from "../src/testoAschermo.ts";
import type { ArticoloVideo } from "./articolo.ts";
import { socialHashtags, X_POST_MAX, xPostLength } from "./canali/testo-x.ts";

/**
 * Il testo del post del video: la domanda del gancio (in forma scritta, «dieci» → «10»), il link e gli hashtag.
 * Diverso dal post dell'articolo uscito poco prima: X scarta i testi duplicati.
 * Se non sta nei 280 caratteri di X si tolgono gli hashtag, poi si accorcia la domanda.
 */
export function buildVideoPost(a: Pick<ArticoloVideo, "titolo" | "url" | "tags">, storyboard: Storyboard): string {
  const domanda = testoAschermo(storyboard.frasi[0]?.testo ?? a.titolo).trim();
  const hashtags = socialHashtags(a.tags);
  const conTag = [domanda, a.url, hashtags].filter(Boolean).join("\n\n");
  if (xPostLength(conTag) <= X_POST_MAX) return conTag;
  const senzaTag = `${domanda}\n\n${a.url}`;
  if (xPostLength(senzaTag) <= X_POST_MAX) return senzaTag;
  const spazio = X_POST_MAX - xPostLength(`\n\n${a.url}`) - 1;
  return `${Array.from(domanda).slice(0, spazio).join("").trimEnd()}…\n\n${a.url}`;
}
