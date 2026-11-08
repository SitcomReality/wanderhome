// Artwork for weapons parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { line, rr, turretBase } from '../primitives';
import { PartArtFn, shared } from './types';

export const WEAPON_ART: Record<string, PartArtFn> = {
  catapult: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 1, '#6b4a2a'); line(ctx, -3.5, -3, -3.5, 3, '#4a3020', 0.9); line(ctx, 3, -3, 3, 3, '#4a3020', 0.9);
  },
  ...shared(['mg','flame','rocket','tesla','bubble','harpoon','frostgun'], (ctx, _t, _o, def) => {
    turretBase(ctx, def.color);
  }),
};
