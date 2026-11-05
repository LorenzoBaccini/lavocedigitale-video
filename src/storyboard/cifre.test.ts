import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { cifreMancanti, numeriDaTesto, paroleInNumero } from "./cifre.ts";
import type { Storyboard } from "./tipi.ts";

const leggi = (nome: string): string => readFileSync(new URL(`../../fixtures/${nome}`, import.meta.url), "utf8");
const storyboard = (): Storyboard => JSON.parse(leggi("windows10.storyboard.json"));
const articolo = (): string => leggi("windows10.articolo.txt");

test("paroleInNumero legge i numeri in lettere", () => {
  const attesi: [string, number | null][] = [
    ["otto", 8],
    ["quattordici", 14],
    ["ventuno", 21],
    ["ventotto", 28],
    ["duemilaventicinque", 2025],
    ["millenovecentonovantanove", 1999],
    ["cento", 100],
    ["trecentoquaranta", 340],
    ["giga", null],
    ["gigabyte", null],
  ];
  for (const [parola, numero] of attesi) assert.equal(paroleInNumero(parola), numero, parola);
});

test("numeriDaTesto trova cifre e numeri in lettere", () => {
  const numeri = numeriDaTesto("dal quattordici ottobre duemilaventicinque, chiavetta da 8 GB");
  for (const n of [14, 2025, 8]) assert.ok(numeri.includes(n), String(n));
});

test("numeriDaTesto legge migliaia e decimali", () => {
  const numeri = numeriDaTesto("costa 1.299 euro, o 8,5 al mese");
  assert.ok(numeri.includes(1299));
  assert.ok(numeri.includes(8.5));
});

test("cifreMancanti è vuoto per Windows 10 contro l'articolo vero", () => {
  assert.deepEqual(cifreMancanti(storyboard(), articolo()), []);
});

test("cifreMancanti segnala un anno che l'articolo non ha", () => {
  const sb = storyboard();
  const scena = sb.frasi[2].scena;
  assert.equal(scena.tipo, "data");
  if (scena.tipo === "data") scena.data = "2026-10-14";
  const mancanti = cifreMancanti(sb, articolo());
  assert.equal(mancanti.length, 1);
  assert.ok(mancanti[0].includes("2026"));
});

test("cifreMancanti accetta «otto gigabyte» quando l'articolo dice 8 GB", () => {
  const sb: Storyboard = {
    slug: "x",
    frasi: [{ testo: "Serve una chiavetta da otto gigabyte.", scena: { tipo: "chiusura" } }],
  };
  assert.deepEqual(cifreMancanti(sb, "Serve una chiavetta da 8 GB."), []);
});

test("cifreMancanti segnala un mese che l'articolo non ha", () => {
  const sb: Storyboard = {
    slug: "x",
    frasi: [{ testo: "Succede presto.", scena: { tipo: "data", etichetta: "Presto", data: "2025-11-14" } }],
  };
  const mancanti = cifreMancanti(sb, "Il 14 del 2025 è ottobre.");
  assert.equal(mancanti.length, 1);
  assert.ok(mancanti[0].includes("novembre"));
});

test("paroleInNumero gestisce centotto e simili", () => {
  const attesi: [string, number][] = [
    ["centotto", 108], ["centottanta", 180], ["centottantotto", 188], ["centouno", 101],
    ["ventuno", 21], ["seicento", 600], ["trentasei", 36],
  ];
  for (const [parola, numero] of attesi) assert.equal(paroleInNumero(parola), numero, parola);
});

test("numeriDaTesto legge date puntate e migliaia con decimali", () => {
  const data = numeriDaTesto("il 14.10.2025");
  for (const n of [14, 10, 2025]) assert.ok(data.includes(n), String(n));
  assert.ok(numeriDaTesto("1.299,50 euro").includes(1299.5));
  assert.ok(numeriDaTesto("il 14/10/2025").includes(2025));
});

test("numeriDaTesto ignora uno, una, zero e sei da soli", () => {
  assert.deepEqual(numeriDaTesto("se sei in dubbio, c'è uno strumento, una scelta, zero rischi"), []);
});

test("cifreMancanti non chiede 1 né 6 per parole di tutti i giorni", () => {
  const sb: Storyboard = {
    slug: "x",
    frasi: [{ testo: "Se sei in dubbio, c'è uno strumento.", scena: { tipo: "chiusura" } }],
  };
  assert.deepEqual(cifreMancanti(sb, "Nessun numero qui."), []);
});

test("cifreMancanti accetta la data puntata al posto del mese in lettere", () => {
  const testo = articolo().replace("14 ottobre 2025", "14.10.2025").replaceAll("ottobre", "");
  assert.deepEqual(cifreMancanti(storyboard(), testo), []);
});

test("cifreMancanti non confonde maggio con maggiore", () => {
  const sb: Storyboard = {
    slug: "x",
    frasi: [{ testo: "Succede.", scena: { tipo: "data", etichetta: "Presto", data: "2025-05-14" } }],
  };
  const mancanti = cifreMancanti(sb, "Il 14 del 2025 il rischio è maggiore.");
  assert.equal(mancanti.length, 1);
  assert.ok(mancanti[0].includes("maggio"));
});

const unaFrase = (testo: string, scena: Storyboard["frasi"][number]["scena"] = { tipo: "chiusura" }): Storyboard => ({
  slug: "x",
  frasi: [{ testo, chiave: "x", scena }],
});

test("«due» nell'articolo copre il 2 dello storyboard, e viceversa", () => {
  assert.deepEqual(cifreMancanti(unaFrase("Hai 2 modi per entrare?"), "Si entra in due modi: SPID o CIE."), []);
  assert.deepEqual(cifreMancanti(unaFrase("Hai due modi per entrare?"), "Ci sono 2 modi: SPID o CIE."), []);
});

test("un due che l'articolo non dice resta un errore, in cifre o in lettere", () => {
  const articolo = "Si entra con SPID o con CIE. Il portale nuovo affianca quello vecchio.";
  assert.deepEqual(cifreMancanti(unaFrase("Due portali, quale usi?"), articolo), ["frase 1: 2 non è nell'articolo"]);
  assert.deepEqual(cifreMancanti(unaFrase("Ci sono 2 portali?"), articolo), ["frase 1: 2 non è nell'articolo"]);
});

test("una sigla va bene se l'articolo la scrive o ne ha il numero", () => {
  assert.deepEqual(cifreMancanti(unaFrase("Attiva la 2FA adesso", { tipo: "teaser", testo: "La 2FA ti salva" }), "Attiva la 2FA dal profilo."), []);
  assert.deepEqual(cifreMancanti(unaFrase("Attiva la 2FA adesso"), "Attiva l'autenticazione a due fattori."), []);
  assert.deepEqual(cifreMancanti(unaFrase("Serve il 5G?"), "La rete 5G copre la città."), []);
  assert.deepEqual(cifreMancanti(unaFrase("Ti serve una chiavetta da 8GB."), "Serve una chiavetta da 8 GB."), []);
});

test("una sigla con un numero che l'articolo non ha e' un errore", () => {
  assert.deepEqual(cifreMancanti(unaFrase("Serve il 6G?"), "La rete 5G copre la città."), ["frase 1: 6G non è nell'articolo"]);
  assert.deepEqual(cifreMancanti(unaFrase("Ti serve una chiavetta da 16GB."), "Serve una chiavetta da 8 GB."), ["frase 1: 16GB non è nell'articolo"]);
});

test("versioni dopo uno spazio contano come numeri: Wi-Fi 6 vuole il 6 nell'articolo", () => {
  assert.deepEqual(cifreMancanti(unaFrase("Il router ha il Wi-Fi 6?"), "Il router supporta il Wi-Fi 6."), []);
  assert.deepEqual(cifreMancanti(unaFrase("Il router ha il Wi-Fi 7?"), "Il router supporta il Wi-Fi 6."), ["frase 1: 7 non è nell'articolo"]);
});

test("gli ordinali in lettere dell'articolo coprono la cifra; «secondo» nello storyboard non chiede un 2", () => {
  assert.deepEqual(cifreMancanti(unaFrase("È il 2° accesso?"), "Al secondo accesso serve il PIN."), []);
  assert.deepEqual(cifreMancanti(unaFrase("La 3ª rata arriva a maggio."), "La terza rata arriva a maggio."), []);
  assert.deepEqual(cifreMancanti(unaFrase("Secondo l'INPS non cambia nulla."), "L'INPS dice che non cambia nulla."), []);
});
