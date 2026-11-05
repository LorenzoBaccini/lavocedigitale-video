import { casuale } from "../tratto.ts";
import { dataOrologio, iconaNotifica } from "./ambiente.ts";
import { FINESTRA_PX, NOTIFICA_PX, NOTIFICA_SCALA, OROLOGIO_PX, PULSANTE_PX, SCHERMO_PX, TITOLO_FINESTRA_PX } from "./geometria.ts";

// Texture dipinte su canvas per il set: scrivania, desktop, notifica, finestra, tastiera, usura dell'alluminio.
export type Ctx = CanvasRenderingContext2D;
const SANS = "Inter, system-ui, sans-serif";

// rumore a valori su griglia, interpolato: base per venature e macchie
export const rumore = (seme: number, celle: number) => {
  const r = casuale(seme);
  const g = Array.from({ length: (celle + 1) * (celle + 1) }, r);
  const at = (i: number, j: number) => g[(j % (celle + 1)) * (celle + 1) + (i % (celle + 1))];
  return (x: number, y: number) => {
    const fx = x * celle, fy = y * celle;
    const i = Math.floor(fx), j = Math.floor(fy);
    const u = fx - i, v = fy - j;
    const s = (t: number) => t * t * (3 - 2 * t);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * s(u);
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * s(u);
    return a + (b - a) * s(v);
  };
};

export const pixel = (ctx: Ctx, w: number, h: number, fn: (x: number, y: number) => [number, number, number]) => {
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y);
      const k = (y * w + x) * 4;
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
};

// Rovere tinto scuro, tavola unica: fibra dritta e fitta che deriva piano, qualche fiamma larga, pochi graffi.
const venatura = (u: number, v: number, largo: (x: number, y: number) => number, fine: (x: number, y: number) => number) => {
  const deriva = largo(u * 0.6, v) * 2.2 + fine(u * 0.15, v * 0.8) * 0.25;
  const fibra = 0.5 + 0.5 * Math.sin((v * 150 + deriva * 6) * Math.PI);
  const fiamma = 0.5 + 0.5 * Math.sin((v * 9 + deriva * 1.4) * Math.PI);
  return { fibra, fiamma };
};

/** Il rovere con la tinta base data (rgb). */
export const legno = ([rr, gg, bb]: [number, number, number] = [118, 88, 64]) => (ctx: Ctx) => {
  const W = 1024, H = 1024;
  const largo = rumore(3, 5), fine = rumore(5, 40), macchie = rumore(8, 9), pori = rumore(9, 300);
  const r = casuale(21);
  pixel(ctx, W, H, (x, y) => {
    const u = x / W, v = y / H;
    const { fibra, fiamma } = venatura(u, v, largo, fine);
    const tono = 0.86 + 0.06 * fibra ** 4 + 0.07 * fiamma ** 6 - 0.06 * macchie(u, v) - 0.05 * pori(u * 0.2, v) + (r() - 0.5) * 0.03;
    return [rr * tono, gg * tono, bb * tono];
  });
  ctx.strokeStyle = "rgba(30,18,10,0.18)"; ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const x = r() * W, y = r() * H, l = 30 + r() * 110, a = (r() - 0.5) * 0.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
};

// Ruvidita' della scrivania: le venature lucidano diversamente, un alone d'uso dove si appoggiano le mani.
export const legnoRuvido = (ctx: Ctx) => {
  const W = 512, H = 512;
  const largo = rumore(3, 5), fine = rumore(5, 40), uso = rumore(13, 3);
  pixel(ctx, W, H, (x, y) => {
    const u = x / W, v = y / H;
    const { fibra } = venatura(u, v, largo, fine);
    const g = 255 * Math.min(1, Math.max(0, 0.58 + 0.12 * fibra - 0.2 * uso(u, v) + 0.06 * fine(u * 4, v * 4)));
    return [g, g, g];
  });
};

// Alluminio sabbiato: grana fine, qualche ditata ovale sul poggiapolsi e un graffio.
export const alluminioRuvido = (ctx: Ctx) => {
  const W = 512, H = 512;
  const fine = rumore(31, 128), largo = rumore(33, 5);
  const r = casuale(35);
  pixel(ctx, W, H, (x, y) => {
    const g = 255 * (0.42 + 0.08 * fine(x / W, y / H) + 0.08 * largo(x / W, y / H) + (r() - 0.5) * 0.04);
    return [g, g, g];
  });
  ctx.filter = "blur(10px)";
  for (const [x, y, rx, ry, a] of [[150, 400, 38, 26, 0.4], [360, 410, 34, 24, -0.3], [250, 360, 22, 16, 0.1], [400, 330, 18, 14, 0.6]]) {
    ctx.fillStyle = "rgba(20,20,20,0.35)";
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); ctx.fill();
  }
  ctx.filter = "none";
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 120); ctx.quadraticCurveTo(110, 116, 170, 128); ctx.stroke();
};

// Tastiera: tasti scuri con fughe, la fila funzioni piu' bassa, la barra spaziatrice; le lettere appena leggibili.
export const tastiera = (ctx: Ctx) => {
  const W = 1024, H = 360;
  ctx.fillStyle = "#0c0d0f"; ctx.fillRect(0, 0, W, H);
  const file = [
    { n: 14, h: 30, lettere: "" },
    { n: 14, h: 56, lettere: "\\1234567890'ì" },
    { n: 14, h: 56, lettere: "QWERTYUIOPè+" },
    { n: 13, h: 56, lettere: "ASDFGHJKLòàù" },
    { n: 12, h: 56, lettere: "<ZXCVBNM,.-" },
  ];
  const fuga = 8, x0 = 14;
  let y = 14;
  ctx.font = `500 15px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const fila of file) {
    const lato = (W - 2 * x0 - fuga * (fila.n - 1)) / fila.n;
    for (let i = 0; i < fila.n; i++) {
      const x = x0 + i * (lato + fuga);
      ctx.fillStyle = "#1c1d21"; ctx.beginPath(); ctx.roundRect(x, y, lato, fila.h, 5); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(x + 3, y + 2, lato - 6, 2);
      const l = fila.lettere[i - (fila.n - fila.lettere.length > 1 ? 1 : 0)];
      if (l) { ctx.fillStyle = "rgba(225,228,232,0.5)"; ctx.fillText(l, x + lato / 2, y + fila.h / 2); }
    }
    y += fila.h + fuga;
  }
  const spazio = { x: 290, w: 440 };
  const latoFila = 72;
  ctx.fillStyle = "#1c1d21";
  for (let x = x0; x < W - x0; x += latoFila + fuga) {
    if (x + latoFila > spazio.x && x < spazio.x + spazio.w) continue;
    ctx.beginPath(); ctx.roundRect(x, y, latoFila, 56, 5); ctx.fill();
  }
  ctx.beginPath(); ctx.roundRect(spazio.x, y, spazio.w, 56, 5); ctx.fill();
  // i tasti piu' usati sono lucidi: il «segno d'uso» che la plastica perfetta non ha
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  ctx.beginPath(); ctx.roundRect(spazio.x + 40, y + 10, spazio.w - 80, 36, 8); ctx.fill();
};

// ——— Desktop ———

// Sfondo: crinali al crepuscolo a strati, toni smorzati, con grana (niente gradiente liscio).
const sfondo = (ctx: Ctx) => {
  const { w, h } = SCHERMO_PX;
  const cielo = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  cielo.addColorStop(0, "#1b2230"); cielo.addColorStop(0.55, "#3a4150"); cielo.addColorStop(1, "#8a7360");
  ctx.fillStyle = cielo; ctx.fillRect(0, 0, w, h);
  const strati = [
    { base: 0.6, amp: 0.05, colore: "#5d5f68", seme: 41 },
    { base: 0.66, amp: 0.07, colore: "#41454f", seme: 43 },
    { base: 0.74, amp: 0.06, colore: "#2c3039", seme: 47 },
    { base: 0.84, amp: 0.05, colore: "#1c1f26", seme: 53 },
  ];
  for (const s of strati) {
    const n = rumore(s.seme, 7), m = rumore(s.seme + 1, 40);
    ctx.fillStyle = s.colore;
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * (s.base - s.amp * n(x / w, 0.5) - 0.012 * m(x / w, 0.3)));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  const r = casuale(61);
  const img = ctx.getImageData(0, 0, w, h);
  for (let k = 0; k < img.data.length; k += 4) {
    const d = (r() - 0.5) * 9;
    img.data[k] += d; img.data[k + 1] += d; img.data[k + 2] += d;
  }
  ctx.putImageData(img, 0, 0);
};

const cartella = (ctx: Ctx, x: number, y: number, nome: string) => {
  ctx.fillStyle = "#9aa7b5"; ctx.beginPath(); ctx.roundRect(x + 30, y + 14, 44, 12, 3); ctx.fill();
  ctx.fillStyle = "#b9c4d0"; ctx.beginPath(); ctx.roundRect(x + 30, y + 22, 84, 62, 5); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(x + 30, y + 22, 84, 4);
  ctx.font = `500 25px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillText(nome, x + 73, y + 99);
  ctx.fillStyle = "#f2f2f2"; ctx.fillText(nome, x + 72, y + 97);
};

const icona = (ctx: Ctx, x: number, y: number, disegno: (ctx: Ctx) => void) => {
  ctx.save(); ctx.translate(x, y); disegno(ctx); ctx.restore();
};

const barra = (ctx: Ctx, orologio?: string) => {
  const { w, h } = SCHERMO_PX;
  const y = h - 72;
  ctx.fillStyle = "rgba(28,29,32,0.94)"; ctx.fillRect(0, y, w, 72);
  ctx.fillStyle = "rgba(255,255,255,0.09)"; ctx.fillRect(0, y, w, 1.5);
  ctx.strokeStyle = "#d6d8dc"; ctx.fillStyle = "#d6d8dc"; ctx.lineWidth = 3; ctx.lineCap = "round";
  // menu generico (tre righe), ricerca, poi quattro app: cartella, browser, posta, note
  icona(ctx, 28, y + 22, (c) => { for (const r of [0, 12, 24]) { c.beginPath(); c.moveTo(0, r + 2); c.lineTo(30, r + 2); c.stroke(); } });
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.beginPath(); ctx.roundRect(84, y + 14, 330, 44, 22); ctx.fill();
  icona(ctx, 106, y + 24, (c) => { c.beginPath(); c.arc(10, 10, 9, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(17, 17); c.lineTo(25, 25); c.stroke(); });
  ctx.fillStyle = "#a9adb3"; ctx.font = `400 24px ${SANS}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("Cerca", 146, y + 37);
  icona(ctx, 452, y + 18, (c) => { c.fillStyle = "#b9c4d0"; c.beginPath(); c.roundRect(0, 8, 36, 26, 3); c.fill(); c.fillStyle = "#9aa7b5"; c.fillRect(0, 4, 16, 6); });
  icona(ctx, 520, y + 18, (c) => { c.strokeStyle = "#8fb3d9"; c.beginPath(); c.arc(18, 18, 16, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.ellipse(18, 18, 7, 16, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(2, 18); c.lineTo(34, 18); c.stroke(); });
  icona(ctx, 588, y + 22, (c) => { c.beginPath(); c.roundRect(0, 0, 38, 28, 3); c.stroke(); c.beginPath(); c.moveTo(1, 2); c.lineTo(19, 16); c.lineTo(37, 2); c.stroke(); });
  icona(ctx, 658, y + 18, (c) => { c.fillStyle = "#e3d9a6"; c.beginPath(); c.roundRect(0, 0, 32, 36, 3); c.fill(); c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = 2; for (const r of [11, 19, 27]) { c.beginPath(); c.moveTo(6, r); c.lineTo(26, r); c.stroke(); } });
  ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.fillRect(452, y + 66, 36, 3);
  // vassoio: freccia, rete, volume, batteria, lingua, ora e data
  ctx.strokeStyle = "#d6d8dc"; ctx.lineWidth = 2.5;
  icona(ctx, 2068, y + 30, (c) => { c.beginPath(); c.moveTo(0, 10); c.lineTo(8, 2); c.lineTo(16, 10); c.stroke(); });
  icona(ctx, 2110, y + 22, (c) => { for (const r of [6, 13, 20]) { c.beginPath(); c.arc(14, 28, r, -2.4, -0.74); c.stroke(); } });
  icona(ctx, 2160, y + 24, (c) => { c.beginPath(); c.moveTo(0, 8); c.lineTo(7, 8); c.lineTo(15, 1); c.lineTo(15, 23); c.lineTo(7, 16); c.lineTo(0, 16); c.closePath(); c.stroke(); c.beginPath(); c.arc(16, 12, 9, -0.8, 0.8); c.stroke(); });
  icona(ctx, 2210, y + 26, (c) => { c.beginPath(); c.roundRect(0, 0, 34, 18, 3); c.stroke(); c.fillStyle = "#d6d8dc"; c.fillRect(3, 3, 17, 12); c.fillRect(35, 5, 3, 8); });
  ctx.fillStyle = "#e6e7ea"; ctx.font = `500 22px ${SANS}`; ctx.textAlign = "center"; ctx.fillText("ITA", 2290, y + 37);
  ctx.textAlign = "right"; ctx.font = `500 23px ${SANS}`;
  const destra = OROLOGIO_PX.x + OROLOGIO_PX.w - 8;
  // senza la data del copione l'orologio mostra solo l'ora: mai una data inventata
  if (orologio) {
    ctx.fillText("10:24", destra, y + 22);
    ctx.fillText(dataOrologio(orologio), destra, y + 51);
  } else ctx.fillText("10:24", destra, y + 37);
};

const puntatore = (ctx: Ctx, x: number, y: number) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(1.5, 1.5);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(5.5, 17); ctx.lineTo(9.5, 26); ctx.lineTo(13, 24.5); ctx.lineTo(9, 15.5); ctx.lineTo(16, 15.5); ctx.closePath();
  ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.restore();
};

/** Il desktop del portatile: sfondo, tre cartelle, puntatore, barra con l'orologio (e la data, se il copione la da'). */
export const desktop = (orologio?: string) => (ctx: Ctx) => {
  sfondo(ctx);
  cartella(ctx, 40, 40, "Documenti");
  cartella(ctx, 40, 200, "Foto 2019");
  cartella(ctx, 40, 360, "Fatture");
  puntatore(ctx, 1310, 860);
  barra(ctx, orologio);
};

/** Corpo minimo di un testo informativo dentro una texture, in pixel dello schermo a 1080. */
export const CORPO_MINIMO = 34;

/**
 * Scrive una riga che non esce mai da `larghezza`: se col font corrente non ci sta, il corpo cala quanto serve,
 * ma mai sotto `minimo`; se non entra nemmeno al minimo la riga e' troncata con «…».
 * Il controllo d'impaginazione non vede dentro le texture: questo e' il loro margine. Restituisce il corpo usato.
 */
export function scriviEntro(ctx: Pick<Ctx, "font" | "measureText" | "fillText">, testo: string, x: number, y: number, larghezza: number, minimo = CORPO_MINIMO): number {
  const corpo = Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 16);
  const largo = ctx.measureText(testo).width;
  const voluto = largo > larghezza ? Math.floor(corpo * (larghezza / largo) * 10) / 10 : corpo;
  const adatto = Math.max(voluto, Math.min(minimo, corpo));
  const impostaCorpo = (c: number) => (ctx.font = ctx.font.replace(/\d+(?:\.\d+)?px/, `${c}px`));
  if (adatto !== corpo) impostaCorpo(adatto);
  let riga = testo;
  while (riga.length > 1 && ctx.measureText(riga).width > larghezza) {
    riga = `${riga.slice(0, -2).trimEnd()}…`;
  }
  ctx.fillText(riga, x, y);
  if (adatto !== corpo) impostaCorpo(corpo);
  return adatto;
}

/** Va a capo sulle parole entro `larghezza`; al massimo `righe` righe, l'ultima chiusa da «…» se non basta. */
export function aCapo(ctx: Ctx, testo: string, larghezza: number, righe: number): string[] {
  const uscita: string[] = [];
  let riga = "";
  for (const parola of testo.split(/\s+/).filter(Boolean)) {
    const prova = riga ? `${riga} ${parola}` : parola;
    if (ctx.measureText(prova).width <= larghezza || !riga) riga = prova;
    else {
      uscita.push(riga);
      riga = parola;
    }
  }
  if (riga) uscita.push(riga);
  if (uscita.length <= righe) return uscita;
  const tenute = uscita.slice(0, righe);
  tenute[righe - 1] += "…";
  return tenute;
}

/** Intestazione della notifica quando il copione non da' il `mittente`. */
export const MITTENTE_NEUTRO = "Notifica";

/** Corpo del messaggio della notifica, in pixel dello schermo (a 150 %). */
export const CORPO_NOTIFICA = 36;
/** Riga di base della prima riga del messaggio e interlinea, in pixel della notifica. */
export const RIGA_NOTIFICA = { prima: 118, passo: 50 };

// La notifica sul portatile, dipinta a 2× per il primo piano: icona, intestazione, messaggio, il link d'azione se c'e'. Nessun logo.
export const notifica = (messaggio: string, mittente = MITTENTE_NEUTRO, azione?: string) => (ctx: Ctx) => {
  const k = NOTIFICA_SCALA;
  const { w, h } = NOTIFICA_PX;
  ctx.scale(k, k);
  ctx.fillStyle = "#2a2b2e"; ctx.beginPath(); ctx.roundRect(0.5, 0.5, w - 1, h - 1, 14); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); ctx.translate(30, 27); ctx.strokeStyle = "#c9ccd1"; ctx.lineWidth = 2.2;
  if (iconaNotifica(mittente) === "scudo") {
    ctx.scale(1.1, 1.1);
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(22, 4); ctx.lineTo(22, 12); ctx.quadraticCurveTo(21, 22, 11, 27); ctx.quadraticCurveTo(1, 22, 0, 12); ctx.lineTo(0, 4); ctx.closePath();
  } else {
    ctx.beginPath(); ctx.roundRect(0, 1, 26, 26, 7);
  }
  ctx.stroke();
  ctx.restore();
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillStyle = "#a7abb1"; ctx.font = `500 25px ${SANS}`; scriviEntro(ctx, mittente, 70, 52, w - 190, 20);
  ctx.textAlign = "right"; ctx.fillText("ora", w - 66, 52);
  ctx.fillText("×", w - 28, 53);
  ctx.textAlign = "left";
  ctx.fillStyle = "#f3f4f6"; ctx.font = `650 ${CORPO_NOTIFICA}px ${SANS}`;
  righeNotifica(ctx, messaggio).forEach((riga, i) => scriviEntro(ctx, riga, 30, RIGA_NOTIFICA.prima + i * RIGA_NOTIFICA.passo, w - 64));
  if (azione) { ctx.fillStyle = "#8fb3d9"; ctx.font = `500 25px ${SANS}`; scriviEntro(ctx, azione, 30, h - 30, w - 64, 20); }
};

export const righeNotifica = (ctx: Ctx, messaggio: string) => {
  ctx.font = `650 ${CORPO_NOTIFICA}px ${SANS}`;
  return aCapo(ctx, messaggio, NOTIFICA_PX.w - 64, 3);
};

/** La schermata nella finestra: il sistema (impostazioni scure), una pagina web o un'app (chiare). */
export type TipoFinestra = "sistema" | "sito" | "app";

export interface Finestra {
  titolo: string;
  pulsante: string;
  /** voci della colonna a sinistra, l'ultima selezionata; senza, righe neutre senza parole */
  menu?: string[];
  tipo: TipoFinestra;
  orologio?: string;
}

const RIGHE_NEUTRE = 5;

/** La colonna di voci: le voci del copione (l'ultima selezionata) o righe grigie senza parole. */
function colonna(ctx: Ctx, x: number, y: number, menu: string[] | undefined, colori: { testo: string; scelta: string; testoScelta: string; neutra: string }) {
  const voci = menu?.length ? menu : Array.from({ length: RIGHE_NEUTRE }, () => "");
  voci.forEach((voce, i) => {
    const vy = y + i * 76;
    const scelta = i === voci.length - 1;
    if (scelta) { ctx.fillStyle = colori.scelta; ctx.beginPath(); ctx.roundRect(x + 14, vy - 30, 300, 60, 10); ctx.fill(); }
    if (voce) {
      ctx.fillStyle = scelta ? colori.testoScelta : colori.testo; ctx.font = `${scelta ? 600 : 400} 28px ${SANS}`;
      scriviEntro(ctx, voce, x + 40, vy, 260, 22);
    } else {
      ctx.fillStyle = colori.neutra; ctx.beginPath(); ctx.roundRect(x + 40, vy - 8, [170, 120, 150, 110, 190][i % 5], 16, 8); ctx.fill();
    }
  });
}

const ombraFinestra = (ctx: Ctx, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.filter = "blur(18px)"; ctx.fillRect(x + 10, y + 24, w, h); ctx.filter = "none";
};

// barra del browser: la scheda con il titolo e la barra dell'indirizzo con il lucchetto, senza un dominio scritto
const barraBrowser = (ctx: Ctx, x: number, y: number, w: number, titolo: string) => {
  ctx.fillStyle = "#d9dde2"; ctx.beginPath(); ctx.roundRect(x, y, w, 120, [14, 14, 0, 0]); ctx.fill();
  ctx.fillStyle = "#f6f4f0"; ctx.beginPath(); ctx.roundRect(x + 24, y + 12, 420, 48, [12, 12, 0, 0]); ctx.fill();
  ctx.fillRect(x, y + 58, w, 62);
  ctx.fillStyle = "#3a3f46"; ctx.font = `500 24px ${SANS}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  scriviEntro(ctx, titolo, x + 48, y + 37, 360, 18);
  ctx.textAlign = "right"; ctx.fillStyle = "#6b7078"; ctx.fillText("—     ▢     ×", x + w - 28, y + 34); ctx.textAlign = "left";
  ctx.fillStyle = "#e6e8eb"; ctx.beginPath(); ctx.roundRect(x + 24, y + 68, w - 48, 44, 22); ctx.fill();
  ctx.strokeStyle = "#5b6068"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(x + 46, y + 88, 16, 13, 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 54, y + 88, 6, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = "#b9bdc3"; ctx.beginPath(); ctx.roundRect(x + 78, y + 83, 320, 14, 7); ctx.fill();
};

/** Una finestra sul desktop: impostazioni di sistema, oppure una pagina web o un'app; colonna di voci, titolo del pannello, pulsante. */
export const finestra = ({ titolo, pulsante, menu, tipo, orologio }: Finestra) => (ctx: Ctx) => {
  desktop(orologio)(ctx);
  const { x, y, w, h } = FINESTRA_PX;
  const chiara = tipo !== "sistema";
  ombraFinestra(ctx, x, y, w, h);
  ctx.fillStyle = chiara ? "#f6f4f0" : "#202226"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  const testa = tipo === "sito" ? 120 : 64;
  if (tipo === "sito") barraBrowser(ctx, x, y, w, titolo);
  ctx.fillStyle = chiara ? "#eceae5" : "#1a1c1f"; ctx.fillRect(x, y + testa, 330, h - testa);
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  if (tipo !== "sito") {
    if (tipo === "app") { ctx.fillStyle = "#2c3e55"; ctx.beginPath(); ctx.roundRect(x, y, w, 64, [14, 14, 0, 0]); ctx.fill(); }
    ctx.fillStyle = chiara ? "#eef1f5" : "#c9ccd1"; ctx.font = `500 26px ${SANS}`;
    if (tipo === "sistema") ctx.fillText("Impostazioni", x + 30, y + 34);
    else { ctx.beginPath(); ctx.roundRect(x + 30, y + 18, 28, 28, 7); ctx.fill(); }
    ctx.textAlign = "right"; ctx.fillStyle = chiara ? "#c4ccd6" : "#8a8e95"; ctx.fillText("—     ▢     ×", x + w - 28, y + 34); ctx.textAlign = "left";
  }
  colonna(ctx, x, y + testa + 66, menu, chiara
    ? { testo: "#2a2e34", scelta: "#dbe6f5", testoScelta: "#1d4f9a", neutra: "#d3d0c9" }
    : { testo: "#d9dbe0", scelta: "#2e3137", testoScelta: "#d9dbe0", neutra: "#3a3d43" });
  const px = TITOLO_FINESTRA_PX.x;
  const alto = y + testa + 76;
  ctx.fillStyle = chiara ? "#1f2328" : "#f1f2f4"; ctx.font = `650 52px ${SANS}`;
  aCapo(ctx, titolo, TITOLO_FINESTRA_PX.w, 2).forEach((riga, i) => scriviEntro(ctx, riga, px, alto + i * 64, TITOLO_FINESTRA_PX.w));
  ctx.fillStyle = chiara ? "#d6d3cc" : "#3a3d43";
  for (const [ry, rw] of [[190, 520], [236, 440], [282, 480]]) { ctx.beginPath(); ctx.roundRect(px, alto + ry, rw, 16, 8); ctx.fill(); }
  const b = PULSANTE_PX;
  ctx.fillStyle = "#2f6fd1"; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.font = `600 ${chiara ? 40 : 34}px ${SANS}`; ctx.textAlign = "center";
  scriviEntro(ctx, pulsante, b.x + b.w / 2, b.y + b.h / 2 + 2, b.w - 40);
  ctx.textAlign = "left";
};

/**
 * Una pagina web (o un'app) a tutto schermo, per l'inquadratura larga del gancio: si riconosce da lontano dal colore chiaro,
 * dalla barra del browser e dal titolo grande. Nessun marchio, nessun dominio.
 */
export const pagina = (titolo: string, tipo: Exclude<TipoFinestra, "sistema">, orologio?: string) => (ctx: Ctx) => {
  const { w, h } = SCHERMO_PX;
  desktop(orologio)(ctx);
  const basso = h - 72;
  ctx.fillStyle = "#f6f4f0"; ctx.fillRect(0, 0, w, basso);
  let alto = 0;
  if (tipo === "sito") { barraBrowser(ctx, 0, 0, w, titolo); alto = 120; }
  // testata del sito: fascia scura con un segno geometrico neutro e righe al posto delle voci
  ctx.fillStyle = "#24364d"; ctx.fillRect(0, alto, w, 150);
  ctx.fillStyle = "#e9edf2"; ctx.beginPath(); ctx.roundRect(80, alto + 45, 60, 60, 14); ctx.fill();
  ctx.fillStyle = "rgba(233,237,242,0.55)";
  for (const [x0, l] of [[1500, 160], [1700, 140], [1880, 180], [2100, 150]]) { ctx.beginPath(); ctx.roundRect(x0, alto + 68, l, 16, 8); ctx.fill(); }
  ctx.fillStyle = "#1f2328"; ctx.font = `700 120px ${SANS}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  aCapo(ctx, titolo, w - 320, 2).forEach((riga, i) => scriviEntro(ctx, riga, 160, alto + 400 + i * 140, w - 320));
  ctx.fillStyle = "#c9c5bd";
  for (const [ry, rw] of [[620, 1300], [670, 1100]]) { ctx.beginPath(); ctx.roundRect(160, alto + ry, rw, 24, 12); ctx.fill(); }
  ctx.fillStyle = "#2f6fd1"; ctx.beginPath(); ctx.roundRect(160, alto + 760, 420, 110, 55); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const cx = 160 + i * 760;
    ctx.fillStyle = "#ebe8e2"; ctx.beginPath(); ctx.roundRect(cx, alto + 960, 680, 300, 18); ctx.fill();
    ctx.fillStyle = "#cfcbc3"; ctx.beginPath(); ctx.roundRect(cx + 40, alto + 1020, 360, 22, 11); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx + 40, alto + 1070, 520, 18, 9); ctx.fill();
  }
  barra(ctx, orologio);
};
