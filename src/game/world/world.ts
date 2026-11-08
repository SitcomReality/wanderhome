import { fbm, hash2 } from './noise';
import { BIOME, BIOMES, BAND_BIOMES, PATCH_BIOMES, NODE, GLOBAL_NODES, LANDMARKS, matchesWhere, Band, LandmarkDef } from '../../content/index';
import { shade } from './textures';

export const TILE = 16;
export const CHUNK = 16;
export const CHUNK_PX = TILE * CHUNK;
export const REGION = 40; // tiles per town region
export const LM_CELL = 34; // tiles per landmark cell

export interface ResNode {
  key: string; kind: string; x: number; y: number; hp: number; maxHp: number; res: string; size: number; shake: number; seedv: number;
}
export interface Town { key: string; name: string; x: number; y: number; tx: number; ty: number; biome: string; mod: number; seedv: number }
export interface Landmark { key: string; def: LandmarkDef; x: number; y: number; tx: number; ty: number; seedv: number; biome: string }

interface Chunk { cx: number; cy: number; canvas: HTMLCanvasElement; terrain: string[]; nodes: ResNode[] }

const SYL_A = ['Moss', 'Rust', 'Dun', 'Brindle', 'Ash', 'Cobble', 'Fern', 'Gloam', 'Hollow', 'Kettle', 'Lark', 'Marrow', 'Nettle', 'Pebble', 'Quill', 'Sorrow', 'Thistle', 'Umber', 'Wick', 'Yarrow', 'Bramble', 'Cinder', 'Dapple', 'Ember', 'Fable', 'Gossamer', 'Hazel', 'Juniper', 'Lumen', 'Mire', 'Oaken', 'Pike', 'Rook', 'Saffron', 'Tumble', 'Vesper'];
const SYL_B = ['bury', 'ford', 'wick', 'stead', 'haven', 'mouth', 'gate', 'well', 'cross', 'hollow', 'ton', 'by', 'mere', 'reach', 'end', 'rest', 'combe', 'fell', 'moor', 'shaw', 'thorpe', 'wold'];

export class World {
  seed: number;
  chunks = new Map<string, Chunk>();
  depleted = new Map<string, number>();
  spawnTX = 0; spawnTY = 0;
  homeTown!: Town;
  private lmCache = new Map<string, Landmark | null>();

  constructor(seed: number) {
    this.seed = seed;
    this.findSpawn();
  }

  /** Pick the biome for a tile: elevation → band, then patches, then nearest climate. */
  rawTerrain(tx: number, ty: number): string {
    const s = this.seed;
    const cont = fbm(tx * 0.0032, ty * 0.0032, s, 4);
    const det = fbm(tx * 0.017, ty * 0.017, s + 77, 3);
    const e = cont * 0.85 + det * 0.3 + 0.1;
    let band: Band;
    if (e < -0.26) band = 'deep';
    else if (e < -0.17) band = 'shallow';
    else if (e < -0.13) band = 'shore';
    else {
      band = 'land';
      const mask = fbm(tx * 0.003, ty * 0.003, s + 31, 2);
      if (mask > 0.05) {
        const ridge = 1 - Math.abs(fbm(tx * 0.011, ty * 0.011, s + 999, 3));
        const th = 0.93 - (mask - 0.05) * 0.25;
        if (ridge > th + 0.045) band = 'summit';
        else if (ridge > th) band = 'high';
      }
    }
    const temp = fbm(tx * 0.0022, ty * 0.0022, s + 500, 3) * 1.7;
    const moist = fbm(tx * 0.006, ty * 0.006, s + 1500, 3) * 1.7;
    if (band === 'land') {
      for (const b of PATCH_BIOMES) {
        const p = b.patch!;
        if (p.temp && (temp < p.temp[0] || temp > p.temp[1])) continue;
        if (p.moist && (moist < p.moist[0] || moist > p.moist[1])) continue;
        if (fbm(tx * p.scale, ty * p.scale, s + p.seed, 2) > p.threshold) return b.id;
      }
    }
    const list = BAND_BIOMES[band].length ? BAND_BIOMES[band] : BAND_BIOMES.land;
    if (!list.length) return BIOMES[0].id;
    let best = list[0], bd = 1e9;
    for (const b of list) {
      const c = b.climate ?? { temp: 0, moist: 0 };
      const d = (c.temp - temp) ** 2 + (c.moist - moist) ** 2;
      if (d < bd) { bd = d; best = b; }
    }
    return best.id;
  }

  findSpawn() {
    const startOk = (t: string) => t === 'grass' || (!BIOME.grass && BIOME[t]?.band === 'land');
    for (let r = 0; r < 600; r += 2) {
      for (let a = 0; a < 16; a++) {
        const tx = Math.round(Math.cos((a / 16) * Math.PI * 2) * r);
        const ty = Math.round(Math.sin((a / 16) * Math.PI * 2) * r);
        if (startOk(this.rawTerrain(tx, ty)) && startOk(this.rawTerrain(tx + 8, ty)) && startOk(this.rawTerrain(tx + 4, ty + 3))) {
          this.spawnTX = tx; this.spawnTY = ty;
          this.homeTown = { key: 'home', name: 'Homeport', tx: tx + 9, ty: ty + 2, x: (tx + 9.5) * TILE, y: (ty + 2.5) * TILE, biome: 'grass', mod: 1, seedv: 0.5 };
          return;
        }
      }
    }
    this.homeTown = { key: 'home', name: 'Homeport', tx: 9, ty: 2, x: 9.5 * TILE, y: 2.5 * TILE, biome: 'grass', mod: 1, seedv: 0.5 };
  }

  terrainAtTile(tx: number, ty: number): string {
    const cx = Math.floor(tx / CHUNK), cy = Math.floor(ty / CHUNK);
    const c = this.chunks.get(cx + ',' + cy);
    if (c) return c.terrain[(ty - cy * CHUNK) * CHUNK + (tx - cx * CHUNK)];
    return this.rawTerrain(tx, ty);
  }
  terrainAt(x: number, y: number): string { return this.terrainAtTile(Math.floor(x / TILE), Math.floor(y / TILE)); }

  getChunk(cx: number, cy: number): Chunk {
    const key = cx + ',' + cy;
    let c = this.chunks.get(key);
    if (c) { this.chunks.delete(key); this.chunks.set(key, c); return c; }
    c = this.buildChunk(cx, cy);
    this.chunks.set(key, c);
    if (this.chunks.size > 160) this.chunks.delete(this.chunks.keys().next().value as string);
    return c;
  }

  private buildChunk(cx: number, cy: number): Chunk {
    const B = CHUNK + 2;
    const ter: string[] = new Array(B * B);
    for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) ter[y * B + x] = this.rawTerrain(cx * CHUNK + x - 1, cy * CHUNK + y - 1);
    const terrain: string[] = new Array(CHUNK * CHUNK);
    for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) terrain[y * CHUNK + x] = ter[(y + 1) * B + x + 1];

    const canvas = document.createElement('canvas');
    canvas.width = CHUNK_PX; canvas.height = CHUNK_PX;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(CHUNK_PX, CHUNK_PX);
    const d = img.data;
    const s = this.seed;
    const isWater = (t: string) => { const b = BIOME[t]?.band; return b === 'deep' || b === 'shallow'; };
    const ox = cx * CHUNK_PX, oy = cy * CHUNK_PX;

    for (let ty = 0; ty < CHUNK; ty++) {
      for (let tx = 0; tx < CHUNK; tx++) {
        const t = ter[(ty + 1) * B + tx + 1];
        const bd = BIOME[t];
        const gtx = cx * CHUNK + tx, gty = cy * CHUNK + ty;
        const tj = (hash2(gtx, gty, s + 3) - 0.5) * bd.jitter * 0.6;
        const foamy = bd.band === 'shallow';
        const wL = isWater(ter[(ty + 1) * B + tx]), wR = isWater(ter[(ty + 1) * B + tx + 2]), wU = isWater(ter[ty * B + tx + 1]), wD = isWater(ter[(ty + 2) * B + tx + 1]);
        for (let py = 0; py < TILE; py++) {
          for (let px = 0; px < TILE; px++) {
            const edge = foamy && ((px < 2 && !wL) || (px > 13 && !wR) || (py < 2 && !wU) || (py > 13 && !wD));
            const [r, g, b] = shade(bd, ox + tx * TILE + px, oy + ty * TILE + py, s, tj, edge);
            const i = ((ty * TILE + py) * CHUNK_PX + tx * TILE + px) * 4;
            d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
            d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
            d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
            d[i + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    const nodes: ResNode[] = [];
    for (let ty = 0; ty < CHUNK; ty++) {
      for (let tx = 0; tx < CHUNK; tx++) {
        const gtx = cx * CHUNK + tx, gty = cy * CHUNK + ty;
        const kind = this.pickNode(terrain[ty * CHUNK + tx], hash2(gtx, gty, s + 5), gtx, gty);
        if (!kind) continue;
        const spec = NODE[kind];
        const sz = (0.75 + hash2(gtx, gty, s + 6) * 0.5) * (spec.scale ?? 1);
        const hp = Math.max(1, Math.round(spec.hp * (0.75 + hash2(gtx, gty, s + 6) * 0.5)));
        nodes.push({
          key: gtx + ',' + gty, kind, res: spec.res, size: sz, shake: 0, seedv: hash2(gtx, gty, s + 8),
          x: (gtx + 0.2 + hash2(gtx, gty, s + 7) * 0.6) * TILE, y: (gty + 0.2 + hash2(gty, gtx, s + 7) * 0.6) * TILE, hp, maxHp: hp,
        });
      }
    }
    return { cx, cy, canvas, terrain, nodes };
  }

  private pickNode(t: string, r: number, tx: number, ty: number): string | null {
    const b = BIOME[t];
    if (!b) return null;
    const dist = Math.hypot(tx - this.spawnTX, ty - this.spawnTY);
    const rich = Math.min(2, 1 + dist / 1500);
    const land = b.band !== 'deep' && b.band !== 'shallow' && !b.noWalk;
    for (const g of GLOBAL_NODES) {
      const gl = g.global!;
      if (land && dist >= gl.minDist && hash2(tx, ty, this.seed + 777 + g.id.length * 13) < gl.chance * rich) return g.id;
    }
    let acc = 0;
    for (const [id, ch, o] of b.nodes) {
      if (o?.minDist && dist < o.minDist) continue;
      acc += ch * (o?.rich ? rich : 1);
      if (r < acc) return id;
    }
    return null;
  }

  nodesInRect(x0: number, y0: number, x1: number, y1: number, now: number, out: ResNode[] = []): ResNode[] {
    const cx0 = Math.floor(x0 / CHUNK_PX), cy0 = Math.floor(y0 / CHUNK_PX), cx1 = Math.floor(x1 / CHUNK_PX), cy1 = Math.floor(y1 / CHUNK_PX);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const c = this.getChunk(cx, cy);
      for (const n of c.nodes) {
        if (n.hp <= 0) {
          const t = this.depleted.get(n.key);
          if (t !== undefined && now - t > 420) { n.hp = n.maxHp; this.depleted.delete(n.key); } else continue;
        }
        if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1) out.push(n);
      }
    }
    return out;
  }

  // ---------------- towns ----------------
  townInRegion(rx: number, ry: number): Town | null {
    const s = this.seed;
    if (hash2(rx, ry, s + 9000) > 0.62) return null;
    const tx = rx * REGION + 6 + Math.floor(hash2(rx, ry, s + 9001) * (REGION - 12));
    const ty = ry * REGION + 6 + Math.floor(hash2(rx, ry, s + 9002) * (REGION - 12));
    const t = this.rawTerrain(tx, ty);
    if (BIOME[t]?.noTowns) return null;
    if (Math.hypot(tx - this.homeTown.tx, ty - this.homeTown.ty) < 25) return null;
    const n = hash2(rx, ry, s + 9003), m = hash2(rx, ry, s + 9004);
    const name = SYL_A[Math.floor(n * SYL_A.length)] + SYL_B[Math.floor(m * SYL_B.length)];
    return { key: rx + ':' + ry, name, tx, ty, x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, biome: t, mod: 0.85 + hash2(rx, ry, s + 9005) * 0.3, seedv: n };
  }
  townsNear(x: number, y: number, radius: number): Town[] {
    const out: Town[] = [];
    const r = Math.ceil(radius / (REGION * TILE));
    const rx0 = Math.floor(x / (REGION * TILE)), ry0 = Math.floor(y / (REGION * TILE));
    for (let ry = ry0 - r; ry <= ry0 + r; ry++) for (let rx = rx0 - r; rx <= rx0 + r; rx++) {
      const t = this.townInRegion(rx, ry);
      if (t && Math.hypot(t.x - x, t.y - y) <= radius) out.push(t);
    }
    if (Math.hypot(this.homeTown.x - x, this.homeTown.y - y) <= radius) out.push(this.homeTown);
    return out;
  }

  // ---------------- landmarks ----------------
  landmarkInCell(cx: number, cy: number): Landmark | null {
    const key = cx + ':' + cy;
    if (this.lmCache.has(key)) return this.lmCache.get(key)!;
    const s = this.seed;
    let out: Landmark | null = null;
    if (hash2(cx, cy, s + 12000) < 0.42) {
      const tx = cx * LM_CELL + 4 + Math.floor(hash2(cx, cy, s + 12001) * (LM_CELL - 8));
      const ty = cy * LM_CELL + 4 + Math.floor(hash2(cx, cy, s + 12002) * (LM_CELL - 8));
      const t = this.rawTerrain(tx, ty);
      const b = BIOME[t];
      const dist = Math.hypot(tx - this.spawnTX, ty - this.spawnTY);
      const isLand = b && b.band !== 'deep' && b.band !== 'shallow' && !b.noWalk;
      const cands = dist < 14 ? [] : LANDMARKS.filter((l) => (l.where === 'any' ? isLand : matchesWhere(l.where, b)) && dist >= (l.minDist ?? 0));
      if (cands.length) {
        const total = cands.reduce((a, l) => a + l.weight, 0);
        let pick = hash2(cx, cy, s + 12003) * total;
        let def = cands[0];
        for (const l of cands) { pick -= l.weight; if (pick <= 0) { def = l; break; } }
        out = { key: `lm:${key}`, def, tx, ty, x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, seedv: hash2(cx, cy, s + 12004), biome: t };
      }
    }
    if (this.lmCache.size > 4000) this.lmCache.clear();
    this.lmCache.set(key, out);
    return out;
  }
  landmarksNear(x: number, y: number, radius: number): Landmark[] {
    const out: Landmark[] = [];
    const r = Math.ceil(radius / (LM_CELL * TILE));
    const cx0 = Math.floor(x / (LM_CELL * TILE)), cy0 = Math.floor(y / (LM_CELL * TILE));
    for (let cy = cy0 - r; cy <= cy0 + r; cy++) for (let cx = cx0 - r; cx <= cx0 + r; cx++) {
      const l = this.landmarkInCell(cx, cy);
      if (l && Math.hypot(l.x - x, l.y - y) <= radius) out.push(l);
    }
    return out;
  }
}
