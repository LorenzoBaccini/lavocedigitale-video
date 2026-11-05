import { test } from "node:test";
import assert from "node:assert/strict";

import type { Allineamento } from "./allineamento.ts";
import { frasiDaParole, paroleDaAllineamento, tagliFrasi } from "./allineamento.ts";

// Un carattere ogni 0,1 s; i segni dati in `lunghi` durano quanto indicato (la voce mette la pausa sulla punteggiatura).
function allinea(testo: string, lunghi: Record<number, number> = {}): Allineamento {
  const characters = [...testo];
  const inizi: number[] = [];
  const fini: number[] = [];
  let t = 0;
  characters.forEach((_, i) => {
    inizi.push(t);
    t = Math.round((t + (lunghi[i] ?? 0.1)) * 1000) / 1000;
    fini.push(t);
  });
  return { characters, character_start_times_seconds: inizi, character_end_times_seconds: fini };
}

test("le parole sono i tratti fra gli spazi, con la punteggiatura attaccata", () => {
  const parole = paroleDaAllineamento(allinea("Hai ancora?"));
  assert.deepEqual(parole.map((p) => p.testo), ["Hai", "ancora?"]);
  assert.equal(parole[0].inizio, 0);
  assert.equal(parole[0].fine, 0.3);
  assert.equal(parole[1].inizio, 0.4);
});

test("la fine della parola è l'ultima lettera: la pausa che la voce mette sul punto non conta", () => {
  // "dieci?" con il "?" lungo 0,6 s
  const parole = paroleDaAllineamento(allinea("dieci? Si", { 5: 0.6 }));
  assert.equal(parole[0].fine, 0.5);
  assert.equal(parole[1].inizio, 1.2);
});

test("spazi doppi, in testa e in coda non creano parole vuote", () => {
  const parole = paroleDaAllineamento(allinea("  Si  può "));
  assert.deepEqual(parole.map((p) => p.testo), ["Si", "può"]);
});

test("una parola di sola punteggiatura tiene i tempi dei suoi caratteri", () => {
  const parole = paroleDaAllineamento(allinea("a — b"));
  assert.deepEqual(parole[1], { testo: "—", inizio: 0.2, fine: 0.3 });
});

test("le parole vanno alle frasi in ordine, con il testo dello storyboard", () => {
  const parole = paroleDaAllineamento(allinea("hai ancora windows. si può"));
  const frasi = frasiDaParole(parole, ["Hai ancora Windows?", "Si può."]);
  assert.deepEqual(frasi.map((f) => f.map((p) => p.testo)), [["Hai", "ancora", "Windows?"], ["Si", "può."]]);
  assert.equal(frasi[1][0].inizio, parole[3].inizio);
});

test("se il numero di parole non torna l'errore lo dice", () => {
  const parole = paroleDaAllineamento(allinea("hai ancora"));
  assert.throws(() => frasiDaParole(parole, ["Hai ancora Windows?"]), /3 parole nel copione, 2 nell'allineamento/);
});

test("se una parola non corrisponde l'errore dice quale", () => {
  const parole = paroleDaAllineamento(allinea("hai ancora linux"));
  assert.throws(() => frasiDaParole(parole, ["Hai ancora Windows?"]), /parola 3.*«Windows\?».*«linux»/);
});

test("il taglio fra due frasi cade a metà della pausa", () => {
  const parole = paroleDaAllineamento(allinea("uno. due. tre", { 3: 0.5, 8: 0.9 }));
  const frasi = frasiDaParole(parole, ["Uno.", "Due.", "Tre."]);
  // "uno" finisce a 0,3, "due" parte a 0,9; "due" finisce a 1,2, "tre" parte a 2,2
  assert.deepEqual(tagliFrasi(frasi), [0.6, 1.7]);
});

test("con una sola frase non ci sono tagli", () => {
  const frasi = frasiDaParole(paroleDaAllineamento(allinea("ciao")), ["Ciao."]);
  assert.deepEqual(tagliFrasi(frasi), []);
});

test("«è» in NFD nella voce combacia con «è» in NFC del copione", () => {
  const nfd = "e\u0300";
  const parole = paroleDaAllineamento(allinea(`Chi ${nfd} qui`));
  const frasi = frasiDaParole(parole, ["Chi \u00e8 qui"]);
  assert.deepEqual(frasi[0].map((p) => p.testo), ["Chi", "\u00e8", "qui"]);
});
