import type { Ctx, Finestra, TipoFinestra } from "./disegni";
import { desktop, finestra, pagina } from "./disegni";

/** Cosa mostra lo schermo: il desktop, una finestra (impostazioni, pagina web, app) con titolo e pulsante, una pagina intera. */
export type Schermo =
  | { tipo: "desktop" }
  | ({ tipo: "finestra" } & Omit<Finestra, "tipo" | "orologio"> & { schermata: TipoFinestra })
  | { tipo: "pagina"; titolo: string; schermata: Exclude<TipoFinestra, "sistema"> };
/** La notifica: messaggio, intestazione, opacita' (0..1) e quanto manca ad arrivare (pixel dello schermo). */
export type Notifica = { messaggio: string; mittente?: string; azione?: string; visibile: number; scarto: number };

/** Il disegno dello schermo del portatile (`SCHERMO_PX`), lo stesso sul set 3D e a tutto quadro. */
export const disegnoSchermo = (s: Schermo, orologio?: string): ((ctx: Ctx) => void) => {
  if (s.tipo === "finestra") return finestra({ titolo: s.titolo, pulsante: s.pulsante, menu: s.menu, tipo: s.schermata, orologio });
  if (s.tipo === "pagina") return pagina(s.titolo, s.schermata, orologio);
  return desktop(orologio);
};
