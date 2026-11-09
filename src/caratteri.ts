/** Un file di carattere in `public/fonts`. `pesi` e' l'intervallo del file variabile, come in `font-weight`. */
export interface Faccia {
  famiglia: string;
  file: string;
  pesi: string;
  corsivo?: boolean;
}

// L'unico elenco dei caratteri: lo usano il render (@font-face in theme.ts) e il controllo d'impaginazione (precaricamento).
export const FACCE: Faccia[] = [
  { famiglia: "Inter", file: "inter-latin.woff2", pesi: "100 900" },
  { famiglia: "Lora", file: "lora-latin.woff2", pesi: "400 700" },
  { famiglia: "Lora", file: "lora-italic-latin.woff2", pesi: "400 700", corsivo: true },
  { famiglia: "Space Grotesk", file: "space-grotesk-latin.woff2", pesi: "300 700" },
];

/** La famiglia come la vuole il CSS: fra virgolette se ha spazi. */
export const nomeCss = (famiglia: string): string => (famiglia.includes(" ") ? `"${famiglia}"` : famiglia);

/** Il descrittore per `document.fonts.load` che fa caricare quella faccia. */
export const caricaFaccia = (f: Faccia): string => `${f.corsivo ? "italic " : ""}${f.pesi.split(" ").at(-1)} 100px ${nomeCss(f.famiglia)}`;
