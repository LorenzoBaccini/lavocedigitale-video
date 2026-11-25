import { casuale } from "../../tratto.ts";
import type { Ctx } from "../disegni.ts";
import { aCapo, scriviEntro } from "../disegni.ts";

const SANS = "Inter, system-ui, sans-serif";

/** Lo schermo del telefono reperto, in pixel della texture. */
export const SCHERMO_REPERTO = { w: 600, h: 1240 };
/** Da dove parte la crepa, in frazioni dello schermo: sopra il fumetto, a destra. */
export const ORIGINE_CREPA = { x: 0.64, y: 0.4 };

/** Lo schermo del telefono: l'SMS in un fumetto (rosso quando il telefono si crepa) o, senza messaggio, l'ora grande. */
export const schermoSms = (messaggio: string | undefined, ora: string, allarme: string | undefined) => (ctx: Ctx) => {
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
  ctx.fillStyle = "#b3acd8"; ctx.font = `500 30px ${SANS}`; ctx.fillText("Numero sconosciuto", W / 2, 262);
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
