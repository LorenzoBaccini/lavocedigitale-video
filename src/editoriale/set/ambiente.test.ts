import { test } from "node:test";
import assert from "node:assert/strict";

import { dataOrologio, dispositivoDi, iconaNotifica, schermataDi } from "./ambiente.ts";

test("il dispositivo scritto nello storyboard vince sulla frase", () => {
  assert.equal(dispositivoDi({ dispositivo: "portatile" }, "Dall'app entri solo con lo SPID."), "portatile");
  assert.equal(dispositivoDi({ dispositivo: "smartphone" }, "Il sistema nasce senza difese."), "smartphone");
});

test("senza dispositivo: lo smartphone se la frase parla di app o telefono, altrimenti il portatile", () => {
  assert.equal(dispositivoDi({}, "Dall'app ER-Salute però entri solo con lo SPID."), "smartphone");
  assert.equal(dispositivoDi({}, "Con solo la CIE, l'app non ti fa entrare."), "smartphone");
  assert.equal(dispositivoDi({}, "Se ti chiama al telefono, riattacca."), "smartphone");
  assert.equal(dispositivoDi({}, "Si può, ma c'è un problema."), "portatile");
  assert.equal(dispositivoDi({}, "Il sistema appena installato nasce senza difese."), "portatile");
  // «applicazione», «approvato», «happy» non sono «app»
  assert.equal(dispositivoDi({}, "L'aggiornamento è approvato per ogni applicazione."), "portatile");
});

test("senza schermata: il sito se la frase lo nomina, l'app se nomina l'app, altrimenti il sistema", () => {
  assert.equal(schermataDi({}, "Entra dal sito con la CIE."), "sito");
  assert.equal(schermataDi({}, "Dal sette luglio c'è un portale nuovo."), "sito");
  assert.equal(schermataDi({}, "Nell'app tocca Notifiche."), "app");
  assert.equal(schermataDi({}, "Poi, da Windows Update, iscrivi il PC all'ESU."), "sistema");
  assert.equal(schermataDi({ schermata: "sistema" }, "Entra dal sito."), "sistema");
});

test("anche i plurali contano: siti, portali, telefoni, cellulari", () => {
  assert.equal(schermataDi({}, "Sui siti ufficiali trovi il modulo."), "sito");
  assert.equal(schermataDi({}, "I due portali restano attivi."), "sito");
  assert.equal(schermataDi({}, "Da una pagina web qualsiasi."), "sito");
  assert.equal(dispositivoDi({}, "Sui telefoni più vecchi non va."), "smartphone");
  assert.equal(dispositivoDi({}, "Con i cellulari Android."), "smartphone");
  assert.equal(dispositivoDi({}, "Le app bancarie chiedono il codice."), "smartphone");
});

test("lo scudo solo sugli avvisi di sicurezza, altrimenti l'icona neutra", () => {
  assert.equal(iconaNotifica("Avviso di sicurezza"), "scudo");
  assert.equal(iconaNotifica("Fascicolo sanitario"), "neutra");
  assert.equal(iconaNotifica("Notifica"), "neutra");
});

test("la data dell'orologio come sulla barra", () => {
  assert.equal(dataOrologio("2025-10-14"), "14/10/2025");
});
