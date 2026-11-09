import { test } from "node:test";
import assert from "node:assert/strict";

import { VARIANTE_BASE } from "../src/editoriale/variante.ts";
import { avvisiNonAttivi, momentiDi, varianteDaArgomenti } from "./controlla-impaginazione.ts";

test("un valore valido ma non ancora attivo si controlla con un avviso: il fotogramma mostra quello di base", () => {
  assert.deepEqual(avvisiNonAttivi(VARIANTE_BASE), []);
  assert.deepEqual(avvisiNonAttivi({ ...VARIANTE_BASE, stile: "studio", durata: "corta" }), ["stile studio non ancora attivo: si vede scrivania", "durata corta non ancora attivo: si vede media"]);
});

test("--variante sovrascrive solo i campi dati, sulla variante delle props", () => {
  assert.deepEqual(varianteDaArgomenti([], undefined), VARIANTE_BASE);
  assert.deepEqual(varianteDaArgomenti(["--variante=luce:sera,apertura:alta"], undefined), { ...VARIANTE_BASE, luce: "sera", apertura: "alta" });
  const props = { ...VARIANTE_BASE, musica: "notturno", luce: "sera", apertura: "radente" } as const;
  assert.deepEqual(varianteDaArgomenti(["--variante=luce:mattino,fraseFinale:0"], props), { ...props, luce: "mattino", fraseFinale: 0 });
});

test("valori sconosciuti di --variante ripiegano sull'aspetto approvato", () => {
  assert.deepEqual(varianteDaArgomenti(["--variante=luce:neon,apertura"], undefined), VARIANTE_BASE);
});

test("--stile, --gancio, --chiusura e --durata forzano anche i valori non ancora attivi nella pipeline", () => {
  const v = varianteDaArgomenti(["x.json", "--stile=notte", "--gancio=parola", "--chiusura=integrata", "--durata=corta", "--passo=5"], undefined);
  assert.deepEqual(v, { ...VARIANTE_BASE, stile: "notte", gancio: "parola", chiusura: "integrata", durata: "corta" });
  // l'opzione esplicita vince su --variante
  assert.equal(varianteDaArgomenti(["--variante=stile:studio", "--stile=schermo"], undefined).stile, "schermo");
});

test("un valore sconosciuto di --stile e simili e' un errore, non un controllo silenzioso sullo stile di base", () => {
  assert.throws(() => varianteDaArgomenti(["--stile=nott"], undefined), /--stile=nott: valori ammessi scrivania, studio, notte, schermo/);
  assert.throws(() => varianteDaArgomenti(["--durata=eterna"], undefined), /--durata/);
});

test("si misura poco dopo l'inizio, a meta' e alla fine della scena", () => {
  assert.deepEqual(momentiDi(100, 90), [["inizio", 108], ["metà", 145], ["fine", 189]]);
  assert.deepEqual(momentiDi(0, 5), [["metà", 2], ["inizio", 4]]);
});

test("con il passo si misura tutta l'animazione, senza fotogrammi doppi", () => {
  const m = momentiDi(100, 90, 30);
  assert.deepEqual(m.map(([, f]) => f), [100, 108, 130, 145, 160, 189]);
});
