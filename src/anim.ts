import { spring } from "remotion";

import { FPS } from "./theme";

export const pop = (frame: number, delay = 0, damping = 12) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness: 180 } });

// Corpo del titolo che scala con la lunghezza, per restare dentro i 920 px utili; `larghezza` e' quella dello stile.
export const corpo = (testo: string, massimo: number, caratteriPieni: number, larghezza = 1) =>
  Math.round(Math.min(massimo, (massimo * caratteriPieni) / Math.max(testo.length, 1)) / larghezza);
