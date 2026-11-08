// Artwork for cargo parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { TAU, circ, line, rivets, rr } from '../primitives';
import type { PartArtFn } from './types';

export const CARGO_ART: Record<string, PartArtFn> = {
  crate: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 0.5, '#9a6a3a');
    for (let i = 0; i < 4; i++) ctx.fillRect(-4, -4 + i * 2, 8, 0.25);
    ctx.fillStyle = '#c08a4a'; ctx.fillRect(-4, -4, 8, 1); ctx.fillRect(-4, 3, 8, 1);
    line(ctx, -3.4, -3, 3.4, 3, '#6b4226', 0.7); rivets(ctx, 3.3, '#3a2a1a');
  },
  sacks: (ctx) => {
    for (const [x, y, r] of [[-1.8, -1.6, 2.2], [1.9, -1.2, 2], [0, 2, 2.3]]) {
      circ(ctx, x, y, r, '#a8864e'); circ(ctx, x - 0.5, y - 0.5, r * 0.6, '#c9a66b'); circ(ctx, x, y - r + 0.4, 0.5, '#6b4f2a');
    }
  },
  balloon: (ctx, t) => {
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(1.5, 2, 4.6, 0, TAU); ctx.fill();
    const bob = Math.sin(t * 1.5) * 0.3;
    ctx.save(); ctx.translate(0, -1 + bob);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#e85d75' : '#ffd166'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 4.8, (i / 6) * TAU, ((i + 1) / 6) * TAU); ctx.fill(); }
    circ(ctx, -1.6, -1.6, 1.2, 'rgba(255,255,255,0.45)'); circ(ctx, 0, 0, 0.8, '#8a3a4a');
    ctx.restore();
  },
  hold: (ctx) => {
    rr(ctx, -4.2, -4.2, 8.4, 8.4, 0.6, '#4a5562'); rr(ctx, -3.4, -3.4, 6.8, 6.8, 0.4, '#6d7b8d');
    line(ctx, -3.4, 0, 3.4, 0, '#3a4450', 0.4); rr(ctx, -1, -0.6, 2, 1.2, 0.3, '#2b333c'); rivets(ctx, 3.7);
  },
  icebox: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 0.8, '#9ec9e8'); rr(ctx, -3.3, -3.3, 6.6, 6.6, 0.6, '#e8f6ff');
    for (let i = 0; i < 5; i++) circ(ctx, Math.sin(i * 3.1) * 2.5, Math.cos(i * 2.3) * 2.5, 0.35, '#bfe0f5');
    rr(ctx, -0.8, 2.6, 1.6, 0.8, 0.3, '#5a8ab0');
  },
};
