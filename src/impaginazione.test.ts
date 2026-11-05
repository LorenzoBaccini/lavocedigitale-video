import { test } from "node:test";
import assert from "node:assert/strict";

import { involucro, MARGINE, problemiImpaginazione, rapporto, ZONE } from "./impaginazione.ts";

const r = (nome: string, x: number, y: number, larghezza: number, altezza: number) => ({ nome, x, y, larghezza, altezza });

test("testi dentro i margini e fuori dalle zone: nessun problema", () => {
  assert.deepEqual(problemiImpaginazione([r("titolo", 140, 400, 800, 150), r("sottotitolo", 200, 1400, 680, 110)], ZONE), []);
});

test("un testo che esce dal margine laterale è un problema", () => {
  const problemi = problemiImpaginazione([r("conferma", 300, 1200, 760, 90), r("etichetta", MARGINE - 30, 400, 300, 40)], ZONE);
  assert.equal(problemi.length, 2);
  assert.match(problemi[0], /conferma.*margin/);
  assert.match(problemi[1], /etichetta.*margin/);
});

test("un testo della scena sulla zona del sottotitolo o sul logo è un problema", () => {
  const problemi = problemiImpaginazione([r("barrato", 140, 1300, 800, 100), r("titolo", 100, 300, 500, 100)], ZONE);
  assert.deepEqual(problemi.map((p) => p.split(":")[0]), ["barrato", "titolo"]);
  assert.match(problemi[0], /sottotitolo/);
  assert.match(problemi[1], /logo/);
});

test("il sottotitolo sta nella sua zona: se sale troppo è un problema", () => {
  assert.deepEqual(problemiImpaginazione([r("sottotitolo", 140, ZONE.sottotitolo.y + 10, 800, 140)], ZONE), []);
  assert.match(problemiImpaginazione([r("sottotitolo", 140, ZONE.sottotitolo.y - 80, 800, 220)], ZONE)[0], /sottotitolo.*zona/);
});

const g = (nome: string, x: number, y: number, larghezza: number, altezza: number, ingombro: "bordo" | "pieno") => ({ ...r(nome, x, y, larghezza, altezza), ingombro });

test("un testo a cavallo del bordo dello schermo 3D e' un problema; tutto fuori o tutto dentro no", () => {
  const schermo = g("schermo", 120, 560, 840, 520, "bordo");
  // il gancio del fascicolo: la seconda riga del titolo scende sul bordo alto dello schermo
  const problemi = problemiImpaginazione([r("titolo", 140, 400, 800, 200), schermo], ZONE);
  assert.equal(problemi.length, 1);
  assert.match(problemi[0], /titolo: a cavallo del bordo di schermo/);
  assert.deepEqual(problemiImpaginazione([r("titolo", 140, 400, 800, 150), schermo], ZONE), []);
  assert.deepEqual(problemiImpaginazione([r("titolo", 140, 600, 800, 150), schermo], ZONE), []);
});

test("sopra un ingombro pieno (la notifica) non sta nessun testo; il sottotitolo non conta", () => {
  const notifica = g("notifica", 100, 620, 880, 360, "pieno");
  assert.match(problemiImpaginazione([r("titolo", 140, 700, 800, 100), notifica], ZONE)[0], /titolo: sopra notifica/);
  assert.deepEqual(problemiImpaginazione([r("sottotitolo", 140, 900, 800, 100), notifica], ZONE).filter((p) => p.includes("notifica")), []);
});

test("un testo d'inchiostro puo' stare dentro una pagina chiara, ma non a cavallo del suo bordo", () => {
  const pagina = g("pagina", 0, 660, 1080, 960, "pieno");
  assert.deepEqual(problemiImpaginazione([{ ...r("conferma", 200, 1260, 600, 80), suChiaro: true }, pagina], ZONE), []);
  assert.match(problemiImpaginazione([{ ...r("conferma", 200, 620, 600, 80), suChiaro: true }, pagina], ZONE)[0], /conferma: sopra pagina/);
});

test("conta il poligono proiettato, non il rettangolo che lo contiene", () => {
  // trapezio inclinato: lo schermo visto di lato, bordo alto da (200,700) a (900,500)
  const poligono: [number, number][] = [[200, 700], [900, 500], [900, 1200], [200, 1100]];
  const schermo = { ...g("schermo", 200, 500, 700, 700, "bordo"), poligono };
  // nel triangolo vuoto in alto a sinistra: dentro il rettangolo, fuori dal trapezio
  assert.equal(rapporto(r("t", 220, 520, 200, 60), poligono), "fuori");
  assert.deepEqual(problemiImpaginazione([r("titolo", 220, 520, 200, 60), schermo], ZONE), []);
  // attraversa il bordo inclinato, pur stando tutto nel rettangolo
  assert.equal(rapporto(r("t", 500, 560, 300, 120), poligono), "a cavallo");
  assert.match(problemiImpaginazione([r("titolo", 500, 560, 300, 120), schermo], ZONE)[0], /a cavallo del bordo di schermo/);
  assert.equal(rapporto(r("t", 400, 800, 300, 100), poligono), "dentro");
});

test("l'involucro mette in giro gli angoli in qualunque ordine arrivino", () => {
  assert.equal(involucro([[0, 0], [10, 10], [10, 0], [0, 10]]).length, 4);
  assert.equal(rapporto(r("t", 20, 20, 40, 40), [[0, 0], [100, 100], [100, 0], [0, 100]]), "dentro");
});

test("un ingombro che esce dal fotogramma non e' un testo fuori dai margini", () => {
  assert.deepEqual(problemiImpaginazione([g("schermo", -200, 300, 1500, 900, "bordo")], ZONE), []);
});

test("un paio di pixel di tolleranza sui bordi dei glifi", () => {
  assert.deepEqual(problemiImpaginazione([r("titolo", MARGINE - 1, 400, 1080 - 2 * MARGINE + 2, 100)], ZONE), []);
});
