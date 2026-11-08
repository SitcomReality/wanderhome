// Tiny procedural paintings for postcards and family portraits (no image assets).
import { BIOME } from '../../content/index';
import type { Postcard } from '../family/meta';
import { mulberry } from '../world/noise';

const shadeRgb = (c: [number, number, number], k: number) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;

export function drawPostcard(ctx: CanvasRenderingContext2D, w: number, h: number, card: Postcard) {
  const r = mulberry(card.seed >>> 0);
  const b = BIOME[card.biome] ?? BIOME.grass;
  const col = b?.color ?? [112, 170, 82];
  const mood = Math.floor(r() * 4); // 0 dawn, 1 day, 2 dusk, 3 night
  const skies = [['#ffb38a', '#ffe3b3'], ['#7cc4f0', '#d8f0ff'], ['#7a4a8a', '#ff9e6e'], ['#141a3a', '#3a4a7a']][mood];
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, skies[0]); sky.addColorStop(1, skies[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // sun / moon & stars
  const sx = w * (0.2 + r() * 0.6), sy = h * (0.18 + r() * 0.18);
  ctx.fillStyle = mood === 3 ? '#f4f1d6' : mood === 2 ? '#ffd27a' : '#fff6c8';
  ctx.beginPath(); ctx.arc(sx, sy, h * 0.08, 0, Math.PI * 2); ctx.fill();
  if (mood === 3) for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; ctx.fillRect(r() * w, r() * h * 0.5, 1, 1); }
  // far hills
  ctx.fillStyle = shadeRgb(col, mood === 3 ? 0.45 : 0.75);
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h * 0.58 + Math.sin(x * 0.05 + r() * 0.2 + card.seed) * h * 0.06);
  ctx.lineTo(w, h); ctx.fill();
  // ground
  const water = b?.band === 'deep' || b?.band === 'shallow';
  ctx.fillStyle = shadeRgb(col, mood === 3 ? 0.55 : 1);
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h * 0.72 + Math.sin(x * 0.03 + card.seed * 0.1) * h * 0.04);
  ctx.lineTo(w, h); ctx.fill();
  if (water) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 8; i++) ctx.fillRect(r() * w, h * 0.75 + r() * h * 0.22, 6, 1); }
  // foreground props
  const dark = shadeRgb(col, 0.45);
  const tex = b?.texture.style;
  for (let i = 0; i < 5; i++) {
    const x = r() * w, y = h * (0.74 + r() * 0.18), s = h * (0.06 + r() * 0.08);
    ctx.fillStyle = dark;
    if (tex === 'snow' || card.biome === 'taiga') { ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x, y - s * 1.6); ctx.lineTo(x + s * 0.5, y); ctx.fill(); }
    else if (tex === 'sand' || tex === 'cracked' || tex === 'stripes') { ctx.fillRect(x - 1, y - s, 2, s); ctx.fillRect(x - 3, y - s * 0.7, 2, s * 0.35); }
    else if (tex === 'crystal') { ctx.fillStyle = '#e6c8ff'; ctx.beginPath(); ctx.moveTo(x - s * 0.3, y); ctx.lineTo(x, y - s * 1.4); ctx.lineTo(x + s * 0.3, y); ctx.fill(); }
    else if (!water) { ctx.beginPath(); ctx.arc(x, y - s * 0.8, s * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 1, y - s * 0.4, 2, s * 0.4); }
  }
  // subject
  const cx = w * 0.5, gy = h * 0.8;
  ctx.fillStyle = mood === 3 ? '#2a2a3a' : '#3a2a2a';
  if (card.kind === 'town') {
    for (let i = -1; i <= 1; i++) { const x = cx + i * h * 0.16, s = h * 0.1; ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x - s * 0.5, gy - s, s, s); ctx.fillStyle = ['#c0392b', '#2980b9', '#8e44ad'][i + 1]; ctx.beginPath(); ctx.moveTo(x - s * 0.65, gy - s); ctx.lineTo(x, gy - s * 1.6); ctx.lineTo(x + s * 0.65, gy - s); ctx.fill(); if (mood >= 2) { ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x - s * 0.15, gy - s * 0.6, s * 0.3, s * 0.3); } }
  } else if (card.kind === 'landmark') {
    ctx.fillRect(cx - h * 0.04, gy - h * 0.3, h * 0.08, h * 0.3); ctx.beginPath(); ctx.arc(cx, gy - h * 0.32, h * 0.06, 0, Math.PI * 2); ctx.fill();
  } else {
    // our little house
    const s = h * 0.12;
    ctx.fillStyle = '#d9b382'; ctx.fillRect(cx - s, gy - s * 0.9, s * 2, s * 0.9);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(cx - s * 1.15, gy - s * 0.9); ctx.lineTo(cx, gy - s * 1.6); ctx.lineTo(cx + s * 1.15, gy - s * 0.9); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - s * 0.6, gy, s * 0.22, 0, Math.PI * 2); ctx.arc(cx + s * 0.6, gy, s * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mood >= 2 ? '#ffe9a8' : '#7fd1e8'; ctx.fillRect(cx - s * 0.25, gy - s * 0.65, s * 0.5, s * 0.35);
  }
  if (card.icon) { ctx.font = `${h * 0.2}px system-ui, "Apple Color Emoji","Segoe UI Emoji"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(card.icon, w * 0.82, h * 0.22); }
  // stamp + border
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.fillStyle = 'rgba(255,240,220,0.9)'; ctx.fillRect(w - 16, 5, 11, 13);
  ctx.fillStyle = b ? shadeRgb(col, 0.8) : '#888'; ctx.fillRect(w - 14, 7, 7, 9);
}

/** A tiny family portrait for the generations shelf. */
export function drawPortrait(ctx: CanvasRenderingContext2D, size: number, seed: number) {
  const r = mulberry(seed >>> 0);
  const bgs = ['#f4d6a0', '#a0d8c8', '#c8b0e8', '#f0b0a0', '#b0c8f0'];
  ctx.fillStyle = bgs[(r() * bgs.length) | 0]; ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
  const skin = ['#ffd7a8', '#e8b48a', '#c08a5a', '#8a5a3a', '#f4c8a8'][(r() * 5) | 0];
  const hair = ['#3a2a1a', '#8a5a2a', '#e0c070', '#d0d0d0', '#a03a2a', '#2a2a3a'][(r() * 6) | 0];
  const s = size;
  ctx.fillStyle = ['#ff7a59', '#3d5a80', '#58a060', '#a060c0'][(r() * 4) | 0];
  ctx.beginPath(); ctx.ellipse(s / 2, s * 0.95, s * 0.32, s * 0.25, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(s / 2, s * 0.48, s * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(s / 2, s * 0.42, s * 0.21, Math.PI, 0); ctx.fill();
  if (r() < 0.4) { ctx.fillRect(s * 0.28, s * 0.42, s * 0.07, s * 0.2); ctx.fillRect(s * 0.65, s * 0.42, s * 0.07, s * 0.2); }
  ctx.fillStyle = '#222'; ctx.fillRect(s * 0.42, s * 0.48, s * 0.04, s * 0.04); ctx.fillRect(s * 0.54, s * 0.48, s * 0.04, s * 0.04);
  ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.beginPath(); ctx.arc(s / 2, s * 0.53, s * 0.06, 0.2, Math.PI - 0.2); ctx.stroke();
  if (r() < 0.35) { ctx.fillStyle = ['#c0392b', '#5a3a20', '#2980b9'][(r() * 3) | 0]; ctx.fillRect(s * 0.28, s * 0.24, s * 0.44, s * 0.06); ctx.fillRect(s * 0.36, s * 0.12, s * 0.28, s * 0.13); }
}
