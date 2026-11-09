import { test } from "node:test";
import assert from "node:assert/strict";

import { conAlfa } from "./alfa.ts";

test("il colore esadecimale diventa rgba con l'opacita' data", () => {
  assert.equal(conAlfa("#1E1C19", 0.55), "rgba(30,28,25,0.55)");
  assert.equal(conAlfa("#ffffff", 1), "rgba(255,255,255,1)");
});

test("un colore in altro formato e' un errore, non un nero silenzioso", () => {
  for (const c of ["#fff", "rgb(1,2,3)", "ambra", "#1E1C19AA"]) assert.throws(() => conAlfa(c, 0.5), /#rrggbb/);
});
