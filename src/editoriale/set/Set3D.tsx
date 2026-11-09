import { useStile } from "../stili";
import { Fondale } from "./Fondale";
import type { PropsScrivania } from "./Scrivania";
import { Scrivania } from "./Scrivania";

/** Il set delle scene 3D scelto dallo stile: lo stile si legge qui, fuori dal canvas, e scende come prop. */
export const Set3D: React.FC<PropsScrivania> = (props) => {
  const stile = useStile();
  return stile.set === "fondale" ? <Fondale {...props} colore={stile.colori.superficie} /> : <Scrivania {...props} />;
};
