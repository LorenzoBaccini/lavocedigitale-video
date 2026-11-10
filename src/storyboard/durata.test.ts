import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ATTIVI, DURATE } from "../editoriale/variante.ts";
import type { NomeDurata } from "../editoriale/variante.ts";
import type { Frase, Storyboard } from "./tipi.ts";
import { LIMITI_DURATA, TESTO_CHIUSURA } from "./tipi.ts";
import { erroriVarieta, somiglianza, validaStoryboard } from "./valida.ts";

const fixture = (nome: string): Storyboard => JSON.parse(readFileSync(new URL(`../../fixtures/${nome}.storyboard.json`, import.meta.url), "utf8"));
const AGENTE = readFileSync(new URL("../../agent-video.md", import.meta.url), "utf8");
const paroleDi = (sb: Storyboard): number => sb.frasi.reduce((t, f) => t + f.testo.trim().split(/\s+/).length, 0);
const PAROLE_CHIUSURA = TESTO_CHIUSURA.split(/\s+/).length;

/** Un copione di `frasi` frasi e `parole` parole in tutto, chiusura compresa, con scene alternate. */
function copione(frasi: number, parole: number): Storyboard {
  const contenuto = frasi - 1;
  const restanti = parole - PAROLE_CHIUSURA;
  const scene: Frase["scena"][] = [{ tipo: "teaser", testo: "Ancora" }, { tipo: "citazione", testo: "Una frase", fonte: "Fonte" }];
  return {
    slug: "copione",
    frasi: [
      ...Array.from({ length: contenuto }, (_, i) => {
        const n = Math.floor(restanti / contenuto) + (i < restanti % contenuto ? 1 : 0);
        return { testo: Array(n).fill("parola").join(" "), chiave: "parola", scena: scene[i % 2] };
      }),
      { testo: TESTO_CHIUSURA, chiave: "il link", scena: { tipo: "chiusura" } },
    ],
  };
}

const errori = (sb: Storyboard, durata: NomeDurata): string[] => {
  const esito = validaStoryboard(sb, durata);
  return esito.ok ? [] : esito.errori;
};

test("i limiti per durata sono quelli della spec; media e' quella di prima col tetto a 72 parole", () => {
  assert.deepEqual(LIMITI_DURATA, {
    corta: { frasi: { min: 4, max: 5 }, parole: { min: 32, max: 46 }, secondi: { min: 15, max: 21 } },
    media: { frasi: { min: 6, max: 8 }, parole: { min: 50, max: 72 }, secondi: { min: 23, max: 32 } },
    lunga: { frasi: { min: 8, max: 9 }, parole: { min: 72, max: 88 }, secondi: { min: 32, max: 40 } },
  });
  assert.deepEqual(Object.keys(LIMITI_DURATA), [...DURATE]);
  assert.deepEqual(ATTIVI.durata, ["corta", "media", "lunga"]);
});

for (const durata of DURATE) {
  const { frasi, parole } = LIMITI_DURATA[durata];

  test(`${durata}: accetta frasi e parole ai due estremi`, () => {
    for (const [f, p] of [[frasi.min, parole.min], [frasi.max, parole.max], [frasi.min, parole.max], [frasi.max, parole.min]]) {
      assert.deepEqual(errori(copione(f, p), durata), [], `${f} frasi, ${p} parole`);
    }
  });

  test(`${durata}: rifiuta una frase in meno o in piu'`, () => {
    for (const f of [frasi.min - 1, frasi.max + 1]) {
      const p = Math.min(Math.max(parole.min, f * 3), parole.max);
      const e = errori(copione(f, p), durata);
      assert.deepEqual(e, [`frasi: ${f} frasi, la durata ${durata} ne vuole da ${frasi.min} a ${frasi.max}`], `${f} frasi`);
    }
  });

  test(`${durata}: rifiuta una parola in meno o in piu'`, () => {
    for (const p of [parole.min - 1, parole.max + 1]) {
      const e = errori(copione(frasi.min, p), durata);
      assert.deepEqual(e, [`copione: ${p} parole, la durata ${durata} ne vuole da ${parole.min} a ${parole.max}`], `${p} parole`);
    }
  });
}

test("le durate si sovrappongono solo al confine: 8 frasi e 72 parole sono media e lunga, mai corta", () => {
  const sb = copione(8, 72);
  assert.deepEqual(errori(sb, "media"), []);
  assert.deepEqual(errori(sb, "lunga"), []);
  assert.equal(errori(sb, "corta").length, 2);
});

test("le fixture della durata stanno al limite e passano solo nella loro", () => {
  const corta = fixture("durata-corta");
  assert.deepEqual([corta.frasi.length, paroleDi(corta)], [4, 32]);
  assert.deepEqual(errori(corta, "corta"), []);
  assert.deepEqual(erroriVarieta(corta, []), []);
  assert.notDeepEqual(errori(corta, "media"), []);

  const lunga = fixture("durata-lunga");
  assert.deepEqual([lunga.frasi.length, paroleDi(lunga)], [9, 88]);
  assert.deepEqual(errori(lunga, "lunga"), []);
  assert.deepEqual(erroriVarieta(lunga, []), []);
  assert.notDeepEqual(errori(lunga, "media"), []);
});

test("chiusura-corta (4 frasi, 37 parole) passa con durata corta, non con media", () => {
  const sb = fixture("chiusura-corta");
  assert.deepEqual([sb.frasi.length, paroleDi(sb)], [4, 37]);
  assert.deepEqual(errori(sb, "corta"), []);
  assert.ok(errori(sb, "media").some((e) => e.startsWith("frasi: 4 frasi")));
});

test("windows10 (8 frasi, 77 parole) e' un copione lungo", () => {
  const sb = fixture("windows10");
  assert.deepEqual([sb.frasi.length, paroleDi(sb)], [8, 77]);
  assert.deepEqual(errori(sb, "lunga"), []);
  assert.ok(errori(sb, "media").some((e) => e.startsWith("copione: 77 parole")));
});

test("la tabella delle durate in agent-video.md e' quella di LIMITI_DURATA", () => {
  for (const d of DURATE) {
    const { frasi, parole, secondi } = LIMITI_DURATA[d];
    assert.ok(AGENTE.includes(`| ${d} | ${frasi.min}-${frasi.max} | ${parole.min}-${parole.max} | ${secondi.min}-${secondi.max} |`), d);
  }
  assert.ok(!/\d+ a \d+ parole/.test(AGENTE), "nessun altro limite di parole scritto a mano");
});

test("ogni esempio di agent-video.md passa la validazione nella durata che dichiara", () => {
  const esempi = [...AGENTE.matchAll(/durata (corta|media|lunga)[^\n]*\n\n```json\n([\s\S]*?)```/gi)];
  assert.equal(esempi.length, 3);
  assert.deepEqual(esempi.map((m) => m[1].toLowerCase()).sort(), ["corta", "lunga", "media"]);
  for (const [, durata, json] of esempi) {
    const sb = JSON.parse(json) as Storyboard;
    assert.deepEqual(errori(sb, durata.toLowerCase() as NomeDurata), [], durata);
    assert.deepEqual(erroriVarieta(sb, []), [], durata);
  }
});

// Con 3 scene (corta da 4 frasi) la soglia del 70 % vuole tutte e 3 uguali: la regola resta possibile e non serve scalarla.
test("varieta' in corta: 2 scene su 3 uguali passano, 3 su 3 no; contro un video piu' lungo conta la sequenza piu' lunga", () => {
  const sb = fixture("durata-corta");
  assert.deepEqual(erroriVarieta(sb, [["gancio", "rischio", "telefono"]]), []);
  assert.ok(erroriVarieta(sb, [["gancio", "rischio", "oggetto"]]).some((e) => e.startsWith("sequenza: 100%")));
  assert.equal(somiglianza(["gancio", "rischio", "oggetto"], ["gancio", "rischio", "oggetto", "data", "checklist", "teaser"]), 0.5);
});
