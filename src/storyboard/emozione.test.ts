import { test } from "node:test";
import assert from "node:assert/strict";

import { erroriEmozione } from "./emozione.ts";
import type { Storyboard } from "./tipi.ts";

const ARTICOLO = "Dopo il 14 ottobre 2025, Windows 10 non riceverà più aggiornamenti software gratuiti, supporto tecnico o correzioni di sicurezza. Con l’ESU resta protetto.";

const copione = (emozione: unknown, toni: (string | undefined)[] = ["serio", "deciso"], testi = ["Windows dieci resta senza difese.", "Ecco come proteggerlo?"]): Storyboard =>
  ({
    slug: "x",
    emozione,
    frasi: testi.map((testo, i) => ({ testo, chiave: "x", tono: toni[i], scena: { tipo: "chiusura" } })),
  }) as unknown as Storyboard;

const FATTO = "Windows 10 non riceverà più aggiornamenti software gratuiti, supporto tecnico o correzioni di sicurezza";

test("un'emozione con il suo fatto citato alla lettera passa", () => {
  assert.deepEqual(erroriEmozione(copione({ tipo: "ansia", fatto: FATTO }), ARTICOLO), []);
});

test("il fatto si confronta senza badare a maiuscole, apostrofi tipografici, spazi e punteggiatura ai bordi", () => {
  assert.deepEqual(erroriEmozione(copione({ tipo: "utilità", fatto: "«con l'ESU   resta protetto.»" }, ["curioso"]), ARTICOLO), []);
});

test("un fatto che l'articolo non contiene viene scartato", () => {
  const errori = erroriEmozione(copione({ tipo: "ansia", fatto: "Windows 10 smetterà di funzionare del tutto" }), ARTICOLO);
  assert.deepEqual(errori, ["emozione.fatto: non è nell'articolo alla lettera; copia il passo che genera ansia, oppure scegli «utilità»"]);
});

test("l'emozione manca, ha un tipo sconosciuto o un fatto troppo corto", () => {
  assert.deepEqual(erroriEmozione(copione(undefined), ARTICOLO), ["emozione: oggetto { tipo, fatto } obbligatorio"]);
  assert.deepEqual(erroriEmozione(copione({ tipo: "rabbia", fatto: FATTO }), ARTICOLO), ["emozione.tipo: uno fra ansia, indignazione, stupore, utilità"]);
  assert.match(erroriEmozione(copione({ tipo: "ansia", fatto: "Windows 10" }), ARTICOLO)[0], /^emozione\.fatto: 10 caratteri/);
});

test("il gancio apre l'emozione con un tono coerente", () => {
  assert.deepEqual(erroriEmozione(copione({ tipo: "ansia", fatto: FATTO }, ["entusiasta"]), ARTICOLO), [
    "frasi[0].tono: «entusiasta» non apre ansia; usa uno fra deciso, serio, drammatico, sussurrato, sorpreso",
  ]);
});

test("non si ride di chi rischia e non si drammatizza un consiglio", () => {
  assert.deepEqual(erroriEmozione(copione({ tipo: "ansia", fatto: FATTO }, ["serio", "ridendo"]), ARTICOLO), ["frasi[1].tono: «ridendo» stona con ansia"]);
  assert.deepEqual(erroriEmozione(copione({ tipo: "utilità", fatto: FATTO }, ["curioso", "drammatico"]), ARTICOLO), ["frasi[1].tono: «drammatico» stona con utilità"]);
});

test("le esche passano solo se le usa l'articolo", () => {
  const testi = ["Una novità INCREDIBILE per Windows.", "Ecco cosa fare?"];
  const errori = erroriEmozione(copione({ tipo: "ansia", fatto: FATTO }, ["serio"], testi), ARTICOLO);
  assert.deepEqual(errori, ["frasi[0].testo: «incredibile» promette più del fatto e l'articolo non lo dice: racconta il fatto, l'emozione arriva da sé"]);
  assert.deepEqual(erroriEmozione(copione({ tipo: "ansia", fatto: FATTO }, ["serio"], testi), `${ARTICOLO} Un risultato incredibile.`), []);
});
