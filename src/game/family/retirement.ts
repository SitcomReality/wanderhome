// Retirement: progress, spark award, run summaries, family perks for new runs and inheritance cards.
import { Cost, INHERITANCES, LEGACY_UPGRADES, PART, PARTS, RES_INFO, RETIRE_REQ } from '../../content';
import type { Game } from '../engine';
import { hashString } from '../world/noise';
import { PastGen, meta, rankOf, saveMeta } from './meta';
import { onDiscover } from './scrapbook';

// ------------------------------------------------------------ retirement
export function retireProgress(g: Game) {
  const nw = Math.floor(g.stats.earned), bio = g.runBiomes.length;
  return { nw, nwReq: RETIRE_REQ.earned, bio, bioReq: RETIRE_REQ.biomes, ready: nw >= RETIRE_REQ.earned && bio >= RETIRE_REQ.biomes };
}

/** Non-negative finite number, or 0. */
const safe = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0);

/** Legacy Sparks for retiring now. Always a finite integer ≥ 1. */
export function retireAward(g: Game) {
  const wealth = Math.max(safe(g.netWorth()), safe(g.stats.earned));
  const base = Math.sqrt(wealth / 40) + g.runBiomes.length * 1.5 + Object.keys(g.towns).length + safe(g.stats.landmarks) * 0.4 + safe(g.stats.distance) / 1500;
  const genMul = 1 + 0.15 * (Math.max(1, Math.floor(safe(meta.generation))) - 1);
  const award = Math.floor(base * genMul);
  return Number.isFinite(award) ? Math.max(1, award) : 1;
}

export function runFavorite(g: Game) {
  let best = 'grass', bv = -1;
  for (const k in g.biomeTime) if (g.biomeTime[k] > bv) { bv = g.biomeTime[k]; best = k; }
  return best;
}

export function runSummary(g: Game): PastGen {
  return {
    gen: meta.generation, family: meta.family, distance: Math.floor(g.stats.distance), earned: Math.floor(g.stats.earned), netWorth: g.netWorth(),
    biomes: g.runBiomes.length, towns: Object.keys(g.towns).length, landmarks: g.stats.landmarks ?? 0, kills: g.stats.kills, favorite: runFavorite(g),
    playTime: g.stats.playTime, sparks: retireAward(g), date: Date.now(), seedStr: g.seedStr, portrait: hashString(meta.family + meta.generation),
  };
}

/**
 * Add a finished (retired or abandoned) run's stats to the family's lifetime totals.
 * Guarded by g.folded so a run can never be counted twice.
 */
export function foldRunIntoLifetime(g: Game) {
  if (g.folded || !g.played) return;
  g.folded = true;
  const L = meta.lifetime, s = g.stats;
  L.distance += safe(s.distance); L.earned += safe(s.earned); L.harvested += safe(s.harvested); L.kills += safe(s.kills);
  L.landmarks += safe(s.landmarks); L.breakdowns += safe(s.breakdowns); L.playTime += safe(s.playTime);
  for (const k in g.biomeTime) meta.biomeTime[k] = safe(meta.biomeTime[k]) + safe(g.biomeTime[k]);
  saveMeta();
}

/**
 * Retire the current house. Returns the summary, or null if it isn't allowed (not ready yet, or this
 * house already retired, e.g. a double-click). The caller then starts a fresh Game.
 */
export function doRetire(g: Game): PastGen | null {
  if (g.retired || !retireProgress(g).ready) return null;
  g.retired = true;
  const sum = runSummary(g);
  foldRunIntoLifetime(g);
  meta.lifetime.retirements++;
  meta.past.unshift(sum);
  meta.sparks = safe(meta.sparks) + sum.sparks; meta.sparksEarned = safe(meta.sparksEarned) + sum.sparks;
  meta.generation++;
  meta.pendingInheritance = [...INHERITANCES].sort(() => Math.random() - 0.5).slice(0, 3).map((i) => i.id);
  saveMeta();
  return sum;
}

export function buyPerk(id: string) {
  const u = LEGACY_UPGRADES.find((x) => x.id === id);
  const r = rankOf(id);
  const cost = u?.costs[r];
  if (!u || r >= 3 || typeof cost !== 'number' || !(cost > 0) || !(meta.sparks >= cost)) return false;
  meta.sparks = Math.max(0, meta.sparks - cost);
  meta.perks[id] = r + 1;
  saveMeta();
  return true;
}

export function learnRandomBlueprints(g: Game, n: number, maxTier: number) {
  const pool = PARTS.filter((p) => p.shop && p.shop.tier <= maxTier && !g.known.includes(p.id)).sort(() => Math.random() - 0.5).slice(0, n);
  for (const p of pool) { g.known.push(p.id); onDiscover(g, 'blueprints', p.id); }
  return pool.map((p) => p.name);
}

export function addCost(g: Game, c: Cost) {
  for (const k in c) { const v = c[k] ?? 0; if (!v) continue; if (k === 'coins') g.coins += v; else if (RES_INFO[k]) g.addRes(k, v); }
}

/** Applied once to every brand-new run (not when loading a save). */
export function applyNewRunPerks(g: Game) {
  const notes: string[] = [];
  const sup = rankOf('supplies');
  if (sup) { addCost(g, LEGACY_UPGRADES.find((u) => u.id === 'supplies')!.supplies![sup - 1]); notes.push('a packed hamper'); }
  const bp = rankOf('blueprints');
  if (bp) { const names = learnRandomBlueprints(g, bp, bp >= 3 ? 2 : 1); if (names.length) notes.push(`blueprints for ${names.join(', ')}`); }
  if (meta.generation > 1) g.addLog(`🌳 Generation ${meta.generation} of the ${meta.family} family sets off${notes.length ? ` with ${notes.join(' and ')}` : ''}.`, '#ffe8a3');
}

export function applyInheritance(g: Game, id: string) {
  const d = INHERITANCES.find((i) => i.id === id);
  meta.pendingInheritance = null;
  if (!d) { saveMeta(); return; }
  if (d.coins) g.coins += d.coins;
  if (d.res) addCost(g, d.res);
  for (const b of d.blueprints ?? []) if (PART[b] && !g.known.includes(b)) { g.known.push(b); onDiscover(g, 'blueprints', b); }
  if (d.randomBlueprints) learnRandomBlueprints(g, d.randomBlueprints, 2);
  for (const p of d.install ?? []) {
    for (let i = 0; i < g.grid.length; i++) {
      const x = i % 7, y = Math.floor(i / 7);
      if (x < g.gridW && y < g.gridH && !g.grid[i]) { g.grid[i] = p; break; }
    }
  }
  if (d.revealTowns) {
    const ts = g.world.townsNear(g.v.x, g.v.y, 4000).filter((t) => !g.towns[t.key]).sort((a, b) => Math.hypot(a.x - g.v.x, a.y - g.v.y) - Math.hypot(b.x - g.v.x, b.y - g.v.y)).slice(0, d.revealTowns);
    for (const t of ts) g.recordKnown(t);
  }
  if (d.buff) g.addBuff(d.buff);
  g.computeStats();
  g.addLog(`${d.icon} Inheritance: ${d.name}. ${d.desc}`, '#ffe8a3');
  saveMeta();
}
