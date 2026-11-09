import { TITOLO_TOP, MARGINE } from "../../impaginazione";
import { SPAZIO_OCCHIELLO } from "../set/misureOcchiello";
import { Occhiello } from "../set/Occhiello";
import { allineaFlesso, useStile } from "../stili";
import type { Riga } from "../Titolo";
import { Titolo } from "../Titolo";

/** Occhiello e titolo in alto, sopra lo schermo: come nelle scene del set. */
export const Testata: React.FC<{ f: number; etichetta: string; righe: Riga[] }> = ({ f, etichetta, righe }) => {
  const stile = useStile();
  return (
    <div style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE, display: "flex", flexDirection: "column", alignItems: allineaFlesso(stile), gap: SPAZIO_OCCHIELLO }}>
      <Occhiello f={f} testo={etichetta} />
      <Titolo nome="titolo" f={f} righe={righe} style={{ alignSelf: "stretch" }} />
    </div>
  );
};
