// Drawing routines for world nodes. Each `shape` is recoloured by the node's palette (content/nodes.ts).
import type { ResNode } from '../world/world';
import { NODE } from '../../content/index';
import { drawShadow } from './primitives';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const circle = (ctx: C, x: number, y: number, r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

export function drawNode(ctx: C, n: ResNode, t: number) {
  const d = NODE[n.kind];
  if (!d) return;
  const c = d.colors;
  const s = n.size;
  const x = n.x + (n.shake > 0 ? Math.sin(t * 60) * n.shake * 1.5 : 0), y = n.y;
  switch (d.shape) {
    case 'tree': {
      drawShadow(ctx, x, y + 1, 6 * s, 2.5 * s);
      ctx.fillStyle = c[0]; ctx.fillRect(x - 1, y - 5 * s, 2, 5 * s + 1);
      circle(ctx, x - 3 * s, y - 7 * s, 4 * s, c[1]); circle(ctx, x + 3 * s, y - 7 * s, 4 * s, c[1]);
      circle(ctx, x, y - 10 * s, 5 * s, c[2]); circle(ctx, x - 1.5 * s, y - 11.5 * s, 2.2 * s, c[3]);
      if (c[4] && n.seedv > 0.75) { circle(ctx, x + 2 * s, y - 8 * s, 0.9, c[4]); circle(ctx, x - 2 * s, y - 9 * s, 0.9, c[4]); }
      break;
    }
    case 'bigtree': {
      drawShadow(ctx, x, y + 1, 10 * s, 4 * s);
      ctx.fillStyle = c[0]; ctx.fillRect(x - 2, y - 8 * s, 4, 8 * s + 1);
      circle(ctx, x - 5 * s, y - 11 * s, 6 * s, c[1]); circle(ctx, x + 5 * s, y - 11 * s, 6 * s, c[1]);
      circle(ctx, x, y - 15 * s, 7 * s, c[2]); circle(ctx, x - 2 * s, y - 17 * s, 3 * s, c[3]);
      if (c[4]) {
        const gl = 0.5 + 0.5 * Math.sin(t * 2 + n.seedv * 5);
        ctx.globalAlpha = 0.6 + gl * 0.4; ctx.fillStyle = c[4]; ctx.fillRect(x - 1, y - 5 * s, 2, 2); ctx.globalAlpha = 1;
      }
      break;
    }
    case 'pine': {
      drawShadow(ctx, x, y + 1, 5 * s, 2 * s);
      ctx.fillStyle = c[0]; ctx.fillRect(x - 1, y - 3 * s, 2, 3 * s + 1);
      for (let i = 0; i < 3; i++) {
        const w = (6 - i * 1.6) * s, yy = y - 3 * s - i * 4 * s;
        ctx.fillStyle = i % 2 ? c[2] : c[1];
        ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x, yy - 6 * s); ctx.fill();
        if (c[3]) { ctx.fillStyle = c[3]; ctx.fillRect(x - w * 0.5, yy - 1.2, w, 1); }
      }
      break;
    }
    case 'palm': {
      drawShadow(ctx, x + 2, y + 1, 6 * s, 2 * s);
      ctx.strokeStyle = c[0]; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const lean = (n.seedv - 0.5) * 6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.3, y - 6 * s, x + lean, y - 12 * s); ctx.stroke();
      const tx = x + lean, ty = y - 12 * s, sw = Math.sin(t * 1.5 + n.seedv * 9) * 0.15;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + sw;
        ctx.strokeStyle = i % 2 ? c[1] : c[2]; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * 4 * s, ty + Math.sin(a) * 3 * s - 2, tx + Math.cos(a) * 7 * s, ty + Math.sin(a) * 4 * s + 1.5); ctx.stroke();
      }
      circle(ctx, tx - 0.8, ty + 0.8, 0.9, c[3]); circle(ctx, tx + 0.8, ty + 1, 0.9, c[3]);
      break;
    }
    case 'dead': {
      drawShadow(ctx, x, y + 1, 4 * s, 1.5 * s);
      ctx.strokeStyle = c[0]; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 10 * s);
      ctx.moveTo(x, y - 6 * s); ctx.lineTo(x - 4 * s, y - 9 * s);
      ctx.moveTo(x, y - 8 * s); ctx.lineTo(x + 3.5 * s, y - 11 * s); ctx.stroke();
      if (c[1] && n.seedv > 0.6) circle(ctx, x - 4 * s, y - 9.5 * s, 1.2, c[1]);
      break;
    }
    case 'bush': {
      drawShadow(ctx, x, y + 1, 4 * s, 1.5 * s);
      circle(ctx, x - 2 * s, y - 2 * s, 2.6 * s, c[0]); circle(ctx, x + 2 * s, y - 2 * s, 2.6 * s, c[0]);
      circle(ctx, x, y - 3.5 * s, 3 * s, c[1]);
      ctx.fillStyle = c[2]; ctx.fillRect(x - 2, y - 4, 1, 1); ctx.fillRect(x + 1, y - 3, 1, 1); ctx.fillRect(x, y - 6, 1, 1);
      break;
    }
    case 'flower': {
      const petals = c.slice(1);
      for (let i = 0; i < 4; i++) {
        const a = n.seedv * 10 + i * 1.7;
        ctx.fillStyle = c[0]; ctx.fillRect(x + Math.cos(a) * 3, y + Math.sin(a) * 2, 1, 2);
        circle(ctx, x + Math.cos(a) * 3 + 0.5, y + Math.sin(a) * 2 - 0.5, 1.1, petals[(i + Math.floor(n.seedv * 4)) % petals.length]);
      }
      break;
    }
    case 'grass': {
      ctx.strokeStyle = c[0]; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const bx = x - 3 * s + i * 1.2 * s, sway = Math.sin(t * 1.6 + n.seedv * 9 + i) * 1.2;
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx + sway * 0.5, y - 3 * s, bx + sway, y - (5 + (i % 3) * 1.5) * s); ctx.stroke();
      }
      if (c[2]) { ctx.fillStyle = c[2]; ctx.fillRect(x - 1.5 * s, y - 7 * s, 1.1, 2.4); ctx.fillRect(x + 1.5 * s, y - 6.5 * s, 1.1, 2.4); }
      else { ctx.fillStyle = c[1]; ctx.fillRect(x - 0.5, y - 6.5 * s, 1, 1); }
      break;
    }
    case 'cactus': {
      drawShadow(ctx, x, y + 1, 3.5 * s, 1.5 * s);
      ctx.fillStyle = c[0];
      ctx.fillRect(x - 1.5 * s, y - 10 * s, 3 * s, 10 * s);
      ctx.fillRect(x - 4.5 * s, y - 7 * s, 2 * s, 4 * s); ctx.fillRect(x - 4.5 * s, y - 4 * s, 3.5 * s, 1.5 * s);
      ctx.fillRect(x + 2.5 * s, y - 8.5 * s, 2 * s, 4 * s); ctx.fillRect(x + 1 * s, y - 5.5 * s, 3.5 * s, 1.5 * s);
      ctx.fillStyle = c[1]; ctx.fillRect(x - 0.6 * s, y - 9.5 * s, 0.8, 8 * s);
      if (n.seedv > 0.7) circle(ctx, x, y - 10.5 * s, 1.3, c[2]);
      break;
    }
    case 'drift': {
      drawShadow(ctx, x, y + 1, 6 * s, 1.5 * s);
      ctx.fillStyle = c[0]; ctx.fillRect(x - 6 * s, y - 2.5, 12 * s, 3);
      ctx.fillStyle = c[1]; ctx.fillRect(x - 6 * s, y - 2.5, 12 * s, 1);
      break;
    }
    case 'rock':
    case 'vent':
    case 'meteor': {
      drawShadow(ctx, x, y + 1, 5 * s, 2 * s);
      ctx.fillStyle = c[0];
      ctx.beginPath(); ctx.moveTo(x - 5 * s, y); ctx.lineTo(x - 4 * s, y - 4 * s); ctx.lineTo(x - 1 * s, y - 6 * s);
      ctx.lineTo(x + 3 * s, y - 5 * s); ctx.lineTo(x + 5 * s, y - 1 * s); ctx.lineTo(x + 4 * s, y); ctx.fill();
      ctx.fillStyle = c[1];
      ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 4 * s); ctx.lineTo(x - 1 * s, y - 6 * s); ctx.lineTo(x + 1 * s, y - 3 * s); ctx.lineTo(x - 2 * s, y - 2 * s); ctx.fill();
      if (d.shape === 'rock' && c[2]) {
        ctx.fillStyle = c[2];
        ctx.fillRect(x - 2 * s, y - 3 * s, 1.5, 1.5); ctx.fillRect(x + 2 * s, y - 2 * s, 1.5, 1.5); ctx.fillRect(x + 0.5 * s, y - 4.5 * s, 1.2, 1.2);
        if (c[3]) { ctx.fillStyle = c[3]; ctx.fillRect(x - 2 * s, y - 3 * s, 0.6, 0.6); ctx.fillRect(x + 2.4 * s, y - 1.6 * s, 0.7, 0.7); }
      } else if (d.shape === 'vent') {
        ctx.fillStyle = c[2]; ctx.fillRect(x - 1.5 * s, y - 2.5 * s, 1.4, 1.4); ctx.fillRect(x + 1.8 * s, y - 1.6 * s, 1.2, 1.2);
        for (let i = 0; i < 3; i++) {
          const p = (t * 0.5 + i / 3 + n.seedv) % 1;
          ctx.globalAlpha = 0.5 - p * 0.5; ctx.fillStyle = c[3];
          ctx.beginPath(); ctx.arc(x + Math.sin(p * 6 + i) * 2, y - 6 * s - p * 10, 1.5 + p * 3, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        const g = 0.5 + 0.5 * Math.sin(t * 3 + n.seedv * 7);
        ctx.globalAlpha = 0.15 + g * 0.2; circle(ctx, x, y - 3 * s, 9 * s, c[2]); ctx.globalAlpha = 0.6 + g * 0.4;
        ctx.strokeStyle = c[2]; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(x - 3 * s, y - 1 * s); ctx.lineTo(x - 1 * s, y - 3 * s); ctx.lineTo(x + 1 * s, y - 2.5 * s); ctx.lineTo(x + 3 * s, y - 4.5 * s); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'crystal': {
      const glow = 0.5 + 0.5 * Math.sin(t * 2 + n.seedv * 10);
      ctx.globalAlpha = 0.6 + glow * 0.4; circle(ctx, x, y - 4 * s, 8 * s, c[3]); ctx.globalAlpha = 1;
      drawShadow(ctx, x, y + 1, 4 * s, 1.5 * s);
      const shard = (dx: number, h: number, w: number, c1: string, c2: string) => {
        ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x + dx - w, y); ctx.lineTo(x + dx, y - h); ctx.lineTo(x + dx + w, y); ctx.fill();
        ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x + dx - w * 0.2, y); ctx.lineTo(x + dx, y - h); ctx.lineTo(x + dx + w, y); ctx.fill();
      };
      shard(-3 * s, 6 * s, 2 * s, c[0], c[1]); shard(3 * s, 7 * s, 2 * s, c[0], c[1]); shard(0, 11 * s, 2.5 * s, c[1], c[2]);
      break;
    }
    case 'pool': {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + 0.5, 6.6 * s, 3.4 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.ellipse(x, y, 6 * s, 3 * s, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + n.seedv * 9);
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(x - 1.5, y - 0.8, 3 * s, 1 * s, 0.3, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      const bp = (t * 0.8 + n.seedv * 5) % 2;
      if (bp < 0.4) circle(ctx, x + 2, y - 0.5, bp * 3, c[2]);
      break;
    }
    case 'ruin': {
      drawShadow(ctx, x, y + 1, 6 * s, 2 * s);
      ctx.fillStyle = '#7a5c48'; ctx.fillRect(x - 5 * s, y - 4 * s, 4 * s, 4 * s);
      ctx.fillStyle = '#8f9aa1'; ctx.fillRect(x - 1 * s, y - 6 * s, 2.5 * s, 6 * s);
      ctx.fillStyle = '#b5651d'; ctx.fillRect(x + 2 * s, y - 2.5 * s, 4 * s, 2.5 * s);
      ctx.fillStyle = '#cfd8dc'; ctx.fillRect(x - 0.5 * s, y - 6 * s, 1, 1); ctx.fillRect(x + 3 * s, y - 2.5 * s, 1.5, 0.8);
      break;
    }
    case 'dune': {
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.ellipse(x + 1, y, 7 * s, 2.5 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(x, y - 1.5 * s, 6 * s, 3 * s, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = c[2]; ctx.beginPath(); ctx.ellipse(x - 1.5 * s, y - 2.5 * s, 3 * s, 1.4 * s, 0, Math.PI, 0); ctx.fill();
      break;
    }
    case 'clam': {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 0.5, 3.5 * s, 1.4 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(x, y - 1, 3 * s, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = c[1]; ctx.lineWidth = 0.4;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x + i * 1.2 * s, y - 1 - 2.6 * s + Math.abs(i) * 0.5); ctx.stroke(); }
      if (Math.sin(t * 0.8 + n.seedv * 20) > 0.6) circle(ctx, x, y - 0.6, 0.9, c[2]);
      break;
    }
    case 'hive': {
      drawShadow(ctx, x, y + 1, 4 * s, 1.5 * s);
      ctx.fillStyle = c[0]; ctx.fillRect(x - 1.2, y - 4 * s, 2.4, 4 * s + 1);
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(x, y - 7 * s, 3.4 * s, 4 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = c[2];
      for (let i = -1; i <= 1; i++) ctx.fillRect(x - 3 * s + Math.abs(i) * 0.6, y - 7 * s + i * 2 * s, 6 * s - Math.abs(i) * 1.2, 0.7);
      circle(ctx, x, y - 5.5 * s, 0.9, '#2b1a0a');
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * 2.1 + n.seedv * 9;
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + Math.cos(a) * 6 * s, y - 7 * s + Math.sin(a * 1.3) * 4 * s, 1, 1);
      }
      break;
    }
    case 'mushroom': {
      drawShadow(ctx, x, y + 1, 4 * s, 1.5 * s);
      ctx.fillStyle = c[0]; ctx.fillRect(x - 1 * s, y - 4 * s, 2 * s, 4 * s + 0.5);
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(x, y - 4 * s, 4 * s, 2.8 * s, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = c[2];
      circle(ctx, x - 1.6 * s, y - 5 * s, 0.6 * s, c[2]); circle(ctx, x + 1.2 * s, y - 5.8 * s, 0.5 * s, c[2]); circle(ctx, x + 2.4 * s, y - 4.6 * s, 0.4 * s, c[2]);
      if (d.glow) { ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 2 + n.seedv * 7); circle(ctx, x, y - 4 * s, 6 * s, c[2]); ctx.globalAlpha = 1; }
      break;
    }
    case 'bones': {
      ctx.strokeStyle = c[1]; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const bone = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.strokeStyle = c[0]; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        circle(ctx, x1, y1, 0.9, c[0]); circle(ctx, x2, y2, 0.9, c[0]);
      };
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 0.5, 5 * s, 1.6 * s, 0, 0, TAU); ctx.fill();
      bone(x - 4 * s, y - 1, x + 3 * s, y - 2.5 * s); bone(x - 2 * s, y - 3.5 * s, x + 4 * s, y - 0.5);
      if (n.seedv > 0.5) bone(x - 3 * s, y + 0.2, x + 1 * s, y - 4 * s);
      break;
    }
    case 'skull': {
      drawShadow(ctx, x, y + 1, 7 * s, 2.5 * s);
      ctx.strokeStyle = c[0]; ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + 2 * s + i * 1.6 * s, y - 1, 3 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.ellipse(x - 3 * s, y - 3 * s, 3.4 * s, 2.8 * s, 0, 0, TAU); ctx.fill();
      ctx.fillRect(x - 5 * s, y - 2 * s, 4 * s, 2 * s);
      circle(ctx, x - 4.2 * s, y - 3.4 * s, 0.9 * s, c[1]); circle(ctx, x - 2 * s, y - 3.4 * s, 0.9 * s, c[1]);
      break;
    }
    case 'coral': {
      ctx.lineCap = 'round';
      const branch = (dx: number, col: string, h: number) => {
        ctx.strokeStyle = col; ctx.lineWidth = 1.3;
        const sw = Math.sin(t * 1.2 + dx + n.seedv * 7) * 0.6;
        ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx + sw, y - h * s);
        ctx.moveTo(x + dx + sw * 0.5, y - h * 0.5 * s); ctx.lineTo(x + dx - 1.5 * s + sw, y - h * 0.8 * s);
        ctx.moveTo(x + dx + sw * 0.6, y - h * 0.6 * s); ctx.lineTo(x + dx + 1.6 * s + sw, y - h * 0.9 * s); ctx.stroke();
      };
      branch(-2.5 * s, c[0], 5); branch(0, c[1], 6.5); branch(2.6 * s, c[2], 4.5);
      break;
    }
    case 'web': {
      ctx.strokeStyle = c[0]; ctx.lineWidth = 0.35;
      const cx = x, cy = y - 4 * s, R = 5 * s;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
      for (let r = 1; r <= 3; r++) { ctx.beginPath(); for (let i = 0; i <= 8; i++) { const a = (i / 8) * TAU; const rr = (R * r) / 3.3; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.stroke(); }
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      if (Math.sin(t * 2 + n.seedv * 9) > 0.7) circle(ctx, cx + 1.5 * s, cy - 1.5 * s, 0.5, '#fff');
      break;
    }
  }
  if (n.hp < n.maxHp) {
    const w = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2, y + 3, w, 1.6);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - w / 2, y + 3, (w * n.hp) / n.maxHp, 1.6);
  }
}
