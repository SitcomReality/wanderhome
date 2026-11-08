// Artwork for defense parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { TAU, circ, line, ring, rivets, rr } from '../primitives';
import type { PartArtFn } from './types';

export const DEFENSE_ART: Record<string, PartArtFn> = {
  armor: (ctx) => {
    rr(ctx, -4.3, -4.3, 8.6, 8.6, 0.6, '#5d656c'); rr(ctx, -4, -4, 4, 8, 0.4, '#8a929a'); rr(ctx, 0.2, -4, 3.8, 4, 0.4, '#7d858c'); rr(ctx, 0.2, 0.2, 3.8, 3.8, 0.4, '#949ca4');
    line(ctx, -2.5, -2, -1.5, 0.5, 'rgba(0,0,0,0.3)', 0.25);
  },
  ironplate: (ctx) => {
    rr(ctx, -4.3, -4.3, 8.6, 8.6, 0.8, '#5a6570'); rr(ctx, -3.8, -3.8, 7.6, 7.6, 0.6, '#9aa6b2');
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(-3.8, -1); ctx.lineTo(-1, -3.8); ctx.lineTo(0.5, -3.8); ctx.lineTo(-3.8, 0.5); ctx.fill();
    rivets(ctx, 3, '#4a5560'); circ(ctx, 0, -3, 0.35, '#4a5560'); circ(ctx, 0, 3, 0.35, '#4a5560');
  },
  hedge: (ctx) => {
    for (const [x, y, r] of [[-2, -2, 2.4], [2, -2, 2.3], [-2, 2, 2.3], [2, 2, 2.4], [0, 0, 2.6]]) circ(ctx, x, y, r, '#3f8a3f');
    for (const [x, y] of [[-1.5, -2.5], [2.4, -1], [-2, 2], [1, 2.5], [0, -0.3]]) circ(ctx, x, y, 1.2, '#5cb85c');
    for (const [x, y] of [[-2.6, -1], [1.6, -2.8], [2.6, 1.6]]) circ(ctx, x, y, 0.4, '#e74c3c');
  },
  repair: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#e8eef0'); ctx.fillStyle = '#27ae60'; ctx.fillRect(-0.9, -2.8, 1.8, 5.6); ctx.fillRect(-2.8, -0.9, 5.6, 1.8);
    const a = t * 3; line(ctx, 3, 3, 3 + Math.cos(a) * 1.2, 3 + Math.sin(a) * 1.2, '#555', 0.5);
  },
  spikes: (ctx, _t, _o) => {
    rr(ctx, -3.6, -3.6, 7.2, 7.2, 0.6, '#4a5056');
    ctx.fillStyle = '#c8d0d8';
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); for (const o of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(o - 0.8, -3.6); ctx.lineTo(o, -4.8); ctx.lineTo(o + 0.8, -3.6); ctx.fill(); } ctx.restore(); }
    circ(ctx, 0, 0, 1.2, '#616a6b');
  },
  shield: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#1e3a4a'); circ(ctx, 0, 0, 2.8, '#5ad1e6'); circ(ctx, 0, 0, 1.6, '#c8f4ff');
    const p = (t * 0.8) % 1; ring(ctx, 0, 0, 2 + p * 3, `rgba(90,209,230,${0.7 - p * 0.7})`, 0.4);
  },
  scarecrow: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 1, '#8a6a4a'); line(ctx, -3.5, 0, 3.5, 0, '#6b4a2a', 0.8);
    circ(ctx, 0, 0, 2.6, '#d4a74a'); circ(ctx, 0, 0, 1.6, '#b8862a'); circ(ctx, -3.6, 0, 0.6, '#d4c48a'); circ(ctx, 3.6, 0, 0.6, '#d4c48a');
    circ(ctx, 1.4, -1.6, 0.6, '#222');
  },
  totem: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 1, '#5a3a20');
    circ(ctx, 0, 0, 3.2, '#a0603a'); circ(ctx, 0, 0, 2.2, '#c0392b'); circ(ctx, 0, 0, 1.2, '#d4a84b');
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; line(ctx, Math.cos(a) * 3.2, Math.sin(a) * 3.2, Math.cos(a) * 4.2, Math.sin(a) * 4.2, '#efe6cf', 0.7); }
  },
};
