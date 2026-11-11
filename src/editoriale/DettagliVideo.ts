import { createContext, useContext } from "react";

import type { Dettagli } from "./dettagli";
import { DETTAGLI_BASE } from "./dettagli";

// Il contesto non attraversa il ThreeCanvas: va letto fuori dalla scena 3D e passato come prop.
export const DettagliVideo = createContext<Dettagli>(DETTAGLI_BASE);

export const useDettagli = (): Dettagli => useContext(DettagliVideo);
