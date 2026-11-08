// Draws the house in vehicle-local space. Shared by the world view and the Workshop workbench.
import type { Game } from '../engine';
import { CELL, TAU } from '../core/constants';
import { drawAvatar } from '../art/avatarArt';
import { drawLoco } from '../art/locoArt';
import { drawHouseExtras } from '../art/houseArt';
import { drawFrame, drawFrameOverlay } from '../art/frameArt';
import { drawPart } from '../art/moduleArt';
import { drawTurret } from '../art/turretArt';

/** Draws the vehicle in its own local space (origin = centre, +x = front). Shared by world + garage. */
export function drawVehicleLocal(g: Game, ctx: CanvasRenderingContext2D, t: number, opts: { garage?: boolean; speed?: number } = {}) {
  const hw = g.hw, hh = g.hh;
  const speed = opts.speed ?? g.speedNow;
  drawLoco(ctx, g.loco, hw, hh, t, speed);
  ctx.save();
  if (!opts.garage && speed > 2 && g.loco !== 'hover') ctx.translate(0, Math.sin(t * 18) * 0.25);
  if (g.loco === 'hover') ctx.translate(0, -1.5 + Math.sin(t * 3) * 0.6);
  drawFrame(ctx, g.frame, g.gridW, g.gridH, CELL);
  const wind = g.wind() * g.openness(g.world.terrainAt(g.v.x, g.v.y));
  const late: { x: number; y: number; id: string }[] = [];
  for (const e of g.st.cells.values()) {
    const p = g.cellLocal(e.idx);
    if (e.def.id === 'balloon') { late.push({ ...p, id: 'balloon' }); continue; }
    ctx.save(); ctx.translate(p.x, p.y);
    drawPart(ctx, e.def.id, CELL - 0.6, t, { wind });
    ctx.restore();
  }
  ctx.fillStyle = '#fff6c8'; ctx.fillRect(hw + 0.6, -hh + 1, 1.2, 2); ctx.fillRect(hw + 0.6, hh - 3, 1.2, 2);
  ctx.fillStyle = '#ff5c5c'; ctx.fillRect(-hw - 1.8, -hh + 1, 1, 2); ctx.fillRect(-hw - 1.8, hh - 3, 1, 2);
  if (g.av.inside && !opts.garage) drawAvatar(ctx, g.av.lx, g.av.ly + 2.5, g.av.facing - g.v.angle, g.av.walk, g.av.flash > 0, 0.72, g.manual);
  for (const w of g.weapons) {
    const p = g.cellLocal(w.idx);
    ctx.save(); ctx.translate(p.x, p.y);
    drawTurret(ctx, w.def.weapon!.kind, opts.garage ? 0 : w.angle - g.v.angle, opts.garage ? 0 : w.recoil, CELL - 0.6, t);
    ctx.restore();
  }
  for (const l of late) { ctx.save(); ctx.translate(l.x, l.y); drawPart(ctx, l.id, CELL - 0.6, t); ctx.restore(); }
  drawHouseExtras(ctx, g, t);
  drawFrameOverlay(ctx, g.frame, g.gridW, g.gridH, CELL);
  if (!opts.garage) {
    const v = g.v;
    if (v.flash > 0) { ctx.fillStyle = `rgba(255,80,80,${v.flash * 4})`; ctx.fillRect(-hw - 1.5, -hh - 1.5, hw * 2 + 3, hh * 2 + 3); }
    if (v.invulnT > 0 && Math.sin(t * 12) > 0) { ctx.strokeStyle = 'rgba(127,209,232,0.7)'; ctx.lineWidth = 0.8; ctx.strokeRect(-hw - 3, -hh - 3, hw * 2 + 6, hh * 2 + 6); }
    if (g.st.shield > 0 && v.shieldT <= 0) { ctx.strokeStyle = `rgba(90,209,230,${0.25 + 0.15 * Math.sin(t * 4)})`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(0, 0, hw + 6, hh + 6, 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}
