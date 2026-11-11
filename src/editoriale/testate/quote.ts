import { ALTEZZA, FONDO_TITOLO, TITOLO_TOP } from "../../impaginazione";
import type { Stile } from "../stili";
import type { Riga } from "../Titolo";
import { larghezzaRiga } from "../Titolo";
import { altezzaRighe } from "../titoli";

/** Quanto e' alto un titolo di una riga logica (stima di `altezzaRighe`), contando a sinistra la riserva del colpo. */
export const altezzaTitolo = (testo: string, righe: Riga[], stile: Stile): number =>
  altezzaRighe([{ testo, size: righe[0].size }], larghezzaRiga(righe, stile.allineamentoTitoli), stile.larghezza);

/** Dove finisce un titolo appoggiato in alto; `sopra` e' quanto occupa l'occhiello, se c'e'. */
export const fineTitoloAlto = (testo: string, righe: Riga[], stile: Stile, sopra = 0): number => TITOLO_TOP + sopra + altezzaTitolo(testo, righe, stile);

/** Dove comincia un titolo appoggiato in basso, sopra i sottotitoli. */
export const inizioTitoloBasso = (testo: string, righe: Riga[], stile: Stile): number => ALTEZZA - FONDO_TITOLO - altezzaTitolo(testo, righe, stile);
