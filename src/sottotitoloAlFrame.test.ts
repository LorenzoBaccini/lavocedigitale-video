import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { pianoScena } from "./editoriale/piani/index.ts";
import { costruisciLinea } from "./linea.ts";
import { bloccoRidondante } from "./ridondanza.ts";
import { propsFrase } from "./scenes/propsFrase.ts";
import { sottotitoloAlFrame } from "./sottotitoloAlFrame.ts";
import type { Storyboard } from "./storyboard/tipi.ts";
import type { Timing } from "./timing.ts";

const leggi = (nome: string) => JSON.parse(readFileSync(new URL(`../fixtures/${nome}`, import.meta.url), "utf8"));
const fixture = leggi("windows10.props.json") as { storyboard: Storyboard; timing: Timing };
const senzaVoce = (sb: Storyboard) => ({ storyboard: sb, timing: { voce: "elevenlabs" as const, clips: sb.frasi.map(() => ({ file: "x.wav", secondi: 3, inviluppo: Array(90).fill(0.5) })) } });
const casi = [fixture, senzaVoce(leggi("tutte-le-scene.storyboard.json")), senzaVoce(leggi("tutte-le-scene-2.storyboard.json"))];
const testoDi = (b: { parole: { t: string }[] }) => b.parole.map((p) => p.t).join(" ");

test("allarme: «ma c'è un problema.» non compare mai sotto «Ma c'è» e «un problema»", () => {
  const linea = costruisciLinea(fixture.timing, 30);
  for (let f = linea.inizi[1]; f < linea.inizi[2]; f++) {
    const s = sottotitoloAlFrame(fixture.storyboard, fixture.timing, linea, f);
    if (testoDi(s.blocco).includes("problema")) assert.ok(s.ridondante, `frame ${f}: «${testoDi(s.blocco)}» a schermo`);
  }
});

test("nessun sottotitolo ripete un testo che la scena scrive mentre il blocco e' a schermo", () => {
  for (const { storyboard, timing } of casi) {
    const linea = costruisciLinea(timing, 30);
    for (let f = 0; f < linea.totale; f++) {
      const s = sottotitoloAlFrame(storyboard, timing, linea, f);
      if (s.ridondante) continue;
      const i = linea.inizi.findLastIndex((x) => x <= f);
      const testi = pianoScena(propsFrase(storyboard, timing, linea, i), linea.durate[i]).testi.filter((t) => t.da < s.blocco.a);
      assert.ok(!bloccoRidondante(s.blocco, testi.map((t) => t.testo)), `${storyboard.slug} frame ${f}: «${testoDi(s.blocco)}»`);
    }
  }
});
