import { SANS } from "../../theme";
import { fase } from "../regia";
import { CORPO_OCCHIELLO, RIGA_OCCHIELLO } from "./misureOcchiello";

/** L'occhiello delle scene sul set: Inter maiuscolo chiaro, sopra il titolo. */
export const Occhiello: React.FC<{ f: number; testo: string }> = ({ f, testo }) => (
  <div data-impaginazione="etichetta" style={{ maxWidth: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: CORPO_OCCHIELLO, lineHeight: `${RIGA_OCCHIELLO}px`, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E7E1D5", textShadow: "0 2px 12px rgba(0,0,0,0.55)", opacity: fase(f, 0, 6) }}>
    {testo}
  </div>
);
