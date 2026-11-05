import { test } from "node:test";
import assert from "node:assert/strict";

import type { Blocco } from "./sottotitoli.ts";
import { blocchiSottotitolo } from "./sottotitoli.ts";

const FRASE = "Ti servono una chiavetta da almeno otto giga, e la stessa lingua e la stessa edizione di Windows che usi già.";

const FINE_PROPOSIZIONE = /[,.;:?!]$/;
const testi = (blocchi: Blocco[]) => blocchi.map((b) => b.parole.map((p) => p.t).join(" "));

test("nessun blocco supera 4 parole, 1 sola solo se è tutta la proposizione", () => {
  const blocchi = blocchiSottotitolo(FRASE, "otto giga", 120);
  assert.ok(blocchi.length > 1);
  blocchi.forEach((b, i) => {
    assert.ok(b.parole.length >= 1 && b.parole.length <= 4, `${b.parole.length} parole`);
    if (b.parole.length === 1 && i > 0) assert.match(blocchi[i - 1].parole.at(-1)!.t, FINE_PROPOSIZIONE);
  });
  assert.equal(blocchi.flatMap((b) => b.parole.map((p) => p.t)).join(" "), FRASE);
});

test("i blocchi coprono tutti i frame senza buchi", () => {
  const blocchi = blocchiSottotitolo(FRASE, "otto giga", 120);
  assert.equal(blocchi[0].da, 0);
  assert.equal(blocchi.at(-1)!.a, 120);
  for (let i = 1; i < blocchi.length; i++) assert.equal(blocchi[i].da, blocchi[i - 1].a);
  for (const b of blocchi) assert.ok(b.a > b.da);
});

test("la chiave è marcata anche con maiuscole diverse", () => {
  const parole = blocchiSottotitolo("Hai ancora Windows dieci?", "windows Dieci", 60).flatMap((b) => b.parole);
  assert.deepEqual(parole.map((p) => p.chiave), [false, false, true, true]);
});

test("una frase di 3 parole è un solo blocco", () => {
  const blocchi = blocchiSottotitolo("Nasce già scoperto.", "scoperto", 40);
  assert.equal(blocchi.length, 1);
  assert.deepEqual(blocchi[0], {
    parole: [{ t: "Nasce", chiave: false }, { t: "già", chiave: false }, { t: "scoperto.", chiave: true }],
    da: 0,
    a: 40,
  });
});

test("non spezza a cavallo di una virgola", () => {
  const blocchi = blocchiSottotitolo("Trovi tutto su lavocedigitale.it, il link è nel post.", "il link", 120);
  for (const t of testi(blocchi)) assert.ok(!t.includes("lavocedigitale.it, il"), t);
  for (const b of blocchi) b.parole.slice(0, -1).forEach((p) => assert.doesNotMatch(p.t, FINE_PROPOSIZIONE));
});

test("un blocco non comincia con la fine della proposizione precedente", () => {
  const blocchi = blocchiSottotitolo("Ora puoi installare il sistema, ma attento.", "sistema", 90);
  assert.deepEqual(testi(blocchi), ["Ora puoi installare", "il sistema,", "ma attento."]);
});

test("una proposizione di una parola è un blocco da 1", () => {
  const blocchi = blocchiSottotitolo("Attenzione: il supporto è finito.", "supporto", 60);
  assert.deepEqual(testi(blocchi), ["Attenzione:", "il supporto è finito."]);
});

test("la data intera resta in un blocco", () => {
  const blocchi = blocchiSottotitolo("Ma dal 14 ottobre 2025 niente più aggiornamenti di sicurezza.", "aggiornamenti", 150);
  assert.ok(testi(blocchi).some((t) => t.includes("14 ottobre 2025")), testi(blocchi).join(" / "));
});

test("numero e unità, nome e versione non si separano", () => {
  for (const [frase, unita] of [
    ["Ti servono una chiavetta da almeno 8 GB, stessa lingua.", "8 GB,"],
    ["Hai ancora sul computer di casa Windows 10?", "Windows 10?"],
    ["Il supporto finisce il giorno 14 ottobre del prossimo anno.", "14 ottobre"],
  ]) {
    const blocchi = blocchiSottotitolo(frase, "", 120);
    assert.ok(testi(blocchi).some((t) => t.includes(unita)), testi(blocchi).join(" / "));
  }
});

test("si arriva a 5 parole solo per tenere unita una sequenza", () => {
  for (const frase of [FRASE, "Ma dal 14 ottobre 2025 niente più aggiornamenti di sicurezza.", "Dal 14 ottobre 2025 stop."]) {
    for (const b of blocchiSottotitolo(frase, "", 120)) {
      if (b.parole.length > 4) assert.match(b.parole.map((p) => p.t).join(" "), /\d/);
      assert.ok(b.parole.length <= 5);
    }
  }
  assert.deepEqual(testi(blocchiSottotitolo("Dal 14 ottobre 2025 stop.", "", 60)), ["Dal 14 ottobre 2025 stop."]);
});

test("con i tempi della voce ogni blocco entra quando si dice la sua prima parola", () => {
  const frase = "Si può ancora installare, ma c'è un problema.";
  const inizi = [5, 9, 14, 22, 40, 44, 49, 53];
  const blocchi = blocchiSottotitolo(frase, "", 80, inizi);
  assert.deepEqual(testi(blocchi), ["Si può ancora installare,", "ma c'è un problema."]);
  assert.deepEqual(blocchi.map((b) => [b.da, b.a]), [[0, 40], [40, 80]]);
});

test("tempi della voce che non tornano con le parole: si ripiega sulla stima", () => {
  assert.deepEqual(blocchiSottotitolo(FRASE, "", 120, [0, 10]), blocchiSottotitolo(FRASE, "", 120));
});
