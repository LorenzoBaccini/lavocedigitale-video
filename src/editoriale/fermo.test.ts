import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

import { costruisciLinea } from "../linea.ts";
import { propsFrase } from "../scenes/propsFrase.ts";
import type { Storyboard } from "../storyboard/tipi.ts";
import type { Timing } from "../timing.ts";
import { scalaFerma, scenaFerma, SPINTA_FERMA } from "./fermo.ts";
import { pianoScena } from "./piani/index.ts";
import { frameScena } from "./transizione.ts";

const cartella = new URL("../../fixtures/", import.meta.url);
const fixture = readdirSync(cartella).filter((f) => f.endsWith(".storyboard.json"));
const leggi = (nome: string): Storyboard => JSON.parse(readFileSync(new URL(nome, cartella), "utf8"));

test("la chiusura integrata ferma l'ultima scena di contenuto; la cartolina nessuna", () => {
  const tipi = leggi("windows10.storyboard.json").frasi.map((f) => f.scena.tipo);
  assert.equal(scenaFerma(tipi, "integrata"), tipi.length - 2);
  assert.equal(scenaFerma(tipi, "cartolina"), undefined);
  assert.equal(scenaFerma(["chiusura"], "integrata"), undefined);
  assert.equal(scenaFerma(["gancio", "data"], "integrata"), undefined);
});

test("la scena ferma resta a scala 1 finche' dura, poi si avvicina piano fino alla fine della chiusura", () => {
  assert.equal(scalaFerma(0, 60, 90), 1);
  assert.equal(scalaFerma(59, 60, 90), 1);
  assert.equal(scalaFerma(60, 60, 90), 1);
  let prima = 1;
  for (let f = 61; f <= 150; f++) {
    const s = scalaFerma(f, 60, 90);
    assert.ok(s >= prima);
    prima = s;
  }
  assert.equal(scalaFerma(150, 60, 90), 1 + SPINTA_FERMA);
  assert.equal(scalaFerma(400, 60, 90), 1 + SPINTA_FERMA);
});

// La scena si ferma sul suo ultimo frame (frameScena): li' ogni testo del piano dev'essere gia' intero, anche con frasi
// cortissime (durata corta, copione al limite inferiore) e con ogni tipo di scena, 3D compresi, prima della chiusura.
test("sul frame fermo i testi della scena sono tutti interi, con frasi da 1 a 3 secondi", () => {
  let casi = 0;
  for (const nome of fixture) {
    const sb = leggi(nome);
    sb.frasi.forEach((frase, k) => {
      if (frase.scena.tipo === "chiusura") return;
      // la scena k come ultima di contenuto, seguita dalla chiusura
      const corto: Storyboard = { ...sb, frasi: [...sb.frasi.slice(0, k + 1), sb.frasi.at(-1)!] };
      for (const secondi of [1, 1.3, 1.6, 2, 2.5, 3]) {
        const timing: Timing = { voce: "elevenlabs", clips: corto.frasi.map(() => ({ file: "x.wav", secondi, inviluppo: Array(Math.round(secondi * 30)).fill(0.5) })) };
        const linea = costruisciLinea(timing, 30);
        const props = propsFrase(corto, timing, linea, k);
        const fermo = frameScena(Number.MAX_SAFE_INTEGER, props.durata);
        const { testi } = pianoScena(props, props.durata);
        for (const t of testi) assert.ok(t.da <= fermo, `${nome} frase ${k + 1} (${props.tipo}) a ${secondi} s: «${t.testo}» intero al frame ${t.da}, fermo al ${fermo}`);
        casi++;
      }
    });
  }
  assert.ok(casi > 300, `${casi} casi`);
});
