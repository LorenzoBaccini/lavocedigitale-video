import { test } from "node:test";
import assert from "node:assert/strict";

import { VARIANTE_BASE } from "../src/editoriale/variante.ts";
import { momentiDi, varianteDaArgomento } from "./controlla-impaginazione.ts";

test("--variante sovrascrive solo i campi dati, sulla variante delle props", () => {
  assert.deepEqual(varianteDaArgomento(undefined, undefined), VARIANTE_BASE);
  assert.deepEqual(varianteDaArgomento("luce:sera,apertura:alta", undefined), { musica: "caldo", luce: "sera", apertura: "alta" });
  assert.deepEqual(varianteDaArgomento("luce:mattino", { musica: "notturno", luce: "sera", apertura: "radente" }), { musica: "notturno", luce: "mattino", apertura: "radente" });
});

test("valori sconosciuti ripiegano sull'aspetto approvato", () => {
  assert.deepEqual(varianteDaArgomento("luce:neon,apertura", undefined), VARIANTE_BASE);
});

test("si misura poco dopo l'inizio, a meta' e alla fine della scena", () => {
  assert.deepEqual(momentiDi(100, 90), [["inizio", 108], ["metà", 145], ["fine", 189]]);
  assert.deepEqual(momentiDi(0, 5), [["metà", 2], ["inizio", 4]]);
});

test("con il passo si misura tutta l'animazione, senza fotogrammi doppi", () => {
  const m = momentiDi(100, 90, 30);
  assert.deepEqual(m.map(([, f]) => f), [100, 108, 130, 145, 160, 189]);
});
