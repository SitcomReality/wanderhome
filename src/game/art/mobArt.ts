// Critter drawings, one branch per MobDef.shape.
import { MobDef } from '../../content';
import { C, TAU, circle, drawShadow } from './primitives';

export function drawMob(ctx: C, def: MobDef, x: number, y: number, t: number, facing: number, flash: boolean, slowed: boolean, burning: false | 'fire' | 'poison') {
  const bob = Math.sin(t * 8 + x) * 0.8;
  const col = flash ? '#ffffff' : def.color;
  const r = def.r;
  if (!def.flying) drawShadow(ctx, x, y + r * 0.6, r * 0.9, r * 0.35);
  else drawShadow(ctx, x, y + r + 4, r * 0.7, r * 0.25);
  const fy = def.flying ? y - 4 + Math.sin(t * 5 + x) * 2 : y;
  const eye = (ex: number, ey: number, s = 1.2) => {
    ctx.fillStyle = '#fff'; ctx.fillRect(ex - s / 2, ey - s / 2, s, s);
    ctx.fillStyle = '#111'; ctx.fillRect(ex - s / 4 + Math.cos(facing) * 0.3, ey - s / 4, s / 2, s / 2);
  };
  switch (def.shape) {
    case 'blob': {
      const sq = 1 + Math.sin(t * 6 + x) * 0.12;
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - (r * 0.5) / sq, r * sq, (r * 0.75) / sq, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - r * 0.5, y - r * 0.9, 2, 1.4);
      eye(x - 2, y - r * 0.55); eye(x + 2, y - r * 0.55);
      break;
    }
    case 'bug':
    case 'scorp':
    case 'spider': {
      ctx.save(); ctx.translate(x, y + bob * 0.3); ctx.rotate(facing);
      ctx.strokeStyle = def.shape === 'spider' ? col : '#2b1d14'; ctx.lineWidth = def.shape === 'spider' ? 0.9 : 0.8;
      const legs = def.shape === 'spider' ? [-1.5, -0.5, 0.5, 1.5] : [-1, 0, 1];
      for (const i of legs) {
        const lw = Math.sin(t * 16 + i * 2) * 1.5, reach = def.shape === 'spider' ? r * 1.5 : r;
        ctx.beginPath(); ctx.moveTo(i * 2, -2); ctx.lineTo(i * 2.4 + lw, -reach * 0.7); ctx.lineTo(i * 2.8 + lw, -reach); ctx.moveTo(i * 2, 2); ctx.lineTo(i * 2.4 - lw, reach * 0.7); ctx.lineTo(i * 2.8 - lw, reach); ctx.stroke();
      }
      ctx.fillStyle = col;
      if (def.shape === 'spider') {
        ctx.beginPath(); ctx.ellipse(-2, 0, r * 0.8, r * 0.7, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(r * 0.4, 0, r * 0.45, r * 0.4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(-3, -0.6, 2, 1.2);
        ctx.fillStyle = '#ff5c5c'; ctx.fillRect(r * 0.6, -1.2, 0.8, 0.8); ctx.fillRect(r * 0.6, 0.4, 0.8, 0.8);
      } else {
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.65, 0, 0, TAU); ctx.fill();
        if (def.shape === 'scorp') {
          ctx.strokeStyle = col; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(-r - 6, -6 + Math.sin(t * 5) * 2, -r + 1, -8); ctx.stroke();
          ctx.fillStyle = '#c0392b'; ctx.fillRect(-r, -9, 2, 2);
          ctx.fillStyle = col; ctx.fillRect(r - 1, -4, 4, 2); ctx.fillRect(r - 1, 2, 4, 2);
        } else { ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke(); }
        eye(r * 0.6, -1.5); eye(r * 0.6, 1.5);
      }
      ctx.restore();
      break;
    }
    case 'crab': {
      ctx.save(); ctx.translate(x, y);
      const sc = Math.sin(t * 14) * 1.2;
      ctx.strokeStyle = col; ctx.lineWidth = 0.8;
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx * r * 0.6, i - 1); ctx.lineTo(sx * (r + 2), i * 1.5 - 1 + sc * (i % 2 ? 1 : -1)); ctx.stroke(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); ctx.fill();
      for (const sx of [-1, 1]) { const o = Math.abs(Math.sin(t * 6)) * 1.2; circle(ctx, sx * (r - 1), -r * 0.8, 1.8, col); ctx.fillStyle = '#3a1a10'; ctx.fillRect(sx * (r - 1) - 0.3, -r * 0.8 - 1.8 - o * 0.3, 0.6, 1 + o); }
      eye(-1.4, -r * 0.55, 1.1); eye(1.4, -r * 0.55, 1.1);
      ctx.restore();
      break;
    }
    case 'croc': {
      ctx.save(); ctx.translate(x, y); ctx.rotate(facing);
      ctx.fillStyle = col; ctx.fillRect(-r, -r * 0.45, r * 2, r * 0.9); ctx.fillRect(r - 1, -r * 0.3, 5, r * 0.6);
      ctx.fillRect(-r - 5, -1.5 + Math.sin(t * 6) * 1.5, 6, 3);
      ctx.fillStyle = '#2f4f25'; for (let i = -2; i < 3; i++) ctx.fillRect(i * 2.5, -1, 1.4, 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(r + 1, -r * 0.3, 3, 0.8);
      eye(r - 1, -r * 0.45); eye(r - 1, r * 0.45);
      ctx.restore();
      break;
    }
    case 'yeti':
    case 'golem': {
      const golem = def.shape === 'golem';
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - r * 0.7 + bob, r * 0.85, r, 0, 0, TAU); ctx.fill();
      if (golem) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - r * 0.5, y - r * 1.2 + bob, r * 0.4, r * 0.4); ctx.fillRect(x + r * 0.1, y - r * 0.4 + bob, r * 0.5, r * 0.3);
        ctx.fillStyle = '#ffb347'; ctx.fillRect(x - 2, y - r + bob, 1.4, 1.4); ctx.fillRect(x + 0.8, y - r + bob, 1.4, 1.4);
        ctx.fillStyle = col; ctx.fillRect(x - r - 2, y - r * 0.6 + bob - Math.sin(t * 5) * 1.5, 3.5, 6); ctx.fillRect(x + r - 1.5, y - r * 0.6 + bob + Math.sin(t * 5) * 1.5, 3.5, 6);
      } else {
        ctx.fillStyle = '#9ec9e8'; ctx.fillRect(x - r * 0.45, y - r * 1.2 + bob, r * 0.9, r * 0.6);
        ctx.fillStyle = col; ctx.fillRect(x - r - 1, y - r * 0.8 + bob - Math.sin(t * 8) * 1.5, 2.5, 5); ctx.fillRect(x + r - 1.5, y - r * 0.8 + bob + Math.sin(t * 8) * 1.5, 2.5, 5);
        eye(x - 1.6, y - r + bob); eye(x + 1.6, y - r + bob);
        ctx.fillStyle = '#333'; ctx.fillRect(x - 1, y - r * 0.68 + bob, 2, 0.8);
      }
      break;
    }
    case 'skeleton': {
      const step = Math.sin(t * 10 + x) * 1.2;
      ctx.strokeStyle = col; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 1.5 + step * 0.5, y); ctx.moveTo(x, y - 3); ctx.lineTo(x + 1.5 - step * 0.5, y);
      ctx.moveTo(x, y - 3); ctx.lineTo(x, y - 7); ctx.moveTo(x - 2.5, y - 6 + step * 0.4); ctx.lineTo(x + 2.5, y - 6 - step * 0.4); ctx.stroke();
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(x - 1.6, y - 4.6 - i * 0.9); ctx.lineTo(x + 1.6, y - 4.6 - i * 0.9); ctx.stroke(); }
      circle(ctx, x, y - 9, 2.2, col);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x - 1.3, y - 9.5, 0.9, 0.9); ctx.fillRect(x + 0.4, y - 9.5, 0.9, 0.9);
      break;
    }
    case 'bat': {
      const flap = Math.sin(t * 22 + x) * 0.8;
      ctx.fillStyle = col;
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + sx * r * 1.6, fy - 2 - flap * 3); ctx.lineTo(x + sx * r * 1.1, fy + 1); ctx.lineTo(x + sx * r * 0.6, fy - 0.5 - flap); ctx.fill(); }
      circle(ctx, x, fy, r * 0.55, col);
      ctx.fillStyle = '#ff4d6d'; ctx.fillRect(x - 1.1, fy - 0.8, 0.8, 0.8); ctx.fillRect(x + 0.3, fy - 0.8, 0.8, 0.8);
      break;
    }
    case 'wisp': {
      const g = ctx.createRadialGradient(x, fy, 0, x, fy, r * 2.5);
      g.addColorStop(0, flash ? '#fff' : 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, def.color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.9; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, fy, r * 2.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      eye(x - 1.4, fy - 0.5, 1); eye(x + 1.4, fy - 0.5, 1);
      break;
    }
    case 'drone': {
      ctx.save(); ctx.translate(x, fy);
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(-r, -1, r * 2, 2); ctx.fillRect(-1, -r, 2, r * 2);
      ctx.fillStyle = 'rgba(200,200,200,0.5)';
      for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) { ctx.beginPath(); ctx.ellipse(dx * 0.8, dy * 0.8, 3, 1 + Math.abs(Math.sin(t * 40)) * 1.5, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.fill();
      ctx.fillStyle = Math.sin(t * 10) > 0 ? '#ff0' : '#f00'; ctx.fillRect(-0.7, -0.7, 1.4, 1.4);
      ctx.restore();
      break;
    }
  }
  if (slowed) {
    ctx.strokeStyle = 'rgba(160,230,255,0.85)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(x, fy - r * 0.4, r + 2.5, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(160,230,255,0.15)'; ctx.fill();
  }
  if (burning) {
    for (let i = 0; i < 3; i++) {
      const p = (t * 3 + i * 0.33) % 1;
      ctx.fillStyle = burning === 'poison' ? `rgba(${120 + p * 60},220,90,${1 - p})` : `rgba(255,${150 - p * 100},40,${1 - p})`;
      ctx.fillRect(x - 3 + i * 3, fy - r - p * 6, 1.5, 1.5);
    }
  }
}
