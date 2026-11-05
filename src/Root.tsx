import { Composition } from "remotion";

import storyboard from "../fixtures/windows10.storyboard.json";
import timing from "../fixtures/windows10.timing.json";
import { ALTEZZA, LARGHEZZA } from "./impaginazione";
import { costruisciLinea } from "./linea";
import type { PropsNotizia } from "./Notizia";
import { Notizia } from "./Notizia";
import { FPS } from "./theme";

const props = { storyboard, timing, audioBase: "audio/fixture" };

// Le props di default sono la fixture: lo studio parte senza argomenti, il render passa le sue con --props.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="notizia"
    component={Notizia}
    defaultProps={props as PropsNotizia}
    calculateMetadata={({ props }) => ({ durationInFrames: costruisciLinea(props.timing, FPS).totale })}
    durationInFrames={1}
    fps={FPS}
    width={LARGHEZZA}
    height={ALTEZZA}
  />
);
