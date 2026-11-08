// Chassis floor patterns and the glass-dome overlay.
import { FRAME } from '../../content/index';
import { C, TAU } from './primitives';

/** Draws the floor/frame for a gw x gh grid with cell size cs (in current units). */
export function drawFrame(ctx: C, frameId: string, gw: number, gh: number, cs: number) {
  const f = FRAME[frameId] ?? FRAME.f_timber;
  const hw = (gw * cs) / 2, hh = (gh * cs) / 2;
  const pad = cs * 0.17;
  ctx.fillStyle = f.rim; ctx.fillRect(-hw - pad, -hh - pad, hw * 2 + pad * 2, hh * 2 + pad * 2);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    ctx.fillStyle = (x + y) % 2 ? f.floor : f.floor2;
    ctx.fillRect(-hw + x * cs, -hh + y * cs, cs, cs);
    if (f.pattern === 'bone') { ctx.fillStyle = 'rgba(120,100,70,0.3)'; ctx.fillRect(-hw + x * cs + cs * 0.1, -hh + y * cs + cs * 0.45, cs * 0.8, cs * 0.1); ctx.beginPath(); ctx.arc(-hw + (x + 0.12) * cs, -hh + (y + 0.5) * cs, cs * 0.08, 0, TAU); ctx.arc(-hw + (x + 0.88) * cs, -hh + (y + 0.5) * cs, cs * 0.08, 0, TAU); ctx.fill(); }
    if (f.pattern === 'leaf') { ctx.fillStyle = 'rgba(150,200,90,0.35)'; ctx.beginPath(); ctx.ellipse(-hw + (x + 0.5) * cs, -hh + (y + 0.5) * cs, cs * 0.3, cs * 0.14, ((x + y) % 2) * 1.2 + 0.4, 0, TAU); ctx.fill(); }
    if (f.pattern === 'planks') { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-hw + x * cs, -hh + y * cs + cs / 3, cs, cs * 0.04); ctx.fillRect(-hw + x * cs, -hh + y * cs + (2 * cs) / 3, cs, cs * 0.04); }
    if (f.pattern === 'weave') { ctx.fillStyle = 'rgba(80,50,20,0.25)'; for (let k = 0; k < 4; k++) ctx.fillRect(-hw + x * cs + (k * cs) / 4, -hh + y * cs + ((k % 2) * cs) / 2, cs / 8, cs / 2); }
    if (f.pattern === 'rivets') { ctx.fillStyle = 'rgba(255,255,255,0.25)'; const r = cs * 0.05; for (const [a, b] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) { ctx.beginPath(); ctx.arc(-hw + (x + a) * cs, -hh + (y + b) * cs, r, 0, TAU); ctx.fill(); } }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-hw - pad, -hh - pad, hw * 2 + pad * 2, pad * 0.5);
}

export function drawFrameOverlay(ctx: C, frameId: string, gw: number, gh: number, cs: number) {
  if ((FRAME[frameId] ?? FRAME.f_timber).pattern !== 'glass') return;
  const hw = (gw * cs) / 2, hh = (gh * cs) / 2;
  ctx.fillStyle = 'rgba(190,235,250,0.12)'; ctx.beginPath(); ctx.roundRect(-hw, -hh, hw * 2, hh * 2, cs * 0.5); ctx.fill();
  ctx.strokeStyle = 'rgba(220,245,255,0.5)'; ctx.lineWidth = cs * 0.06; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-hw * 0.4, -hh * 0.5, hw * 0.35, hh * 0.18, -0.3, 0, TAU); ctx.fill();
}
