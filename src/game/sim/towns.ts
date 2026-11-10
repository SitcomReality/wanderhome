// Towns: prices, markets, blueprint workshops, the price journal, rumours, docking & auto-sell.
import type { Game } from '../engine';
import { zeroRes } from '../core/constants';
import type { KnownTown, Mob } from '../core/types';
import { BIOME, MOD, PART, PARTS, RES_INFO, RES_LIST, Res, TERRAIN_INFO, TIER_DIST, Terrain, biomePriceMul, describeWhere, matchesWhere, partHint } from '../../content/index';
import { onDiscover } from '../family/index';
import { meta } from '../family/meta';
import { hash2 } from '../world/noise';
import { sfx } from '../sfx';
import { TILE, Town } from '../world/world';
import { settlementRadius } from '../world/settlement';
import { goalProtect } from './plan';

/** Base safe ring; larger settlements push their watch farther out. */
export const TOWN_SAFE_RADIUS = 160;

export function townSafeRadius(t: Town) { return Math.round(TOWN_SAFE_RADIUS + settlementRadius(t) * 0.42); }

export type ProsperityTier = { at: number; label: string; icon: string; blurb: string };
export const PROSPERITY: ProsperityTier[] = [
  { at: 0, label: 'humble', icon: '🌱', blurb: 'A few roofs, a well, and enough to get by' },
  { at: 25, label: 'comfortable', icon: '🪴', blurb: 'Flower boxes, a second market stall, and a bench' },
  { at: 50, label: 'prosperous', icon: '🏮', blurb: 'Lit windows, extra wares, and a busier watch' },
  { at: 75, label: 'flourishing', icon: '✨', blurb: 'Bunting, painted shutters, and a proper market' },
  { at: 100, label: 'golden', icon: '👑', blurb: 'The kind of place other towns tell stories about' },
];

export function prosperityLevel(wealth: number) {
  const v = Math.max(0, Math.min(100, wealth));
  let level = 0;
  for (let i = 0; i < PROSPERITY.length; i++) if (v >= PROSPERITY[i].at) level = i;
  return { value: v, level, next: level < PROSPERITY.length - 1 ? PROSPERITY[level + 1].at : 100, ...PROSPERITY[level] };
}

export function townProsperity(g: Game, t: Town) { return prosperityLevel(g.townWealth[t.key] ?? 0); }

/** Trade, generous purchases and new residents all feed a town's little budget. */
export function addTownWealth(g: Game, t: Town, amount: number) {
  if (!(amount > 0)) return;
  const old = g.townWealth[t.key] ?? 0;
  const before = prosperityLevel(old).level;
  const next = Math.min(100, old + amount);
  g.townWealth[t.key] = next;
  const after = prosperityLevel(next).level;
  if (after > before) {
    g.stockCache.delete(t.key);
    if (g.played && Math.hypot(t.x - g.v.x, t.y - g.v.y) < 900) {
      g.addLog(`🏘️ ${t.name} feels a little more ${PROSPERITY[after].label}. ${PROSPERITY[after].blurb}.`, '#ffe8a3');
    }
  }
}

export interface TownDefense { name: string; range: number; damage: number; rate: number; color: string }

function watchName(goods: string[]): string {
  if (goods.includes('crystal') || goods.includes('starmetal')) return 'Prism Watch';
  if (goods.includes('obsidian') || goods.includes('sulfur')) return 'Ash Watch';
  if (goods.includes('iron') || goods.includes('metal')) return 'Iron Watch';
  if (goods.includes('stone')) return 'Stone Watch';
  if (goods.includes('bone')) return 'Bone Watch';
  if (goods.includes('wood') || goods.includes('fiber')) return 'Timber Watch';
  return 'Town Watch';
}

export function townDist(g: Game, t: { x: number; y: number }) { return Math.hypot(t.x - g.homeX, t.y - g.homeY) / TILE; }

export function townPrice(g: Game, t: Town, r: Res) {
  const hm = 0.85 + hash2(Math.floor(t.seedv * 1e6), RES_LIST.indexOf(r), g.world.seed + 31) * 0.3;
  const sat = g.townSat[t.key]?.[r] ?? 1;
  const db = 1 + Math.hypot(t.x - g.homeX, t.y - g.homeY) / 40000;
  const pres = g.st?.preserve && (RES_INFO[r].tier === 'rare' || RES_INFO[r].tier === 'epic') ? 1.15 : 1;
  return RES_INFO[r].base * biomePriceMul(t.biome, r) * t.mod * hm * sat * db * pres;
}

export function buyPrice(g: Game, t: Town, r: Res) { return g.townPrice(t, r) * 1.3; }

export function townStock(g: Game, t: Town): string[] {
  const c = g.stockCache.get(t.key);
  if (c) return c;
  const dist = g.townDist(t);
  const biome: Terrain = t.key === 'home' ? 'grass' : t.biome;
  const seedBase = Math.floor(t.seedv * 1e6) + t.tx * 7 + t.ty * 13;
  const ok = (p: (typeof PARTS)[number]) => p.shop && dist >= TIER_DIST[p.shop.tier];
  const local = PARTS.filter((p) => ok(p) && matchesWhere(p.shop!.where, BIOME[biome]));
  const sorted = local.map((p, i) => ({ p, k: hash2(seedBase, i, g.world.seed + 4242) })).sort((a, b) => a.k - b.k).map((x) => x.p.id);
  const wealthLevel = prosperityLevel(g.townWealth[t.key] ?? 0).level;
  const wealthBonus = wealthLevel >= 3 ? 2 : wealthLevel >= 1 ? 1 : 0;
  const tierBonus = t.tier === 'city' ? 2 : t.tier === 'town' ? 1 : 0;
  const count = (t.key === 'home' ? 3 : 3 + Math.floor(hash2(seedBase, 99, g.world.seed) * 3)) + wealthBonus + tierBonus;
  const out = sorted.slice(0, count);
  if (hash2(seedBase, 77, g.world.seed) < 0.4) {
    const wild = PARTS.filter((p) => ok(p) && !out.includes(p.id));
    if (wild.length) out.push(wild[Math.floor(hash2(seedBase, 78, g.world.seed) * wild.length)].id);
  }
  g.stockCache.set(t.key, out);
  return out;
}

/** A town's watch is armed from its local goods and the defensive kit it sells. */
export function townDefense(g: Game, t: Town): TownDefense {
  const goods = BIOME[t.biome]?.goods?.cheap ?? [];
  let damage = 8 + t.mod * 5;
  let range = 210 + t.mod * 20 + settlementRadius(t) * 0.16;
  let rate = 0.9;
  if (goods.includes('iron') || goods.includes('metal')) { damage += 4; range += 15; }
  if (goods.includes('stone')) { damage += 2; range += 10; }
  if (goods.includes('crystal')) { damage += 4; range += 20; }
  if (goods.includes('sulfur') || goods.includes('obsidian')) { damage += 3; }
  if (goods.includes('bone')) damage += 2;
  if (goods.includes('wood') || goods.includes('fiber')) { damage += 1; range += 5; }
  for (const id of g.townStock(t)) {
    const m = MOD[id];
    if (!m) continue;
    if (m.weapon) { damage += 4; range += 12; rate += 0.08; }
    else if (m.shield || (m.hp ?? 0) > 0) damage += 2;
    else if (m.spikes) damage += 2;
  }
  const wealth = g.townWealth[t.key] ?? 0;
  damage += wealth * 0.08; range += wealth * 0.18;
  const diff = g.difficulty(t.x, t.y);
  damage = Math.round(damage * (0.65 + diff * 0.7));
  const color = goods.includes('crystal') ? '#b07cff' : goods.includes('sulfur') || goods.includes('obsidian') ? '#f2e14c' : goods.includes('iron') || goods.includes('metal') ? '#cfd8dc' : '#ffd166';
  return { name: watchName(goods), range: Math.min(320, Math.round(range)), damage: Math.min(80, damage), rate: Math.min(2.4, rate), color };
}

export function inTownSafeZone(g: Game, x: number, y: number, extra = 0): boolean {
  return g.nearTowns.some((t) => Math.hypot(t.x - x, t.y - y) <= townSafeRadius(t) + extra);
}

/** Towns shoot the nearest critter in range. Kills use the normal loot path. */
export function updateTownDefense(g: Game, dt: number) {
  for (const t of g.nearTowns) {
    const cd = (g.townDefCd[t.key] ?? 0) - dt;
    if (cd > 0) { g.townDefCd[t.key] = cd; continue; }
    const def = townDefense(g, t);
    let best: Mob | null = null, bd = def.range;
    for (const m of g.mobs) {
      const d = Math.hypot(m.x - t.x, m.y - t.y);
      if (d < bd) { bd = d; best = m; }
    }
    if (!best) { g.townDefCd[t.key] = 0.2; continue; }
    g.townDefCd[t.key] = 1 / def.rate;
    const wp = g.settlementPlan(t).watch;
    const ox = wp.x, oy = wp.y - 7;
    const ang = Math.atan2(best.y - oy, best.x - ox);
    const speed = 420;
    g.projectiles.push({ kind: 'bullet', x: ox, y: oy, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, dmg: def.damage, life: def.range / speed + 0.15, target: null, color: def.color, town: true });
    g.part(ox, oy, Math.cos(ang) * 20, Math.sin(ang) * 20, 0.12, 2.5, def.color, 1, 0, 0);
    g.residentsWatchFire(t, best.x, best.y);
    const near = Math.hypot(g.v.x - t.x, g.v.y - t.y) < 500;
    if (near) sfx('shot', 0.35);
    if (near && (g.townDefLog[t.key] ?? -999) + 45 < g.time) {
      g.townDefLog[t.key] = g.time;
      g.addLog(`🏹 ${t.name}'s ${def.name} opens fire on a ${best.def.name}.`, '#ffd166');
    }
  }
}

export function blueprintPrice(g: Game, t: { x: number; y: number; mod?: number }, id: string) {
  const p = PART[id];
  if (!p?.shop) return 0;
  return Math.round(p.shop.price * (t.mod ?? 1) * (1 + g.townDist(t) / 3000));
}

export function buyBlueprint(g: Game, t: Town, id: string) {
  if (g.known.includes(id)) return false;
  const price = g.blueprintPrice(t, id);
  if (g.coins < price) return false;
  g.coins -= price;
  g.known.push(id);
  addTownWealth(g, t, 2.5);
  onDiscover(g, 'blueprints', id);
  meta.lifetime.bought++;
  sfx('buy');
  g.burst(g.v.x, g.v.y - 10, 30, ['#ffd166', '#7fd1e8', '#ff6b9a', '#fff'], 110, 1, 1.6, 4, 60);
  g.popup(g.v.x, g.v.y - 24, `Blueprint: ${PART[id].name}!`, '#7fd1e8', true);
  g.addLog(`📐 Learned blueprint: ${PART[id].name}. Build it in the Garage.`, '#7fd1e8');
  g.rumors = g.rumors.filter((r) => r.partId !== id);
  return true;
}

export function togglePin(g: Game, id: string) { g.pins = g.pins.includes(id) ? g.pins.filter((p) => p !== id) : [...g.pins, id]; }

export function whereSold(g: Game, id: string) {
  let best: (KnownTown & { key: string; d: number }) | null = null;
  for (const k in g.towns) {
    const kt = g.towns[k];
    if (!kt.stock.includes(id)) continue;
    const d = Math.hypot(kt.x - g.v.x, kt.y - g.v.y) / TILE;
    if (!best || d < best.d) best = { ...kt, key: k, d };
  }
  return best;
}

export function sell(g: Game, t: Town, r: Res, n: number) {
  let got = 0, sold = 0;
  const sat = (g.townSat[t.key] ??= {});
  for (let i = 0; i < n && g.res[r] >= 1; i++) {
    got += g.townPrice(t, r);
    g.res[r] -= 1; sold++;
    sat[r] = Math.max(0.35, (sat[r] ?? 1) * 0.993);
  }
  const c = Math.floor(got);
  if (sold) {
    g.coins += c; g.stats.earned += c;
    addTownWealth(g, t, sold * 0.22 + c * 0.008);
    if (g.townMemory[t.key]) g.townMemory[t.key].trades += sold;
    g.gainPopup(g.v.x, g.v.y - 14, 'coins', c);
    g.burst(g.v.x, g.v.y - 10, Math.min(30, 4 + sold), ['#ffd166', '#fff3b0', '#f4a261'], 90, 0.7, 1.6, 4, 60);
    sfx('coin');
    g.recordKnown(t);
  }
  return { sold, coins: c };
}

export function buy(g: Game, t: Town, r: Res, n: number) {
  let bought = 0;
  const sat = (g.townSat[t.key] ??= {});
  for (let i = 0; i < n; i++) {
    const p = Math.ceil(g.buyPrice(t, r));
    if (g.coins < p || g.cargoFree() < 1) break;
    g.coins -= p; g.addRes(r, 1); bought++;
    sat[r] = Math.min(2.5, (sat[r] ?? 1) * 1.006);
  }
  if (bought) { addTownWealth(g, t, bought * 0.1); if (g.townMemory[t.key]) g.townMemory[t.key].trades += bought; sfx('buy'); g.recordKnown(t); }
  return bought;
}

export function recordKnown(g: Game, t: Town) {
  const sell = zeroRes();
  for (const r of RES_LIST) sell[r] = g.townPrice(t, r);
  if (!g.towns[t.key]) { g.stats.townsVisited++; onDiscover(g, 'towns', `${g.seedStr}:${t.key}`, { name: t.name, biome: t.biome }); }
  g.towns[t.key] = { name: t.name, x: t.x, y: t.y, biome: t.biome, sell, t: g.time, stock: g.townStock(t), tier: t.tier, pop: t.pop };
}

export function bestKnown(g: Game, r: Res, excludeKey?: string) {
  let best: (KnownTown & { key: string }) | null = null;
  for (const k in g.towns) { if (k === excludeKey) continue; const kt = g.towns[k]; if (!best || kt.sell[r] > best.sell[r]) best = { ...kt, key: k }; }
  return best;
}

export function sellable(g: Game, r: Res) { return Math.max(0, Math.floor(g.res[r] - Math.max(g.keep[r], goalProtect(g, r)))); }

export function autoSellNow(g: Game, t: Town) {
  let total = 0;
  for (const r of RES_LIST) {
    if (!g.autoSellRes[r]) continue;
    const n = g.sellable(r);
    if (n > 0) total += g.sell(t, r, n).coins;
  }
  return total;
}

export function makeRumor(g: Game, t: { x: number; y: number }) {
  const cands = PARTS.filter((p) => p.shop && p.shop.where !== 'any' && !g.known.includes(p.id) && !g.rumors.some((r) => r.partId === p.id) && g.townDist(t) + 150 >= TIER_DIST[p.shop.tier]);
  if (!cands.length) return;
  const p = cands[(Math.random() * cands.length) | 0];
  const where = describeWhere(p.shop!.where);
  const openers = ['A trader swears', 'An old tinker mutters', 'The innkeeper says', 'A dusty pamphlet claims', 'A kid at the market insists', 'Overheard at the well:'];
  const text = `${openers[(Math.random() * openers.length) | 0]} that ${where} sell ${partHint(p)}.`;
  g.rumors.unshift({ id: ++g.rumorId, text, partId: p.id, where, t: g.time });
  if (g.rumors.length > 8) g.rumors.pop();
  g.addLog(`📜 Rumor: ${text}`, '#e0c8ff');
}

export function updateDock(g: Game, dt: number) {
  let dock: Town | null = null;
  for (const t of g.nearTowns) {
    const gate = g.townApproach(t);
    if (!gate) continue;
    const d = Math.hypot(t.x - g.v.x, t.y - g.v.y);
    const edge = Math.abs(gate.x - t.x) > 0.5 || Math.abs(gate.y - t.y) > 0.5;
    if (d < 48 || (edge && Math.hypot(gate.x - g.v.x, gate.y - g.v.y) < 30)) { dock = t; break; }
  }
  g.docked = dock;
  if (dock) {
    if (g.lastDockKey !== dock.key) {
      g.lastDockKey = dock.key;
      const first = !g.towns[dock.key];
      g.recordKnown(dock);
      const newBp = g.townStock(dock).filter((id) => !g.known.includes(id)).length;
      g.addLog(first ? `🏘️ Discovered ${dock.name} (${TERRAIN_INFO[dock.biome].name}).${newBp ? ` Its workshop has ${newBp} blueprint${newBp > 1 ? 's' : ''} you don't know!` : ''}` : `🏘️ Rolled into ${dock.name}.`, '#ffd166');
      if (first) {
        g.popup(dock.x, dock.y - 30, dock.name, '#ffd166', true);
        g.burst(dock.x, dock.y - 20, 24, ['#ffd166', '#ff6b9a', '#7fd1e8', '#fff'], 100, 1, 1.6, 0, 80);
        if (Math.random() < 0.75) g.makeRumor(dock);
      }
      const pinned = g.townStock(dock).filter((id) => g.pins.includes(id) && !g.known.includes(id));
      if (pinned.length) g.addLog(`📌 ${dock.name} sells your wishlisted ${pinned.map((p) => PART[p].name).join(', ')}!`, '#7fd1e8');
      g.residentsVisit(dock);
      if (g.tradeRun && g.tradeRun.key === dock.key) {
        g.dockPause = 3;
        const got = g.autoSellNow(dock);
        g.addLog(got > 0 ? `Sold goods for ${got} 🪙.` : 'Nothing here was unlocked for auto-sell…', got > 0 ? '#ffd166' : '#ff8a80');
        g.tradeRun = null;
        g.tradeCd = g.cargoUsed() >= g.cargoCap * 0.85 ? 90 : 10;
      }
      g.autoSellT = 0.5;
    }
    g.autoSellT -= dt;
    if (g.autoSellT <= 0) {
      g.autoSellT = 3;
      if (g.settings.autoSell) g.autoSellNow(dock);
      g.recordKnown(dock);
    }
  } else g.lastDockKey = '';
}
