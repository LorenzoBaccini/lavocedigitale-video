import type { ScenaDi } from "../../scenes/props";
import type { Scena } from "../../storyboard/tipi";
import { AllarmeSchermo } from "./AllarmeSchermo";
import { DocumentiSchermo } from "./DocumentiSchermo";
import { GancioSchermo } from "./GancioSchermo";
import { OggettoSchermo } from "./OggettoSchermo";
import { RischioSchermo } from "./RischioSchermo";
import { TelefonoSchermo } from "./TelefonoSchermo";

/** Le scene che negli altri stili stanno sul set 3D, rese a tutto quadro in 2D per lo stile schermo; le altre restano quelle comuni. */
export const SCENE_SCHERMO: { [T in Scena["tipo"]]?: React.FC<ScenaDi<T>> } = {
  gancio: GancioSchermo,
  allarme: AllarmeSchermo,
  oggetto: OggettoSchermo,
  rischio: RischioSchermo,
  telefono: TelefonoSchermo,
  documenti: DocumentiSchermo,
};
