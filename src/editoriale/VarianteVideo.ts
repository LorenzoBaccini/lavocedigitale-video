import { createContext, useContext } from "react";

import type { Variante } from "./variante";
import { VARIANTE_BASE } from "./variante";

// Il contesto non attraversa il ThreeCanvas: va letto fuori dalla scena 3D e passato come prop.
export const VarianteVideo = createContext<Variante>(VARIANTE_BASE);

export const useVariante = (): Variante => useContext(VarianteVideo);
