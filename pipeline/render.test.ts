import { test } from "node:test";
import assert from "node:assert/strict";

import { argomentiFinitura, argomentiRender } from "./render.ts";

test("argomentiRender passa props, gl e codec h264", () => {
  const a = argomentiRender("props.json", "grezzo.mp4", "swangle");
  assert.ok(a.includes("--props=props.json"));
  assert.ok(a.includes("--gl=swangle"));
  assert.ok(a.includes("--codec=h264"));
  assert.ok(a.includes("grezzo.mp4"));
});

test("argomentiRender usa il gl ricevuto", () => {
  assert.ok(argomentiRender("p.json", "o.mp4", "angle").includes("--gl=angle"));
});

test("argomentiRender usa tutti i processori ricevuti", () => {
  assert.ok(argomentiRender("p.json", "o.mp4", "swangle", 2).includes("--concurrency=2"));
});

test("argomentiFinitura rispetta le specifiche dei Reel Facebook", () => {
  const a = argomentiFinitura("grezzo.mp4", "finale.mp4").join(" ");
  for (const parte of [
    "-i grezzo.mp4",
    "-vf scale=out_range=tv",
    "-c:v libx264",
    "-profile:v high",
    "-pix_fmt yuv420p",
    "-g 60",
    "-keyint_min 60",
    "-sc_threshold 0",
    "-c:a aac",
    "-b:a 128k",
    "-ar 48000",
    "-ac 2",
    "-movflags +faststart",
  ]) assert.ok(a.includes(parte), parte);
  assert.ok(a.endsWith("finale.mp4"));
});
