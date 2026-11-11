/** FNV-1a a 32 bit: lo stesso slug da' sempre la stessa scelta. */
export function impronta(testo: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < testo.length; i++) h = Math.imul(h ^ testo.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

// FNV-1a mescola poco i bit bassi: senza il rimescolamento finale (murmur3) `% n` di chiavi diverse andrebbe di pari passo.
/** L'impronta da usare per scegliere con `% n`: FNV-1a seguito dal finalizzatore di murmur3. */
export function improntaMescolata(testo: string): number {
  let h = impronta(testo);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
