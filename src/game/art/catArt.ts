// Biscuit, the Homeport cat. Small, opinionated, and usually asleep somewhere inconvenient.
import type { TownCat } from '../core/types';
import { C, TAU, drawShadow } from './primitives';

export function drawCat(ctx: C, c: TownCat, t: number) {
  const moving = c.state === 'wander' || c.state === 'follow' || c.state === 'startle';
  const bob = moving ? Math.abs(Math.sin(c.walk * 7)) * 0.6 : 0;
  const x = c.x, y = c.y - bob;
  drawShadow(ctx, x, c.y + 1, 3.4, 1.2);
  const flip = Math.cos(c.facing) < 0 ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);

  if (c.state === 'sleep') {
    ctx.fillStyle = c.color;
    ctx.beginPath(); ctx.ellipse(0, -1.3, 4.1, 2.1, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(2.7, -2.4, 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.moveTo(1.4, -3.4); ctx.lineTo(1.6, -5); ctx.lineTo(2.5, -4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(3.3, -3.9); ctx.lineTo(3.9, -5.2); ctx.lineTo(4.4, -3.5); ctx.fill();
    ctx.fillStyle = '#3a2d28'; ctx.fillRect(2.8, -2.5, 0.8, 0.3);
    ctx.strokeStyle = c.color; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-4, -1.2); ctx.quadraticCurveTo(-6.2, -0.5, -5.6, 1.2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z', -3, -5);
  } else if (c.state === 'sit') {
    ctx.fillStyle = c.color;
    ctx.beginPath(); ctx.ellipse(0, -2.6, 2.4, 3.1, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -5.8, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(-1.7, -9); ctx.lineTo(-0.8, -7.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1.9, -7); ctx.lineTo(1.5, -9); ctx.lineTo(0.7, -7.5); ctx.fill();
    ctx.fillStyle = '#3a2d28'; ctx.fillRect(-1.1, -6.1, 0.6, 0.6); ctx.fillRect(0.6, -6.1, 0.6, 0.6);
    ctx.strokeStyle = c.color; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(2, -1.5); ctx.quadraticCurveTo(5.2, -1.2, 4.4, -4); ctx.stroke();
  } else {
    const arch = c.state === 'startle' ? -1 : 0;
    ctx.fillStyle = c.color;
    ctx.beginPath(); ctx.ellipse(-0.4, -2.6 + arch, 3.6, 1.7, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -3.3 + arch, 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.moveTo(1.2, -4.3 + arch); ctx.lineTo(1.4, -6 + arch); ctx.lineTo(2.3, -4.8 + arch); ctx.fill();
    ctx.beginPath(); ctx.moveTo(3.1, -4.8 + arch); ctx.lineTo(3.7, -6.1 + arch); ctx.lineTo(4.2, -4.4 + arch); ctx.fill();
    ctx.fillStyle = '#3a2d28'; ctx.fillRect(2.7, -3.5 + arch, 0.7, 0.6);
    ctx.fillStyle = c.color;
    ctx.fillRect(-2.6, -1.1, 0.9, 2.1); ctx.fillRect(-0.2, -1.1, 0.9, 2.1); ctx.fillRect(1.4, -1.1, 0.9, 2.1);
    ctx.strokeStyle = c.color; ctx.lineWidth = 0.8;
    const tail = c.state === 'startle' ? -7 : -1 + Math.sin(t * 3 + c.anim) * 1.5;
    ctx.beginPath(); ctx.moveTo(-3.7, -2.8); ctx.quadraticCurveTo(-6.2, -2, -5.4, tail); ctx.stroke();
  }

  ctx.restore();

  if (c.state === 'startle') {
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', x, y - 10);
  }
}
