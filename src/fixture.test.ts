import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leggi = (nome: string) => JSON.parse(readFileSync(new URL(`../fixtures/${nome}`, import.meta.url), "utf8"));

// windows10.props.json serve alle righe di comando (render, controllo); lo studio parte da storyboard e timing.
test("windows10.props.json e' l'unione di storyboard e timing della fixture", () => {
  assert.deepEqual(leggi("windows10.props.json"), { storyboard: leggi("windows10.storyboard.json"), timing: leggi("windows10.timing.json"), audioBase: "audio/fixture" });
});
