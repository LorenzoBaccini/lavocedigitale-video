import { test } from "node:test";
import assert from "node:assert/strict";

import { altezzaOcchiello, RIGA_OCCHIELLO, sopraIlTitolo, SPAZIO_OCCHIELLO } from "./misureOcchiello.ts";

test("un occhiello corto sta su una riga, uno al limite di 32 caratteri puo' andare su due", () => {
  assert.equal(altezzaOcchiello("Dall'app"), RIGA_OCCHIELLO);
  assert.equal(altezzaOcchiello("A".repeat(32)), 2 * RIGA_OCCHIELLO);
  assert.equal(sopraIlTitolo("Dall'app"), RIGA_OCCHIELLO + SPAZIO_OCCHIELLO);
});
