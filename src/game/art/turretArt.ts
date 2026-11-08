// Rotating turret tops for weapon parts.
import { WeaponKind } from '../../content/index';
import { C, circ, line, ring, rr } from './primitives';

/** Turret top drawn in cell units; angle relative to the vehicle. */
export function drawTurret(ctx: C, kind: WeaponKind, angle: number, recoil: number, s: number, t: number) {
  ctx.save();
  ctx.scale(s / 9, s / 9);
  ctx.rotate(angle);
  const r = -recoil * 1.4;
  switch (kind) {
    case 'pea': rr(ctx, 1.5 + r * 0.5, -0.6, 3.6, 1.2, 0.4, '#5a4a2a'); circ(ctx, 1.5, 0, 0.9, '#8a6a3a'); break;
    case 'mg': rr(ctx, r - 1, -1.6, 4, 3.2, 0.5, '#3d4650'); rr(ctx, r + 2.5, -0.9, 4.5, 0.7, 0.2, '#1e2328'); rr(ctx, r + 2.5, 0.2, 4.5, 0.7, 0.2, '#1e2328'); break;
    case 'flame': rr(ctx, r - 1.5, -1.8, 4, 3.6, 1.2, '#7a3b10'); rr(ctx, r + 2, -0.8, 3.6, 1.6, 0.4, '#3a2a1a'); circ(ctx, r + 5.6, 0, 0.8, '#ffb347'); break;
    case 'rocket': rr(ctx, r - 2, -3, 6, 2.6, 0.6, '#5b2c6f'); rr(ctx, r - 2, 0.4, 6, 2.6, 0.6, '#5b2c6f'); circ(ctx, r + 3.6, -1.7, 0.7, '#e74c3c'); circ(ctx, r + 3.6, 1.7, 0.7, '#e74c3c'); break;
    case 'tesla': {
      circ(ctx, 0, 0, 2.4, '#1e4a6a');
      for (let i = 0; i < 3; i++) ring(ctx, 0, 0, 0.8 + i * 0.7, '#b3e5ff', 0.35);
      const p = 0.5 + 0.5 * Math.sin(t * 20);
      circ(ctx, 0, 0, 0.8 + p * 0.3, '#ffffff');
      break;
    }
    case 'bubble': rr(ctx, r, -0.8, 4.5, 1.6, 0.6, '#5ab0c8'); ring(ctx, r + 5.6, 0, 1.4, '#e0f7ff', 0.5); circ(ctx, -0.5, 0, 1.4, '#9ee4f5'); break;
    case 'harpoon': rr(ctx, r - 1.5, -1, 5, 2, 0.5, '#4a5a66'); line(ctx, r + 3, 0, r + 6, 0, '#cfd8dc', 0.6); ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.moveTo(r + 6.8, 0); ctx.lineTo(r + 5.6, -0.9); ctx.lineTo(r + 5.6, 0.9); ctx.fill(); break;
    case 'frost': rr(ctx, r - 1.5, -1.6, 4, 3.2, 1, '#5a9ac0'); rr(ctx, r + 2, -0.9, 3.5, 1.8, 0.6, '#a8e0ff'); circ(ctx, r + 5.4, 0, 0.7, '#ffffff'); break;
    case 'lob': {
      const arm = recoil > 0 ? -0.8 + (1 - recoil) * 0.8 : 0;
      ctx.save(); ctx.rotate(arm);
      line(ctx, -2.5, 0, 3, 0, '#8a6a3a', 1); circ(ctx, 3.4, 0, 1.3, '#5a3a20');
      if (recoil < 0.3) circ(ctx, 3.4, 0, 0.9, '#9aa3ad');
      ctx.restore(); circ(ctx, -1.5, 0, 0.8, '#3a2a1a');
      break;
    }
  }
  ctx.restore();
}
