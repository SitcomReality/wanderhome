/**
 * CONTENT REGISTRY: collects every content list into fast lookup tables, validates cross-references
 * (warnings appear in the console) and exposes registerContent() for content packs. See MODDING.md.
 */
import { BIOMES, BIOME_TAGS } from './biomes';
import { FRAMES } from './frames';
import { GROUNDS } from './grounds';
import { LANDMARKS } from './landmarks';
import { LOCOS } from './locomotion';
import { MOBS } from './mobs';
import { NODES } from './nodes';
import { CAT_INFO, MODULES } from './parts';
import { RESOURCES } from './resources';
import { Band, BiomeDef, Cost, FrameDef, GroundDef, LandmarkDef, LocoDef, MobDef, ModuleDef, NodeDef, ResourceDef, Shop, Tier, Where } from './types';

/**
 * CONTENT REGISTRY
 * Collects every content list into fast lookup tables, validates cross-references
 * (warnings appear in the browser console), and exposes `registerContent()` so extra
 * content packs can be added without touching the base files. See MODDING.md.
 */
// Legacy aliases used around the engine/UI
export type Res = string;

export type Terrain = string;

// ------------------------------------------------------------ lookup tables (filled by rebuild)
export const RES_LIST: string[] = [];

export const RES_INFO: Record<string, ResourceDef> = {};

export const GROUND: Record<string, GroundDef> = {};

export const BIOME: Record<string, BiomeDef> = {};
/** alias kept for older code: TERRAIN_INFO[biomeId].name / .color */

export const TERRAIN_INFO = BIOME;

export const NODE: Record<string, NodeDef> = {};

export const MOB: Record<string, MobDef> = {};

export const LANDMARK: Record<string, LandmarkDef> = {};

export const MOD: Record<string, ModuleDef> = {};

export const LOCO: Record<string, LocoDef> = {};

export const FRAME: Record<string, FrameDef> = {};

export const BAND_BIOMES: Record<Band, BiomeDef[]> = { deep: [], shallow: [], shore: [], land: [], high: [], summit: [] };

export const PATCH_BIOMES: BiomeDef[] = [];

export const GLOBAL_NODES: NodeDef[] = [];

export type PartKind = 'module' | 'loco' | 'frame';

export interface PartRef { kind: PartKind; id: string; name: string; desc: string; cost: Cost; shop?: Shop; catName: string; color: string }

export const PARTS: PartRef[] = [];

export const PART: Record<string, PartRef> = {};

export const STARTER_PARTS: string[] = [];

// ------------------------------------------------------------ constants
export const TIER_COLOR: Record<Tier, string> = { common: '#c4bcb4', uncommon: '#6ee7a0', rare: '#7cb8ff', epic: '#f0a0ff', refined: '#fcd34d' };
/** minimum distance from home (tiles) before a shop tier appears */

export const TIER_DIST: Record<1 | 2 | 3, number> = { 1: 0, 2: 60, 3: 200 };

export const GRID_MAX_W = 7, GRID_MAX_H = 5;

// ------------------------------------------------------------ content packs
export interface ContentPack {
  resources?: ResourceDef[]; grounds?: GroundDef[]; biomes?: BiomeDef[]; nodes?: NodeDef[]; mobs?: MobDef[];
  landmarks?: LandmarkDef[]; modules?: ModuleDef[]; locos?: LocoDef[]; frames?: FrameDef[];
  biomeTags?: Record<string, string>;
}

export function upsert<T extends { id: string }>(arr: T[], items?: T[]) {
  for (const it of items ?? []) { const i = arr.findIndex((a) => a.id === it.id); if (i >= 0) arr[i] = it; else arr.push(it); }
}

/** Add or override content. Items with an existing id replace the original. Call before a game is created. */
export function registerContent(pack: ContentPack) {
  upsert(RESOURCES, pack.resources); upsert(GROUNDS, pack.grounds); upsert(BIOMES, pack.biomes); upsert(NODES, pack.nodes);
  upsert(MOBS, pack.mobs); upsert(LANDMARKS, pack.landmarks); upsert(MODULES, pack.modules); upsert(LOCOS, pack.locos); upsert(FRAMES, pack.frames);
  Object.assign(BIOME_TAGS, pack.biomeTags ?? {});
  rebuild();
}

export function fill<T extends { id: string }>(map: Record<string, T>, arr: T[]) {
  for (const k of Object.keys(map)) delete map[k];
  for (const a of arr) map[a.id] = a;
}

export function rebuild() {
  RES_LIST.length = 0; RES_LIST.push(...RESOURCES.map((r) => r.id));
  fill(RES_INFO, RESOURCES); fill(GROUND, GROUNDS); fill(BIOME, BIOMES); fill(NODE, NODES); fill(MOB, MOBS);
  fill(LANDMARK, LANDMARKS); fill(MOD, MODULES); fill(LOCO, LOCOS); fill(FRAME, FRAMES);
  for (const b of Object.keys(BAND_BIOMES) as Band[]) BAND_BIOMES[b] = BIOMES.filter((x) => x.band === b && !x.patch);
  PATCH_BIOMES.length = 0; PATCH_BIOMES.push(...BIOMES.filter((b) => b.patch));
  GLOBAL_NODES.length = 0; GLOBAL_NODES.push(...NODES.filter((n) => n.global));
  PARTS.length = 0;
  PARTS.push(
    ...MODULES.filter((m) => m.cat !== 'core').map((m) => ({ kind: 'module' as const, id: m.id, name: m.name, desc: m.desc, cost: m.cost, shop: m.shop, catName: CAT_INFO[m.cat].name, color: m.color })),
    ...LOCOS.map((l) => ({ kind: 'loco' as const, id: l.id, name: l.name, desc: l.desc, cost: l.cost, shop: l.shop, catName: 'Locomotion', color: '#888' })),
    ...FRAMES.map((f) => ({ kind: 'frame' as const, id: f.id, name: f.name, desc: f.desc, cost: f.cost, shop: f.shop, catName: 'Frame', color: f.floor })),
  );
  fill(PART, PARTS);
  STARTER_PARTS.length = 0; STARTER_PARTS.push(...PARTS.filter((p) => !p.shop).map((p) => p.id));
  validate();
}

export function validate() {
  const warn = (m: string) => console.warn(`[content] ${m}`);
  const res = (r: string, where: string) => { if (!RES_INFO[r]) warn(`${where}: unknown resource "${r}"`); };
  const cost = (c: Cost, where: string) => { for (const k in c) if (k !== 'coins') res(k, where); };
  const whereOk = (w: Where, at: string) => {
    if (w === 'any') return;
    for (const x of w) if (x.startsWith('#') ? !BIOMES.some((b) => b.tags?.includes(x.slice(1))) : !BIOME[x]) warn(`${at}: "${x}" matches no biome`);
  };
  for (const b of BIOMES) {
    if (!GROUND[b.ground]) warn(`biome ${b.id}: unknown ground "${b.ground}"`);
    for (const [n] of b.nodes) if (!NODE[n]) warn(`biome ${b.id}: unknown node "${n}"`);
    for (const r of [...(b.goods?.cheap ?? []), ...(b.goods?.dear ?? [])]) res(r, `biome ${b.id} goods`);
    for (const m of b.mobs ?? []) if (!MOB[m]) warn(`biome ${b.id}: unknown mob "${m}"`);
  }
  for (const n of NODES) { res(n.res, `node ${n.id}`); if (n.find) res(n.find.res, `node ${n.id} find`); }
  for (const m of MOBS) { for (const b of m.biomes) if (!BIOME[b]) warn(`mob ${m.id}: unknown biome "${b}"`); if (m.drop) res(m.drop, `mob ${m.id} drop`); }
  for (const l of LANDMARKS) { whereOk(l.where, `landmark ${l.id}`); for (const r in l.reward?.res ?? {}) res(r, `landmark ${l.id} reward`); }
  for (const m of MODULES) {
    cost(m.cost, `part ${m.id}`);
    if (m.burns) res(m.burns.res, `part ${m.id} burns`);
    if (m.weapon?.ammo) res(m.weapon.ammo.res, `part ${m.id} ammo`);
    for (const r in m.process?.input ?? {}) res(r, `part ${m.id} input`);
    for (const r in m.process?.output ?? {}) res(r, `part ${m.id} output`);
    if (m.art && !MOD[m.art]) warn(`part ${m.id}: art "${m.art}" is not a part id`);
    if (m.shop) whereOk(m.shop.where, `part ${m.id} shop`);
  }
  for (const l of LOCOS) { cost(l.cost, `loco ${l.id}`); for (const g in l.ground) if (!GROUND[g]) warn(`loco ${l.id}: unknown ground "${g}"`); if (l.shop) whereOk(l.shop.where, `loco ${l.id} shop`); }
  for (const f of FRAMES) { cost(f.cost, `frame ${f.id}`); if (f.shop) whereOk(f.shop.where, `frame ${f.id} shop`); }
  if (!BAND_BIOMES.land.length) warn('no land biomes defined!');
}

rebuild();
