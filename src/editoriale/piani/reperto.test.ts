import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScenaDi } from "../../scenes/props.ts";
import type { Reperto } from "../../storyboard/tipi.ts";
import { pausaPiuLunga, PAUSA_MAX } from "../regia.ts";
import type { Voce } from "../voce.ts";
import { pianoGancio } from "./gancio.ts";
import { pianoReperto } from "./reperto.ts";

// una parola ogni 6 frame dal frame 0; la chiave e' la parola di indice `chiave`
const voce = (testo: string, chiave: number): Voce => {
  const parole = testo.split(" ").map((t, i) => ({ t, da: i * 6, a: i * 6 + 5 }));
  return { parole, chiave, chiaveFine: chiave + 1 };
};

const scena = (durata: number, v: Voce, reperto: Reperto = "telefono", messaggio?: string): ScenaDi<"reperto"> => ({
  tipo: "reperto",
  etichetta: "Il messaggio",
  titolo: "Ti svuota il conto",
  reperto,
  ...(messaggio ? { messaggio } : {}),
  durata,
  voce: v,
  contesto: {},
});

const DETTA = "Basta un clic su quel link e ti svuotano il conto in pochi minuti";

test("il reperto reagisce quando la voce dice la chiave, col suono della crepa", () => {
  const v = voce(DETTA, 8);
  const piano = pianoReperto(scena(120, v), 120);
  assert.equal(piano.reazione, 48);
  assert.deepEqual(piano.suoni, [{ da: 48, suono: "crepa" }]);
  assert.ok(piano.eventi.includes(48));
});

test("con la chiave in fondo o in testa la reazione resta dentro la scena e si vede", () => {
  assert.ok(pianoReperto(scena(50, voce(DETTA, 12)), 50).reazione <= 50 - 14);
  assert.ok(pianoReperto(scena(120, voce(DETTA, 0)), 120).reazione >= 10);
});

test("nessuna pausa oltre il massimo, per ogni reperto", () => {
  for (const r of ["telefono", "carta", "lucchetto"] as const) {
    const piano = pianoReperto(scena(160, voce(DETTA, 3), r), 160);
    assert.ok(pausaPiuLunga(piano.eventi, 160) <= PAUSA_MAX, r);
  }
});

test("a schermo: l'occhiello, il titolo e il messaggio dell'SMS se c'e'", () => {
  const con = pianoReperto(scena(120, voce(DETTA, 8), "telefono", "Pacco in giacenza: paga 1,99 euro"), 120);
  assert.deepEqual(con.testi.map((t) => t.testo), ["Il messaggio", "Pacco in giacenza: paga 1,99 euro", "Ti svuota il conto"]);
  const senza = pianoReperto(scena(120, voce(DETTA, 8), "carta"), 120);
  assert.deepEqual(senza.testi.map((t) => t.testo), ["Il messaggio", "Ti svuota il conto"]);
});

test("il gancio aperto sul reperto reagisce sulla chiave, col suono della crepa; senza reperto niente crepa", () => {
  const v = voce("Un SMS da pochi spiccioli ti svuota il conto", 7);
  const gancio = (extra: object): ScenaDi<"gancio"> => ({ tipo: "gancio", titolo: "t", evidenza: "e", sottotitolo: "s", oggetto: "smartphone", ...extra, durata: 90, voce: v, contesto: {} }) as ScenaDi<"gancio">;
  const con = pianoGancio(gancio({ reperto: "telefono", messaggio: "Paga 1,99 euro" }), 90);
  assert.equal(con.reazione, 42);
  assert.ok(con.suoni.some((s) => s.suono === "crepa" && s.da === 42));
  assert.ok(con.testi.some((t) => t.testo === "Paga 1,99 euro" && t.da === 0));
  const senza = pianoGancio(gancio({}), 90);
  assert.equal(senza.reazione, undefined);
  assert.ok(!senza.suoni.some((s) => s.suono === "crepa"));
});
