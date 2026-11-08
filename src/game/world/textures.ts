// Per-pixel ground shading for each biome texture style. Biomes pick a style plus optional specks.
import { fbm, hash2 } from './noise';
import type { BiomeDef } from '../../content/index';

const hexCache = new Map<string, [number, number, number]>();
function hex(c: string): [number, number, number] {
  let v = hexCache.get(c);
  if (!v) { const n = parseInt(c.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; hexCache.set(c, v); }
  return v;
}

/** Returns an RGB colour for one ground pixel. `edge` = shallow water touching land (foam). */
export function shade(b: BiomeDef, wx: number, wy: number, s: number, tileJitter: number, edge: boolean): [number, number, number] {
  const h = hash2(wx, wy, s + 11);
  let r = b.color[0], g = b.color[1], bl = b.color[2];
  let j = tileJitter + (h - 0.5) * b.jitter + fbm(wx * 0.02, wy * 0.02, s + 55, 2) * b.jitter * 0.9;
  switch (b.texture.style) {
    case 'water':
      if (Math.sin(wx * 0.35 + Math.sin(wy * 0.12) * 3) > 0.93) j += 22;
      if (edge) { r = 200; g = 230; bl = 240; j = (h - 0.5) * 20; }
      break;
    case 'grass': if (h < 0.06) j -= 26; break;
    case 'rock':
    case 'peak': {
      const ridge = fbm(wx * 0.08, wy * 0.08, s + 7, 2);
      j += ridge * 40;
      if (b.texture.style === 'peak' && ridge > 0.1) { r = 245; g = 248; bl = 255; }
      break;
    }
    case 'sand': if (Math.sin(wx * 0.18 + wy * 0.08 + fbm(wx * 0.03, wy * 0.03, s, 2) * 6) > 0.9) j -= 18; break;
    case 'swamp': if (fbm(wx * 0.06, wy * 0.06, s + 9, 2) > 0.25) { r *= 0.78; g *= 0.86; bl *= 1.05; } break;
    case 'cracked': if (Math.abs(fbm(wx * 0.09, wy * 0.09, s + 13, 2)) < 0.03) j -= 45; break;
    case 'ash':
      if (Math.abs(fbm(wx * 0.05, wy * 0.05, s + 17, 2)) < 0.022) { r = 255; g = 110 + h * 60; bl = 30; j = 0; }
      break;
    case 'stripes': j += Math.sin(wy * 0.22 + fbm(wx * 0.02, wy * 0.02, s + 19, 2) * 5) * 16; break;
    default: break;
  }
  const sp = b.texture.specks;
  if (sp) {
    const h2 = hash2(wx, wy, s + 23);
    let acc = 0;
    for (const [col, ch] of sp) { acc += ch; if (h2 < acc) { [r, g, bl] = hex(col); j = (h - 0.5) * 10; break; } }
  }
  return [r + j, g + j, bl + j];
}
