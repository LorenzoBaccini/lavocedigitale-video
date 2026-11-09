import { fase } from "../regia";
import { useStile } from "../stili";
import { CORPO_OCCHIELLO, RIGA_OCCHIELLO } from "./misureOcchiello";

/** L'occhiello delle scene sul set: maiuscolo chiaro, sopra il titolo. */
export const Occhiello: React.FC<{ f: number; testo: string }> = ({ f, testo }) => {
  const stile = useStile();
  return (
    <div data-impaginazione="etichetta" style={{ maxWidth: "100%", textAlign: stile.allineamentoTitoli === "sinistra" ? "left" : "center", fontFamily: stile.caratteri.testo, fontWeight: 600, fontSize: CORPO_OCCHIELLO, lineHeight: `${RIGA_OCCHIELLO}px`, letterSpacing: "0.08em", textTransform: "uppercase", color: stile.colori.tenue, textShadow: stile.ombra(12, 0.55), opacity: fase(f, 0, 6) }}>
      {testo}
    </div>
  );
};
