/** FNV-1a a 32 bit: lo stesso slug da' sempre la stessa scelta. */
export function impronta(testo: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < testo.length; i++) h = Math.imul(h ^ testo.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}
