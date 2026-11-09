// Town drawing.
import { Town } from '../world/world';
import { C, TAU, drawShadow } from './primitives';

const WATCH_TOWERS = [[-34, 4], [34, -4]] as const;

export function drawTown(ctx: C, town: Town, t: number, docked: boolean) {
  const x = town.x, y = town.y;
  const r = (k: number) => (town.seedv * 997 * (k + 1)) % 1;
  ctx.fillStyle = 'rgba(160,130,90,0.55)'; ctx.beginPath(); ctx.ellipse(x, y, 40, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(190,160,110,0.6)'; ctx.beginPath(); ctx.ellipse(x, y, 26, 16, 0, 0, TAU); ctx.fill();
  const roofs = ['#c0392b', '#2980b9', '#8e44ad', '#d35400', '#16a085', '#7f8c8d'];
  const houses = [[-24, -10], [18, -14], [-14, 12], [22, 10], [-30, 6], [4, -20]];
  houses.forEach(([hx, hy], i) => {
    if (i > 2 + Math.floor(r(9) * 4)) return;
    const X = x + hx, Y = y + hy;
    drawShadow(ctx, X, Y + 1, 8, 2.5);
    ctx.fillStyle = '#e8d8b8'; ctx.fillRect(X - 6, Y - 7, 12, 7);
    ctx.fillStyle = '#6b4226'; ctx.fillRect(X - 1, Y - 4, 2.5, 4);
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(X + 3, Y - 5, 2, 2); ctx.fillRect(X - 5, Y - 5, 2, 2);
    ctx.fillStyle = roofs[Math.floor(r(i) * roofs.length)];
    ctx.beginPath(); ctx.moveTo(X - 8, Y - 7); ctx.lineTo(X, Y - 13); ctx.lineTo(X + 8, Y - 7); ctx.fill();
    if (r(i + 3) > 0.5) {
      ctx.fillStyle = '#5d4037'; ctx.fillRect(X + 3, Y - 13, 2, 4);
      const p = (t * 0.6 + i) % 1;
      ctx.fillStyle = `rgba(230,230,230,${0.6 - p * 0.6})`;
      ctx.beginPath(); ctx.arc(X + 4 + p * 4, Y - 14 - p * 8, 1.5 + p * 2, 0, TAU); ctx.fill();
    }
  });
  // A pair of little watchtowers: the town's defenses have somewhere to stand.
  for (const [ox, oy] of WATCH_TOWERS) {
    const X = x + ox, Y = y + oy;
    drawShadow(ctx, X, Y + 1, 4, 2);
    ctx.fillStyle = '#4e342e'; ctx.fillRect(X - 1.7, Y - 13, 3.4, 13);
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(X - 4, Y - 15, 8, 2.5);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(X - 5, Y - 15); ctx.lineTo(X, Y - 20); ctx.lineTo(X + 5, Y - 15); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(X - 0.5, Y - 18, 1, 2);
  }
  ctx.fillStyle = '#8d6e63'; ctx.fillRect(x - 6, y - 3, 12, 5);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e74c3c'; ctx.fillRect(x - 7 + i * 3.5, y - 7, 3.5, 4); }
  ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 4, y - 2, 2, 2); ctx.fillStyle = '#7fd1e8'; ctx.fillRect(x, y - 2, 2, 2); ctx.fillStyle = '#b388ff'; ctx.fillRect(x + 3, y - 2, 2, 2);
  ctx.fillStyle = '#4e342e'; ctx.fillRect(x + 32, y - 22, 1.2, 20);
  ctx.fillStyle = docked ? '#2ecc71' : '#f1c40f';
  const wv = Math.sin(t * 4) * 1.5;
  ctx.beginPath(); ctx.moveTo(x + 33, y - 22); ctx.lineTo(x + 41, y - 20 + wv); ctx.lineTo(x + 33, y - 17); ctx.fill();
}
