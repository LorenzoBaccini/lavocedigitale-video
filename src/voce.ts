import { createContext } from "react";

// Livello della voce al frame globale (0..1): le scene sono dentro una Sequence e vedono solo il frame locale.
export const LivelloVoce = createContext(0);
