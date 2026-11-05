import { test } from "node:test";
import assert from "node:assert/strict";

import { socialHashtags, xPostLength } from "./testo-x.ts";

test("xPostLength conta ogni link 23 caratteri", () => {
  const url = "https://lavocedigitale.it/software/installare-windows-10-usb-dopo-fine-supporto";
  assert.equal(xPostLength(`Ciao\n\n${url}`), 6 + 23);
  assert.equal(xPostLength("senza link"), 10);
});

test("socialHashtags: primi tre tag, senza trattini ne' punteggiatura", () => {
  assert.equal(socialHashtags(["dvb-t2", "regola 3-2-1", "perché", "quarto"]), "#dvbt2 #regola321 #perché");
  assert.equal(socialHashtags(["---", "ok"]), "#ok");
  assert.equal(socialHashtags(undefined), "");
});
