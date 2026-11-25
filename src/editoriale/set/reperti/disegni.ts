import { casuale } from "../../tratto.ts";
import type { Ctx } from "../disegni.ts";
import { aCapo, scriviEntro } from "../disegni.ts";

const SANS = "Inter, system-ui, sans-serif";

/** Lo schermo del telefono reperto, in pixel della texture. */
export const SCHERMO_REPERTO = { w: 600, h: 1240 };
/** Da dove parte la crepa, in frazioni dello schermo: sopra il fumetto, a destra. */
export const ORIGINE_CREPA = { x: 0.64, y: 0.4 };

/** Lo schermo del telefono: l'SMS in un fumetto (rosso quando il telefono si crepa) o, senza messaggio, l'ora grande. */
export const schermoSms = (messaggio: string | undefined, ora: string, allarme: string | undefined, mittente = "Numero sconosciuto") => (ctx: Ctx) => {
  const { w: W, h: H } = SCHERMO_REPERTO;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1d1840"); g.addColorStop(1, "#0b0a18");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e9e6f7"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = `600 28px ${SANS}`; ctx.fillText(ora, 40, 44);
  ctx.fillRect(W - 92, 32, 46, 24);
  ctx.textAlign = "center";
  if (!messaggio) {
    ctx.font = `300 190px ${SANS}`; ctx.fillText(ora, W / 2, H * 0.3);
    return;
  }
  ctx.fillStyle = "#3b3566"; ctx.beginPath(); ctx.arc(W / 2, 170, 52, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "#cfc9ee"; ctx.font = `600 52px ${SANS}`; ctx.fillText("?", W / 2, 172);
  ctx.fillStyle = "#b3acd8"; ctx.font = `500 30px ${SANS}`; scriviEntro(ctx, mittente, W / 2, 262, W - 80);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = `700 52px ${SANS}`;
  const righe = aCapo(ctx, messaggio, W - 110, 6);
  const alto = 330;
  const altezza = 56 + righe.length * 66;
  ctx.fillStyle = allarme ?? "#3a3470";
  ctx.beginPath(); ctx.roundRect(24, alto, W - 48, altezza, 36); ctx.fill();
  ctx.fillStyle = "#ffffff";
  righe.forEach((riga, i) => scriviEntro(ctx, riga, 52, alto + 76 + i * 66, W - 104));
  ctx.fillStyle = "#8f88b8"; ctx.font = `500 24px ${SANS}`; ctx.fillText("ora", 44, alto + altezza + 36);
};

/** La crepa a raggiera sul vetro, fino a `progresso` (0..1): sempre la stessa per lo stesso seme. */
export const crepa = (seme: number, progresso: number) => (ctx: Ctx) => {
  const { w: W, h: H } = SCHERMO_REPERTO;
  ctx.clearRect(0, 0, W, H);
  if (progresso <= 0) return;
  const rnd = casuale(seme);
  const ox = W * ORIGINE_CREPA.x;
  const oy = H * ORIGINE_CREPA.y;
  const raggi = Array.from({ length: 12 }, (_, i) => {
    const angolo = (i / 12) * 2 * Math.PI + (rnd() - 0.5) * 0.4;
    const lungo = (0.45 + 0.7 * rnd()) * H * 0.6;
    const punti = [{ x: ox, y: oy }];
    for (let k = 1; k <= 7; k++) {
      const t = (k / 7) * lungo;
      const a = angolo + (rnd() - 0.5) * 0.35;
      punti.push({ x: ox + Math.cos(a) * t, y: oy + Math.sin(a) * t });
    }
    return punti;
  });
  const traccia = (colore: string, spessore: number, dx: number) => {
    ctx.strokeStyle = colore; ctx.lineWidth = spessore; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const punti of raggi) {
      const n = Math.max(2, Math.round(punti.length * progresso));
      ctx.beginPath(); ctx.moveTo(punti[0].x + dx, punti[0].y + dx);
      for (const p of punti.slice(1, n)) ctx.lineTo(p.x + dx, p.y + dx);
      ctx.stroke();
    }
    // gli anelli fra un raggio e l'altro arrivano a crepa quasi finita
    if (progresso < 0.5) return;
    for (const r of [0.22, 0.5]) {
      ctx.beginPath();
      raggi.forEach((punti, i) => {
        const p = punti[Math.round(r * (punti.length - 1))];
        if (i === 0) ctx.moveTo(p.x + dx, p.y + dx); else ctx.lineTo(p.x + dx, p.y + dx);
      });
      ctx.closePath(); ctx.stroke();
    }
  };
  traccia("rgba(0,0,0,0.55)", 5, 2);
  traccia("rgba(255,255,255,0.9)", 2.5, 0);
  // il punto d'impatto: vetro sbriciolato
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath(); ctx.arc(ox, oy, 26 * Math.min(1, progresso * 2), 0, 2 * Math.PI); ctx.fill();
};

/** La chiamata in arrivo: chi chiama in grande, i due tasti; `squillo` (0..1) allarga gli anelli, `allarme` tinge lo schermo. */
export const schermoChiamata = (mittente: string, ora: string, squillo: number, allarme: string | undefined) => (ctx: Ctx) => {
  const { w: W, h: H } = SCHERMO_REPERTO;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, allarme ? "#5a1410" : "#1d1840"); g.addColorStop(1, allarme ?? "#0b0a18");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e9e6f7"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = `600 28px ${SANS}`; ctx.fillText(ora, 40, 44);
  ctx.fillRect(W - 92, 32, 46, 24);
  ctx.textAlign = "center";
  ctx.fillStyle = "#c9c3ea"; ctx.font = `500 34px ${SANS}`; ctx.fillText("Chiamata in arrivo", W / 2, 190);
  ctx.fillStyle = "#ffffff"; ctx.font = `700 60px ${SANS}`;
  aCapo(ctx, mittente, W - 80, 2).forEach((riga, i) => scriviEntro(ctx, riga, W / 2, 280 + i * 70, W - 80));
  const cy = 600;
  for (let k = 0; k < 3; k++) {
    const t = (squillo + k / 3) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - t)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(W / 2, cy, 110 + 130 * t, 0, 2 * Math.PI); ctx.stroke();
  }
  ctx.fillStyle = "#3b3566"; ctx.beginPath(); ctx.arc(W / 2, cy, 110, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "#cfc9ee"; ctx.font = `600 110px ${SANS}`; ctx.fillText("?", W / 2, cy + 6);
  const tasto = (x: number, colore: string, giu: boolean) => {
    ctx.fillStyle = colore; ctx.beginPath(); ctx.arc(x, 1030, 70, 0, 2 * Math.PI); ctx.fill();
    ctx.save(); ctx.translate(x, 1030); ctx.rotate(giu ? 2.36 : 0);
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(-34, -12, 68, 24, 12); ctx.fill();
    ctx.restore();
  };
  tasto(150, "#e5484d", true);
  tasto(W - 150, "#30a46c", false);
};

/** La mail: intestazione della posta, mittente, oggetto in grassetto, righe d'anteprima e il tasto; `allarme` la marchia. */
export const EMAIL_PX = { w: 1200, h: 860 };
export const schermoEmail = (mittente: string, oggetto: string, allarme: string | undefined) => (ctx: Ctx) => {
  const { w: W, h: H } = EMAIL_PX;
  ctx.fillStyle = "#f4f2fb"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e3dff3"; ctx.fillRect(0, 0, W, 96);
  ctx.fillStyle = "#5b5580"; ctx.font = `600 36px ${SANS}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillText("Posta in arrivo", 56, 48);
  ctx.fillStyle = "#7b5cff"; ctx.beginPath(); ctx.arc(110, 190, 50, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.font = `700 52px ${SANS}`; ctx.textAlign = "center"; ctx.fillText((mittente.trim()[0] ?? "?").toUpperCase(), 110, 194);
  ctx.textAlign = "left"; ctx.fillStyle = "#1b1638"; ctx.font = `700 44px ${SANS}`;
  scriviEntro(ctx, mittente, 190, 170, W - 260);
  ctx.fillStyle = "#8a85a8"; ctx.font = `500 30px ${SANS}`; ctx.fillText("a me", 190, 222);
  ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#14112a"; ctx.font = `800 58px ${SANS}`;
  aCapo(ctx, oggetto, W - 112, 3).forEach((riga, i) => scriviEntro(ctx, riga, 56, 340 + i * 70, W - 112));
  ctx.fillStyle = "#d8d4ea";
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(56, 560 + i * 44, (W - 112) * (i === 2 ? 0.55 : 1), 20, 10); ctx.fill(); }
  ctx.fillStyle = allarme ?? "#7b5cff"; ctx.beginPath(); ctx.roundRect(56, 720, 380, 88, 44); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.font = `700 36px ${SANS}`; ctx.textBaseline = "middle"; ctx.fillText("Conferma i dati", 92, 766);
  if (allarme) { ctx.strokeStyle = allarme; ctx.lineWidth = 28; ctx.strokeRect(14, 14, W - 28, H - 28); }
};

/** Una banconota generica: nessun disegno vero, solo il taglio e due fasce di colore. */
export const BANCONOTA_PX = { w: 640, h: 320 };
export const banconota = (ctx: Ctx) => {
  const { w: W, h: H } = BANCONOTA_PX;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#e9b872"); g.addColorStop(1, "#c98b4a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(90,50,20,0.45)"; ctx.lineWidth = 6; ctx.strokeRect(16, 16, W - 32, H - 32);
  ctx.fillStyle = "rgba(255,240,215,0.55)"; ctx.beginPath(); ctx.ellipse(W * 0.72, H / 2, 90, 110, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "#5a3415"; ctx.font = `800 150px ${SANS}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillText("50", 52, H / 2 + 6);
  ctx.font = `700 64px ${SANS}`; ctx.fillText("€", W * 0.72 - 20, H / 2 + 4);
};
