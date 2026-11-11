import { useLayoutEffect } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";

import { caricaFaccia, FACCE } from "./caratteri";
import type { Misura } from "./impaginazione";
import { PREFISSO_MISURA } from "./impaginazione";

const FONT = FACCE.map(caricaFaccia);

const opacita = (el: Element | null) => {
  let o = 1;
  for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
  return o;
};

// Rettangolo dei glifi visibili di ogni nodo marcato: un testo che sborda dal contenitore si vede, uno ancora trasparente no.
function misura(): Misura[] {
  return [...document.querySelectorAll("[data-impaginazione]")].flatMap((el) => {
    const rettangoli: DOMRect[] = [];
    const camminatore = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = camminatore.nextNode(); n; n = camminatore.nextNode()) {
      if (!n.textContent?.trim() || opacita(n.parentElement) < 0.1) continue;
      const intervallo = document.createRange();
      intervallo.selectNodeContents(n);
      rettangoli.push(...[...intervallo.getClientRects()].filter((r) => r.width > 0));
    }
    if (!rettangoli.length) return [];
    const x = Math.min(...rettangoli.map((r) => r.left));
    const y = Math.min(...rettangoli.map((r) => r.top));
    const destra = Math.max(...rettangoli.map((r) => r.right));
    const basso = Math.max(...rettangoli.map((r) => r.bottom));
    return [{ nome: el.getAttribute("data-impaginazione")!, x, y, larghezza: destra - x, altezza: basso - y, ...(el.hasAttribute("data-su-chiaro") ? { suChiaro: true } : {}) }];
  });
}

// Lo schermo o l'oggetto 3D principale, proiettato dalla scena (`Ingombro`): solo la parte dentro il fotogramma.
function ingombri(): Misura[] {
  return [...document.querySelectorAll<HTMLElement>("[data-ingombro]")].flatMap((el) => {
    const r = el.getBoundingClientRect();
    const x = Math.max(0, r.left), y = Math.max(0, r.top);
    const destra = Math.min(window.innerWidth, r.right), basso = Math.min(window.innerHeight, r.bottom);
    if (destra <= x || basso <= y) return [];
    const poligono = el.dataset.angoli ? (JSON.parse(el.dataset.angoli) as [number, number][]) : undefined;
    return [{ nome: el.dataset.ingombro!, x, y, larghezza: destra - x, altezza: basso - y, ingombro: el.dataset.pieno ? "pieno" : "bordo", poligono }];
  });
}

// Solo per il controllo d'impaginazione: scrive in console i rettangoli del fotogramma, dopo il caricamento dei font.
export const MisuraImpaginazione: React.FC = () => {
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const attesa = delayRender("misura impaginazione");
    // i @font-face caricano solo quando servono: `fonts.ready` da solo può essere già risolto con le metriche di ripiego
    Promise.all(FONT.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => console.log(PREFISSO_MISURA + JSON.stringify({ frame, misure: [...misura(), ...ingombri()] })))
      .finally(() => continueRender(attesa));
  }, [frame]);
  return null;
};
