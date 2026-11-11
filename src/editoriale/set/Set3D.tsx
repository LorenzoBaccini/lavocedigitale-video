import { useDettagli } from "../DettagliVideo";
import { useStile } from "../stili";
import { Fondale } from "./Fondale";
import { Notturno } from "./Notturno";
import type { PropsScrivania } from "./Scrivania";
import { Scrivania } from "./Scrivania";

/** Il set delle scene 3D scelto dallo stile: lo stile si legge qui, fuori dal canvas, e scende come prop. */
export const Set3D: React.FC<PropsScrivania> = (props) => {
  const stile = useStile();
  const dettagli = useDettagli();
  // lo schermo ha le sue scene a tutto quadro (SCENE_SCHERMO): arrivare qui vorrebbe dire montare il 3D per sbaglio
  if (stile.set === "schermo") throw new Error("lo stile schermo non monta il set 3D");
  if (stile.set === "fondale") return <Fondale {...props} dettagli={dettagli} colore={stile.colori.superficie} />;
  if (stile.set === "notturno") return <Notturno {...props} dettagli={dettagli} fondo={stile.colori.fondo} />;
  return <Scrivania {...props} dettagli={dettagli} />;
};
