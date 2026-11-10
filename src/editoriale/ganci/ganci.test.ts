import { test } from "node:test";
import assert from "node:assert/strict";

import { ALTEZZA, LARGHEZZA_UTILE } from "../../impaginazione.ts";
import type { PianoGancio } from "../piani/gancio.ts";
import { riquadroTitoloPagina, SCHEDA_BROWSER, TITOLO_PAGINA } from "../set/disegni.ts";
import { NOTTE } from "../stili/notte.ts";
import { SCHERMO } from "../stili/schermo.ts";
import { SCRIVANIA } from "../stili/scrivania.ts";
import { NOMI_TINTE, studio } from "../stili/studio.ts";
import { contrasto } from "../stili/colore.ts";
import { altezzaParola, emDi, FASCIA_PAROLA, lineeDi, STACCO_CHIAVE, titoloParola } from "../testate/parola.ts";
import { dettaglioDi, FINE_DETTAGLIO, MARGINE_DETTAGLIO, notificaSulloSchermo, pianoDettaglio, riquadroDettaglio, riquadroDettaglioSchermo, suoniDettaglio } from "./dettaglio.ts";
import { bloccoDiviso, coloriDiviso, FINE_DIVISO, tingiPerBlocco } from "./diviso.ts";

const STILI = [SCRIVANIA, NOTTE, SCHERMO, ...NOMI_TINTE.map(studio)];

const piano = (parole: string[], grande: [number, number], extra: Partial<PianoGancio> = {}): PianoGancio => ({
  parole: parole.map((t, i) => ({ t, da: i * 6 })),
  grande,
  sottolinea: 10,
  spinta: { da: 4, a: 26 },
  stacchi: [],
  testi: [],
  suoni: [],
  eventi: [],
  ...extra,
});

test("il dettaglio dipende dal contenuto: la notifica prima di tutto, poi cio' che l'oggetto mostra", () => {
  assert.equal(dettaglioDi({ oggetto: "chiavetta" }, true), "notifica");
  assert.equal(dettaglioDi({ oggetto: "smartphone" }, false), "telefono");
  assert.equal(dettaglioDi({ oggetto: "router" }, false), "oggetto");
  assert.equal(dettaglioDi({ oggetto: "portatile", schermata: "sito" }, false), "titolo");
  assert.equal(dettaglioDi({ oggetto: "portatile" }, false), "barra");
  assert.equal(dettaglioDi({ oggetto: "nessuno" }, false), "barra");
  assert.equal(riquadroDettaglio("oggetto", { titolo: "x" }), undefined);
  assert.ok(riquadroDettaglio("titolo", { titolo: "x", schermata: "sito" })!.y > riquadroDettaglio("titolo", { titolo: "x", schermata: "app" })!.y, "sotto la barra del browser");
});

test("il primo piano sul titolo della pagina contiene il titolo disegnato, con il margine: niente titolo tagliato", () => {
  for (const titolo of ["Fascicolo sanitario", "Carta d'identità elettronica: prenota il rinnovo online dal portale", "SPID"]) {
    for (const schermata of ["sito", "app"] as const) {
      const r = riquadroDettaglio("titolo", { titolo, schermata })!;
      const t = riquadroTitoloPagina(titolo, schermata);
      assert.ok(r.x <= t.x - MARGINE_DETTAGLIO + 1e-9 && r.y <= t.y - MARGINE_DETTAGLIO + 1e-9, titolo);
      assert.ok(r.x + r.w >= t.x + t.w + MARGINE_DETTAGLIO - 1e-9 && r.y + r.h >= t.y + t.h + MARGINE_DETTAGLIO - 1e-9, titolo);
    }
  }
  const lungo = riquadroTitoloPagina("Carta d'identità elettronica: prenota il rinnovo online dal portale", "sito");
  assert.equal(lungo.x + lungo.w, TITOLO_PAGINA.x + TITOLO_PAGINA.larghezza, "un titolo lungo va a capo nella colonna");
});

test("a tutto quadro, sul sito, il primo piano sta sulla scheda del browser e la contiene intera", () => {
  const r = riquadroDettaglioSchermo("titolo", { titolo: "Fascicolo sanitario", schermata: "sito" })!;
  assert.ok(r.x <= SCHEDA_BROWSER.x && r.y <= SCHEDA_BROWSER.y && r.x + r.w >= SCHEDA_BROWSER.x + SCHEDA_BROWSER.w && r.y + r.h >= SCHEDA_BROWSER.y + SCHEDA_BROWSER.h);
  assert.deepEqual(riquadroDettaglioSchermo("titolo", { titolo: "x", schermata: "app" }), riquadroDettaglio("titolo", { titolo: "x", schermata: "app" }));
});

test("aperto sulla notifica, il suono della notifica va sul primo fotogramma", () => {
  assert.deepEqual(suoniDettaglio([{ da: 70, suono: "notifica" }]), [{ da: 0, suono: "notifica" }]);
});

test("il suono si sposta solo se la notifica e' sullo schermo: a tutto quadro il telefono non la mostra", () => {
  const conAllarme = { contesto: { messaggioSeguente: "Accesso sospetto" } };
  assert.equal(notificaSulloSchermo({ oggetto: "smartphone", ...conAllarme }, false), true, "sul set sta sul portatile");
  assert.equal(notificaSulloSchermo({ oggetto: "smartphone", ...conAllarme }, true), false);
  assert.equal(notificaSulloSchermo({ oggetto: "chiavetta", ...conAllarme }, true), false);
  assert.equal(notificaSulloSchermo({ oggetto: "portatile", ...conAllarme }, true), true);
  assert.equal(notificaSulloSchermo({ oggetto: "nessuno", ...conAllarme }, true), true);
  assert.equal(notificaSulloSchermo({ oggetto: "portatile", contesto: {} }, false), false);
  assert.equal(dettaglioDi({ oggetto: "smartphone" }, notificaSulloSchermo({ oggetto: "smartphone", ...conAllarme }, true)), "telefono");
});

test("a dettaglio il titolo e la spinta aspettano che il primo piano si sia allargato", () => {
  const p = pianoDettaglio(piano(["Devi", "rinnovare", "la", "carta", "scaduta", "subito"], [3, 5]), 90);
  assert.ok(p.parole.every((w) => w.da >= FINE_DETTAGLIO));
  assert.equal(p.parole[5].da, 30, "le parole dette dopo restano a tempo");
  assert.ok(p.spinta.da >= FINE_DETTAGLIO && p.spinta.a === p.spinta.da + 22 && p.spinta.a <= 90);
  assert.ok(p.sottolinea >= FINE_DETTAGLIO + 4);
  const conNotifica = pianoDettaglio(piano(["Attenzione"], [0, 1], { notifica: 70, spinta: { da: 71, a: 90 } }), 90);
  assert.deepEqual(conNotifica.spinta, { da: 71, a: 90 }, "la notifica alla fine non si sposta");
});

test("il blocco del diviso parte dalla meta' (o sotto il titolo), sale fino al titolo e svanisce entro un secondo", () => {
  for (const limite of [700, 1100]) {
    assert.equal(bloccoDiviso(0, limite).basso, Math.max(ALTEZZA / 2, limite));
    assert.equal(bloccoDiviso(0, limite).pieno, 1);
    for (let f = 0; f < 40; f++) assert.ok(bloccoDiviso(f, limite).basso >= limite - 1e-9, "mai sopra la fine del titolo");
    assert.equal(bloccoDiviso(FINE_DIVISO, limite).pieno, 0);
    assert.equal(bloccoDiviso(FINE_DIVISO, limite).basso, limite);
  }
  assert.ok(FINE_DIVISO <= 30);
});

test("sul blocco il titolo e il logo si leggono (>= 3:1) in ogni stile e tinta, e il blocco e' l'accento", () => {
  for (const s of STILI) {
    const { fondo, testo } = coloriDiviso(s);
    assert.equal(fondo, s.colori.accento);
    assert.ok(contrasto(fondo, testo) >= 3, `${s.set} ${s.colori.fondo}: ${contrasto(fondo, testo).toFixed(2)}`);
  }
});

test("tinte del blocco: col blocco pieno il colore del blocco, svanito il colore di sempre", () => {
  const righe = [{ parole: [{ t: "Carta", da: 0 }], size: 100, sottolinea: { da: 4, durata: 9, colore: SCRIVANIA.colori.accento, seme: 4 } }];
  assert.equal(tingiPerBlocco(righe, SCRIVANIA, 1)[0].parole[0].colore, coloriDiviso(SCRIVANIA).testo);
  assert.equal(tingiPerBlocco(righe, SCRIVANIA, 0), righe);
});

// le domande piu' lunghe che il gancio scrive per intero (FRASE_TITOLO_MAX), con la chiave da 18 caratteri in ogni posizione:
// le stesse di fixtures/ganci-lunghi.storyboard.json, che il controllo d'impaginazione misura davvero
const DOMANDE = [
  "Devi proprio rinnovare lo SPID se ti basta la firma elettronica?",
  "Perché la batteria del telefono si scarica di notte se è spento?",
  "Perché lo smartphone si scarica di notte anche quando è spento?!",
];

test("parola: una domanda da 64 caratteri con una chiave da 18 sta nella fascia in ogni stile, nessuna parola esce dai margini", () => {
  let casi = 0;
  for (const domanda of DOMANDE) {
    assert.equal(domanda.length, 64);
    const parole = domanda.split(" ");
    for (let da = 0; da < parole.length; da++) {
      for (let a = da + 1; a <= parole.length; a++) {
        if (parole.slice(da, a).join(" ").length !== 18) continue;
        casi++;
        for (const s of STILI) {
          const righe = titoloParola(piano(parole, [da, a]), s);
          assert.ok(altezzaParola(righe, s) <= FASCIA_PAROLA.basso - FASCIA_PAROLA.alto, `${s.set}: ${altezzaParola(righe, s)}`);
          const grossa = righe.find((r) => r.sottolinea)!;
          for (const r of righe) {
            if (r !== grossa) assert.ok(grossa.size >= r.size * STACCO_CHIAVE - 1, "la chiave e' enorme rispetto al resto");
            for (const p of r.parole) assert.ok(emDi(p.t, r === grossa) * r.size * s.larghezza <= LARGHEZZA_UTILE, `${p.t} a ${r.size}`);
          }
        }
      }
    }
  }
  assert.ok(casi >= 4);
});

test("parola: le parole restano a tempo con la voce e la chiave e' una sola riga sottolineata", () => {
  const righe = titoloParola(piano(["Devi", "cambiare", "la", "password?"], [3, 4]), SCRIVANIA);
  assert.deepEqual(righe.flatMap((r) => r.parole.map((p) => p.da)), [0, 6, 12, 18]);
  assert.equal(righe.filter((r) => r.sottolinea).length, 1);
  assert.equal(righe.length, 2);
});

test("parola: la stima va a capo a parole intere", () => {
  assert.equal(lineeDi([{ t: "corta" }], 100, 1), 1);
  // tre parole che da sole riempiono quasi la riga: una per linea
  assert.equal(lineeDi([{ t: "aaaaaaaaaaaaaaa" }, { t: "aaaaaaaaaaaaaaa" }, { t: "aaaaaaaaaaaaaaa" }], 100, 1), 3);
});
