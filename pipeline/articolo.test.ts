import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { leggiArticolo, slugValido, validaArticolo } from "./articolo.ts";

const SLUG = "installare-windows-10-usb-dopo-fine-supporto";
const buono = {
  slug: SLUG,
  titolo: "Installare Windows 10 da USB dopo la fine del supporto",
  sottotitolo: "Si può ancora fare",
  testo: "Dal 14 ottobre 2025 niente aggiornamenti.",
  url: `https://lavocedigitale.it/software/${SLUG}`,
  tags: ["windows-10", "usb"],
};

const errori = (dato: unknown): string[] => {
  const e = validaArticolo(dato);
  return e.ok ? [] : e.errori;
};

test("un payload corretto passa cosi' com'e'", () => {
  assert.deepEqual(validaArticolo(buono), { ok: true, articolo: buono });
});

test("senza tags vale un elenco vuoto, il sottotitolo puo' essere vuoto", () => {
  const { tags, ...senza } = buono;
  const e = validaArticolo({ ...senza, sottotitolo: "" });
  assert.ok(e.ok);
  assert.deepEqual(e.ok && e.articolo.tags, []);
});

test("slug che esce dalla cartella o con maiuscole viene rifiutato", () => {
  assert.equal(slugValido("../etc"), false);
  assert.equal(slugValido("Abc"), false);
  assert.match(errori({ ...buono, slug: "../x" }).join(), /slug/);
});

test("l'url deve essere la pagina dell'articolo sul sito", () => {
  assert.match(errori({ ...buono, url: `https://altro.example/software/${SLUG}` }).join(), /url/);
  assert.match(errori({ ...buono, url: "https://lavocedigitale.it/software/altro-articolo" }).join(), /url/);
  assert.match(errori({ ...buono, url: `https://lavocedigitale.it.example.com/software/${SLUG}` }).join(), /url/);
  assert.match(errori({ ...buono, url: `https://lavocedigitale.it/a/b/${SLUG}` }).join(), /url/);
  assert.deepEqual(errori({ ...buono, url: `https://lavocedigitale.it/migliori/${SLUG}` }), []);
});

test("campi mancanti, del tipo sbagliato o troppo lunghi", () => {
  assert.match(errori({ ...buono, titolo: "" }).join(), /titolo/);
  assert.match(errori({ ...buono, testo: 3 }).join(), /testo/);
  assert.match(errori({ ...buono, testo: "x".repeat(60_001) }).join(), /testo: oltre/);
  assert.match(errori({ ...buono, tags: "usb" }).join(), /tags/);
  assert.match(errori({ ...buono, tags: [1] }).join(), /tags/);
  assert.deepEqual(errori([]), ["articolo: non è un oggetto"]);
});

test("leggiArticolo legge il file e lancia un errore leggibile", () => {
  const cartella = mkdtempSync(join(tmpdir(), "articolo-"));
  const file = join(cartella, "articolo.json");
  writeFileSync(file, JSON.stringify(buono));
  assert.deepEqual(leggiArticolo(file), buono);
  writeFileSync(file, "{rotto");
  assert.throws(() => leggiArticolo(file), /JSON non leggibile/);
  writeFileSync(file, JSON.stringify({ ...buono, slug: "A" }));
  assert.throws(() => leggiArticolo(file), /articolo non valido: slug/);
});
