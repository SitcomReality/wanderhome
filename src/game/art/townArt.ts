// Town drawing.
import { Town } from '../world/world';
import type { SettlementPlan } from '../world/settlement';
import { TOWN_HOUSE_OFFSETS, townHouseCount } from '../world/settlement';
import { C, TAU, drawShadow } from './primitives';

const WATCH_TOWERS = [[-34, 4], [34, -4]] as const;

export function drawTown(ctx: C, town: Town, t: number, docked: boolean, plan?: SettlementPlan) {
  const x = town.x, y = town.y;
  const r = (k: number) => (town.seedv * 997 * (k + 1)) % 1;
  if (plan) drawField(ctx, plan.field.x, plan.field.y, town.seedv);
  ctx.fillStyle = 'rgba(160,130,90,0.55)'; ctx.beginPath(); ctx.ellipse(x, y, 40, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(190,160,110,0.6)'; ctx.beginPath(); ctx.ellipse(x, y, 26, 16, 0, 0, TAU); ctx.fill();
  if (plan) drawWell(ctx, plan.well.x, plan.well.y);
  const roofs = ['#c0392b', '#2980b9', '#8e44ad', '#d35400', '#16a085', '#7f8c8d'];
  const count = townHouseCount(town);
  TOWN_HOUSE_OFFSETS.forEach(([hx, hy], i) => {
    if (i >= count) return;
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
  if (plan) drawGate(ctx, plan.gate.x, plan.gate.y);
  ctx.fillStyle = '#8d6e63'; ctx.fillRect(x - 6, y - 3, 12, 5);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e74c3c'; ctx.fillRect(x - 7 + i * 3.5, y - 7, 3.5, 4); }
  ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 4, y - 2, 2, 2); ctx.fillStyle = '#7fd1e8'; ctx.fillRect(x, y - 2, 2, 2); ctx.fillStyle = '#b388ff'; ctx.fillRect(x + 3, y - 2, 2, 2);
  ctx.fillStyle = '#4e342e'; ctx.fillRect(x + 32, y - 22, 1.2, 20);
  ctx.fillStyle = docked ? '#2ecc71' : '#f1c40f';
  const wv = Math.sin(t * 4) * 1.5;
  ctx.beginPath(); ctx.moveTo(x + 33, y - 22); ctx.lineTo(x + 41, y - 20 + wv); ctx.lineTo(x + 33, y - 17); ctx.fill();
}

function drawField(ctx: C, x: number, y: number, seed: number) {
  const dry = seed > 0.72;
  ctx.fillStyle = dry ? 'rgba(120,96,54,0.45)' : 'rgba(92,70,44,0.5)';
  ctx.beginPath(); ctx.ellipse(x, y, 21, 13, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5b422d'; ctx.lineWidth = 1;
  for (let row = -8; row <= 8; row += 8) {
    ctx.beginPath(); ctx.moveTo(x - 16, y + row); ctx.lineTo(x + 16, y + row); ctx.stroke();
    for (let col = -13; col <= 13; col += 5) {
      const n = ((col * 7 + row * 11 + Math.floor(seed * 100)) % 5 + 5) % 5;
      ctx.fillStyle = n === 0 ? '#f2c14e' : n === 1 ? '#9bc06a' : '#6f9e4f';
      ctx.fillRect(x + col, y + row - 1, 1.6, 2.4);
    }
  }
  ctx.fillStyle = '#7a5a3a';
  for (let i = -20; i <= 20; i += 9) { ctx.fillRect(x + i, y - 15, 1.2, 4); ctx.fillRect(x + i, y + 11, 1.2, 4); }
  ctx.strokeStyle = 'rgba(122,90,58,0.8)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x - 19, y - 13); ctx.lineTo(x + 19, y - 13); ctx.moveTo(x - 19, y + 13); ctx.lineTo(x + 19, y + 13); ctx.stroke();
}

function drawWell(ctx: C, x: number, y: number) {
  drawShadow(ctx, x, y + 1, 6, 2);
  ctx.fillStyle = '#77797c'; ctx.beginPath(); ctx.ellipse(x, y, 6, 3.8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3f4b56'; ctx.beginPath(); ctx.ellipse(x, y - 0.5, 4, 2.3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5d4037'; ctx.fillRect(x - 4.5, y - 9, 1.2, 7); ctx.fillRect(x + 3.3, y - 9, 1.2, 7);
  ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x - 6, y - 9); ctx.lineTo(x, y - 13); ctx.lineTo(x + 6, y - 9); ctx.fill();
  ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x - 1, y - 8, 2, 2.5);
}

function drawGate(ctx: C, x: number, y: number) {
  drawShadow(ctx, x, y + 1, 9, 2);
  ctx.fillStyle = '#5d4037'; ctx.fillRect(x - 7, y - 10, 2, 10); ctx.fillRect(x + 5, y - 10, 2, 10);
  ctx.fillStyle = '#8d6e63'; ctx.fillRect(x - 7, y - 11, 14, 2);
  ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x - 2, y - 9, 4, 3);
  ctx.fillStyle = '#b07c55'; ctx.fillRect(x - 1, y - 7, 2, 1);
}
