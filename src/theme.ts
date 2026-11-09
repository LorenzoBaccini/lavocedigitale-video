import { staticFile } from "remotion";

export const FPS = 30;

export const fontsCss = `
@font-face { font-family: Inter; src: url(${staticFile("fonts/inter-latin.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Lora; src: url(${staticFile("fonts/lora-latin.woff2")}) format("woff2"); font-weight: 400 700; }
@font-face { font-family: Lora; src: url(${staticFile("fonts/lora-italic-latin.woff2")}) format("woff2"); font-weight: 400 700; font-style: italic; }
`;
// le famiglie dei caratteri: gli stili (src/editoriale/stili) scelgono quali usare
export const SERIF = "Lora, Georgia, serif";
export const SANS = "Inter, system-ui, sans-serif";
