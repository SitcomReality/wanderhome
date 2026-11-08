// Artwork for harvest parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { TAU, circ, gear, line, ring, rr } from '../primitives';
import type { PartArtFn } from './types';

export const HARVEST_ART: Record<string, PartArtFn> = {
  claw: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#7a5a2a'); circ(ctx, -1.5, 0, 2, '#f39c12'); circ(ctx, -1.5, 0, 0.8, '#7a4a0a');
    line(ctx, -1.5, 0, 2, 0, '#e08a0a', 1.2);
    const open = 0.4 + Math.abs(Math.sin(t * 2)) * 0.5;
    for (const sgn of [-1, 1]) { line(ctx, 2, 0, 3.5, sgn * open * 2, '#5a4a3a', 0.6); line(ctx, 3.5, sgn * open * 2, 4.2, sgn * open * 0.8, '#5a4a3a', 0.6); }
  },
  saw: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#4a4f56');
    ctx.save(); ctx.rotate(t * 12);
    gear(ctx, 0, 0, 3.1, 12, 0, '#c8d0d8'); circ(ctx, 0, 0, 1.6, '#9aa3ad');
    ctx.restore(); circ(ctx, 0, 0, 0.6, '#e74c3c');
  },
  drill: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#c09020'); for (let i = -4; i < 4; i += 2) { ctx.fillStyle = '#2b2320'; ctx.beginPath(); ctx.moveTo(i, -4); ctx.lineTo(i + 1, -4); ctx.lineTo(i - 1, 4); ctx.lineTo(i - 2, 4); ctx.fill(); }
    circ(ctx, 0, 0, 3, '#7f8c8d');
    ctx.save(); ctx.rotate(-t * 9);
    for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.strokeStyle = '#d0d6da'; ctx.lineWidth = 0.55; ctx.beginPath(); ctx.arc(0.8, 0, 1.8, -1.2, 1.4); ctx.stroke(); }
    ctx.restore(); circ(ctx, 0, 0, 0.6, '#333');
  },
  scythe: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#5a6a4a');
    ctx.save(); ctx.rotate(t * 7);
    for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.strokeStyle = '#e0e6ea'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(1.6, 0.8, 2.4, -2, 0); ctx.stroke(); }
    ctx.restore(); circ(ctx, 0, 0, 1, '#a3b18a');
  },
  pump: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#2b333c'); circ(ctx, -1.6, 1.4, 2, '#111'); circ(ctx, -1.6, 1.4, 1.3, '#3a2a5a');
    const a = Math.sin(t * 3) * 0.4;
    ctx.save(); ctx.translate(1, -1); ctx.rotate(a); rr(ctx, -3.5, -0.5, 6.5, 1, 0.3, '#e0b030'); circ(ctx, -3.5, 0, 0.9, '#c09020'); ctx.restore();
    circ(ctx, 1, -1, 0.6, '#555');
  },
  sieve: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#8a6a3a'); rr(ctx, -3.2, -3.2, 6.4, 6.4, 0.5, '#2b2320');
    for (let i = -3; i <= 3; i += 1) { line(ctx, i, -3.2, i, 3.2, '#a08a6a', 0.15); line(ctx, -3.2, i, 3.2, i, '#a08a6a', 0.15); }
    const j = Math.sin(t * 16) * 0.3;
    for (let i = 0; i < 6; i++) circ(ctx, Math.sin(i * 2.7) * 2.4 + j, Math.cos(i * 1.9) * 2.4, 0.45, '#e9cf8a');
  },
  net: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 1, '#5a4a3a');
    ring(ctx, 0, 0, 3.2, '#d9b88a', 0.8);
    for (let i = -2; i <= 2; i++) { line(ctx, i * 1.2, -2.8, i * 1.2, 2.8, 'rgba(217,184,138,0.7)', 0.2); line(ctx, -2.8, i * 1.2, 2.8, i * 1.2, 'rgba(217,184,138,0.7)', 0.2); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; circ(ctx, Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0.55, '#e74c3c'); }
  },
  icepick: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#5a7a90');
    const k = Math.sin(t * 6) * 0.2;
    for (const sgn of [-1, 1]) {
      ctx.save(); ctx.rotate(sgn * (0.7 + k));
      line(ctx, 0, 3.5, 0, -2.5, '#8a6a4a', 0.8); ctx.fillStyle = '#d8e6f0'; ctx.beginPath(); ctx.moveTo(-2.2, -2.2); ctx.lineTo(2.2, -2.8); ctx.lineTo(0, -3.6); ctx.fill();
      ctx.restore();
    }
  },
  magnet: (ctx, t) => {
    rr(ctx, -4, -4, 8, 8, 1, '#3a3f47');
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-0.5, 0, 2.4, Math.PI / 2, -Math.PI / 2); ctx.stroke();
    ctx.lineWidth = 2; line(ctx, -0.5, -2.4, 2.2, -2.4, '#e74c3c', 2); line(ctx, -0.5, 2.4, 2.2, 2.4, '#e74c3c', 2);
    ctx.fillStyle = '#e0e6ea'; ctx.fillRect(2.2, -3.4, 1.4, 2); ctx.fillRect(2.2, 1.4, 1.4, 2);
    const p = (t * 1.5) % 1; ring(ctx, 3.5, 0, 1 + p * 2, `rgba(255,120,120,${0.6 - p * 0.6})`, 0.3);
  },
};
