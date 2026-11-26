import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ATTIVI, DURATE } from "../editoriale/variante.ts";
import type { NomeDurata } from "../editoriale/variante.ts";
import { erroriEmozione } from "./emozione.ts";
import type { Frase, Storyboard } from "./tipi.ts";
import { contaParole, FORME_MAPPA, LIMITI_DURATA, SIMBOLI } from "./tipi.ts";
import { erroriVarieta, somiglianza, validaStoryboard } from "./valida.ts";

const fixture = (nome: string): Storyboard => JSON.parse(readFileSync(new URL(`../../fixtures/${nome}.storyboard.json`, import.meta.url), "utf8"));
const AGENTE = readFileSync(new URL("../../agent-video.md", import.meta.url), "utf8");
const paroleDi = (sb: Storyboard): number => sb.frasi.reduce((t, f) => t + contaParole(f.testo), 0);

const DOMANDA = "Tu lo sapevi?";

/** Un copione di `frasi` frasi con `parole` parole in tutto: gancio corto, scene alternate, domanda finale di 3 parole. */
function copione(frasi: number, parole: number): Storyboard {
  const n = frasi - 1;
  const contenuto = parole - contaParole(DOMANDA);
  const scene: Frase["scena"][] = [{ tipo: "teaser", testo: "Ancora" }, { tipo: "citazione", testo: "Una frase", fonte: "Fonte" }];
  // il gancio sta nelle sue 10 parole: il resto va alle frasi dopo
  const gancio = Math.min(10, Math.floor(contenuto / n));
  const resto = contenuto - gancio;
  return {
    slug: "copione",
    frasi: [
      { testo: Array(gancio).fill("parola").join(" "), chiave: "parola", tono: "curioso", scena: scene[0] },
      ...Array.from({ length: n - 1 }, (_, i) => {
        const k = Math.floor(resto / (n - 1)) + (i < resto % (n - 1) ? 1 : 0);
        return { testo: Array(k).fill("parola").join(" "), chiave: "parola", tono: "curioso", scena: scene[(i + 1) % 2] };
      }),
      { testo: DOMANDA, chiave: "sapevi", tono: "curioso", scena: { tipo: "chiusura" } },
    ],
  };
}

const errori = (sb: Storyboard, durata: NomeDurata): string[] => {
  const esito = validaStoryboard(sb, durata);
  return esito.ok ? [] : esito.errori;
};

test("i limiti per durata sono quelli della spec del format veloce", () => {
  assert.deepEqual(LIMITI_DURATA, {
    corta: { frasi: { min: 4, max: 5 }, parole: { min: 28, max: 40 }, secondi: { min: 11, max: 16 } },
    media: { frasi: { min: 5, max: 7 }, parole: { min: 40, max: 56 }, secondi: { min: 16, max: 22 } },
    lunga: { frasi: { min: 7, max: 8 }, parole: { min: 56, max: 72 }, secondi: { min: 22, max: 28 } },
  });
  assert.deepEqual(Object.keys(LIMITI_DURATA), [...DURATE]);
  assert.deepEqual(ATTIVI.durata, ["corta", "media", "lunga"]);
});

for (const durata of DURATE) {
  const { frasi, parole } = LIMITI_DURATA[durata];

  test(`${durata}: accetta i due estremi di parole, rifiuta una in meno e una in piu'`, () => {
    for (const f of [frasi.min, frasi.max]) {
      for (const p of [parole.min, parole.max]) assert.deepEqual(errori(copione(f, p), durata), [], `${f} frasi, ${p} parole`);
    }
    for (const p of [parole.min - 1, parole.max + 1]) {
      assert.deepEqual(errori(copione(frasi.min, p), durata), [`copione: ${p} parole, la durata ${durata} ne vuole da ${parole.min} a ${parole.max}, domanda finale compresa`], `${p} parole`);
    }
  });

  test(`${durata}: rifiuta una frase in meno o in piu'`, () => {
    for (const f of [frasi.min - 1, frasi.max + 1]) {
      const p = Math.min(Math.max(parole.min, f * 3), parole.max);
      assert.deepEqual(errori(copione(f, p), durata), [`frasi: ${f} frasi, la durata ${durata} ne vuole da ${frasi.min} a ${frasi.max}`], `${f} frasi`);
    }
  });
}

test("le fixture della durata passano solo nella loro durata", () => {
  const corta = fixture("durata-corta");
  assert.deepEqual([corta.frasi.length, paroleDi(corta)], [4, 30]);
  assert.deepEqual(errori(corta, "corta"), []);
  assert.deepEqual(erroriVarieta(corta, []), []);
  assert.notDeepEqual(errori(corta, "media"), []);

  const lunga = fixture("durata-lunga");
  assert.deepEqual([lunga.frasi.length, paroleDi(lunga)], [8, 72], "il massimo della lunga");
  assert.deepEqual(errori(lunga, "lunga"), []);
  assert.deepEqual(erroriVarieta(lunga, []), []);
  assert.notDeepEqual(errori(lunga, "media"), []);
});

test("veloce (8 frasi, 69 parole) e' una lunga, non una media", () => {
  const sb = fixture("veloce");
  assert.deepEqual([sb.frasi.length, paroleDi(sb)], [8, 69]);
  assert.deepEqual(errori(sb, "lunga"), []);
  assert.notDeepEqual(errori(sb, "media"), []);
});

test("la tabella delle durate in agent-video.md e' quella di LIMITI_DURATA, senza conteggi di parole scritti a mano", () => {
  for (const d of DURATE) {
    const { frasi, parole, secondi } = LIMITI_DURATA[d];
    assert.ok(AGENTE.includes(`| ${d} | ${frasi.min}-${frasi.max} | ${parole.min}-${parole.max} | ${secondi.min}-${secondi.max} |`), d);
  }
  assert.ok(!/\d+ a \d+ parole|\d+ parole\)/.test(AGENTE), "nessun altro conteggio di parole scritto a mano");
});

const ESEMPI = [...AGENTE.matchAll(/durata (corta|media|lunga)[^\n]*\n\n```json\n([\s\S]*?)```/gi)].map(([, durata, json]) => ({
  durata: durata.toLowerCase() as NomeDurata,
  sb: JSON.parse(json) as Storyboard,
}));

test("ogni esempio di agent-video.md passa la validazione e la varieta' nella durata che dichiara", () => {
  assert.equal(ESEMPI.length, 4);
  for (const d of DURATE) assert.ok(ESEMPI.some((e) => e.durata === d), `c'e' un esempio ${d}`);
  for (const { durata, sb } of ESEMPI) {
    assert.deepEqual(errori(sb, durata), [], `${sb.slug} (${durata})`);
    assert.deepEqual(erroriVarieta(sb, []), [], `${sb.slug} (${durata})`);
  }
});

// l'articolo degli esempi non c'e': il fatto vale come articolo, si controllano tipo, toni ed esche
test("ogni esempio di agent-video.md ha un'emozione coerente con i suoi toni, e non sempre la stessa", () => {
  for (const { sb } of ESEMPI) assert.deepEqual(erroriEmozione(sb, sb.emozione?.fatto ?? ""), [], sb.slug);
  assert.ok(new Set(ESEMPI.map((e) => e.sb.emozione?.tipo)).size >= 3, "almeno tre emozioni diverse");
  assert.ok(ESEMPI.some((e) => e.sb.emozione?.tipo === "utilità"), "un esempio senza emozione forte");
});

// Claude imita gli esempi: se tutti hanno la notifica, ogni video ha la notifica; se nessuno ha un tono, non lo usa.
test("negli esempi di agent-video.md la notifica e' l'eccezione, ci sono le scene senza dispositivo e i toni", () => {
  const conAllarme = ESEMPI.filter((e) => e.sb.frasi.some((f) => f.scena.tipo === "allarme"));
  assert.equal(conAllarme.length, 1, "un solo esempio con allarme");
  const tipi = new Set(ESEMPI.flatMap((e) => e.sb.frasi.map((f) => f.scena.tipo)));
  for (const t of ["simbolo", "passi", "flusso", "mappa", "reperto"]) assert.ok(tipi.has(t), t);
  for (const e of ESEMPI) assert.ok(e.sb.frasi.some((f) => f.tono !== undefined && f.tono !== "deciso"), `${e.sb.slug}: almeno un tono`);
});

test("agent-video.md descrive le scene nuove, i pittogrammi e le forme della mappa", () => {
  for (const t of ["simbolo", "passi", "flusso", "mappa", "reperto"]) assert.ok(AGENTE.includes(`| \`${t}\` |`), `riga della tabella per ${t}`);
  for (const s of [...SIMBOLI, ...FORME_MAPPA]) assert.ok(AGENTE.includes(`\`${s}\``), s);
});

// Con 3 scene (corta da 4 frasi) la soglia del 70 % vuole tutte e 3 uguali: la regola resta possibile e non serve scalarla.
test("varieta' in corta: 2 scene su 3 uguali passano, 3 su 3 no; contro un video piu' lungo conta la sequenza piu' lunga", () => {
  const sb = fixture("durata-corta");
  assert.deepEqual(erroriVarieta(sb, [["gancio", "simbolo", "telefono"]]), []);
  assert.ok(erroriVarieta(sb, [["gancio", "simbolo", "oggetto"]]).some((e) => e.startsWith("sequenza: 100%")));
  assert.equal(somiglianza(["gancio", "simbolo", "oggetto"], ["gancio", "simbolo", "oggetto", "data", "checklist", "teaser"]), 0.5);
});
