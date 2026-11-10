import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

import type { Variante } from "../src/editoriale/variante.ts";
import { ATTIVI, VARIANTE_BASE } from "../src/editoriale/variante.ts";
import type { Impronta } from "./somiglianza.ts";
import {
  CONFRONTATI,
  coloreHex,
  confronta,
  dHash,
  distanza,
  èImpronta,
  fotogrammiFissi,
  improntaFotogramma,
  MAX_TENTATIVI,
  prossimaVariante,
  scegliDiversa,
  SOGLIA,
} from "./somiglianza.ts";
import type { VoceStorico } from "./storico.ts";

const NERO = "0000000000000000#000000";
const uguale = (f: string): Impronta => Array(6).fill(f);
const voce = (slug: string, impronta?: Impronta, variante: Partial<Variante> = VARIANTE_BASE): VoceStorico => ({ slug, data: "2026-11-09", scene: [{ tipo: "gancio" }], variante, ...(impronta && { impronta }) });

test("i fotogrammi fissi: inizio, 1 s, 30, 50, 70 e 90 per cento", () => {
  assert.deepEqual(fotogrammiFissi(1000, 30), [0, 30, 300, 500, 700, 900]);
  assert.deepEqual(fotogrammiFissi(20, 30), [0, 19, 6, 10, 14, 18]);
});

test("dHash: un bit per coppia di pixel vicini, 1 se il sinistro e' piu' chiaro", () => {
  const scendente = Uint8Array.from({ length: 72 }, (_, i) => 255 - (i % 9) * 20);
  assert.equal(dHash(scendente), "ffffffffffffffff");
  assert.equal(dHash(new Uint8Array(72).fill(9)), "0000000000000000");
  const unBit = new Uint8Array(72);
  unBit[0] = 1;
  assert.equal(dHash(unBit), "8000000000000000");
});

test("il colore medio in esadecimale", () => {
  assert.equal(coloreHex(Uint8Array.from([255, 16, 1])), "#ff1001");
});

test("impronte uguali stanno a zero, opposte a uno", () => {
  assert.equal(distanza(uguale(NERO), uguale(NERO)), 0);
  assert.equal(distanza(uguale(NERO), uguale("ffffffffffffffff#ffffff")), 1);
});

test("il primo fotogramma pesa il doppio degli altri", () => {
  const diverso = (i: number) => uguale(NERO).map((f, j) => (j === i ? "ffffffffffffffff#000000" : f));
  const primo = distanza(uguale(NERO), diverso(0));
  const altro = distanza(uguale(NERO), diverso(3));
  assert.ok(Math.abs(primo - 2 * altro) < 1e-12);
  assert.ok(altro > 0);
});

test("forma e colore contano tutti e due", () => {
  assert.ok(distanza(uguale(NERO), uguale("0000000000000000#ffffff")) > 0);
  assert.ok(distanza(uguale(NERO), uguale("ffffffffffffffff#000000")) > 0);
});

test("solo stringhe da 16 esadecimali piu' #rrggbb, sei in tutto, sono un'impronta", () => {
  assert.ok(èImpronta(uguale(NERO)));
  assert.ok(!èImpronta(uguale(NERO).slice(0, 5)));
  assert.ok(!èImpronta([...uguale(NERO).slice(0, 5), "zz"]));
  assert.ok(!èImpronta("abc"));
  assert.ok(!èImpronta(undefined));
});

test("il confronto guarda gli ultimi 5 video con impronta e ignora quelli senza", () => {
  const lontana = uguale("ffffffffffffffff#ffffff");
  const recenti = [voce("senza"), voce("a", lontana), voce("b", lontana), voce("c", lontana), voce("d", lontana), voce("e", lontana), voce("vicino-ma-vecchio", uguale(NERO))];
  const r = confronta(uguale(NERO), recenti);
  assert.equal(CONFRONTATI, 5);
  assert.equal(r?.slug, "a");
  assert.equal(r?.distanza, 1);
  assert.equal(confronta(uguale(NERO), [voce("x"), voce("y")]), undefined);
});

test("il confronto riporta il video piu' vicino", () => {
  const mezza = uguale("ffffffff00000000#000000");
  const r = confronta(uguale(NERO), [voce("a", uguale("ffffffffffffffff#ffffff")), voce("b", mezza)]);
  assert.equal(r?.slug, "b");
});

test("la variante successiva cambia lo stile, non uno degli ultimi 5 se si puo', e lascia voce e copione", () => {
  const v: Variante = { ...VARIANTE_BASE, stile: "scrivania", gancio: "scena" };
  const recenti = [{ stile: "studio" }, { stile: "scrivania" }, {}] as Partial<Variante>[];
  const n = prossimaVariante("slug", v, 2, [v], recenti);
  assert.ok(["notte", "schermo"].includes(n.stile));
  assert.equal(n.gancio, "scena");
  assert.equal(n.fraseFinale, v.fraseFinale);
  assert.equal(n.durata, v.durata);
  assert.equal(n.musica, v.musica);
  assert.deepEqual(prossimaVariante("slug", v, 2, [v], recenti), n);
});

test("se tutti gli stili sono negli ultimi 5 accorcia la memoria ma non ripete uno stile gia' provato", () => {
  const v: Variante = { ...VARIANTE_BASE, stile: "notte" };
  const recenti = ATTIVI.stile.map((stile) => ({ stile })) as Partial<Variante>[];
  for (let t = 0; t < 20; t++) {
    const n = prossimaVariante(`s${t}`, v, 2, [v], recenti);
    assert.notEqual(n.stile, "notte");
  }
  const n = prossimaVariante("x", { ...v, stile: "studio" }, 3, [v, { ...v, stile: "studio" }], recenti);
  assert.ok(!["notte", "studio"].includes(n.stile));
});

test("se lo stile nuovo con lo stesso gancio e' fra gli ultimi 5 cambia gia' al secondo tentativo anche il gancio, verso una coppia non usata", () => {
  const v: Variante = { ...VARIANTE_BASE, stile: "notte", gancio: "scena" };
  const recenti = ATTIVI.stile.map((stile) => ({ stile, gancio: "scena" })) as Partial<Variante>[];
  for (let t = 0; t < 20; t++) assert.notEqual(prossimaVariante(`s${t}`, v, 2, [v], recenti).gancio, "scena");
  const libero = prossimaVariante("x", v, 2, [v], [{ stile: "notte", gancio: "scena" }]);
  assert.equal(libero.gancio, "scena", "con uno stile non visto negli ultimi 5 il gancio resta");
});

test("al terzo tentativo cambia anche il gancio", () => {
  const v1: Variante = { ...VARIANTE_BASE, stile: "scrivania", gancio: "scena" };
  const v2 = prossimaVariante("slug", v1, 2, [v1], []);
  const v3 = prossimaVariante("slug", v2, 3, [v1, v2], []);
  assert.notEqual(v3.gancio, "scena");
  assert.ok(![v1.stile, v2.stile].includes(v3.stile));
});

// Il primo tentativo ha gia' l'impaginazione controllata da main; i successivi la rifanno.
function finto(impronte: Record<string, Impronta | Error>, impaginazione: Record<string, string[]> = {}) {
  const chiamate = { impronta: [] as string[], impaginazione: [] as string[] };
  const chiave = (v: Variante) => `${v.stile}/${v.gancio}`;
  return {
    chiamate,
    impronta: async (v: Variante) => {
      chiamate.impronta.push(chiave(v));
      const r = impronte[chiave(v)] ?? impronte["*"];
      if (r instanceof Error) throw r;
      return r;
    },
    controllaImpaginazione: async (v: Variante) => {
      chiamate.impaginazione.push(chiave(v));
      return impaginazione[chiave(v)] ?? [];
    },
  };
}

const V1: Variante = { ...VARIANTE_BASE, stile: "scrivania", gancio: "scena" };
const LONTANA = uguale("ffffffffffffffff#ffffff");
const VICINA = uguale(NERO);

test("abbastanza diversa al primo colpo: tiene la variante e dice la distanza minima", async () => {
  const f = finto({ "*": LONTANA });
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("prima", VICINA)], ...f });
  assert.deepEqual(r.variante, V1);
  assert.deepEqual(r.impronta, LONTANA);
  assert.equal(f.chiamate.impaginazione.length, 0);
  assert.match(r.riga, /^Somiglianza: ok, distanza minima 1\.00 da prima$/);
});

test("senza video con impronte non c'e' confronto, ma l'impronta resta per lo storico", async () => {
  const f = finto({ "*": VICINA });
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("vecchio")], ...f });
  assert.deepEqual(r.variante, V1);
  assert.deepEqual(r.impronta, VICINA);
  assert.match(r.riga, /nessun video recente con impronta/);
});

test("troppo simile: cambia variante, rifa' l'impaginazione e si ferma alla prima abbastanza lontana", async () => {
  const v2 = prossimaVariante("s", V1, 2, [V1], [VARIANTE_BASE]);
  const f = finto({ "scrivania/scena": VICINA, "*": LONTANA });
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("prima", VICINA)], ...f });
  assert.deepEqual(r.variante, v2);
  assert.deepEqual(f.chiamate.impaginazione, [`${v2.stile}/${v2.gancio}`]);
  assert.equal(f.chiamate.impronta.length, 2);
  assert.match(r.riga, /cambiata variante 1 volta/);
  assert.match(r.riga, new RegExp(`${v2.stile}/scena`));
});

test("dopo 3 tentativi tutti sotto soglia tiene la piu' lontana e lo dice", async () => {
  const quasi = uguale("000000000000000f#000000");
  const v2 = prossimaVariante("s", V1, 2, [V1], [VARIANTE_BASE]);
  const f = finto({ "scrivania/scena": VICINA, [`${v2.stile}/${v2.gancio}`]: quasi, "*": VICINA });
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("prima", VICINA)], ...f });
  assert.equal(f.chiamate.impronta.length, MAX_TENTATIVI);
  assert.deepEqual(r.variante, v2);
  assert.deepEqual(r.impronta, quasi);
  assert.match(r.riga, /3 tentativi sotto soglia/);
  assert.match(r.riga, /tenuta la più lontana/);
});

test("una variante nuova che non passa l'impaginazione e' scartata e conta come tentativo", async () => {
  const v2 = prossimaVariante("s", V1, 2, [V1], [VARIANTE_BASE]);
  const f = finto({ "scrivania/scena": VICINA, "*": LONTANA }, { [`${v2.stile}/${v2.gancio}`]: ["titolo fuori"] });
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("prima", VICINA)], ...f });
  assert.equal(f.chiamate.impaginazione.length, 2);
  assert.equal(f.chiamate.impronta.length, 2);
  assert.notDeepEqual(r.variante, v2);
  assert.notDeepEqual(r.variante, V1);
  assert.match(r.riga, /scartata dall'impaginazione/);
});

test("se nessuna variante nuova passa l'impaginazione si tiene la prima", async () => {
  const f = finto({ "scrivania/scena": VICINA, "*": LONTANA }, {});
  f.controllaImpaginazione = async () => ["sempre fuori"];
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("prima", VICINA)], ...f });
  assert.deepEqual(r.variante, V1);
  assert.deepEqual(r.impronta, VICINA);
});

test("un errore di ffmpeg al primo colpo salta il controllo senza impronta", async () => {
  const f = finto({ "*": new Error("ffmpeg è uscito con codice 1") });
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("prima", VICINA)], ...f });
  assert.deepEqual(r.variante, V1);
  assert.equal(r.impronta, undefined);
  assert.match(r.riga, /controllo saltato: ffmpeg è uscito con codice 1/);
});

test("un errore a meta' dei tentativi ferma il controllo e tiene la piu' lontana gia' provata", async () => {
  const f = finto({ "scrivania/scena": VICINA, "*": new Error("browser chiuso") });
  const r = await scegliDiversa({ slug: "s", variante: V1, recenti: [voce("prima", VICINA)], ...f });
  assert.deepEqual(r.variante, V1);
  assert.deepEqual(r.impronta, VICINA);
  assert.match(r.riga, /interrotto: browser chiuso/);
});

const conFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

test("ffmpeg vero: un'immagine rossa uniforme ha dHash nullo e colore rosso", { skip: !conFfmpeg && "ffmpeg assente" }, async () => {
  const png = spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=red:s=64x48", "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "pipe:1"]).stdout;
  const f = await improntaFotogramma(png);
  assert.match(f, /^0{16}#f[0-9a-f]0[0-9a-f]0[0-9a-f]$/);
});

test("ffmpeg vero: un'immagine illeggibile e' un errore, non un'impronta", { skip: !conFfmpeg && "ffmpeg assente" }, async () => {
  await assert.rejects(improntaFotogramma(Buffer.from("non e' un png")), /ffmpeg/);
});

test("la soglia sta fra 0 e 1", () => {
  assert.ok(SOGLIA > 0 && SOGLIA < 1);
});
