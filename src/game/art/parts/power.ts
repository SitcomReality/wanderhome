// Artwork for power parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { TAU, circ, gear, line, ring, rivets, rr } from '../primitives';
import type { PartArtFn } from './types';

export const POWER_ART: Record<string, PartArtFn> = {
  hamster: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#c99a68');
    ring(ctx, 0, 0, 3.2, '#6b4226', 0.9); ring(ctx, 0, 0, 2.4, 'rgba(107,66,38,0.4)', 0.3);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 5; line(ctx, Math.cos(a) * 2.4, Math.sin(a) * 2.4, Math.cos(a) * 3.2, Math.sin(a) * 3.2, '#6b4226', 0.3); }
    const a = Math.PI / 2 + Math.sin(t * 12) * 0.15;
    circ(ctx, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 1.1, '#f5cba7'); circ(ctx, Math.cos(a) * 2.6 + 0.6, Math.sin(a) * 2.6 - 0.3, 0.6, '#f5cba7');
    circ(ctx, Math.cos(a) * 2.6 + 0.9, Math.sin(a) * 2.6 - 0.4, 0.18, '#111');
  },
  steam: (ctx, t) => {
    circ(ctx, 0, 0, 4, '#7a4a22'); circ(ctx, 0, 0, 3.5, '#b87333'); circ(ctx, -0.8, -0.8, 2, '#d08a4a');
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; circ(ctx, Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0.3, '#5a3010'); }
    circ(ctx, 1.6, 1.6, 1.2, '#2b2320'); circ(ctx, 1.6, 1.6, 0.6, '#111');
    circ(ctx, -1.6, 1.5, 0.8, '#f5f5f5'); line(ctx, -1.6, 1.5, -1.6 + Math.cos(t * 3) * 0.6, 1.5 + Math.sin(t * 3) * 0.6, '#c0392b', 0.25);
  },
  sail: (ctx, t, o) => {
    rr(ctx, -4, -4, 8, 8, 1, '#8a6a4a');
    const w = o.wind ?? 0.6;
    line(ctx, -3.5, 0, 3.5, 0, '#5b3a24', 0.6);
    ctx.fillStyle = '#f6f1e4'; ctx.beginPath(); ctx.moveTo(-3.2, 0); ctx.quadraticCurveTo(0, -1 - w * 3.5 + Math.sin(t * 3) * 0.4, 3.2, 0); ctx.quadraticCurveTo(0, -0.8, -3.2, 0); ctx.fill();
    ctx.fillStyle = '#e0d5bc'; ctx.beginPath(); ctx.moveTo(-3.2, 0); ctx.quadraticCurveTo(0, 1 + w * 3 + Math.sin(t * 3 + 1) * 0.4, 3.2, 0); ctx.quadraticCurveTo(0, 0.8, -3.2, 0); ctx.fill();
    circ(ctx, 0, 0, 0.8, '#3a2a1a'); line(ctx, -3.6, -3.6, -3.2, 0, 'rgba(255,255,255,0.4)', 0.15); line(ctx, 3.6, 3.6, 3.2, 0, 'rgba(255,255,255,0.4)', 0.15);
  },
  clock: (ctx, t) => {
    circ(ctx, 0, 0, 4, '#8a6a2a'); gear(ctx, 0, 0, 2.9, 10, t * 0.5, '#d4a84b');
    gear(ctx, 2.6, -2.6, 1.2, 6, -t * 1.3, '#b08a3a');
    line(ctx, 0, 0, Math.cos(t * 2) * 2, Math.sin(t * 2) * 2, '#2b2320', 0.35);
  },
  combust: (ctx, t) => {
    rr(ctx, -4, -3.6, 8, 7.2, 1, '#6a2020'); rr(ctx, -3.4, -3, 6.8, 6, 0.8, '#c0392b');
    for (let i = 0; i < 4; i++) {
      const px = -1.8 + (i % 2) * 3.6, py = -1.4 + Math.floor(i / 2) * 2.8, b = Math.sin(t * 25 + i * 1.6) * 0.3;
      circ(ctx, px, py, 1.1, '#3a3f47'); circ(ctx, px, py + b, 0.7, '#9aa3ad');
    }
    rr(ctx, -4.5, 2.4, 2.2, 1.2, 0.5, '#3a3f47');
  },
  solar: (ctx) => {
    rr(ctx, -4.2, -4.2, 8.4, 8.4, 0.6, '#c0c8d0');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) rr(ctx, -3.8 + i * 2.6, -3.8 + j * 2.6, 2.4, 2.4, 0.2, '#1e4a8a');
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(-3.8, 1); ctx.lineTo(1, -3.8); ctx.lineTo(2.4, -3.8); ctx.lineTo(-3.8, 2.4); ctx.fill();
  },
  frost: (ctx, t) => {
    circ(ctx, 0, 0, 4, '#3a7aa0'); circ(ctx, 0, 0, 3.4, '#bfe6ff');
    for (let i = 0; i < 5; i++) { const a = t * 6 + i / 5 * TAU; ctx.fillStyle = '#4a9ad0'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 3, Math.sin(a) * 3); ctx.lineTo(Math.cos(a + 0.5) * 2.6, Math.sin(a + 0.5) * 2.6); ctx.fill(); }
    circ(ctx, 0, 0, 0.9, '#e8f6ff');
    for (let i = 0; i < 3; i++) circ(ctx, Math.sin(i * 7 + t) * 3.5, Math.cos(i * 5 + t) * 3.5, 0.3, '#fff');
  },
  brimstone: (ctx, t) => {
    rr(ctx, -4.2, -4.2, 8.4, 8.4, 0.8, '#2b2320'); rr(ctx, -3.6, -3.6, 7.2, 7.2, 0.6, '#4a3a30');
    const f = 0.6 + 0.4 * Math.sin(t * 13) * Math.sin(t * 7);
    rr(ctx, -2.6, -2, 5.2, 4, 0.5, `rgb(${220 + f * 35},${90 + f * 80},30)`);
    for (let i = -2; i <= 2; i++) line(ctx, i * 1.1, -2, i * 1.1, 2, '#2b2320', 0.45);
    circ(ctx, -3, 3, 0.4, '#f2e14c'); circ(ctx, 3, -3, 0.4, '#f2e14c'); rivets(ctx, 3.6);
  },
  reactor: (ctx, t) => {
    circ(ctx, 0, 0, 4.1, '#3a2050'); ring(ctx, 0, 0, 3.3, '#9b59b6', 0.8);
    const p = 0.5 + 0.5 * Math.sin(t * 4);
    circ(ctx, 0, 0, 2.6, `rgba(200,140,255,${0.3 + p * 0.3})`); circ(ctx, 0, 0, 1.2 + p * 0.5, '#f2e0ff');
    for (let i = 0; i < 3; i++) { const a = t * 2 + i / 3 * TAU; circ(ctx, Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0.5, '#e0b3ff'); }
  },
  starcore: (ctx, t) => {
    circ(ctx, 0, 0, 4.2, '#0e1630');
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 4); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#7fe0ff'); g.addColorStop(1, 'rgba(60,100,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    for (let i = 0; i < 2; i++) { const a = t * (1.5 + i) + i * 2; circ(ctx, Math.cos(a) * 3.2, Math.sin(a) * 1.6 * (i ? -1 : 1), 0.45, '#fff'); }
  },
  windmill: (ctx, t, o) => {
    rr(ctx, -4, -4, 8, 8, 1, '#8a6a4a'); circ(ctx, 0, 0, 2.6, '#c8b48a');
    ctx.save(); ctx.rotate(t * (1 + (o.wind ?? 0.6) * 4));
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); rr(ctx, 0.6, -0.9, 4.4, 1.8, 0.3, '#efe6d0'); line(ctx, 0, 0, 5, 0, '#5a3a20', 0.35); }
    ctx.restore(); circ(ctx, 0, 0, 0.8, '#3a2a1a');
  },
};
