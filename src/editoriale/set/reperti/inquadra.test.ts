import { test } from "node:test";
import assert from "node:assert/strict";

import { proietta, rettangoloDi } from "../geometria.ts";
import { LARGHEZZA, MARGINE } from "../../../impaginazione.ts";
import { angoliReperto, inquadraReperto, SAGOME } from "./inquadra.ts";

const FASCIA = { alto: 700, basso: 1300 };

for (const nome of ["telefono", "carta", "lucchetto"] as const) {
  test(`${nome}: girato fino al massimo resta fra il titolo e i sottotitoli e dentro i margini`, () => {
    const cam = inquadraReperto(SAGOME[nome], FASCIA.alto, FASCIA.basso);
    for (const giro of [-0.4, 0, 0.4]) {
      const r = rettangoloDi(angoliReperto(SAGOME[nome], giro).map((p) => proietta(p, cam)));
      assert.ok(r.y >= FASCIA.alto - 2 && r.y + r.h <= FASCIA.basso + 2, `${nome} ${giro}: y ${r.y}–${r.y + r.h}`);
      assert.ok(r.x >= MARGINE - 2 && r.x + r.w <= LARGHEZZA - MARGINE + 2, `${nome} ${giro}: x ${r.x}–${r.x + r.w}`);
    }
  });
}

test("il reperto e' grande: riempie almeno l'80% della fascia in una delle due direzioni", () => {
  for (const nome of ["telefono", "carta", "lucchetto"] as const) {
    const cam = inquadraReperto(SAGOME[nome], FASCIA.alto, FASCIA.basso);
    const r = rettangoloDi(angoliReperto(SAGOME[nome], 0).map((p) => proietta(p, cam)));
    assert.ok(r.h >= 0.8 * (FASCIA.basso - FASCIA.alto) || r.w >= 0.8 * (LARGHEZZA - 2 * MARGINE), `${nome}: ${r.w}×${r.h}`);
  }
});
