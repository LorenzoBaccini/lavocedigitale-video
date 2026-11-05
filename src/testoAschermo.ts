import { paroleInNumero, QUOTIDIANE } from "./storyboard/cifre.ts";

const INDIRIZZO_PARLATO = /(?<!\p{L})la\s+voce\s+digitale\s+punto\s+it\b/giu;
const GIGABYTE = new Set(["giga", "gigabyte"]);

const inCifre = (parola: string): string | null => {
  const minuscola = parola.toLowerCase();
  if (QUOTIDIANE.has(minuscola)) return null;
  const n = paroleInNumero(minuscola);
  return n === null ? null : String(n);
};

// Il testo della voce è scritto per essere letto (numeri in lettere, indirizzo sillabato): a schermo va la forma scritta.
export function testoAschermo(testo: string): string {
  let numeroPrima = false;
  return testo.replace(INDIRIZZO_PARLATO, "lavocedigitale.it").replace(/\p{L}+|\P{L}+/gu, (pezzo) => {
    if (!/\p{L}/u.test(pezzo)) {
      if (pezzo.trim()) numeroPrima = false;
      return pezzo;
    }
    if (numeroPrima && GIGABYTE.has(pezzo.toLowerCase())) {
      numeroPrima = false;
      return "GB";
    }
    const cifre = inCifre(pezzo);
    numeroPrima = cifre !== null;
    return cifre ?? pezzo;
  });
}
