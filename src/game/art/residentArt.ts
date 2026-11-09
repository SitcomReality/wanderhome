// Tiny procedural settlement residents: readable at the game's zoom, never more than a few pixels wide.
// The little animations matter: a hoe swing, a seated break, a head turned to watch the treeline.
import type { Resident } from '../core/types';
import { C, TAU, drawShadow } from './primitives';

export function drawResident(ctx: C, r: Resident, t: number) {
  if (r.indoors) return;
  const kid = r.def.role === 'kid';
  const s = kid ? 0.84 : 1;
  const resting = r.state === 'rest' || r.state === 'social';
  const bob = r.walking ? Math.abs(Math.sin(r.walk * 7)) * 1.1 : resting ? 0 : Math.sin(t * 1.7 + r.seed) * 0.25;
  const x = r.x, y = r.y - bob;
  drawShadow(ctx, x, r.y + 1, (resting ? 3.6 : 2.9) * s, 1.1 * s);

  if (resting) {
    drawResting(ctx, r, x, y, s, t);
    return;
  }

  const swing = r.walking ? Math.sin(r.walk * 9) * 1.2 : 0;
  ctx.fillStyle = '#3a2d28';
  ctx.fillRect(x - 1.7 * s, y - 3, 1.2, 3 + swing);
  ctx.fillRect(x + 0.5 * s, y - 3, 1.2, 3 - swing);

  const lean = r.state === 'work' ? Math.sin(r.anim * 3.6) * 0.35 : 0;
  ctx.fillStyle = r.def.color;
  ctx.fillRect(x - 2.2 * s + lean, y - 7.8, 4.4 * s, 5.2);
  ctx.fillStyle = r.def.accent;
  ctx.fillRect(x - 2.2 * s + lean, y - 5.2, 4.4 * s, 0.8);
  ctx.fillStyle = r.def.color;
  ctx.fillRect(x - 3 * s, y - 7.2, 1, 2.8);
  ctx.fillRect(x + 2 * s, y - 7.2, 1, 2.8);

  const look = Math.cos(r.facing) * 0.55;
  ctx.fillStyle = '#f0c9a4';
  ctx.beginPath(); ctx.arc(x + look * 0.4, y - 9.5 * s, 2.2 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2d28';
  ctx.fillRect(x - 0.9 * s + look, y - 9.8 * s, 0.7, 0.7);
  ctx.fillRect(x + 0.4 * s + look, y - 9.8 * s, 0.7, 0.7);

  if (r.def.role === 'gardener') {
    ctx.fillStyle = '#e0c070'; ctx.beginPath(); ctx.ellipse(x, y - 11.2 * s, 3.2, 1.2, 0, 0, TAU); ctx.fill();
    drawHoe(ctx, r, x + 2.4, y - 6);
  } else if (r.def.role === 'tinker') {
    ctx.fillStyle = '#4e5d6c'; ctx.fillRect(x - 2.5, y - 12, 5, 1.4); ctx.fillRect(x - 1.4, y - 13.2, 2.8, 1.2);
    drawHammer(ctx, r, x + 2.2, y - 6.2);
  } else if (r.def.role === 'kid') {
    ctx.fillStyle = r.def.accent; ctx.beginPath(); ctx.arc(x - 2, y - 11.8, 1.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 2, y - 11.8, 1.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(x - 1.8 + look, y - 9.3, 0.8, 0.8); ctx.fillRect(x + 1 + look, y - 9.3, 0.8, 0.8);
  } else {
    drawWatcher(ctx, r, x, y, t);
  }

  if (r.state === 'loot') {
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', x, y - 15);
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(x - 4, y - 4.5, 2.4, 2.4);
  }
}

function drawHoe(ctx: C, r: Resident, hx: number, hy: number) {
  const working = r.state === 'work';
  const swing = working ? Math.sin(r.anim * 4) * 0.9 : 0.15;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(-1.0 + swing);
  ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 10); ctx.stroke();
  ctx.fillStyle = '#9aa3ad'; ctx.fillRect(-1.6, 10, 3.2, 1.3);
  ctx.restore();
}

function drawHammer(ctx: C, r: Resident, hx: number, hy: number) {
  const working = r.state === 'work';
  const swing = working ? Math.sin(r.anim * 6) * 0.8 : 0.1;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(-0.4 + swing);
  ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 4.5); ctx.stroke();
  ctx.fillStyle = '#c8d0d8'; ctx.fillRect(-1.4, 4.3, 2.8, 1.4);
  ctx.restore();
}

function drawWatcher(ctx: C, r: Resident, x: number, y: number, t: number) {
  ctx.fillStyle = '#4f6070'; ctx.beginPath(); ctx.moveTo(x - 3, y - 10); ctx.lineTo(x, y - 13.2); ctx.lineTo(x + 3, y - 10); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 1.2, y - 10.6, 0.7, 0.7);
  ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 0.2, y - 10.6, 0.7, 0.7);
  ctx.fillStyle = '#8d6e63'; ctx.fillRect(x + 3, y - 8, 1, 8);
  const lx = x + 4.2, ly = y - 7 + Math.sin(t * 2 + r.seed) * 0.4;
  ctx.fillStyle = 'rgba(255,209,102,0.25)'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(lx, ly, 1.3, 0, TAU); ctx.fill();
}

function drawResting(ctx: C, r: Resident, x: number, y: number, s: number, t: number) {
  // A seated pose: legs out, hands on knees, tool laid beside them.
  ctx.fillStyle = '#3a2d28';
  ctx.fillRect(x - 2.4 * s, y - 2.6, 4.4 * s, 1.2);
  ctx.fillRect(x - 2.4 * s, y - 1.2, 1.1, 1.4);
  ctx.fillRect(x + 1.4 * s, y - 1.2, 1.1, 1.4);
  ctx.fillStyle = r.def.color;
  ctx.fillRect(x - 2.4 * s, y - 6.2, 4.8 * s, 4.1);
  ctx.fillStyle = r.def.accent;
  ctx.fillRect(x - 2.4 * s, y - 3.4, 4.8 * s, 0.8);
  ctx.fillStyle = r.def.color;
  ctx.fillRect(x - 3.2 * s, y - 5.6, 1, 2.4);
  ctx.fillRect(x + 2.2 * s, y - 5.6, 1, 2.4);
  ctx.fillStyle = '#f0c9a4';
  ctx.beginPath(); ctx.arc(x, y - 8.2 * s, 2.2 * s, 0, TAU); ctx.fill();
  const look = Math.cos(r.facing) * 0.5;
  ctx.fillStyle = '#3a2d28';
  ctx.fillRect(x - 0.9 * s + look, y - 8.5 * s, 0.7, 0.7);
  ctx.fillRect(x + 0.4 * s + look, y - 8.5 * s, 0.7, 0.7);

  if (r.def.role === 'gardener') {
    ctx.fillStyle = '#e0c070'; ctx.beginPath(); ctx.ellipse(x, y - 9.8 * s, 3, 1.1, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x + 4, y - 0.5); ctx.lineTo(x + 8, y - 2); ctx.stroke();
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(x + 7.4, y - 2.8, 2, 1.2);
  } else if (r.def.role === 'tinker') {
    ctx.fillStyle = '#4e5d6c'; ctx.fillRect(x - 2.5, y - 10.8, 5, 1.4); ctx.fillRect(x - 1.4, y - 12, 2.8, 1.2);
    ctx.fillStyle = '#c8d0d8'; ctx.fillRect(x + 4, y - 2, 2.4, 1.2);
  } else if (r.def.role === 'kid') {
    ctx.fillStyle = r.def.accent; ctx.beginPath(); ctx.arc(x - 2, y - 10.4, 1.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 2, y - 10.4, 1.2, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(x + 3.5, y - 7, 1, 7);
    const lx = x + 4.8, ly = y - 5 + Math.sin(t * 2 + r.seed) * 0.3;
    ctx.fillStyle = 'rgba(255,209,102,0.25)'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(lx, ly, 1.3, 0, TAU); ctx.fill();
  }

  if (r.state === 'social') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '6px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('…', x, y - 13);
  }
}
