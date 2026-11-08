// Small queries over content data (biome matching, prices, rumour hints…).
import { hash2 } from '../game/world/noise';
import { BIOME_TAGS } from './biomes';
import { CAT_INFO } from './parts';
import { BIOME, GROUND, LOCO, MOD, PartRef, RES_INFO, RES_LIST, rebuild } from './registry';
import { BiomeDef, BuffDef, Cost, Where } from './types';

// ------------------------------------------------------------ helpers
/** Does a biome match a `where` list? 'any' matches everything. */
export function matchesWhere(w: Where, b: BiomeDef | undefined) {
  if (!b) return false;
  if (w === 'any') return true;
  return w.some((x) => (x.startsWith('#') ? !!b.tags?.includes(x.slice(1)) : x === b.id));
}

/** A short phrase describing one random entry of a `where` list, for rumours. */
export function describeWhere(w: Where): string {
  if (w === 'any') return 'towns everywhere';
  const x = w[Math.floor(Math.random() * w.length)];
  if (x.startsWith('#')) { const t = x.slice(1); return `towns in ${BIOME_TAGS[t] ?? t + ' lands'}`; }
  return `${BIOME[x]?.name ?? x} towns`;
}

export function locoSpeed(locoId: string, biomeId: string) {
  const b = BIOME[biomeId];
  return (b && LOCO[locoId]?.ground[b.ground]) ?? 0;
}

export function biomePriceMul(biomeId: string, r: string) {
  const g = BIOME[biomeId]?.goods;
  if (g?.cheap.includes(r)) return 0.55;
  if (g?.dear.includes(r)) return 1.7;
  return 0.9 + hash2(RES_LIST.indexOf(r), biomeId.length * 7 + biomeId.charCodeAt(0), 99) * 0.25;
}

export const BUFF_LABEL: Record<string, string> = { speed: 'speed', yield: 'harvest yield', regen: 'hull repair', luck: 'lucky finds', damage: 'weapon damage' };

export function describeBuff(b: BuffDef) { return `×${b.mult} ${BUFF_LABEL[b.stat] ?? b.stat}`; }

export function expandCost(w: number, h: number): Cost {
  const n = w * h;
  const c: Cost = { coins: Math.round(40 * Math.pow(1.35, n - 6)), wood: 10 + n * 3, stone: 10 + n * 4 };
  if (n >= 10) c.iron = (n - 8) * 3;
  if (n >= 18) c.metal = (n - 16) * 2;
  return c;
}

/** A vague hint about a part, used in rumours so they don't spoil the exact item. */
export function partHint(p: PartRef): string {
  if (p.kind === 'frame') return 'a whole new kind of chassis frame';
  if (p.kind === 'loco') {
    const l = LOCO[p.id];
    const best = Object.entries(l.ground).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0, 2).map(([g]) => (GROUND[g]?.name ?? g).toLowerCase());
    return `a way for a house to travel over ${best.join(' & ')}`;
  }
  const m = MOD[p.id];
  const rn = (r: string) => (RES_INFO[r]?.name ?? r).toLowerCase();
  if (m.weight < 0) return 'something lighter than air';
  if (m.burns) return `${m.cat === 'power' ? 'an engine' : 'a part'} that runs on ${rn(m.burns.res)}`;
  if (m.sail) return 'a power source that needs no fuel at all';
  if (m.harvest?.bonus) return `a tool for gathering ${m.harvest.bonus.map(rn).join(' & ')}`;
  if (m.weapon) return m.weapon.ammo ? `a weapon that fires ${rn(m.weapon.ammo.res)}` : 'a weapon that needs no ammo';
  if (m.process) return `a machine that turns ${Object.keys(m.process.input).map(rn).join(' & ')} into something better`;
  if (m.comfort && m.comfort > 0) return 'something that makes a home feel cozy';
  if (m.cargo) return 'a new way to haul cargo';
  return `a ${CAT_INFO[m.cat].name.toLowerCase()} gadget`;
}

rebuild();
