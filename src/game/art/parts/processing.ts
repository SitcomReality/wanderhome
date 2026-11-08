// Artwork for processing parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { TAU, circ, gear, line, rr } from '../primitives';
import type { PartArtFn } from './types';

export const PROCESSING_ART: Record<string, PartArtFn> = {
  loom: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 0.6, '#6b4a2a');
    const cols = ['#e85d75', '#ffd166', '#7fd1e8', '#58d68d', '#c39bd3'];
    for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(-3.2 + i * 1.3, -3.2, 0.9, 6.4); }
    const sx = Math.sin(t * 3) * 2.8; rr(ctx, sx - 1, -0.5, 2, 1, 0.4, '#3a2a1a');
  },
  recycler: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1.2, '#2e7d4a'); circ(ctx, 0, 0, 3, '#1e5a34');
    ctx.save(); ctx.rotate(t * 2);
    for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.strokeStyle = '#8ff0b0'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 1.4); ctx.stroke(); ctx.fillStyle = '#8ff0b0'; ctx.beginPath(); ctx.moveTo(2 * Math.cos(1.4) + 0.6, 2 * Math.sin(1.4)); ctx.lineTo(2 * Math.cos(1.4) - 0.6, 2 * Math.sin(1.4)); ctx.lineTo(2 * Math.cos(1.6) - 0.2, 2 * Math.sin(1.6) + 0.6); ctx.fill(); }
    ctx.restore();
  },
  smelter: (ctx, t) => {
    rr(ctx, -4.2, -4.2, 8.4, 8.4, 0.6, '#7a2e1e');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) rr(ctx, -4 + c * 2.8 + (r % 2) * 1.4 - 0.7, -4 + r * 2.1, 2.5, 1.8, 0.2, r % 2 ? '#a0402a' : '#8a3420');
    const f = 0.7 + 0.3 * Math.sin(t * 9);
    circ(ctx, 0, 0, 2.2, '#2b2320'); circ(ctx, 0, 0, 1.6, `rgb(255,${120 + f * 80},40)`);
  },
  kiln: (ctx, t) => {
    circ(ctx, 0, 0, 4.2, '#8a5034'); circ(ctx, 0, 0, 3.6, '#c27c54'); circ(ctx, -1, -1, 1.8, '#d49a74');
    const f = 0.6 + 0.4 * Math.sin(t * 7);
    rr(ctx, -1.4, 1.6, 2.8, 1.8, 0.8, `rgb(255,${130 + f * 90},50)`);
  },
  distill: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#3a5a50'); circ(ctx, -1.4, -1, 2.4, '#b87333'); circ(ctx, -2, -1.6, 1, '#d89a5a');
    ctx.strokeStyle = '#d89a5a'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let i = 0; i < 20; i++) { const a = i * 0.7; ctx.lineTo(2 + Math.cos(a) * 1.2, -2 + i * 0.25 + Math.sin(a) * 0.4); } ctx.stroke();
    circ(ctx, 2, 3, 1, '#58d6a0'); const p = (t * 1.2) % 1; circ(ctx, 2, 3 - p * 1.5, 0.3 * (1 - p), '#c8ffe8');
  },
  tinker: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 0.6, '#7a5a3a'); ctx.fillStyle = '#5a3a20'; ctx.fillRect(-4, -0.3, 8, 0.6);
    gear(ctx, -1.6, -1.6, 1.4, 7, t * 2, '#d4a84b'); gear(ctx, 0.6, -0.6, 0.9, 6, -t * 3, '#b08a3a');
    line(ctx, 1, 1.6, 3.4, 3, '#9aa3ad', 0.6); rr(ctx, -3.4, 1.4, 2.6, 1, 0.3, '#c0392b');
  },
};
