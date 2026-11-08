// Minimap terrain bitmap (re-rendered only after travelling a little way).
import type { Game } from '../engine';
import { TERRAIN_INFO } from '../../content/index';
import { TILE } from '../world/world';

export function updateMinimap(g: Game, size = 150, tilesPerPx = 4) {
  const cx = Math.floor(g.v.x / TILE), cy = Math.floor(g.v.y / TILE);
  if (g.minimapCanvas && Math.hypot(cx - g.mmCenter.x, cy - g.mmCenter.y) < 24) return;
  g.mmCenter = { x: cx, y: cy };
  const cv = g.minimapCanvas ?? document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const c = TERRAIN_INFO[g.world.rawTerrain(cx + (x - size / 2) * tilesPerPx, cy + (y - size / 2) * tilesPerPx)].color;
    const i = (y * size + x) * 4;
    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  g.minimapCanvas = cv;
}
