import type { Dettagli } from "../../dettagli.ts";
import { ALFA_ALONE } from "../../dettagli.ts";
import { conAlfa } from "../../stili/alfa.ts";
import { casuale } from "../../tratto.ts";
import type { Ctx } from "../disegni.ts";
import { aCapo, MITTENTE_NEUTRO, scriviEntro } from "../disegni.ts";
import { CORPO_NOTIFICA_TELEFONO, NOTIFICA_TELEFONO_PX, opzionePx, RIGA_NOTIFICA_TELEFONO, TELEFONO_PX } from "../telefono.ts";

const SANS = "Inter, system-ui, sans-serif";

/** Indice della riga evidenziata nella schermata del telefono. */
export const RIGA_EVIDENZIATA = 3;
const RIGHE_ELENCO = 7;

/** Che cosa mostra il telefono: la schermata di blocco, un elenco (impostazioni o app) con la riga di `indica`, i metodi d'accesso. */
export type SchermoTelefono =
  | { tipo: "blocco"; titolo?: string }
  | { tipo: "elenco"; riga: string; titolo: string; menu?: string[]; app: boolean }
  | { tipo: "opzioni"; opzioni: string[] };

/** Quello che la schermata del telefono prende dai dettagli del video. */
export type AspettoTelefono = Pick<Dettagli, "ora" | "sfondo">;

const barraStato = (ctx: Ctx, colore: string, ora: string) => {
  const W = TELEFONO_PX.w;
  ctx.fillStyle = colore; ctx.font = `600 30px ${SANS}`; ctx.textBaseline = "middle";
  ctx.textAlign = "left"; ctx.fillText(ora, 52, 60);
  ctx.textAlign = "right"; ctx.fillText("▮▮▮  82%", W - 52, 60);
  ctx.textAlign = "left";
};

// testata di un'app: fascia scura con un segno geometrico neutro, nessun marchio
const testataApp = (ctx: Ctx, ora: string, titolo?: string) => {
  const W = TELEFONO_PX.w;
  ctx.fillStyle = "#24364d"; ctx.fillRect(0, 0, W, 250);
  barraStato(ctx, "#eef1f5", ora);
  ctx.fillStyle = "#e9edf2"; ctx.beginPath(); ctx.roundRect(48, 140, 64, 64, 16); ctx.fill();
  if (titolo) { ctx.font = `650 40px ${SANS}`; ctx.fillStyle = "#f4f6f8"; scriviEntro(ctx, titolo, 136, 174, W - 190); }
  else { ctx.fillStyle = "rgba(233,237,242,0.6)"; ctx.beginPath(); ctx.roundRect(136, 164, 260, 20, 10); ctx.fill(); }
};

// l'alone si spegne prima del bordo alto e di quello basso: a tutto quadro attorno al disegno c'e' la tinta unita
const sfondoBlocco = (ctx: Ctx, { fondo, alone }: AspettoTelefono["sfondo"]) => {
  const { w: W, h: H } = TELEFONO_PX;
  ctx.fillStyle = fondo; ctx.fillRect(0, 0, W, H);
  if (!alone) return;
  const g = ctx.createRadialGradient(W / 2, H * 0.36, 0, W / 2, H * 0.36, H * 0.34);
  g.addColorStop(0, conAlfa(alone, ALFA_ALONE)); g.addColorStop(1, conAlfa(alone, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
};

const blocco = (ctx: Ctx, ora: string, titolo?: string) => {
  const { w: W } = TELEFONO_PX;
  barraStato(ctx, "#e8e8ea", ora);
  ctx.fillStyle = "#e8e8ea"; ctx.textAlign = "center"; ctx.font = `300 160px ${SANS}`; ctx.fillText(ora, W / 2, 270);
  ctx.textAlign = "left";
  if (!titolo) return;
  ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.roundRect(40, 620, W - 80, 170, 34); ctx.fill();
  ctx.fillStyle = "#f3f4f6"; ctx.font = `600 34px ${SANS}`;
  aCapo(ctx, titolo, W - 160, 2).forEach((r, i) => scriviEntro(ctx, r, 80, 680 + i * 46, W - 160));
};

// L'elenco, sempre scuro (i titoli bianchi ci passano sopra): la riga di `indica` e' la quarta, evidenziata; le altre sono le
// voci del copione o righe grigie senza parole. Nelle app la testata dell'app al posto di «Impostazioni».
const elenco = (ctx: Ctx, ora: string, riga: string, titolo: string, menu: string[] | undefined, app: boolean) => {
  const W = TELEFONO_PX.w;
  if (app) testataApp(ctx, ora, titolo);
  else {
    barraStato(ctx, "#e8e8ea", ora);
    ctx.fillStyle = "#f2f3f5"; ctx.font = `700 64px ${SANS}`; ctx.fillText("Impostazioni", 48, 190);
  }
  const altre = [...(menu ?? [])];
  const voci = Array.from({ length: RIGHE_ELENCO }, (_, i) => (i === RIGA_EVIDENZIATA ? riga : altre.shift() ?? ""));
  voci.forEach((voce, i) => {
    const y = 300 + i * 132;
    const evidenziata = i === RIGA_EVIDENZIATA;
    ctx.fillStyle = evidenziata ? "#25364f" : "#1c1d21";
    ctx.beginPath(); ctx.roundRect(32, y, W - 64, 112, 24); ctx.fill();
    ctx.fillStyle = ["#8fa9c9", "#9ab8a0", "#c9a98f", "#5b84c4", "#a7b28c", "#a39cc0", "#b0b0b0"][i];
    ctx.beginPath(); ctx.roundRect(60, y + 30, 52, 52, 12); ctx.fill();
    if (voce) {
      ctx.fillStyle = "#eceef1"; ctx.font = `${evidenziata ? 650 : 500} 36px ${SANS}`;
      scriviEntro(ctx, voce, 136, y + 57, W - 260);
    } else {
      ctx.fillStyle = "#34363c"; ctx.beginPath(); ctx.roundRect(136, y + 48, [220, 170, 250, 0, 190, 230, 160][i], 18, 9); ctx.fill();
    }
    ctx.fillStyle = "#6f737a"; ctx.textAlign = "right"; ctx.font = `500 36px ${SANS}`; ctx.fillText("›", W - 64, y + 56); ctx.textAlign = "left";
  });
};

// I metodi d'accesso: pulsanti grandi, uno sotto l'altro; quello escluso lo barra a mano la scena, non la schermata.
const opzioni = (ctx: Ctx, ora: string, voci: string[]) => {
  const W = TELEFONO_PX.w;
  testataApp(ctx, ora);
  ctx.fillStyle = "#cfcbc3";
  for (const [y, l] of [[330, 430], [380, 330]]) { ctx.beginPath(); ctx.roundRect(56, y, l, 22, 11); ctx.fill(); }
  voci.forEach((voce, i) => {
    const b = opzionePx(i);
    ctx.fillStyle = i === 0 ? "#2f6fd1" : "#ffffff"; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 28); ctx.fill();
    if (i > 0) { ctx.strokeStyle = "#2f6fd1"; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.fillStyle = i === 0 ? "#ffffff" : "#1d4f9a"; ctx.font = `650 44px ${SANS}`; ctx.textAlign = "center";
    scriviEntro(ctx, voce, W / 2, b.y + b.h / 2 + 2, b.w - 60);
    ctx.textAlign = "left";
  });
  ctx.fillStyle = "#d9d6cf"; ctx.beginPath(); ctx.roundRect(56, opzionePx(voci.length).y + 30, 360, 18, 9); ctx.fill();
};

/** Il colore della schermata dove il disegno finisce: a tutto quadro il riquadro attorno combacia. */
export const fondoTelefono = (s: SchermoTelefono, a: AspettoTelefono): string => (s.tipo === "opzioni" ? "#f4f2ee" : s.tipo === "blocco" ? a.sfondo.fondo : "#101113");

/** La schermata del telefono, con l'ora e lo sfondo del blocco dai dettagli del video. */
export const disegnoTelefono = (s: SchermoTelefono, a: AspettoTelefono) => (ctx: Ctx) => {
  const { w: W, h: H } = TELEFONO_PX;
  if (s.tipo === "blocco") sfondoBlocco(ctx, a.sfondo);
  else { ctx.fillStyle = fondoTelefono(s, a); ctx.fillRect(0, 0, W, H); }
  if (s.tipo === "blocco") blocco(ctx, a.ora, s.titolo);
  else if (s.tipo === "elenco") elenco(ctx, a.ora, s.riga, s.titolo, s.menu, s.app);
  else opzioni(ctx, a.ora, s.opzioni);
};

export const righeNotificaTelefono = (ctx: Ctx, messaggio: string) => {
  ctx.font = `650 ${CORPO_NOTIFICA_TELEFONO}px ${SANS}`;
  return aCapo(ctx, messaggio, NOTIFICA_TELEFONO_PX.w - 64, 3);
};

/** La notifica sulla schermata di blocco, dipinta a 2×: icona neutra, intestazione, «ora», il messaggio in grassetto. */
export const notificaTelefono = (messaggio: string, mittente = MITTENTE_NEUTRO) => (ctx: Ctx) => {
  const { w, h } = NOTIFICA_TELEFONO_PX;
  ctx.scale(2, 2);
  ctx.fillStyle = "rgba(46,48,54,0.96)"; ctx.beginPath(); ctx.roundRect(0.5, 0.5, w - 1, h - 1, 34); ctx.fill();
  ctx.fillStyle = "#8fa9c9"; ctx.beginPath(); ctx.roundRect(28, 26, 44, 44, 11); ctx.fill();
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillStyle = "#c3c7cd"; ctx.font = `500 30px ${SANS}`; scriviEntro(ctx, mittente, 88, 49, w - 200, 24);
  ctx.textAlign = "right"; ctx.fillText("ora", w - 30, 49); ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f3f4f6"; ctx.font = `650 ${CORPO_NOTIFICA_TELEFONO}px ${SANS}`;
  righeNotificaTelefono(ctx, messaggio).forEach((riga, i) => scriviEntro(ctx, riga, 32, RIGA_NOTIFICA_TELEFONO.prima + i * RIGA_NOTIFICA_TELEFONO.passo, w - 64));
};

// Griglia d'aerazione del router: file di asole scure su plastica grafite, con un po' di polvere.
export const griglia = (ctx: Ctx) => {
  const W = 1024, H = 680;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(10,10,12,0.75)";
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 14; c++) {
      ctx.beginPath(); ctx.roundRect(250 + c * 38, 120 + r * 50, 22, 34, 11); ctx.fill();
    }
  const rnd = casuale(81);
  ctx.fillStyle = "rgba(200,200,190,0.06)";
  for (let i = 0; i < 400; i++) { ctx.fillRect(rnd() * W, rnd() * H, 2, 2); }
};

// Faccia della carta: chip, simbolo senza contatto, cifre mascherate, scadenza; satinata con un graffio.
export const carta = (ctx: Ctx) => {
  const W = 976, H = 616;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#26354a"); g.addColorStop(1, "#18212e");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // chip
  const cx = 110, cy = 200;
  const oro = ctx.createLinearGradient(cx, cy, cx + 130, cy + 100);
  oro.addColorStop(0, "#bfae84"); oro.addColorStop(1, "#8d7d58");
  ctx.fillStyle = oro; ctx.beginPath(); ctx.roundRect(cx, cy, 130, 100, 16); ctx.fill();
  ctx.strokeStyle = "rgba(60,48,25,0.6)"; ctx.lineWidth = 3;
  for (const y of [cy + 33, cy + 66]) { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + 130, y); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx + 65, cy); ctx.lineTo(cx + 65, cy + 100); ctx.stroke();
  // senza contatto
  ctx.strokeStyle = "rgba(230,232,236,0.75)"; ctx.lineWidth = 5; ctx.lineCap = "round";
  for (const r of [18, 32, 46]) { ctx.beginPath(); ctx.arc(300, 250, r, -0.7, 0.7); ctx.stroke(); }
  ctx.fillStyle = "rgba(235,237,240,0.9)"; ctx.font = `500 58px ${SANS}`; ctx.textBaseline = "alphabetic";
  ctx.fillText("••••  ••••  ••••  4821", 110, 430);
  ctx.font = `500 30px ${SANS}`; ctx.fillStyle = "rgba(235,237,240,0.65)"; ctx.fillText("09/28", 110, 500);
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(620, 120); ctx.quadraticCurveTo(700, 140, 800, 132); ctx.stroke();
};

const chip = (ctx: Ctx, cx: number, cy: number, w: number, h: number) => {
  const oro = ctx.createLinearGradient(cx, cy, cx + w, cy + h);
  oro.addColorStop(0, "#c8b88f"); oro.addColorStop(1, "#8d7d58");
  ctx.fillStyle = oro; ctx.beginPath(); ctx.roundRect(cx, cy, w, h, 14); ctx.fill();
  ctx.strokeStyle = "rgba(60,48,25,0.55)"; ctx.lineWidth = 3;
  for (const y of [cy + h / 3, cy + (2 * h) / 3]) { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + w, y); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx + w / 2, cy); ctx.lineTo(cx + w / 2, cy + h); ctx.stroke();
};

const righeGrigie = (ctx: Ctx, colore: string, righe: [number, number, number, number][]) => {
  ctx.fillStyle = colore;
  for (const [x, y, l, s] of righe) { ctx.beginPath(); ctx.roundRect(x, y, l, s, s / 2); ctx.fill(); }
};

// Tessera con chip, chiara: fascia in alto, righe al posto dei dati, codice mascherato. Nessuno stemma, nessuna scritta d'ente.
export const tessera = (ctx: Ctx) => {
  const W = 976, H = 616;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#e3ece9"); g.addColorStop(1, "#c6d8d3");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#4f7f7a"; ctx.fillRect(0, 0, W, 120);
  righeGrigie(ctx, "rgba(240,246,244,0.75)", [[60, 46, 300, 26], [600, 50, 300, 18]]);
  chip(ctx, 80, 200, 140, 106);
  righeGrigie(ctx, "rgba(40,70,66,0.35)", [[290, 210, 420, 24], [290, 262, 320, 20], [290, 306, 380, 20]]);
  ctx.fillStyle = "rgba(30,52,49,0.8)"; ctx.font = `500 46px ${SANS}`; ctx.textBaseline = "alphabetic";
  ctx.fillText("••••  ••••  ••••  0731", 80, 470);
  for (let i = 0; i < 46; i++) ctx.fillRect(560 + i * 8, 520, i % 3 ? 3 : 5, 56);
};

// Documento d'identita' generico: rosato, foto stilizzata, righe al posto dei dati, chip piccolo.
export const documento = (ctx: Ctx) => {
  const W = 976, H = 616;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#f1e6df"); g.addColorStop(1, "#dcc9c0");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#cdb8ae"; ctx.beginPath(); ctx.roundRect(60, 120, 250, 320, 12); ctx.fill();
  ctx.fillStyle = "#9c877d"; ctx.beginPath(); ctx.arc(185, 240, 62, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(185, 420, 105, 90, 0, Math.PI, 0); ctx.fill();
  righeGrigie(ctx, "rgba(90,60,50,0.38)", [[360, 140, 380, 26], [360, 200, 300, 22], [360, 256, 340, 22], [360, 312, 260, 22], [60, 520, 620, 22]]);
  chip(ctx, 780, 160, 120, 92);
  ctx.strokeStyle = "rgba(150,110,100,0.25)"; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(820, 470, 30 + i * 12, 0, Math.PI * 2); ctx.stroke(); }
};

// Lettera del PIN: foglio piegato in tre, righe stampate, il riquadro del codice con le cifre coperte.
export const letteraPin = (ctx: Ctx) => {
  const W = 880, H = 600;
  ctx.fillStyle = "#f3f0e8"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.fillRect(0, 196, W, 3); ctx.fillRect(0, 398, W, 3);
  righeGrigie(ctx, "rgba(60,60,60,0.28)", [[60, 60, 260, 20], [60, 100, 420, 14], [60, 130, 380, 14], [60, 250, 520, 14], [60, 280, 470, 14], [60, 460, 560, 14], [60, 490, 500, 14], [60, 520, 300, 14]]);
  ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(560, 230, 260, 120, 10); ctx.stroke();
  ctx.fillStyle = "#2a2a2a"; ctx.font = `700 40px ${SANS}`; ctx.textBaseline = "middle"; ctx.fillText("PIN", 590, 268);
  ctx.font = `700 34px ${SANS}`; ctx.fillText("• • • • • • • •", 590, 318);
};
