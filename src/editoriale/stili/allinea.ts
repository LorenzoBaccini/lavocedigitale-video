import type { Stile } from "./tipi";

/** `text-align` dei titoli e degli occhielli dello stile. */
export const allineaTesto = (s: Stile): "left" | "center" => (s.allineamentoTitoli === "sinistra" ? "left" : "center");

/** `align-items` / `justify-content` dei contenitori di titoli e occhielli dello stile. */
export const allineaFlesso = (s: Stile): "flex-start" | "center" => (s.allineamentoTitoli === "sinistra" ? "flex-start" : "center");
