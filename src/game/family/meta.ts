// Persistent "family" state that survives retirement: legacy perks, scrapbook, postcards,
// milestones, cosmetics, past generations, the family cat. Stored under its own key.
import { LEGACY_UPGRADES, FAMILY_NAMES, DEFAULT_COSMETICS, BonusKind, BookCat } from '../../content/index';

// Kept as the old namespace so family progress survives the Wanderhaus → Wanderhome rename.
export const META_KEY = 'wanderhaus-meta-v1';
export const META_VERSION = 1;

export interface BookEntry { first: number; count: number; gen: number; name?: string; biome?: string }
export interface Postcard { id: string; kind: 'biome' | 'landmark' | 'town' | 'visitor'; ref: string; title: string; line: string; date: number; gen: number; biome: string; seed: number; icon?: string }
export interface PastGen {
  gen: number; family: string; distance: number; earned: number; netWorth: number; biomes: number; towns: number; landmarks: number;
  kills: number; favorite: string; playTime: number; sparks: number; date: number; seedStr: string; portrait: number;
}
export interface GuestEntry { date: number; gen: number; icon: string; text: string }
export interface Lifetime {
  distance: number; earned: number; harvested: number; kills: number; landmarks: number; breakdowns: number; playTime: number;
  farthest: number; awayMax: number; netWorthMax: number; comfortMax: number; cellsMax: number;
  retirements: number; visitors: number; coffees: number; bought: number;
}
export interface Meta {
  v: number; family: string; generation: number; sparks: number; sparksEarned: number;
  perks: Record<string, number>;
  bonus: Partial<Record<BonusKind, number>>;
  book: Record<BookCat, Record<string, BookEntry>>;
  bookRewards: Partial<Record<BookCat, number>>;
  postcards: Postcard[];
  milestones: Record<string, number>;
  cosmetics: string[];
  equipped: { paint: string; flag: string; trinket: string };
  lifetime: Lifetime;
  biomeTime: Record<string, number>;
  past: PastGen[];
  guestbook: GuestEntry[];
  cat: { name: string; color: string; adopted: number } | null;
  lastCoffee: string;
  pendingInheritance: string[] | null;
}

const emptyLifetime = (): Lifetime => ({
  distance: 0, earned: 0, harvested: 0, kills: 0, landmarks: 0, breakdowns: 0, playTime: 0,
  farthest: 0, awayMax: 0, netWorthMax: 0, comfortMax: 0, cellsMax: 0, retirements: 0, visitors: 0, coffees: 0, bought: 0,
});

export function freshMeta(): Meta {
  return {
    v: META_VERSION, family: FAMILY_NAMES[(Math.random() * FAMILY_NAMES.length) | 0], generation: 1, sparks: 0, sparksEarned: 0,
    perks: {}, bonus: {},
    book: { biomes: {}, resources: {}, critters: {}, landmarks: {}, towns: {}, blueprints: {} },
    bookRewards: {}, postcards: [], milestones: {}, cosmetics: [...DEFAULT_COSMETICS],
    equipped: { paint: 'paint_none', flag: 'flag_none', trinket: 'trinket_none' },
    lifetime: emptyLifetime(), biomeTime: {}, past: [], guestbook: [], cat: null, lastCoffee: '', pendingInheritance: null,
  };
}

/** Fill any missing fields (future-proof migration for meta saves). */
export function normalizeMeta(m: any): Meta {
  const f = freshMeta();
  if (!m || typeof m !== 'object') return f;
  const out: Meta = { ...f, ...m };
  out.book = { ...f.book, ...(m.book ?? {}) };
  out.lifetime = { ...f.lifetime, ...(m.lifetime ?? {}) };
  out.equipped = { ...f.equipped, ...(m.equipped ?? {}) };
  out.cosmetics = Array.from(new Set([...(Array.isArray(m.cosmetics) ? m.cosmetics : []), ...DEFAULT_COSMETICS]));
  for (const k of ['postcards', 'past', 'guestbook'] as const) if (!Array.isArray(out[k])) (out as any)[k] = [];
  // numbers: never NaN, never negative (a hand-edited or damaged save can't break the Legacy maths)
  const num = (v: unknown, min = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : min);
  out.generation = Math.max(1, Math.floor(num(m.generation, 1)));
  out.sparks = Math.floor(num(m.sparks));
  out.sparksEarned = Math.max(out.sparks, Math.floor(num(m.sparksEarned)));
  out.perks = {};
  for (const u of LEGACY_UPGRADES) { const r = Math.min(3, Math.floor(num(m.perks?.[u.id]))); if (r) out.perks[u.id] = r; }
  out.bonus = {};
  for (const [k, v] of Object.entries(m.bonus ?? {})) if (typeof v === 'number' && Number.isFinite(v)) (out.bonus as Record<string, number>)[k] = v;
  out.milestones = {};
  for (const [k, v] of Object.entries(m.milestones ?? {})) out.milestones[k] = Math.floor(num(v));
  out.bookRewards = {};
  for (const [k, v] of Object.entries(m.bookRewards ?? {})) (out.bookRewards as Record<string, number>)[k] = Math.min(4, Math.floor(num(v)));
  for (const k of Object.keys(out.lifetime) as (keyof Lifetime)[]) out.lifetime[k] = num(out.lifetime[k]);
  out.biomeTime = {};
  for (const [k, v] of Object.entries(m.biomeTime ?? {})) out.biomeTime[k] = num(v);
  if (out.pendingInheritance && !Array.isArray(out.pendingInheritance)) out.pendingInheritance = null;
  if (typeof out.family !== 'string' || !out.family.trim()) out.family = f.family;
  out.v = META_VERSION;
  return out;
}

function load(): Meta {
  try {
    const s = localStorage.getItem(META_KEY);
    if (s) return normalizeMeta(JSON.parse(s));
  } catch {
    try { const raw = localStorage.getItem(META_KEY); if (raw) localStorage.setItem(META_KEY + '-backup', raw); } catch { /* ignore */ }
  }
  return freshMeta();
}

/** The live meta object. Mutate it directly, then call saveMeta(). */
export let meta: Meta = load();
export function replaceMeta(m: Meta) { meta = m; }
export function saveMeta() { if ((globalThis as any).__wanderhausNoSave) return; try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* ignore */ } }
export function wipeMeta() { meta = freshMeta(); try { localStorage.removeItem(META_KEY); } catch { /* ignore */ } }

export const rankOf = (id: string) => meta.perks[id] ?? 0;
/** total permanent bonus of a kind (legacy perks + milestone rewards) */
export function perkVal(kind: BonusKind): number {
  let v = meta.bonus[kind] ?? 0;
  for (const u of LEGACY_UPGRADES) {
    const r = rankOf(u.id);
    if (r > 0 && u.effect === kind) v += u.values[r - 1];
  }
  if (kind === 'offlineMul') { const r = rankOf('offline'); if (r) v += LEGACY_UPGRADES.find((u) => u.id === 'offline')!.values[r - 1] * 0.025; }
  return v;
}
export const bookCount = (cat: BookCat) => Object.keys(meta.book[cat]).length;
export const totalPerkRanks = () => Object.values(meta.perks).reduce((a, b) => a + b, 0);
export function unlockCosmetic(id: string) { if (!meta.cosmetics.includes(id)) { meta.cosmetics.push(id); return true; } return false; }
export function favoriteBiome(extra: Record<string, number> = {}): string | null {
  let best: string | null = null, bv = 0;
  const keys = new Set([...Object.keys(meta.biomeTime), ...Object.keys(extra)]);
  for (const k of keys) { const v = (meta.biomeTime[k] ?? 0) + (extra[k] ?? 0); if (v > bv) { bv = v; best = k; } }
  return best;
}
export const todayStr = () => new Date().toDateString();
