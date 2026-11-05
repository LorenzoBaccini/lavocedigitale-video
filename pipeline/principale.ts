import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Vero se il modulo e' quello lanciato da riga di comando. Confronta percorsi, non URL: con caratteri da
 * codificare nel percorso (spazi, `+`) il confronto fra URL e `file://${argv[1]}` falliva in silenzio.
 */
export const èPrincipale = (urlModulo: string, argv1: string | undefined = process.argv[1]): boolean =>
  argv1 !== undefined && fileURLToPath(urlModulo) === resolve(argv1);
