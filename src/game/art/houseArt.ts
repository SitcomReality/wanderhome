// Family cosmetics on the house (trim paint, flag, trinket, the cat) and sky effects for weather visitors.
import { COSMETICS } from '../../content';
import type { Game } from '../engine';
import { meta } from '../family/meta';

// ------------------------------------------------------------ drawing
export function drawHouseExtras(ctx: CanvasRenderingContext2D, g: Game, t: number) {
  const hw = g.hw, hh = g.hh;
  const paint = COSMETICS.find((c) => c.id === meta.equipped.paint);
  if (paint?.color) { ctx.strokeStyle = paint.color; ctx.lineWidth = 1.1; ctx.strokeRect(-hw - 1.3, -hh - 1.3, hw * 2 + 2.6, hh * 2 + 2.6); }
  // cat napping on a part
  if (meta.cat) {
    // the cat changes napping spot every few minutes (deterministic, so no extra state)
    const cells = [...g.st.cells.keys()].sort((a, b) => a - b);
    const spot = cells.length ? cells[Math.floor(g.time / 150 + meta.cat.adopted / 7) % cells.length] : -1;
    const p = spot >= 0 ? g.cellLocal(spot) : { x: -hw + 3, y: hh - 3 };
    const c = meta.cat.color;
    const br = 1 + Math.sin(t * 2) * 0.06;
    ctx.save(); ctx.translate(p.x + 1.5, p.y + 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0.3, 0.5, 2.6, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 2.4 * br, 1.6 * br, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.9, -0.5, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1.3, -1.2); ctx.lineTo(1.6, -2.2); ctx.lineTo(2.1, -1.4); ctx.moveTo(2.2, -1.3); ctx.lineTo(2.8, -2.1); ctx.lineTo(2.9, -1); ctx.fill();
    ctx.strokeStyle = c; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(-1.4, 0.6, 1.4, Math.PI * 0.4, Math.PI * 1.3); ctx.stroke();
    if (Math.sin(t * 0.7) > 0.3) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '2.4px sans-serif'; ctx.fillText('z', 3 + Math.sin(t) * 0.3, -2.5 - (t % 2)); }
    ctx.restore();
  }
  // trinket near the front
  const tk = meta.equipped.trinket;
  if (tk !== 'trinket_none') {
    ctx.save(); ctx.translate(hw - 2.2, -hh + 2.2);
    if (tk === 'trinket_gnome') {
      ctx.fillStyle = '#3a6ab0'; ctx.beginPath(); ctx.arc(0, 0.6, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0.1, 0.9, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(-1, -0.2); ctx.lineTo(0, -2.6); ctx.lineTo(1, -0.2); ctx.fill();
    } else if (tk === 'trinket_bobble') {
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(-0.4, -0.5, 0.8, 1.5);
      ctx.fillStyle = '#ffd7a8'; ctx.beginPath(); ctx.arc(Math.sin(t * 7) * 0.5, -1, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(Math.sin(t * 7) * 0.5 - 0.6, -1.2, 0.35, 0.35); ctx.fillRect(Math.sin(t * 7) * 0.5 + 0.25, -1.2, 0.35, 0.35);
    } else if (tk === 'trinket_pinwheel') {
      ctx.rotate(t * 4);
      const cols = ['#ff6b9a', '#7fd1e8', '#ffd166', '#58d68d'];
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1.8, 0); ctx.lineTo(1.8, 1.2); ctx.fill(); }
    } else if (tk === 'trinket_cactus') {
      ctx.fillStyle = '#c0603a'; ctx.fillRect(-1, 0, 2, 1.2);
      ctx.fillStyle = '#2e8b57'; ctx.fillRect(-0.5, -2, 1, 2); ctx.fillRect(-1.3, -1.4, 0.7, 0.9); ctx.fillStyle = '#ff6b9a'; ctx.fillRect(-0.3, -2.4, 0.6, 0.5);
    }
    ctx.restore();
  }
  // flag at the back
  const fl = COSMETICS.find((c) => c.id === meta.equipped.flag);
  if (fl?.color) {
    ctx.save(); ctx.translate(-hw + 0.8, -hh + 0.8);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-0.3, -9, 0.6, 9);
    const w = Math.sin(t * 5) * 0.8;
    if (fl.color === 'rainbow') {
      ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, -9 + i * 0.6); ctx.lineTo(-5, -8.6 + i * 0.6 + w); ctx.lineTo(-5, -8 + i * 0.6 + w); ctx.lineTo(0, -8.4 + i * 0.6); ctx.fill(); });
    } else {
      ctx.fillStyle = fl.color; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-5.5, -7.6 + w); ctx.lineTo(0, -6); ctx.fill();
      if (fl.color2) { ctx.fillStyle = fl.color2; ctx.beginPath(); ctx.arc(-1.8, -7.5 + w * 0.4, 0.7, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
}

/** Screen-space sky effects for weather visitors. */
export function drawSkyFx(ctx: CanvasRenderingContext2D, g: Game, W: number, H: number) {
  const sky = g.sky;
  if (!sky || g.time > sky.until) return;
  const fade = Math.min(1, (sky.until - g.time) / 20, 1);
  const night = 0.35 + 0.65 * (1 - g.daylight());
  const t = g.time;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  if (sky.kind === 'aurora') {
    const bands = [['rgba(80,255,170,', 0.18], ['rgba(170,110,255,', 0.32], ['rgba(90,220,255,', 0.46]] as const;
    bands.forEach(([col, yy], i) => {
      const y0 = H * yy;
      const grad = ctx.createLinearGradient(0, y0 - 70, 0, y0 + 50);
      grad.addColorStop(0, col + '0)'); grad.addColorStop(0.5, col + (0.22 * night * fade).toFixed(3) + ')'); grad.addColorStop(1, col + '0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(0, y0 + 60);
      for (let x = 0; x <= W; x += 24) ctx.lineTo(x, y0 + Math.sin(x * 0.006 + t * 0.4 + i * 2) * 30 + Math.sin(x * 0.013 - t * 0.3) * 14);
      ctx.lineTo(W, y0 + 60); ctx.closePath(); ctx.fill();
    });
  } else {
    for (let i = 0; i < 7; i++) {
      const p = (t * 0.32 + i * 0.618) % 1;
      const sx = ((i * 0.37 + 0.2) % 1) * W * 1.3 - p * W * 0.5, sy = p * H * 0.55 - 30 + i * 18;
      const a = Math.sin(p * Math.PI) * fade * (0.5 + 0.5 * night);
      const grad = ctx.createLinearGradient(sx, sy, sx + 70, sy - 40);
      grad.addColorStop(0, `rgba(255,255,255,${a})`); grad.addColorStop(1, 'rgba(160,200,255,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 70, sy - 40); ctx.stroke();
    }
  }
  ctx.restore();
}
