

// Shared drawing helpers: shadows, towns, mobs, avatar and locomotion.
// World nodes live in nodeArt.ts, landmarks in landmarkArt.ts, vehicle parts in parts.ts.
export type C = CanvasRenderingContext2D;

export const TAU = Math.PI * 2;

export const circle = (ctx: C, x: number, y: number, r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

export function drawShadow(ctx: C, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}

// Procedural top-down art for every vehicle part. Drawn in a 9x9 unit cell centred on (0,0).
export function rr(ctx: C, x: number, y: number, w: number, h: number, r: number, col: string) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

export function circ(ctx: C, x: number, y: number, r: number, col: string) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

export function ring(ctx: C, x: number, y: number, r: number, col: string, lw: number) {
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
}

export function line(ctx: C, x1: number, y1: number, x2: number, y2: number, col: string, lw: number) {
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

export function rivets(ctx: C, d: number, col = 'rgba(255,255,255,0.45)') {
  for (const [x, y] of [[-d, -d], [d, -d], [-d, d], [d, d]]) circ(ctx, x, y, 0.35, col);
}

export function gear(ctx: C, x: number, y: number, r: number, teeth: number, a: number, col: string) {
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const ang = a + (i / (teeth * 2)) * TAU, rad = i % 2 ? r : r * 1.3;
    ctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
  }
  ctx.fill(); circ(ctx, x, y, r * 0.35, 'rgba(0,0,0,0.4)');
}

export function turretBase(ctx: C, col: string) {
  ctx.fillStyle = '#2a2f36'; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + TAU / 16; ctx.lineTo(Math.cos(a) * 4, Math.sin(a) * 4); }
  ctx.fill();
  circ(ctx, 0, 0, 3, col); ring(ctx, 0, 0, 3, 'rgba(0,0,0,0.35)', 0.4);
}
