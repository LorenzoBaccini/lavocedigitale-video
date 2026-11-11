import { createContext, useContext } from "react";

import { SCRIVANIA } from "./scrivania";
import type { Stile } from "./tipi";

// Il contesto non attraversa il ThreeCanvas: va letto fuori dalla scena 3D e passato come prop.
export const StileVideo = createContext<Stile>(SCRIVANIA);

export const useStile = (): Stile => useContext(StileVideo);
