import { useStile } from "../stili";
import { Fondale } from "./Fondale";
import { Notturno } from "./Notturno";
import type { PropsScrivania } from "./Scrivania";
import { Scrivania } from "./Scrivania";

/** Il set delle scene 3D scelto dallo stile: lo stile si legge qui, fuori dal canvas, e scende come prop. */
export const Set3D: React.FC<PropsScrivania> = (props) => {
  const stile = useStile();
  if (stile.set === "fondale") return <Fondale {...props} colore={stile.colori.superficie} />;
  if (stile.set === "notturno") return <Notturno {...props} fondo={stile.colori.fondo} />;
  return <Scrivania {...props} />;
};
