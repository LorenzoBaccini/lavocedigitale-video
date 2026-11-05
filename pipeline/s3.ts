/**
 * Argomenti di `aws s3api list-objects-v2` che elencano le chiavi con il prefisso dato.
 * Si chiede l'elenco invece di leggere la chiave e guardare il 404: il ruolo del workflow ha
 * `s3:ListBucket` solo sui prefissi del video, e con quella condizione una chiave assente
 * puo' rispondere 403 invece di 404, indistinguibile da un permesso mancante.
 */
export const argomentiElenco = (bucket: string, chiave: string): string[] => [
  "s3api", "list-objects-v2", "--bucket", bucket, "--prefix", chiave, "--query", "Contents[].Key", "--output", "json",
];

/** Dall'output JSON di `argomentiElenco`: `true` se la chiave esatta c'e'. Un output che non e' un elenco lancia un errore. */
export function chiavePresente(out: string, chiave: string): boolean {
  const chiavi: unknown = JSON.parse(out.trim() || "null");
  if (chiavi === null) return false;
  if (!Array.isArray(chiavi)) throw new Error(`list-objects-v2: risposta inattesa ${out.trim().slice(0, 80)}`);
  return chiavi.includes(chiave);
}
