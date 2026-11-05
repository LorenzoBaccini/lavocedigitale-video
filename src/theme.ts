import { staticFile } from "remotion";

export const FPS = 30;

export const C = {
  paper: "#FAFAF7",
  amber: "#D97706",
};

export const fontsCss = `
@font-face { font-family: Inter; src: url(${staticFile("fonts/inter-latin.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Lora; src: url(${staticFile("fonts/lora-latin.woff2")}) format("woff2"); font-weight: 400 700; }
@font-face { font-family: Lora; src: url(${staticFile("fonts/lora-italic-latin.woff2")}) format("woff2"); font-weight: 400 700; font-style: italic; }
`;
export const SERIF = "Lora, Georgia, serif";
export const SANS = "Inter, system-ui, sans-serif";
