import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { èPrincipale } from "./principale.ts";

test("riconosce il modulo lanciato anche con caratteri da codificare nel percorso", () => {
  const percorso = "/tmp/cartella con spazi+piu/pipeline/main.ts";
  const url = pathToFileURL(percorso).href;
  assert.notEqual(url, `file://${percorso}`);
  assert.equal(èPrincipale(url, percorso), true);
});

test("un altro modulo o nessun argomento non e' il principale", () => {
  assert.equal(èPrincipale(pathToFileURL("/a/main.ts").href, "/a/render.ts"), false);
  assert.equal(èPrincipale(pathToFileURL("/a/main.ts").href, undefined), false);
});
