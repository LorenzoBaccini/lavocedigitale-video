import { LARGHEZZA } from "../../impaginazione";
import { Ingombro } from "../set/Ingombro";
import { useStile } from "../stili";
import { coloriDiviso } from "./diviso";

/**
 * Il blocco di colore del gancio diviso, dall'alto fino a `basso`. Per il controllo d'impaginazione e' un ingombro a bordo:
 * il titolo ci deve stare dentro intero, mai a cavallo del bordo mentre sale.
 */
export const Blocco: React.FC<{ basso: number; pieno: number }> = ({ basso, pieno }) => {
  const { fondo } = coloriDiviso(useStile());
  if (pieno <= 0) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGHEZZA, height: basso, background: fondo, opacity: pieno }} />
      <Ingombro nome="blocco" angoli={[{ x: 0, y: 0 }, { x: LARGHEZZA, y: 0 }, { x: LARGHEZZA, y: basso }, { x: 0, y: basso }]} />
    </>
  );
};
