/** Limite di un post su X per gli account non-premium. */
export const X_POST_MAX = 280;

/** Ogni link, dopo l'accorciamento t.co, vale questo numero di caratteri per X. */
const T_CO_LENGTH = 23;

/** Lunghezza del post secondo le regole di X: ogni link conta 23 caratteri, qualunque sia la sua lunghezza. */
export function xPostLength(text: string): number {
  const urls = text.match(/https?:\/\/\S+/g) || [];
  return urls.reduce((len, url) => len - url.length + T_CO_LENGTH, text.length);
}

/**
 * I primi tre tag come hashtag, separati da spazio ("" se non ce ne sono). Un hashtag finisce dove
 * finiscono lettere, cifre e underscore (`#dvb-t2` diventerebbe `#dvb`): si toglie tutto il resto.
 */
export function socialHashtags(tags: string[] | undefined): string {
  return (tags || [])
    .slice(0, 3)
    .map((t) => `#${t.replace(/[^\p{L}\p{N}_]/gu, "")}`)
    .filter((h) => h.length > 1)
    .join(" ");
}
