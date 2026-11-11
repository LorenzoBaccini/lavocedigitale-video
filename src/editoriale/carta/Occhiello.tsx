import { allineaTesto, useStile } from "../stili";

// L'occhiello maiuscolo in testa al foglio, stampato nell'inchiostro tenue.
export const Occhiello: React.FC<{ testo: string; opacita: number; style?: React.CSSProperties }> = ({ testo, opacita, style }) => {
  const stile = useStile();
  return (
    <div data-impaginazione="etichetta" style={{ maxWidth: "100%", textAlign: allineaTesto(stile), fontFamily: stile.caratteri.testo, fontWeight: 600, fontSize: 36, lineHeight: 1.2, letterSpacing: "0.08em", textTransform: "uppercase", color: stile.colori.inchiostro.tenue, opacity: opacita, ...style }}>
      {testo}
    </div>
  );
};
