// Icon for any part (module / locomotion / frame) in UI lists.
import { MOD, PART } from '../../content/index';
import { drawFrame, drawFrameOverlay } from './frameArt';
import { drawLoco } from './locoArt';
import { drawPart } from './moduleArt';
import { drawTurret } from './turretArt';
import { C } from './primitives';

/** Icon for any part (module/loco/frame), fitting a box of `size` px. */
export function drawPartIcon(ctx: C, id: string, size: number, t: number) {
  const p = PART[id] ?? (id === 'cockpit' ? { kind: 'module' } : null);
  if (!p) return;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  if (p.kind === 'module') {
    const m = MOD[id];
    drawPart(ctx, id, size * 0.8, t, { wind: 0.7 });
    if (m.weapon && m.weapon.kind !== 'lob') drawTurret(ctx, m.weapon.kind, -0.5, 0, size * 0.8, t);
    if (m.weapon?.kind === 'lob') drawTurret(ctx, 'lob', -0.5, 0, size * 0.8, t);
  } else if (p.kind === 'loco') {
    const sc = size / 34;
    ctx.scale(sc, sc);
    drawLoco(ctx, id, 9, 4.5, t, 20);
    drawFrame(ctx, 'f_timber', 2, 1, 9);
  } else {
    const sc = size / 26;
    ctx.scale(sc, sc);
    drawFrame(ctx, id, 2, 2, 9);
    drawFrameOverlay(ctx, id, 2, 2, 9);
  }
  ctx.restore();
}
