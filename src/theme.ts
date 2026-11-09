import { staticFile } from "remotion";

import { FACCE } from "./caratteri.ts";

export const FPS = 30;

export const fontsCss = FACCE.map(
  (f) => `@font-face { font-family: ${f.famiglia}; src: url(${staticFile(`fonts/${f.file}`)}) format("woff2"); font-weight: ${f.pesi};${f.corsivo ? " font-style: italic;" : ""} }`,
).join("\n");

// le famiglie dei caratteri: gli stili (src/editoriale/stili) scelgono quali usare
export const SERIF = "Lora, Georgia, serif";
export const SANS = "Inter, system-ui, sans-serif";
