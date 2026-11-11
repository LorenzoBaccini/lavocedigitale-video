import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DISPOSITIVI, FORME_MAPPA, OGGETTI, SCHERMATE, SIMBOLI } from "./tipi.ts";
import { validaStoryboard } from "./valida.ts";

const leggi = (): any =>
  JSON.parse(readFileSync(new URL("../../fixtures/windows10.storyboard.json", import.meta.url), "utf8"));

const errori = (input: unknown): string[] => {
  const esito = validaStoryboard(input, "media", 2);
  assert.equal(esito.ok, false);
  return esito.ok ? [] : esito.errori;
};

test("accetta lo storyboard del prototipo", () => {
  assert.equal(validaStoryboard(leggi(), "media", 2).ok, true);
});

test("la notifica dell'allarme e' facoltativa, ma non oltre il suo limite", () => {
  const sb = leggi();
  delete sb.frasi[1].scena.notifica;
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[1].scena.notifica = "x".repeat(65);
  assert.ok(errori(sb).some((e) => e === "frasi[1].scena.notifica: 65 caratteri, massimo 64"));
  sb.frasi[1].scena.notifica = "";
  assert.ok(errori(sb).some((e) => e.startsWith("frasi[1].scena.notifica")));
});

test("rifiuta una frase senza chiave", () => {
  const sb = leggi();
  delete sb.frasi[2].chiave;
  assert.ok(errori(sb).some((e) => e.includes("frasi[2].chiave")));
});

test("rifiuta una chiave che non è nel testo", () => {
  const sb = leggi();
  sb.frasi[2].chiave = "frigorifero";
  assert.ok(errori(sb).some((e) => e.includes("frasi[2].chiave")));
});

test("accetta una chiave con maiuscole diverse dal testo", () => {
  const sb = leggi();
  sb.frasi[4].chiave = "stessa EDIZIONE";
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
});

test("rifiuta una chiave oltre 18 caratteri", () => {
  const sb = leggi();
  sb.frasi[3].testo = "Solo che dal quattordici ottobre duemilaventicinque non arrivano più aggiornamenti di sicurezza.";
  sb.frasi[3].chiave = "aggiornamenti di sicurezza";
  assert.ok(errori(sb).some((e) => e.includes("frasi[3].chiave")));
});

test("accetta indica sulla scena oggetto e rifiuta indica oltre 28 caratteri", () => {
  const sb = leggi();
  sb.frasi[5].scena.indica = "Verifica aggiornamenti";
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[5].scena.indica = "x".repeat(29);
  assert.ok(errori(sb).some((e) => e.includes("frasi[5].scena.indica")));
});

test("rifiuta un'ultima frase diversa dal testo fisso di chiusura", () => {
  const sb = leggi();
  sb.frasi[7].testo = "Trovi tutto nell'articolo su La Voce Digitale.";
  sb.frasi[7].chiave = "articolo";
  assert.ok(errori(sb).some((e) => e.includes("frasi[7].testo")));
});

test("rifiuta l'ultima scena diversa da chiusura", () => {
  const sb = leggi();
  sb.frasi[7].scena = { tipo: "teaser", testo: "Ciao" };
  assert.ok(errori(sb).some((e) => e.includes("chiusura")));
});

test("rifiuta un titolo oltre 24 caratteri e dice quale frase", () => {
  const sb = leggi();
  sb.frasi[0].scena.titolo = "x".repeat(25);
  assert.ok(errori(sb).some((e) => e.includes("frasi[0].scena.titolo")));
});

test("rifiuta un tipo di scena sconosciuto", () => {
  const sb = leggi();
  sb.frasi[1].scena = { tipo: "boh" };
  assert.ok(errori(sb).some((e) => e.includes("frasi[1].scena.tipo")));
});

test("rifiuta un oggetto fuori elenco", () => {
  const sb = leggi();
  sb.frasi[0].scena.oggetto = "frigorifero";
  assert.ok(errori(sb).some((e) => e.includes("frasi[0].scena.oggetto")));
});

test("rifiuta una data non YYYY-MM-DD", () => {
  const sb = leggi();
  sb.frasi[2].scena.data = "14/10/2025";
  assert.ok(errori(sb).some((e) => e.includes("frasi[2].scena.data")));
});

test("rifiuta una data che non esiste nel calendario", () => {
  for (const d of ["2026-02-30", "2026-04-31", "2025-02-29", "2026-13-01", "2026-00-10"]) {
    const sb = leggi();
    sb.frasi[2].scena.data = d;
    assert.ok(errori(sb).some((e) => e.includes("frasi[2].scena.data")), d);
  }
  const sb = leggi();
  sb.frasi[2].scena.data = "2028-02-29";
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
});

test("accetta un barrato di 26 caratteri e rifiuta 27", () => {
  const sb = leggi();
  sb.frasi[2].scena.barrato = "x".repeat(26);
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[2].scena.barrato = "x".repeat(27);
  assert.ok(errori(sb).some((e) => e.includes("frasi[2].scena.barrato")));
});

test("rifiuta indica su una scena oggetto senza oggetto", () => {
  const sb = leggi();
  sb.frasi[5].scena.oggetto = "nessuno";
  assert.ok(errori(sb).some((e) => e.includes("frasi[5].scena.indica")));
  delete sb.frasi[5].scena.indica;
  delete sb.frasi[5].scena.menu;
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
});

const fixture = (nome: string): any => JSON.parse(readFileSync(new URL(`../../fixtures/${nome}`, import.meta.url), "utf8"));
const AL_LIMITE = ["tutte-le-scene.storyboard.json", "tutte-le-scene-2.storyboard.json", "tutte-le-scene-3.storyboard.json"].map(fixture);

test("le fixture con i testi al limite passano la validazione", () => {
  for (const sb of AL_LIMITE) assert.deepEqual(validaStoryboard(sb, "media", 2), { ok: true, storyboard: sb });
});

test("le fixture al limite coprono tutti i tipi di scena e tutti gli oggetti", () => {
  const scene = AL_LIMITE.flatMap((sb) => sb.frasi.map((f: any) => f.scena));
  const tipi = new Set(scene.map((s: any) => s.tipo));
  const oggetti = new Set([...scene, ...leggi().frasi.map((f: any) => f.scena)].map((s: any) => s.oggetto));
  for (const t of ["gancio", "allarme", "oggetto", "data", "checklist", "rischio", "telefono", "documenti", "teaser", "numero", "confronto", "citazione", "chiusura"]) assert.ok(tipi.has(t), t);
  for (const d of DISPOSITIVI) assert.ok(scene.some((s: any) => s.dispositivo === d) || d === "portatile", d);
  for (const sc of SCHERMATE) assert.ok(scene.some((s: any) => s.schermata === sc) || sc === "sistema", sc);
  const pezzi = new Set(scene.flatMap((s: any) => (s.pezzi ?? []).map((p: any) => p.oggetto)));
  assert.ok(pezzi.size >= 3);
  for (const o of OGGETTI) assert.ok(oggetti.has(o), o);
});

test("raccoglie tutti gli errori senza fermarsi al primo", () => {
  const sb = leggi();
  sb.frasi[0].scena.titolo = "x".repeat(25);
  sb.frasi[2].scena.data = "14/10/2025";
  assert.ok(errori(sb).length >= 2);
});

test("i campi d'ambientazione sono facoltativi e controllati", () => {
  const sb = leggi();
  for (const f of sb.frasi) for (const c of ["schermata", "dispositivo", "mittente", "menu"]) delete f.scena[c];
  delete sb.orologio;
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.orologio = "2025-02-29";
  sb.frasi[0].scena.schermata = "desktop";
  sb.frasi[1].scena.dispositivo = "tablet";
  sb.frasi[1].scena.mittente = "x".repeat(29);
  sb.frasi[5].scena.menu = [];
  const e = errori(sb);
  for (const atteso of ["storyboard.orologio", "frasi[0].scena.schermata", "frasi[1].scena.dispositivo", "frasi[1].scena.mittente", "frasi[5].scena.menu"]) {
    assert.ok(e.some((x) => x.startsWith(atteso)), atteso);
  }
  sb.frasi[5].scena.menu = ["Sistema", "x".repeat(19)];
  assert.ok(errori(sb).includes("frasi[5].scena.menu[1]: 19 caratteri, massimo 18"));
});

test("telefono: da 2 a 3 opzioni, l'esclusa e' una di loro", () => {
  const sb = leggi();
  sb.frasi[3].scena = { tipo: "telefono", etichetta: "Con solo la CIE", titolo: "l'app non ti fa entrare", opzioni: ["Entra con SPID", "Entra con CIE"], esclusa: "Entra con CIE" };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[3].scena.esclusa = "Entra con la CIE";
  assert.ok(errori(sb).includes("frasi[3].scena.esclusa: deve essere una delle opzioni"));
  sb.frasi[3].scena.opzioni = ["Solo una"];
  delete sb.frasi[3].scena.esclusa;
  assert.ok(errori(sb).includes("frasi[3].scena.opzioni: da 2 a 3 voci"));
  sb.frasi[3].scena.opzioni = ["Entra con CIE", "Entra con CIE"];
  assert.ok(errori(sb).includes("frasi[3].scena.opzioni: ogni opzione una volta sola"));
});

test("azione facoltativa entro il limite; menu solo con indica", () => {
  const sb = leggi();
  sb.frasi[1].scena.azione = "x".repeat(29);
  assert.ok(errori(sb).includes("frasi[1].scena.azione: 29 caratteri, massimo 28"));
  delete sb.frasi[1].scena.azione;
  delete sb.frasi[5].scena.indica;
  assert.ok(errori(sb).includes("frasi[5].scena.menu: menu solo con indica"));
});

test("documenti: da 2 a 3 pezzi conosciuti, ognuno una volta", () => {
  const sb = leggi();
  sb.frasi[4].scena = { tipo: "documenti", etichetta: "Dal sito", titolo: "Entra dal sito", pezzi: [{ oggetto: "tessera", nota: "tessera sanitaria" }, { oggetto: "lettore", nota: "lettore e PIN" }] };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[4].scena.pezzi.push({ oggetto: "tessera", nota: "x".repeat(25) }, { oggetto: "busta", nota: "PIN" });
  const e = errori(sb);
  assert.ok(e.includes("frasi[4].scena.pezzi: da 2 a 3 pezzi"));
  sb.frasi[4].scena.pezzi.pop();
  const e2 = errori(sb);
  assert.ok(e2.includes("frasi[4].scena.pezzi[2].nota: 25 caratteri, massimo 24"));
  assert.ok(e2.includes("frasi[4].scena.pezzi: ogni oggetto una volta sola"));
});

test("indica e le note dei pezzi non hanno parole oltre il limite della colonna della nota", () => {
  const sb = leggi();
  const oggetto = sb.frasi.find((f: { scena: { tipo: string; indica?: string } }) => f.scena.tipo === "oggetto" && f.scena.indica !== undefined);
  oggetto.scena.indica = "Amministrazione";
  assert.equal(validaStoryboard(sb, "media", 2).ok, true, "15 lettere ci stanno");
  oggetto.scena.indica = "Riconfigurazioni ora";
  assert.ok(errori(sb).some((e) => e.endsWith("indica: «Riconfigurazioni» ha 16 lettere, massimo 15 per parola")));
});

test("simbolo: un pittogramma dell'elenco, titolo entro il limite, barrato vero o falso", () => {
  const sb = leggi();
  sb.frasi[4].scena = { tipo: "simbolo", etichetta: "Dal 14 ottobre", simbolo: "scudo", titolo: "x".repeat(24), barrato: true };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  delete sb.frasi[4].scena.barrato;
  assert.equal(validaStoryboard(sb, "media", 2).ok, true, "barrato e' facoltativo");
  sb.frasi[4].scena.simbolo = "razzo";
  assert.ok(errori(sb).includes(`frasi[4].scena.simbolo: deve essere uno tra ${SIMBOLI.join(", ")}`));
  sb.frasi[4].scena.simbolo = "scudo";
  sb.frasi[4].scena.titolo = "x".repeat(25);
  assert.ok(errori(sb).includes("frasi[4].scena.titolo: 25 caratteri, massimo 24"));
  sb.frasi[4].scena.titolo = "Niente patch";
  sb.frasi[4].scena.barrato = "sì";
  assert.ok(errori(sb).includes("frasi[4].scena.barrato: vero o falso"));
  sb.frasi[4].scena.barrato = false;
  sb.frasi[4].scena.etichetta = "x".repeat(33);
  assert.ok(errori(sb).includes("frasi[4].scena.etichetta: 33 caratteri, massimo 32"));
  sb.frasi[4].scena.etichetta = "Dal 14 ottobre";
  delete sb.frasi[4].scena.simbolo;
  assert.ok(errori(sb).some((e) => e.startsWith("frasi[4].scena.simbolo: deve essere uno tra")), "il simbolo e' obbligatorio");
});

test("passi: da 2 a 4 passi, testo entro 28 caratteri, simbolo facoltativo dell'elenco", () => {
  const sb = leggi();
  const passo = (testo: string) => ({ testo });
  sb.frasi[4].scena = { tipo: "passi", etichetta: "Prima di iniziare", passi: [{ testo: "x".repeat(28), simbolo: "wifi" }, passo("Collega il caricatore")] };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[4].scena.passi = [passo("Uno")];
  assert.ok(errori(sb).includes("frasi[4].scena.passi: da 2 a 4 passi"));
  sb.frasi[4].scena.passi = ["a", "b", "c", "d", "e"].map(passo);
  assert.ok(errori(sb).includes("frasi[4].scena.passi: da 2 a 4 passi"));
  sb.frasi[4].scena.passi = [passo("x".repeat(29)), passo("Due")];
  assert.ok(errori(sb).includes("frasi[4].scena.passi[0].testo: 29 caratteri, massimo 28"));
  sb.frasi[4].scena.passi = [passo(""), passo("Due")];
  assert.ok(errori(sb).includes("frasi[4].scena.passi[0].testo: testo obbligatorio"));
  sb.frasi[4].scena.passi = [{ testo: "Uno", simbolo: "razzo" }, passo("Due")];
  assert.ok(errori(sb).includes(`frasi[4].scena.passi[0].simbolo: deve essere uno tra ${SIMBOLI.join(", ")}`));
  sb.frasi[4].scena.passi = ["Uno", passo("Due")];
  assert.ok(errori(sb).includes("frasi[4].scena.passi[0]: oggetto richiesto"));
});

test("scene-nuove passa la validazione come media con ogni frase finale", () => {
  const sb = fixture("scene-nuove.storyboard.json");
  for (const fraseFinale of [0, 1, 2] as const) {
    const esito = validaStoryboard(sb, "media", fraseFinale);
    assert.equal(esito.ok, true, `${fraseFinale}: ${esito.ok ? "" : esito.errori.join("; ")}`);
  }
  assert.ok(sb.frasi.some((f: any) => f.scena.tipo === "simbolo" && f.scena.barrato === true));
  assert.ok(sb.frasi.some((f: any) => f.scena.tipo === "simbolo" && f.scena.titolo.length === 24));
  const passi = sb.frasi.filter((f: any) => f.scena.tipo === "passi").map((f: any) => f.scena.passi);
  assert.ok(passi.some((p: any[]) => p.length === 4 && p.every((x) => x.testo.length === 28) && p.some((x) => x.simbolo) && p.some((x) => !x.simbolo)));
  assert.ok(passi.some((p: any[]) => p.length === 2 && p.every((x) => !x.simbolo)));
  const flussi = sb.frasi.filter((f: any) => f.scena.tipo === "flusso").map((f: any) => f.scena.nodi);
  assert.ok(flussi.some((n: any[]) => n.length === 3 && n.every((x) => x.testo.length === 18) && n.every((x) => x.simbolo)));
  assert.ok(flussi.some((n: any[]) => n.length === 2));
});

test("flusso: da 2 a 3 nodi, testo entro 18 caratteri, simbolo facoltativo dell'elenco", () => {
  const sb = leggi();
  const nodo = (testo: string) => ({ testo });
  sb.frasi[4].scena = { tipo: "flusso", etichetta: "Come funziona", nodi: [{ testo: "x".repeat(18), simbolo: "wifi" }, nodo("Lo controlli"), nodo("Lo installi")] };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[4].scena.nodi = [nodo("Uno")];
  assert.ok(errori(sb).includes("frasi[4].scena.nodi: da 2 a 3 nodi"));
  sb.frasi[4].scena.nodi = ["a", "b", "c", "d"].map(nodo);
  assert.ok(errori(sb).includes("frasi[4].scena.nodi: da 2 a 3 nodi"));
  sb.frasi[4].scena.nodi = [nodo("x".repeat(19)), nodo("Due")];
  assert.ok(errori(sb).includes("frasi[4].scena.nodi[0].testo: 19 caratteri, massimo 18"));
  sb.frasi[4].scena.nodi = [nodo(""), nodo("Due")];
  assert.ok(errori(sb).includes("frasi[4].scena.nodi[0].testo: testo obbligatorio"));
  sb.frasi[4].scena.nodi = [{ testo: "Uno", simbolo: "razzo" }, nodo("Due")];
  assert.ok(errori(sb).includes(`frasi[4].scena.nodi[0].simbolo: deve essere uno tra ${SIMBOLI.join(", ")}`));
  sb.frasi[4].scena.nodi = ["Uno", nodo("Due")];
  assert.ok(errori(sb).includes("frasi[4].scena.nodi[0]: oggetto richiesto"));
});

test("mappa: un luogo con punto e area, due con percorso, ciascuno entro 20 caratteri, forma dell'elenco", () => {
  const sb = leggi();
  sb.frasi[4].scena = { tipo: "mappa", etichetta: "Dove", titolo: "x".repeat(24), forma: "punto", luoghi: ["x".repeat(20)] };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "area" };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "percorso", luoghi: ["Partenza", "Arrivo"] };
  assert.equal(validaStoryboard(sb, "media", 2).ok, true);
  sb.frasi[4].scena.luoghi = ["Partenza"];
  assert.ok(errori(sb).includes("frasi[4].scena.luoghi: 2 luoghi con percorso"));
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "punto", luoghi: ["Qui", "Là"] };
  assert.ok(errori(sb).includes("frasi[4].scena.luoghi: 1 luogo con punto"));
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "area", luoghi: [] };
  assert.ok(errori(sb).includes("frasi[4].scena.luoghi: 1 luogo con area"));
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "cerchio", luoghi: ["Qui"] };
  assert.ok(errori(sb).includes(`frasi[4].scena.forma: deve essere uno tra ${FORME_MAPPA.join(", ")}`));
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "punto", luoghi: ["x".repeat(21)] };
  assert.ok(errori(sb).includes("frasi[4].scena.luoghi[0]: 21 caratteri, massimo 20"));
  sb.frasi[4].scena.luoghi = [""];
  assert.ok(errori(sb).includes("frasi[4].scena.luoghi[0]: testo obbligatorio"));
  sb.frasi[4].scena = { ...sb.frasi[4].scena, luoghi: ["Qui"], titolo: "x".repeat(25) };
  assert.ok(errori(sb).includes("frasi[4].scena.titolo: 25 caratteri, massimo 24"));
});

test("scene-nuove-2 (le mappe) passa la validazione come media con ogni frase finale", () => {
  const sb = fixture("scene-nuove-2.storyboard.json");
  for (const fraseFinale of [0, 1, 2] as const) {
    const esito = validaStoryboard(sb, "media", fraseFinale);
    assert.equal(esito.ok, true, `${fraseFinale}: ${esito.ok ? "" : esito.errori.join("; ")}`);
  }
  const mappe = sb.frasi.filter((f: any) => f.scena.tipo === "mappa").map((f: any) => f.scena);
  assert.deepEqual(mappe.map((m: any) => m.forma).sort(), [...FORME_MAPPA].sort());
  for (const m of mappe) {
    assert.equal(m.titolo.length, 24, m.titolo);
    assert.ok(m.luoghi.every((l: string) => l.length === 20), m.luoghi.join(" / "));
  }
});
