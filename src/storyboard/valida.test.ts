import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DISPOSITIVI, FORME_MAPPA, OGGETTI, REPERTI, SCHERMATE, SIMBOLI } from "./tipi.ts";
import { erroriVarieta, somiglianza, validaStoryboard } from "./valida.ts";

const leggi = (): any =>
  JSON.parse(readFileSync(new URL("../../fixtures/veloce.storyboard.json", import.meta.url), "utf8"));

/** Le fixture d'impaginazione hanno testi al limite e la chiusura vecchia: per loro contano solo campi e scene. */
export const erroriDiCampo = (input: unknown): string[] => {
  const esito = validaStoryboard(input, "lunga");
  return esito.ok ? [] : esito.errori.filter((e) => /^frasi\[\d+\]\.(scena|chiave)/.test(e));
};

const errori = (input: unknown): string[] => {
  const esito = validaStoryboard(input, "lunga");
  assert.equal(esito.ok, false);
  return esito.ok ? [] : esito.errori;
};

test("accetta lo storyboard del format veloce", () => {
  assert.equal(validaStoryboard(leggi(), "lunga").ok, true);
});

test("la notifica dell'allarme e' facoltativa, ma non oltre il suo limite", () => {
  const sb = leggi();
  delete sb.frasi[1].scena.notifica;
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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
  sb.frasi[4].chiave = "stessa LINGUA";
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
});

test("accetta un barrato di 26 caratteri e rifiuta 27", () => {
  const sb = leggi();
  sb.frasi[2].scena.barrato = "x".repeat(26);
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[2].scena.barrato = "x".repeat(27);
  assert.ok(errori(sb).some((e) => e.includes("frasi[2].scena.barrato")));
});

test("rifiuta la scena oggetto senza oggetto, anche senza indica", () => {
  const sb = leggi();
  sb.frasi[5].scena.oggetto = "nessuno";
  delete sb.frasi[5].scena.indica;
  delete sb.frasi[5].scena.menu;
  assert.ok(errori(sb).some((e) => e.includes("frasi[5].scena.oggetto: la scena oggetto vuole un oggetto vero")));
});

const fixture = (nome: string): any => JSON.parse(readFileSync(new URL(`../../fixtures/${nome}`, import.meta.url), "utf8"));
const AL_LIMITE = ["tutte-le-scene.storyboard.json", "tutte-le-scene-2.storyboard.json", "tutte-le-scene-3.storyboard.json"].map(fixture);

test("le fixture con i testi al limite passano la validazione", () => {
  for (const sb of AL_LIMITE) assert.deepEqual(erroriDiCampo(sb), []);
});

// le scene senza dispositivo hanno le loro fixture al limite, `scene-nuove` e `scene-nuove-2`
const SCENE_NUOVE = ["scene-nuove.storyboard.json", "scene-nuove-2.storyboard.json", "reperti.storyboard.json", "reperti-2.storyboard.json"].map(fixture);

test("le fixture al limite coprono tutti i tipi di scena e tutti gli oggetti", () => {
  const scene = AL_LIMITE.flatMap((sb) => sb.frasi.map((f: any) => f.scena));
  const tipi = new Set([...AL_LIMITE, ...SCENE_NUOVE].flatMap((sb) => sb.frasi.map((f: any) => f.scena.tipo)));
  const oggetti = new Set([...scene, ...leggi().frasi.map((f: any) => f.scena)].map((s: any) => s.oggetto));
  const TUTTI = ["gancio", "allarme", "oggetto", "data", "checklist", "rischio", "telefono", "documenti", "teaser", "numero", "confronto", "citazione", "simbolo", "passi", "flusso", "mappa", "reperto", "chiusura"];
  for (const t of TUTTI) assert.ok(tipi.has(t), t);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true, "15 lettere ci stanno");
  oggetto.scena.indica = "Riconfigurazioni ora";
  assert.ok(errori(sb).some((e) => e.endsWith("indica: «Riconfigurazioni» ha 16 lettere, massimo 15 per parola")));
});

test("simbolo: un pittogramma dell'elenco, titolo entro il limite, barrato vero o falso", () => {
  const sb = leggi();
  sb.frasi[4].scena = { tipo: "simbolo", etichetta: "Dal 14 ottobre", simbolo: "scudo", titolo: "x".repeat(24), barrato: true };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  delete sb.frasi[4].scena.barrato;
  assert.equal(validaStoryboard(sb, "lunga").ok, true, "barrato e' facoltativo");
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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

test("scene-nuove passa la validazione nei campi", () => {
  const sb = fixture("scene-nuove.storyboard.json");
  assert.deepEqual(erroriDiCampo(sb), []);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "area" };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[4].scena = { ...sb.frasi[4].scena, forma: "percorso", luoghi: ["Partenza", "Arrivo"] };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
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

test("mappa: un paese o una regione non sono luoghi della piantina", () => {
  const sb = leggi();
  const base = { tipo: "mappa", etichetta: "Dove", titolo: "App non disponibile", forma: "area" };
  for (const luogo of ["Paese o regione", "Il tuo paese", "Regioni escluse", "Fuori dall'Europa", "Nazione", "Tutto il mondo", "All'estero"]) {
    sb.frasi[4].scena = { ...base, luoghi: [luogo] };
    assert.ok(errori(sb).some((x) => x.startsWith("frasi[4].scena.luoghi[0]: la mappa è una piantina di strade")), luogo);
  }
  for (const luogo of ["Sportello del comune", "Ultima posizione", "Quartieri del centro", "Paesino"]) {
    sb.frasi[4].scena = { ...base, luoghi: [luogo] };
    assert.equal(validaStoryboard(sb, "lunga").ok, true, luogo);
  }
});

test("scene-nuove-2 (le mappe) passa la validazione nei campi", () => {
  const sb = fixture("scene-nuove-2.storyboard.json");
  assert.deepEqual(erroriDiCampo(sb), []);
  const mappe = sb.frasi.filter((f: any) => f.scena.tipo === "mappa").map((f: any) => f.scena);
  assert.deepEqual(mappe.map((m: any) => m.forma).sort(), [...FORME_MAPPA].sort());
  for (const m of mappe) {
    assert.equal(m.titolo.length, 24, m.titolo);
    assert.ok(m.luoghi.every((l: string) => l.length === 20), m.luoghi.join(" / "));
  }
});

const nuovo = () => leggi();

test("il gancio ha al massimo 10 parole", () => {
  const sb = nuovo();
  sb.frasi[0].testo = "Reinstallare Windows dieci oggi ha una trappola che in pochi conoscono.";
  assert.ok(errori(sb).includes("frasi[0].testo: il gancio ha 11 parole, al massimo 10"));
});

test("il gancio è un'affermazione, non una domanda", () => {
  const sb = nuovo();
  sb.frasi[0].testo = "Devi reinstallare Windows dieci, una trappola?";
  assert.ok(errori(sb).includes("frasi[0].testo: il gancio è un'affermazione, non una domanda"));
});

test("la domanda finale finisce con il punto di domanda e sta in 12 parole", () => {
  const sb = nuovo();
  sb.frasi[7].testo = "Dimmi se passeresti a Windows undici.";
  assert.ok(errori(sb).includes("frasi[7].testo: la domanda finale finisce con «?»"));
  sb.frasi[7].testo = "E tu lo reinstalleresti da zero oppure passeresti proprio subito a Windows undici?";
  assert.ok(errori(sb).includes("frasi[7].testo: la domanda finale ha 13 parole, al massimo 12"));
});

test("niente rimandi al link o all'articolo, ma Linkedin passa", () => {
  const sb = nuovo();
  sb.frasi[5].testo = "Trovi il link sotto, poi iscrivi il PC.";
  sb.frasi[5].chiave = "iscrivi";
  assert.ok(errori(sb).includes("frasi[5].testo: niente rimandi al link o all'articolo, il video dà la soluzione intera"));
  sb.frasi[5].testo = "Nell'articolo c'è il passo per iscrivere il PC.";
  assert.ok(errori(sb).some((e) => e.startsWith("frasi[5].testo: niente rimandi")));
  sb.frasi[5].testo = "Su Linkedin lo dicono: iscrivi il PC all'ESU.";
  assert.ok(!(validaStoryboard(sb, "lunga").ok ? [] : (validaStoryboard(sb, "lunga") as any).errori).some((e: string) => e.startsWith("frasi[5].testo")));
});

test("nessuna parentesi quadra nel testo: ElevenLabs la leggerebbe come regia", () => {
  const sb = nuovo();
  sb.frasi[5].testo = "Poi iscrivi il PC all'ESU [beta].";
  assert.ok(errori(sb).includes("frasi[5].testo: nessuna parentesi quadra nel testo"));
});

test("il tono è uno dell'elenco e al massimo tre sono le reazioni forti", () => {
  const sb = nuovo();
  sb.frasi[2].tono = "arrabbiato";
  assert.ok(errori(sb).some((e) => e.startsWith("frasi[2].tono: deve essere uno tra deciso")));
  sb.frasi[2].tono = "ridendo";
  sb.frasi[4].tono = "drammatico";
  sb.frasi[5].tono = "sospirando";
  assert.ok(errori(sb).some((e) => e.startsWith("toni: 4 frasi fra sussurrato, ironico, drammatico, ridendo e sospirando, al massimo 3")));
});

test("almeno meta' delle frasi sono recitate: un copione tutto deciso suona piatto", () => {
  const sb = nuovo();
  for (const f of sb.frasi) delete f.tono;
  sb.frasi[0].tono = "curioso";
  assert.ok(errori(sb).includes("toni: 1 frasi recitate su 8, almeno 4: dai un tono a piu' frasi"));
});

test("maiuscole per l'enfasi e puntini per le pause passano", () => {
  const sb = nuovo();
  sb.frasi[1].testo = "Si può fare... ma il sistema nasce SCOPERTO.";
  assert.equal(validaStoryboard(sb, "lunga").ok, true, JSON.stringify(validaStoryboard(sb, "lunga")));
});

test("le parole contano anche la domanda finale", () => {
  const sb = nuovo();
  sb.frasi[4].testo = "Crea la chiavetta.";
  sb.frasi[4].chiave = "chiavetta";
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[1].testo = "Si può.";
  sb.frasi[1].chiave = "può";
  assert.ok(errori(sb).includes("copione: 51 parole, la durata lunga ne vuole da 56 a 72, domanda finale compresa"));
});

test("la domanda finale sta in 80 caratteri: oltre non entra nella fascia della chiusura integrata", () => {
  const sb = nuovo();
  sb.frasi[7].testo = "Preferiresti disattivare definitivamente l'aggiornamento automatico oppure tenerlo?";
  sb.frasi[7].chiave = "tenerlo";
  assert.ok(errori(sb).some((e) => e.startsWith("frasi[7].testo: la domanda finale ha 83 caratteri, al massimo 80")));
});

test("reperto: un oggetto dell'elenco, messaggio solo sul telefono, al massimo due per video", () => {
  const sb = leggi();
  sb.frasi[4].scena = { tipo: "reperto", etichetta: "Il messaggio", titolo: "x".repeat(24), reperto: "telefono", messaggio: "y".repeat(64) };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[4].scena.reperto = "pistola";
  assert.ok(errori(sb).includes(`frasi[4].scena.reperto: deve essere uno tra ${REPERTI.join(", ")}`));
  sb.frasi[4].scena.reperto = "telefono";
  sb.frasi[4].scena.messaggio = "y".repeat(65);
  assert.ok(errori(sb).includes("frasi[4].scena.messaggio: 65 caratteri, massimo 64"));
  sb.frasi[4].scena.reperto = "carta";
  sb.frasi[4].scena.messaggio = "Paga 1,99 euro";
  assert.ok(errori(sb).includes("frasi[4].scena.messaggio: il messaggio solo con telefono o email"));
  delete sb.frasi[4].scena.messaggio;
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[2].scena = { tipo: "reperto", etichetta: "La carta", titolo: "Spezzata", reperto: "lucchetto" };
  sb.frasi[6].scena = { tipo: "reperto", etichetta: "La carta", titolo: "Spezzata", reperto: "carta" };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  assert.ok(erroriVarieta(sb, []).some((e) => e.startsWith("sequenza: 3 scene «reperto», al massimo 2")));
});

test("reperti: la fixture ha tutti i reperti, testi al limite e un telefono senza messaggio", () => {
  const sb = fixture("reperti.storyboard.json");
  assert.deepEqual(erroriDiCampo(sb), []);
  const reperti = sb.frasi.filter((f: any) => f.scena.tipo === "reperto").map((f: any) => f.scena);
  for (const r of REPERTI) assert.ok(reperti.some((s: any) => s.reperto === r), r);
  assert.ok(reperti.some((s: any) => s.titolo.length === 24 && s.etichetta.length === 32));
  assert.ok(reperti.some((s: any) => s.reperto === "telefono" && s.messaggio === undefined));
});

test("gancio sul reperto: il reperto e i suoi testi sono facoltativi e controllati come nella scena reperto", () => {
  const sb = leggi();
  sb.frasi[0].scena = { ...sb.frasi[0].scena, reperto: "telefono", messaggio: "Pagamento sospetto: chiama subito", mittente: "Avviso carte" };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[0].scena.reperto = "lucchetto";
  assert.ok(errori(sb).includes("frasi[0].scena.messaggio: il messaggio solo con telefono o email"));
  assert.ok(errori(sb).includes("frasi[0].scena.mittente: il mittente solo con telefono, chiamata o email"));
});

test("chiamata ed email: chi chiama e chi scrive nel mittente, l'oggetto della mail nel messaggio", () => {
  const sb = leggi();
  sb.frasi[4].scena = { tipo: "reperto", etichetta: "La telefonata", titolo: "Il finto operatore", reperto: "chiamata", mittente: "x".repeat(28) };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[4].scena.mittente = "x".repeat(29);
  assert.ok(errori(sb).includes("frasi[4].scena.mittente: 29 caratteri, massimo 28"));
  sb.frasi[4].scena = { tipo: "reperto", etichetta: "La mail", titolo: "Il finto rimborso", reperto: "email", mittente: "Rimborsi", messaggio: "Hai un rimborso in attesa" };
  assert.equal(validaStoryboard(sb, "lunga").ok, true);
  sb.frasi[4].scena.reperto = "chiamata";
  assert.ok(errori(sb).includes("frasi[4].scena.messaggio: il messaggio solo con telefono o email"));
});

test("varieta': il video non si apre come uno degli ultimi due e non ricicla i loro reperti", () => {
  const sb = leggi();
  sb.frasi[0].scena = { ...sb.frasi[0].scena, reperto: "telefono" };
  sb.frasi[4].scena = { tipo: "reperto", etichetta: "Dopo", titolo: "Conto svuotato", reperto: "carta" };
  assert.deepEqual(erroriVarieta(sb, []), []);
  const apre = erroriVarieta(sb, [["citazione"], ["gancio:reperto:telefono", "numero"]]);
  assert.ok(apre.some((e) => e.startsWith("apertura: ")), apre.join("\n"));
  assert.deepEqual(erroriVarieta(sb, [["citazione"], ["citazione"], ["gancio:reperto:telefono"]]).filter((e) => e.startsWith("apertura")), [], "il terzo video fa ancora non conta");
  const ricicla = erroriVarieta(sb, [["gancio:smartphone", "reperto:carta"]]);
  assert.ok(ricicla.some((e) => e.startsWith("reperto: «carta»")), ricicla.join("\n"));
  // lo storico vecchio ha solo i tipi: non esclude niente
  assert.deepEqual(erroriVarieta(sb, [["gancio", "reperto"]]).filter((e) => /^(apertura|reperto):/.test(e)), []);
});

test("la somiglianza delle sequenze confronta i tipi, non i dettagli", () => {
  assert.equal(somiglianza(["gancio:smartphone", "reperto:carta"], ["gancio", "reperto:lucchetto"]), 1);
});
