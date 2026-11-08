// Artwork for core parts, keyed by part id (or ModuleDef.art). Drawn in a 9×9 cell centred on (0,0).
import { line, ring, rr } from '../primitives';
import type { PartArtFn } from './types';

export const CORE_ART: Record<string, PartArtFn> = {
  cockpit: (ctx) => {
    rr(ctx, -4, -4, 8, 8, 1.2, '#e9b949');
    rr(ctx, 1.6, -3.4, 2, 6.8, 0.8, '#8fd8f0'); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(2, -3, 0.5, 2.5);
    rr(ctx, -3.2, -2, 3, 4, 1, '#a0522d');
    ring(ctx, 0.6, 0, 1.4, '#2b2320', 0.6); line(ctx, -0.8, 0, 2, 0, '#2b2320', 0.4);
  },
};
