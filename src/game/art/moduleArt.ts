// Vehicle part artwork. Art for each part id lives in art/parts/<category>.ts.
import { MOD, ModuleDef } from '../../content/index';
import { PART_ART, PartOpts } from './parts';
import { C, TAU, circ, gear, line, rivets, rr, turretBase } from './primitives';

export type { PartOpts } from './parts';

export function drawPart(ctx: C, id: string, s: number, t: number, o: PartOpts = {}) {
  const def = MOD[id];
  if (!def) return;
  ctx.save();
  ctx.scale(s / 9, s / 9);
  if (o.shadow !== false && id !== 'balloon') { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-3.6, -3.2, 7.8, 7.8); }
  const art = PART_ART[def.art ?? id];
  if (art) art(ctx, t, o, def);
  else drawGenericPart(ctx, t, def);
  ctx.restore();
}

/** Generic art for any part without its own drawing (e.g. from a mod): coloured housing + category motif. */
function drawGenericPart(ctx: C, t: number, def: ModuleDef) {
  if (def.weapon) { turretBase(ctx, def.color); return; }
  rr(ctx, -4, -4, 8, 8, 1, '#2b2f36'); rr(ctx, -3.5, -3.5, 7, 7, 0.9, def.color);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-3.5, -3.5, 7, 1);
  switch (def.cat) {
    case 'power': ctx.save(); ctx.rotate(t * 3); for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); rr(ctx, 0.4, -0.7, 2.6, 1.4, 0.5, 'rgba(0,0,0,0.35)'); } ctx.restore(); circ(ctx, 0, 0, 0.9, '#ffd166'); break;
    case 'cargo': for (let i = -1; i <= 1; i++) ctx.fillRect(-3.5, i * 2 - 0.2, 7, 0.4); ctx.fillStyle = 'rgba(0,0,0,0.3)'; line(ctx, -3, -3, 3, 3, 'rgba(0,0,0,0.3)', 0.6); break;
    case 'harvest': ctx.save(); ctx.rotate(t * 4); gear(ctx, 0, 0, 2, 8, 0, 'rgba(255,255,255,0.75)'); ctx.restore(); break;
    case 'defense': rivets(ctx, 2.8, 'rgba(0,0,0,0.45)'); line(ctx, -3, 0, 3, 0, 'rgba(0,0,0,0.2)', 0.4); break;
    case 'process': gear(ctx, -1, -1, 1.4, 7, t * 2, 'rgba(255,255,255,0.7)'); rr(ctx, 1.2, 0.6, 1.6, 2.4, 0.3, 'rgba(0,0,0,0.4)'); break;
    case 'comfort': circ(ctx, 0, 0, 2.2, 'rgba(255,255,255,0.35)'); circ(ctx, -0.6, -0.6, 0.8, 'rgba(255,255,255,0.5)'); break;
  }
}
