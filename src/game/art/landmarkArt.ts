// Drawing routines for landmarks (content/landmarks.ts → `shape`).
import type { Landmark } from '../world/world';
import { drawShadow } from './primitives';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const circ = (ctx: C, x: number, y: number, r: number, c: string) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const rect = (ctx: C, x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

export function drawLandmark(ctx: C, lm: Landmark, t: number, visited: boolean) {
  const x = lm.x, y = lm.y, sv = lm.seedv;
  switch (lm.def.shape) {
    case 'stones': {
      ctx.strokeStyle = 'rgba(80,70,60,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 16, 10, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU, sx = x + Math.cos(a) * 16, sy = y + Math.sin(a) * 10;
        drawShadow(ctx, sx, sy + 1, 3, 1.2); rect(ctx, sx - 1.8, sy - 7, 3.6, 7, '#8a8f96'); rect(ctx, sx - 1.8, sy - 7, 1.2, 7, '#a8adb3');
      }
      rect(ctx, x - 4, y - 2, 8, 3, '#7a7f86');
      const g = 0.5 + 0.5 * Math.sin(t * 2);
      circ(ctx, x, y - 2, 3 + g, `rgba(150,220,255,${0.15 + g * 0.15})`);
      break;
    }
    case 'statue': {
      drawShadow(ctx, x, y + 1, 7, 2.5);
      rect(ctx, x - 5, y - 4, 10, 4, '#7a7f86'); rect(ctx, x - 3, y - 14, 6, 10, '#9aa0a6');
      circ(ctx, x, y - 16, 2.6, '#9aa0a6'); rect(ctx, x + 2, y - 13, 6, 1.6, '#9aa0a6');
      rect(ctx, x - 3, y - 10, 2, 4, '#6a9a5a'); circ(ctx, x - 1, y - 17, 1, '#6a9a5a');
      circ(ctx, x, y - 1, 1.5, '#ffd166');
      break;
    }
    case 'skeleton': {
      drawShadow(ctx, x, y + 2, 22, 5);
      ctx.strokeStyle = '#efe6cf'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 16, y); ctx.stroke();
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x - 10 + i * 4.5, y + 1, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.fillStyle = '#efe6cf'; ctx.beginPath(); ctx.ellipse(x + 20, y - 3, 6, 4.5, 0.2, 0, TAU); ctx.fill();
      circ(ctx, x + 21, y - 4, 1.4, '#3a3020');
      ctx.beginPath(); ctx.moveTo(x + 22, y + 1); ctx.lineTo(x + 30, y + 2); ctx.lineTo(x + 24, y + 3); ctx.fill();
      break;
    }
    case 'airship': {
      drawShadow(ctx, x, y + 3, 24, 6);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.2);
      ctx.fillStyle = '#c8a06a'; ctx.beginPath(); ctx.ellipse(0, -8, 20, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a07a4a'; for (let i = -3; i <= 3; i++) ctx.fillRect(i * 5 - 0.4, -15, 0.8, 14);
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(-8, -1, 16, 5);
      ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.moveTo(18, -8); ctx.lineTo(26, -14); ctx.lineTo(26, -2); ctx.fill();
      ctx.restore();
      const p = (t * 0.4) % 1; circ(ctx, x + 6 + p * 4, y - 16 - p * 12, 2 + p * 3, `rgba(90,90,90,${0.5 - p * 0.5})`);
      break;
    }
    case 'lighthouse': {
      drawShadow(ctx, x, y + 1, 7, 2.5);
      for (let i = 0; i < 5; i++) rect(ctx, x - 4 + i * 0.4, y - 4 - i * 5, 8 - i * 0.8, 5, i % 2 ? '#c0392b' : '#f4f1ea');
      rect(ctx, x - 3, y - 30, 6, 4, '#3a3f47'); circ(ctx, x, y - 28, 2, '#ffe9a8');
      const a = t * 1.5;
      ctx.fillStyle = 'rgba(255,240,180,0.18)'; ctx.beginPath(); ctx.moveTo(x, y - 28);
      ctx.lineTo(x + Math.cos(a - 0.15) * 50, y - 28 + Math.sin(a - 0.15) * 30); ctx.lineTo(x + Math.cos(a + 0.15) * 50, y - 28 + Math.sin(a + 0.15) * 30); ctx.fill();
      break;
    }
    case 'windmill': {
      drawShadow(ctx, x, y + 1, 7, 2.5);
      ctx.fillStyle = '#c8b48a'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 3.5, y - 16); ctx.lineTo(x + 3.5, y - 16); ctx.lineTo(x + 6, y); ctx.fill();
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.moveTo(x - 5, y - 16); ctx.lineTo(x, y - 21); ctx.lineTo(x + 5, y - 16); ctx.fill();
      rect(ctx, x - 1.2, y - 5, 2.4, 5, '#5a3a20');
      ctx.save(); ctx.translate(x, y - 15); ctx.rotate(t * 0.8 + sv * 6);
      for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.fillStyle = '#e8e0cc'; ctx.fillRect(1, -1.5, 11, 3); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(0, -0.4, 12, 0.8); }
      ctx.restore(); circ(ctx, x, y - 15, 1.2, '#3a2a1a');
      break;
    }
    case 'hut': {
      drawShadow(ctx, x, y + 1, 9, 3);
      rect(ctx, x - 7, y - 8, 14, 8, '#8a6a4a'); for (let i = 0; i < 4; i++) rect(ctx, x - 7, y - 8 + i * 2, 14, 0.4, '#6a4a2a');
      ctx.fillStyle = '#6a8a3a'; ctx.beginPath(); ctx.moveTo(x - 9, y - 8); ctx.lineTo(x, y - 15); ctx.lineTo(x + 9, y - 8); ctx.fill();
      rect(ctx, x - 1.5, y - 5, 3, 5, '#3a2a1a'); rect(ctx, x + 3, y - 6, 2.4, 2, '#ffe9a8');
      const p = (t * 0.5) % 1; circ(ctx, x + 5 + p * 3, y - 16 - p * 10, 1.4 + p * 2, `rgba(230,230,230,${0.6 - p * 0.6})`);
      break;
    }
    case 'shrine': {
      drawShadow(ctx, x, y + 1, 6, 2);
      rect(ctx, x - 6, y - 12, 1.6, 12, '#c0392b'); rect(ctx, x + 4.4, y - 12, 1.6, 12, '#c0392b');
      rect(ctx, x - 8, y - 14, 16, 2, '#c0392b'); rect(ctx, x - 7, y - 10.5, 14, 1.2, '#a03020');
      const sw = Math.sin(t * 2) * 1; rect(ctx, x - 0.6 + sw * 0.3, y - 10, 1.2, 4, '#d4a84b'); circ(ctx, x + sw * 0.5, y - 5.5, 1.3, '#ffd166');
      break;
    }
    case 'spring': {
      ctx.fillStyle = '#8a8f96'; ctx.beginPath(); ctx.ellipse(x, y, 13, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5ab8d8'; ctx.beginPath(); ctx.ellipse(x, y, 10, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - 3, y - 2, 4, 1.5, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) { const p = (t * 0.35 + i / 4) % 1; circ(ctx, x - 6 + i * 4 + Math.sin(p * 6) * 2, y - p * 18, 2 + p * 4, `rgba(255,255,255,${0.35 - p * 0.35})`); }
      break;
    }
    case 'ring': {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, sx = x + Math.cos(a) * 12, sy = y + Math.sin(a) * 8;
        rect(ctx, sx - 0.6, sy - 2.5, 1.2, 2.5, '#e8dcc8'); ctx.fillStyle = i % 2 ? '#d23a3a' : '#e85d75'; ctx.beginPath(); ctx.ellipse(sx, sy - 2.5, 2, 1.4, 0, Math.PI, 0); ctx.fill();
      }
      for (let i = 0; i < 5; i++) { const a = t * 0.8 + i * 1.3; circ(ctx, x + Math.cos(a) * 8, y - 6 + Math.sin(a * 1.7) * 4, 0.8, `rgba(255,250,180,${0.6 + 0.4 * Math.sin(t * 5 + i)})`); }
      break;
    }
    case 'obelisk': {
      drawShadow(ctx, x, y + 1, 6, 2);
      ctx.fillStyle = '#2a2a3a'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 2.6, y - 22); ctx.lineTo(x, y - 26); ctx.lineTo(x + 2.6, y - 22); ctx.lineTo(x + 4, y); ctx.fill();
      const g = 0.5 + 0.5 * Math.sin(t * 2.5);
      ctx.fillStyle = `rgba(127,224,255,${0.5 + g * 0.5})`;
      for (let i = 0; i < 4; i++) ctx.fillRect(x - 1, y - 20 + i * 4.5, 2, 1.4);
      circ(ctx, x, y - 26, 2 + g * 2, `rgba(127,224,255,${0.25 + g * 0.2})`);
      break;
    }
    case 'chest': {
      if (!visited) { ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 2); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 2); ctx.stroke(); }
      else {
        drawShadow(ctx, x, y + 1, 5, 1.6);
        rect(ctx, x - 4, y - 4, 8, 5, '#8a5a2a'); rect(ctx, x - 4, y - 6, 8, 2, '#a06a3a'); rect(ctx, x - 0.6, y - 4, 1.2, 1.6, '#ffd166');
      }
      ctx.fillStyle = 'rgba(90,70,40,0.4)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 2, 3, 1.4, 0, 0, TAU); ctx.fill();
      break;
    }
    case 'crater': {
      ctx.fillStyle = 'rgba(40,30,30,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, 22, 14, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(120,100,90,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(20,15,15,0.5)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 14, 8, 0, 0, TAU); ctx.fill();
      const g = 0.5 + 0.5 * Math.sin(t * 3);
      circ(ctx, x, y, 5 + g * 2, `rgba(127,224,255,${0.15 + g * 0.15})`);
      ctx.fillStyle = '#7fe0ff'; ctx.fillRect(x - 2, y - 1, 2, 2); ctx.fillRect(x + 3, y + 2, 1.4, 1.4); ctx.fillRect(x - 5, y + 2, 1.2, 1.2);
      break;
    }
    case 'totem': {
      drawShadow(ctx, x, y + 1, 5, 2);
      const cols = ['#a0603a', '#c0392b', '#2980b9', '#d4a84b'];
      for (let i = 0; i < 4; i++) {
        rect(ctx, x - 3.5, y - 6 - i * 6, 7, 6, cols[i]);
        rect(ctx, x - 2, y - 4.5 - i * 6, 1.4, 1.4, '#fff'); rect(ctx, x + 0.6, y - 4.5 - i * 6, 1.4, 1.4, '#fff'); rect(ctx, x - 1.5, y - 2 - i * 6, 3, 0.8, '#2b1a0a');
      }
      rect(ctx, x - 9, y - 22, 18, 2.4, '#a0603a');
      break;
    }
    case 'wreck': {
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.4);
      ctx.fillStyle = 'rgba(40,30,20,0.55)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.4;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 4.5, -5); ctx.lineTo(i * 4.5, 5); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.stroke();
      rect(ctx, 2, -12, 1.4, 12, '#5a3a20');
      ctx.restore();
      for (let i = 0; i < 2; i++) { const p = (t * 0.6 + i * 0.5) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.4 - p * 0.4})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x - 6 + i * 10, y - p * 8, 1 + p, 0, TAU); ctx.stroke(); }
      break;
    }
    case 'camp': {
      drawShadow(ctx, x, y + 1, 10, 3);
      ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 6, y - 9); ctx.lineTo(x, y); ctx.fill();
      ctx.fillStyle = '#a04a2a'; ctx.beginPath(); ctx.moveTo(x - 6, y - 9); ctx.lineTo(x, y); ctx.lineTo(x - 3, y); ctx.fill();
      circ(ctx, x + 6, y, 2.6, '#5a4a3a');
      const f = Math.sin(t * 12) * 0.5;
      circ(ctx, x + 6, y - 1.5, 1.8 + f * 0.4, '#ff9f43'); circ(ctx, x + 6, y - 2.2, 1 + f * 0.3, '#ffe08a');
      break;
    }
  }
  if (!visited) {
    const bob = Math.sin(t * 3 + sv * 6) * 1.5;
    const by = y - 30 + bob;
    circ(ctx, x, by, 4.2, 'rgba(20,16,30,0.75)');
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, by, 4.2, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 6px ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', x, by + 0.3);
  }
}
