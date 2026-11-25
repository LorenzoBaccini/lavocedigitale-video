import type { Storyboard } from "../src/storyboard/tipi.ts";
import { testoAschermo } from "../src/testoAschermo.ts";
import type { ArticoloVideo } from "./articolo.ts";
import { socialHashtags, X_POST_MAX, xPostLength } from "./canali/testo-x.ts";

/** Il post del video e il primo commento, che porta il link all'articolo. */
export interface PostVideo {
  testo: string;
  commento: string;
}

/**
 * Il testo del post del video: il gancio e la domanda finale in forma scritta («dieci» → «10») e gli hashtag. Il link
 * va nel primo commento: Meta consiglia descrizioni dei reel senza link. Diverso dal post dell'articolo uscito poco
 * prima: X scarta i testi duplicati. Se non sta nei 280 caratteri di X si tolgono gli hashtag, poi la domanda, poi si
 * accorcia il gancio.
 */
export function buildVideoPost(a: Pick<ArticoloVideo, "titolo" | "url" | "tags">, storyboard: Storyboard): PostVideo {
  const gancio = testoAschermo(storyboard.frasi[0]?.testo ?? a.titolo).trim();
  const ultima = storyboard.frasi.at(-1);
  const domanda = ultima && ultima.scena.tipo === "chiusura" && storyboard.frasi.length > 1 ? testoAschermo(ultima.testo).trim() : "";
  const commento = `${COMMENTO} ${a.url}`;
  const prove = [
    [gancio, domanda, socialHashtags(a.tags)],
    [gancio, domanda],
    [gancio],
  ].map((parti) => parti.filter(Boolean).join("\n\n"));
  const sta = prove.find((p) => xPostLength(p) <= X_POST_MAX);
  if (sta) return { testo: sta, commento };
  return { testo: `${Array.from(gancio).slice(0, X_POST_MAX - 1).join("").trimEnd()}…`, commento };
}

export const COMMENTO = "Tutti i dettagli e come difendersi:";
