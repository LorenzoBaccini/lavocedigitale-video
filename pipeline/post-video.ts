import type { Storyboard } from "../src/storyboard/tipi.ts";
import { testoAschermo } from "../src/testoAschermo.ts";
import type { ArticoloVideo } from "./articolo.ts";
import { socialHashtags, X_POST_MAX, xPostLength } from "./canali/testo-x.ts";

/**
 * Il testo del post del video: il gancio e la domanda finale in forma scritta («dieci» → «10»), il link e gli hashtag.
 * Chi legge la descrizione trova un invito a commentare, non solo un link. Diverso dal post dell'articolo uscito poco
 * prima: X scarta i testi duplicati. Se non sta nei 280 caratteri di X si tolgono gli hashtag, poi la domanda, poi si
 * accorcia il gancio.
 */
export function buildVideoPost(a: Pick<ArticoloVideo, "titolo" | "url" | "tags">, storyboard: Storyboard): string {
  const gancio = testoAschermo(storyboard.frasi[0]?.testo ?? a.titolo).trim();
  const ultima = storyboard.frasi.at(-1);
  const domanda = ultima && ultima.scena.tipo === "chiusura" && storyboard.frasi.length > 1 ? testoAschermo(ultima.testo).trim() : "";
  const prove = [
    [gancio, domanda, a.url, socialHashtags(a.tags)],
    [gancio, domanda, a.url],
    [gancio, a.url],
  ].map((parti) => parti.filter(Boolean).join("\n\n"));
  const sta = prove.find((p) => xPostLength(p) <= X_POST_MAX);
  if (sta) return sta;
  const spazio = X_POST_MAX - xPostLength(`\n\n${a.url}`) - 1;
  return `${Array.from(gancio).slice(0, spazio).join("").trimEnd()}…\n\n${a.url}`;
}
