import { SANS } from "../../theme";
import type { Tinta } from "../Titolo";
import { INCHIOSTRO } from "./stile";

/** Il titolo su carta: inchiostro, niente ombra. */
export const SU_CARTA_TINTA: Tinta = { colore: INCHIOSTRO.testo, ombra: false };

// L'occhiello maiuscolo in testa al foglio, stampato in grigio caldo.
export const Occhiello: React.FC<{ testo: string; opacita: number; style?: React.CSSProperties }> = ({ testo, opacita, style }) => (
  <div data-impaginazione="etichetta" style={{ maxWidth: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 36, lineHeight: 1.2, letterSpacing: "0.08em", textTransform: "uppercase", color: INCHIOSTRO.tenue, opacity: opacita, ...style }}>
    {testo}
  </div>
);
