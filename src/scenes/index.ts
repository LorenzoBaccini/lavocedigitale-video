import type { Scena } from "../storyboard/tipi";
import { Allarme } from "./Allarme";
import { Checklist } from "./Checklist";
import { Chiusura } from "./Chiusura";
import { Citazione } from "./Citazione";
import { Confronto } from "./Confronto";
import { Data } from "./Data";
import { Gancio } from "./Gancio";
import { Numero } from "./Numero";
import { Oggetto } from "./Oggetto";
import type { ScenaDi } from "./props";
import { Rischio } from "./Rischio";
import { Simbolo } from "./Simbolo";
import { Teaser } from "./Teaser";
import { Telefono } from "./Telefono";
import { Documenti } from "./Documenti";

export type { PropsScena, ScenaDi } from "./props";
export { Tipografica } from "./Tipografica";

// Gli schemi assenti ripiegano sulla scena tipografica (oggi li copre tutti; resta come rete).
export const SCENE: { [T in Scena["tipo"]]?: React.FC<ScenaDi<T>> } = {
  gancio: Gancio,
  allarme: Allarme,
  oggetto: Oggetto,
  data: Data,
  checklist: Checklist,
  rischio: Rischio,
  telefono: Telefono,
  documenti: Documenti,
  teaser: Teaser,
  numero: Numero,
  confronto: Confronto,
  citazione: Citazione,
  simbolo: Simbolo,
  chiusura: Chiusura,
};
