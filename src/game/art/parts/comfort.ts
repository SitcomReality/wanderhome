// Artwork for comfort parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { TAU, circ, line, ring, rr } from '../primitives';
import type { PartArtFn } from './types';

export const COMFORT_ART: Record<string, PartArtFn> = {
  plant: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#8a6a4a'); circ(ctx, 0, 0, 2.6, '#c0603a'); circ(ctx, 0, 0, 2, '#4a3020');
    const sw = Math.sin(t * 1.2) * 0.15;
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + sw; ctx.fillStyle = i % 2 ? '#4fae4a' : '#6fc96a'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 1.8, Math.sin(a) * 1.8, 1.8, 0.8, a, 0, TAU); ctx.fill(); }
  },
  bunk: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 0.8, '#6b4a2a'); rr(ctx, -3.6, -3.4, 7.2, 6.8, 0.8, '#f0e8f8');
    rr(ctx, 1.2, -3, 2.2, 6, 0.8, '#ffffff'); rr(ctx, -3.6, -3.4, 4.2, 6.8, 0.8, '#c39bd3');
    for (let i = 0; i < 3; i++) line(ctx, -3.2 + i * 1.3, -3, -3.2 + i * 1.3, 3, 'rgba(255,255,255,0.3)', 0.3);
  },
  hearth: (ctx, t) => {
    circ(ctx, 0, 0, 4, '#6a6a6a'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; circ(ctx, Math.cos(a) * 3.2, Math.sin(a) * 3.2, 1.1, i % 2 ? '#8a8a8a' : '#7a7a7a'); }
    circ(ctx, 0, 0, 2.2, '#2b2320');
    for (let i = 0; i < 4; i++) { const f = Math.sin(t * 10 + i * 2) * 0.4; circ(ctx, Math.cos(i * 1.7) * 0.8, Math.sin(i * 1.7) * 0.8, 1 + f, i % 2 ? '#ff9f43' : '#ffd166'); }
  },
  library: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 0.6, '#5a3a20');
    const cols = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#d35400'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) rr(ctx, -3.6 + i * 1.2, -3.6 + r * 2.5, 1, 2.1, 0.2, cols[(i * 3 + r * 2) % cols.length]);
  },
  records: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#c08a3a'); circ(ctx, -0.5, 0, 3.2, '#111');
    ctx.save(); ctx.translate(-0.5, 0); ctx.rotate(t * 3);
    ring(ctx, 0, 0, 2.2, 'rgba(255,255,255,0.12)', 0.2); ring(ctx, 0, 0, 1.6, 'rgba(255,255,255,0.12)', 0.2);
    circ(ctx, 0, 0, 1, '#e85d75'); circ(ctx, 0.5, 0, 0.25, '#fff');
    ctx.restore(); line(ctx, 3.2, -3.2, 1, 0.5, '#d0d6da', 0.4);
  },
  aquarium: (ctx, t) => {
    rr(ctx, -4.2, -4.2, 8.4, 8.4, 0.8, '#bfe9f0'); rr(ctx, -3.6, -3.6, 7.2, 7.2, 0.6, '#2a7ab0');
    for (let i = 0; i < 3; i++) { const fx = Math.sin(t * (0.8 + i * 0.3) + i * 2) * 2.4, fy = -2 + i * 2; ctx.fillStyle = ['#ff9f43', '#ffd166', '#e85d75'][i]; ctx.beginPath(); ctx.ellipse(fx, fy, 0.9, 0.5, 0, 0, TAU); ctx.fill(); }
    circ(ctx, -2.5, 2.8, 0.8, '#3a8a3a'); circ(ctx, 2.4, 2.6, 0.6, '#f3eefc');
    const p = (t * 0.7) % 1; circ(ctx, 1, 3 - p * 6, 0.3, 'rgba(255,255,255,0.6)');
  },
  amberlamp: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#5a3a20');
    const p = 0.6 + 0.4 * Math.sin(t * 2);
    circ(ctx, 0, 0, 3.6, `rgba(255,159,28,${0.25 * p})`); circ(ctx, 0, 0, 2.2, '#ff9f1c'); circ(ctx, -0.6, -0.6, 1, '#ffe0a0');
  },
  lava: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#3a2a4a'); circ(ctx, 0, 0, 2.8, '#ff6f91'); circ(ctx, 0, 0, 2.4, '#ffb3c6');
    for (let i = 0; i < 3; i++) { const a = t * 0.7 + i * 2.1; circ(ctx, Math.cos(a) * 1.2, Math.sin(a * 1.3) * 1.2, 0.8, '#ff3b6b'); }
  },
  coralgarden: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1.2, '#7a8a96'); rr(ctx, -3.3, -3.3, 6.6, 6.6, 1, '#2a7ab0');
    const cols = ['#ff7f9f', '#ffb347', '#c38bff'];
    for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 1.4 + i) * 0.3; line(ctx, -2 + i * 2, 2.6, -2 + i * 2 + sw, -1.5 + i * 0.4, cols[i], 0.9); circ(ctx, -2 + i * 2 + sw, -1.5 + i * 0.4, 0.8, cols[i]); }
    const fx = Math.sin(t * 0.9) * 2.2; ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(fx, 0.5, 0.8, 0.45, 0, 0, TAU); ctx.fill();
  },
  terrarium: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1.2, '#3a2a4a');
    circ(ctx, 0, 0, 3.4, 'rgba(200,180,255,0.25)'); ring(ctx, 0, 0, 3.4, 'rgba(230,220,255,0.7)', 0.4);
    const g = 0.6 + 0.4 * Math.sin(t * 2);
    for (const [x, y, c] of [[-1.3, 0.8, '#7fe0ff'], [1.2, -0.6, '#c8a0ff'], [0.4, 1.6, '#9be070']] as [number, number, string][]) { circ(ctx, x, y, 1.1 * g, c); circ(ctx, x, y + 0.4, 0.35, '#e8dcf0'); }
  },
  hottub: (ctx, t) => {
    rr(ctx, -4.2, -4.2, 8.4, 8.4, 2, '#8a8f96'); rr(ctx, -3.4, -3.4, 6.8, 6.8, 1.6, '#4ab0d8');
    for (let i = 0; i < 3; i++) { const p = (t * 0.5 + i / 3) % 1; circ(ctx, -1.5 + i * 1.5, 1.5 - p * 4, 0.6 + p * 1.2, `rgba(255,255,255,${0.5 - p * 0.5})`); }
    ring(ctx, 0, 0, 2, 'rgba(255,255,255,0.25)', 0.3);
  },
};
