import type { FraseFinale, NomeDurata } from "../editoriale/variante.ts";
import { contaParole, DISPOSITIVI, FRASI_CHIUSURA, LIMITI, LIMITI_DURATA, OGGETTI, paroleContenuto, PEZZI, SCHERMATE, TESTO_CHIUSURA } from "./tipi.ts";
import type { Scena, Storyboard } from "./tipi.ts";

export type EsitoValidazione = { ok: true; storyboard: Storyboard } | { ok: false; errori: string[] };

type Dict = Record<string, unknown>;

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const èDizionario = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);

function testo(o: Dict, campo: string, percorso: string, max: number, errori: string[], opzionale = false): void {
  const v = o[campo];
  if (v === undefined && opzionale) return;
  if (typeof v !== "string" || v.trim() === "") {
    errori.push(`${percorso}.${campo}: testo obbligatorio`);
  } else if (v.length > max) {
    errori.push(`${percorso}.${campo}: ${v.length} caratteri, massimo ${max}`);
  }
}

function oggetto(o: Dict, percorso: string, errori: string[]): void {
  if (!OGGETTI.includes(o.oggetto as never)) {
    errori.push(`${percorso}.oggetto: deve essere uno tra ${OGGETTI.join(", ")}`);
  }
}

// `Date.parse("2026-02-30")` in V8 è valido: si confronta il giorno dopo la conversione.
function èGiornoDelCalendario(v: string): boolean {
  const [a, m, g] = v.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, g));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === g;
}

function data(o: Dict, percorso: string, errori: string[], campo = "data", opzionale = false): void {
  const v = o[campo];
  if (v === undefined && opzionale) return;
  const valida = typeof v === "string" && DATA_ISO.test(v) && èGiornoDelCalendario(v);
  if (!valida) errori.push(`${percorso}.${campo}: formato YYYY-MM-DD richiesto`);
}

function unoTra(o: Dict, campo: string, ammessi: readonly string[], percorso: string, errori: string[]): void {
  if (o[campo] === undefined) return;
  if (!ammessi.includes(o[campo] as never)) errori.push(`${percorso}.${campo}: deve essere uno tra ${ammessi.join(", ")}`);
}

/** Un elenco di testi brevi, da `min` a `max`, ciascuno di al massimo `lung` caratteri. */
function elenco(o: Dict, campo: string, percorso: string, limiti: { min: number; max: number }, lung: number, errori: string[], opzionale = false): void {
  const v = o[campo];
  if (v === undefined && opzionale) return;
  if (!Array.isArray(v) || v.length < limiti.min || v.length > limiti.max) {
    errori.push(`${percorso}.${campo}: da ${limiti.min} a ${limiti.max} voci`);
    return;
  }
  v.forEach((t, i) => {
    if (typeof t !== "string" || t.trim() === "") errori.push(`${percorso}.${campo}[${i}]: testo obbligatorio`);
    else if (t.length > lung) errori.push(`${percorso}.${campo}[${i}]: ${t.length} caratteri, massimo ${lung}`);
  });
}

/** Le note a mano vanno a capo solo fra le parole: una parola troppo lunga non sta nella colonna. */
function parole(o: Dict, campo: string, percorso: string, errori: string[]): void {
  const v = o[campo];
  if (typeof v !== "string") return;
  const lunga = v.split(/\s+/).find((p) => p.length > LIMITI.parolaNota);
  if (lunga) errori.push(`${percorso}.${campo}: «${lunga}» ha ${lunga.length} lettere, massimo ${LIMITI.parolaNota} per parola`);
}

function pezzi(o: Dict, percorso: string, errori: string[]): void {
  const v = o.pezzi;
  if (!Array.isArray(v) || v.length < LIMITI.pezzi.min || v.length > LIMITI.pezzi.max) {
    errori.push(`${percorso}.pezzi: da ${LIMITI.pezzi.min} a ${LIMITI.pezzi.max} pezzi`);
    return;
  }
  v.forEach((pezzo, i) => {
    const p = `${percorso}.pezzi[${i}]`;
    if (!èDizionario(pezzo)) return void errori.push(`${p}: oggetto richiesto`);
    if (!PEZZI.includes(pezzo.oggetto as never)) errori.push(`${p}.oggetto: deve essere uno tra ${PEZZI.join(", ")}`);
    testo(pezzo, "nota", p, LIMITI.notaPezzo, errori);
    parole(pezzo, "nota", p, errori);
  });
  const nomi = v.filter(èDizionario).map((x) => x.oggetto);
  if (new Set(nomi).size !== nomi.length) errori.push(`${percorso}.pezzi: ogni oggetto una volta sola`);
}

function voci(o: Dict, percorso: string, errori: string[]): void {
  const v = o.voci;
  if (!Array.isArray(v) || v.length < LIMITI.voci.min || v.length > LIMITI.voci.max) {
    errori.push(`${percorso}.voci: da ${LIMITI.voci.min} a ${LIMITI.voci.max} voci`);
    return;
  }
  v.forEach((voce, i) => {
    const p = `${percorso}.voci[${i}]`;
    if (!èDizionario(voce)) return void errori.push(`${p}: oggetto richiesto`);
    testo(voce, "grande", p, LIMITI.grande, errori);
    testo(voce, "piccolo", p, LIMITI.piccolo, errori);
  });
}

function lato(o: Dict, nome: "a" | "b", percorso: string, errori: string[]): void {
  const p = `${percorso}.${nome}`;
  const v = o[nome];
  if (!èDizionario(v)) return void errori.push(`${p}: oggetto richiesto`);
  testo(v, "titolo", p, LIMITI.titolo, errori);
  testo(v, "valore", p, LIMITI.numero, errori);
}

const CONTROLLI: Record<string, (s: Dict, p: string, e: string[]) => void> = {
  gancio: (s, p, e) => {
    testo(s, "titolo", p, LIMITI.titolo, e);
    testo(s, "evidenza", p, LIMITI.evidenza, e);
    testo(s, "sottotitolo", p, LIMITI.sottotitolo, e);
    oggetto(s, p, e);
    unoTra(s, "schermata", SCHERMATE, p, e);
  },
  allarme: (s, p, e) => {
    testo(s, "sopra", p, LIMITI.etichetta, e);
    testo(s, "titolo", p, LIMITI.titolo, e);
    testo(s, "notifica", p, LIMITI.notifica, e, true);
    testo(s, "mittente", p, LIMITI.mittente, e, true);
    testo(s, "azione", p, LIMITI.azione, e, true);
    unoTra(s, "dispositivo", DISPOSITIVI, p, e);
  },
  oggetto: (s, p, e) => {
    testo(s, "etichetta", p, LIMITI.etichetta, e);
    testo(s, "titolo", p, LIMITI.titolo, e);
    testo(s, "evidenza", p, LIMITI.evidenza, e, true);
    testo(s, "conferma", p, LIMITI.conferma, e, true);
    testo(s, "indica", p, LIMITI.indica, e, true);
    parole(s, "indica", p, e);
    oggetto(s, p, e);
    if (s.oggetto === "nessuno" && s.indica !== undefined) e.push(`${p}.indica: indica solo con un oggetto`);
    unoTra(s, "schermata", SCHERMATE, p, e);
    elenco(s, "menu", p, LIMITI.menu, LIMITI.voceMenu, e, true);
    if (s.menu !== undefined && s.indica === undefined) e.push(`${p}.menu: menu solo con indica`);
  },
  data: (s, p, e) => {
    testo(s, "etichetta", p, LIMITI.etichetta, e);
    data(s, p, e);
    testo(s, "barrato", p, LIMITI.barrato, e, true);
    testo(s, "timbro", p, LIMITI.evidenza, e, true);
  },
  checklist: (s, p, e) => {
    testo(s, "etichetta", p, LIMITI.etichetta, e);
    voci(s, p, e);
    oggetto(s, p, e);
  },
  rischio: (s, p, e) => {
    testo(s, "sopra", p, LIMITI.etichetta, e);
    testo(s, "titolo", p, LIMITI.titolo, e);
    unoTra(s, "dispositivo", DISPOSITIVI, p, e);
  },
  telefono: (s, p, e) => {
    testo(s, "etichetta", p, LIMITI.etichetta, e);
    testo(s, "titolo", p, LIMITI.titolo, e);
    elenco(s, "opzioni", p, LIMITI.opzioni, LIMITI.opzione, e);
    if (Array.isArray(s.opzioni) && new Set(s.opzioni).size !== s.opzioni.length) e.push(`${p}.opzioni: ogni opzione una volta sola`);
    if (s.esclusa !== undefined && !(Array.isArray(s.opzioni) && s.opzioni.includes(s.esclusa))) e.push(`${p}.esclusa: deve essere una delle opzioni`);
  },
  documenti: (s, p, e) => {
    testo(s, "etichetta", p, LIMITI.etichetta, e);
    testo(s, "titolo", p, LIMITI.titolo, e);
    pezzi(s, p, e);
  },
  teaser: (s, p, e) => testo(s, "testo", p, LIMITI.testoTeaser, e),
  numero: (s, p, e) => {
    testo(s, "etichetta", p, LIMITI.etichetta, e);
    testo(s, "numero", p, LIMITI.numero, e);
    testo(s, "unita", p, LIMITI.etichetta, e, true);
    testo(s, "nota", p, LIMITI.sottotitolo, e, true);
  },
  confronto: (s, p, e) => {
    testo(s, "etichetta", p, LIMITI.etichetta, e);
    lato(s, "a", p, e);
    lato(s, "b", p, e);
  },
  citazione: (s, p, e) => {
    testo(s, "testo", p, LIMITI.testoCitazione, e);
    testo(s, "fonte", p, LIMITI.etichetta, e);
  },
  chiusura: () => {},
};

function validaFrase(frase: unknown, i: number, errori: string[]): number {
  const p = `frasi[${i}]`;
  if (!èDizionario(frase)) {
    errori.push(`${p}: oggetto richiesto`);
    return 0;
  }
  testo(frase, "testo", p, LIMITI.testoFrase, errori);
  testo(frase, "chiave", p, LIMITI.chiave, errori);
  if (typeof frase.chiave === "string" && typeof frase.testo === "string" && frase.chiave.trim() !== "") {
    if (!frase.testo.toLowerCase().includes(frase.chiave.toLowerCase())) {
      errori.push(`${p}.chiave: deve comparire nel testo della frase`);
    }
  }
  const scena = frase.scena;
  if (!èDizionario(scena)) {
    errori.push(`${p}.scena: oggetto richiesto`);
  } else if (typeof scena.tipo !== "string" || !Object.hasOwn(CONTROLLI, scena.tipo)) {
    errori.push(`${p}.scena.tipo: tipo di scena sconosciuto`);
  } else {
    CONTROLLI[scena.tipo](scena, `${p}.scena`, errori);
  }
  return typeof frase.testo === "string" ? contaParole(frase.testo) : 0;
}

/**
 * `durata` e `fraseFinale`: quelle della variante. Le parole sono quelle dette: le frasi prima della chiusura piu' la
 * frase finale scelta; l'ultima frase del copione resta comunque `TESTO_CHIUSURA`, la sostituzione viene dopo.
 */
export function validaStoryboard(input: unknown, durata: NomeDurata, fraseFinale: FraseFinale): EsitoValidazione {
  const limiti = LIMITI_DURATA[durata];
  const errori: string[] = [];
  if (!èDizionario(input)) return { ok: false, errori: ["storyboard: oggetto richiesto"] };

  if (typeof input.slug !== "string" || input.slug.trim() === "") errori.push("slug: testo obbligatorio");
  data(input, "storyboard", errori, "orologio", true);

  const frasi = input.frasi;
  if (!Array.isArray(frasi)) return { ok: false, errori: [...errori, "frasi: elenco richiesto"] };
  if (frasi.length < limiti.frasi.min || frasi.length > limiti.frasi.max) {
    errori.push(`frasi: ${frasi.length} frasi, la durata ${durata} ne vuole da ${limiti.frasi.min} a ${limiti.frasi.max}`);
  }

  const conteggi = frasi.map((f, i) => validaFrase(f, i, errori));
  const prima = conteggi.slice(0, -1).reduce((a, b) => a + b, 0);
  const dette = prima + contaParole(FRASI_CHIUSURA[fraseFinale].testo);
  if (dette < limiti.parole.min || dette > limiti.parole.max) {
    const ammesse = paroleContenuto(durata, fraseFinale);
    errori.push(`copione: ${prima} parole prima della chiusura (${dette} dette con la frase finale), la durata ${durata} ne vuole da ${ammesse.min} a ${ammesse.max} prima della chiusura`);
  }

  const ultima = frasi.at(-1);
  if (èDizionario(ultima) && èDizionario(ultima.scena) && ultima.scena.tipo !== "chiusura") {
    errori.push(`frasi[${frasi.length - 1}].scena.tipo: l'ultima scena deve essere chiusura`);
  }
  if (èDizionario(ultima) && typeof ultima.testo === "string" && ultima.testo.trim() !== TESTO_CHIUSURA) {
    errori.push(`frasi[${frasi.length - 1}].testo: l'ultima frase deve essere «${TESTO_CHIUSURA}»`);
  }

  return errori.length ? { ok: false, errori } : { ok: true, storyboard: input as unknown as Storyboard };
}

/** La sequenza dei tipi di scena, chiusura esclusa: e' quella che si confronta con i video recenti. */
export const sequenzaDi = (storyboard: Storyboard): string[] => storyboard.frasi.map((f) => f.scena.tipo).filter((t) => t !== "chiusura");

/** Da questa quota di scene uguali e nello stesso posto due video sembrano lo stesso. */
export const SOGLIA_SOMIGLIANZA = 0.7;
/** Quanti video recenti si confrontano. */
export const VIDEO_CONFRONTATI = 5;

/** Quota di posizioni con lo stesso tipo, sulla sequenza piu' lunga: 1 = stessa sequenza. */
export function somiglianza(a: string[], b: string[]): number {
  const n = Math.max(a.length, b.length);
  if (n === 0) return 1;
  let uguali = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) uguali++;
  return uguali / n;
}

/** Le notifiche sono un'eccezione: una sola per video. */
export const MASSIMO_ALLARMI = 1;
/** Al massimo meta' delle scene (chiusura esclusa) su un dispositivo, il resto su carta. */
export const massimoSuDispositivo = (scene: number) => Math.ceil(scene / 2);

/** La scena mostra uno schermo di telefono o portatile. */
export function suDispositivo(scena: Scena): boolean {
  if (scena.tipo === "oggetto") return scena.oggetto === "portatile" || scena.oggetto === "smartphone";
  return scena.tipo === "gancio" || scena.tipo === "allarme" || scena.tipo === "rischio" || scena.tipo === "telefono";
}

/**
 * La varieta' dello storyboard: mai lo stesso tipo due volte di fila (salvo due `data` con date diverse)
 * e mai una sequenza troppo simile a quella di uno degli ultimi video (`recenti`, dal piu' recente).
 */
export function erroriVarieta(storyboard: Storyboard, recenti: string[][]): string[] {
  const errori: string[] = [];
  storyboard.frasi.forEach((f, i) => {
    const precedente = storyboard.frasi[i - 1]?.scena;
    const prima = precedente?.tipo;
    if (f.scena.tipo !== prima || prima === "chiusura") return;
    if (prima !== "data") errori.push(`frasi[${i}].scena.tipo: «${prima}» due volte di fila; solo «data» può ripetersi`);
    else if (precedente?.tipo === "data" && f.scena.tipo === "data" && precedente.data === f.scena.data) {
      errori.push(`frasi[${i}].scena.data: due «data» di fila con la stessa data`);
    }
  });
  const sequenza = sequenzaDi(storyboard);
  const allarmi = sequenza.filter((t) => t === "allarme").length;
  if (allarmi > MASSIMO_ALLARMI) {
    errori.push(`sequenza: ${allarmi} scene «allarme», al massimo ${MASSIMO_ALLARMI}: la notifica solo se l'articolo parla di un messaggio vero, per le altre frasi scegli un'altra scena`);
  }
  const sui = storyboard.frasi.filter((f) => suDispositivo(f.scena)).length;
  const tetto = massimoSuDispositivo(sequenza.length);
  if (sui > tetto) {
    errori.push(`sequenza: ${sui} scene su un dispositivo (telefono o portatile) su ${sequenza.length}, al massimo ${tetto}: mostra le altre frasi su carta, con simboli, passi, flussi o mappe`);
  }
  for (const recente of recenti.slice(0, VIDEO_CONFRONTATI)) {
    const quota = somiglianza(sequenza, recente);
    if (quota >= SOGLIA_SOMIGLIANZA) {
      errori.push(`sequenza: ${Math.round(quota * 100)}% delle scene uguali e nello stesso posto di un video recente (${recente.join(" → ")}); cambia tipi e ordine`);
    }
  }
  return errori;
}
