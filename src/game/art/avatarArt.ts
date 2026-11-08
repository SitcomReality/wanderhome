// The little wanderer.
import { C, drawShadow } from './primitives';

export function drawAvatar(ctx: C, x: number, y: number, facing: number, walk: number, hurt: boolean, scale = 1, sitting = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  drawShadow(ctx, 0, 0.5, 2.6, 1);
  const step = Math.sin(walk) * 1.1;
  const flip = Math.cos(facing) < 0 ? -1 : 1;
  ctx.fillStyle = '#2c3e50';
  if (!sitting) { ctx.fillRect(-1.5, -2.5 + Math.max(0, step) * 0.5, 1.2, 2.5); ctx.fillRect(0.3, -2.5 + Math.max(0, -step) * 0.5, 1.2, 2.5); }
  ctx.fillStyle = hurt ? '#ffffff' : '#ff7a59'; ctx.fillRect(-2, -6.5, 4, 4.2);
  ctx.fillStyle = '#ffd7a8'; ctx.fillRect(-1.6, -9.3, 3.2, 3);
  ctx.fillStyle = '#111'; ctx.fillRect(flip > 0 ? 0.5 : -1.2, -8.3, 0.7, 0.7);
  ctx.fillStyle = '#3d5a80'; ctx.fillRect(-2, -10, 4, 1.2); ctx.fillRect(flip > 0 ? 0 : -3, -9.2, 3, 0.7);
  ctx.fillStyle = '#ffd7a8'; ctx.fillRect(flip > 0 ? 1.8 : -2.6, -5.5 - step * 0.4, 0.9, 2);
  ctx.restore();
}
