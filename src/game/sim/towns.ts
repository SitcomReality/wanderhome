// Towns: prices, markets, blueprint workshops, the price journal, rumours, docking & auto-sell.
import type { Game } from '../engine';
import { zeroRes } from '../core/constants';
import { KnownTown } from '../core/types';
import { BIOME, PART, PARTS, RES_INFO, RES_LIST, Res, TERRAIN_INFO, TIER_DIST, Terrain, biomePriceMul, describeWhere, matchesWhere, partHint } from '../../content/index';
import { onDiscover } from '../family/index';
import { meta } from '../family/meta';
import { hash2 } from '../world/noise';
import { sfx } from '../sfx';
import { TILE, Town } from '../world/world';
import { goalProtect } from './plan';

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
  const count = t.key === 'home' ? 3 : 3 + Math.floor(hash2(seedBase, 99, g.world.seed) * 3);
  const out = sorted.slice(0, count);
  if (hash2(seedBase, 77, g.world.seed) < 0.4) {
    const wild = PARTS.filter((p) => ok(p) && !out.includes(p.id));
    if (wild.length) out.push(wild[Math.floor(hash2(seedBase, 78, g.world.seed) * wild.length)].id);
  }
  g.stockCache.set(t.key, out);
  return out;
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
  if (bought) { sfx('buy'); g.recordKnown(t); }
  return bought;
}

export function recordKnown(g: Game, t: Town) {
  const sell = zeroRes();
  for (const r of RES_LIST) sell[r] = g.townPrice(t, r);
  if (!g.towns[t.key]) { g.stats.townsVisited++; onDiscover(g, 'towns', `${g.seedStr}:${t.key}`, { name: t.name, biome: t.biome }); }
  g.towns[t.key] = { name: t.name, x: t.x, y: t.y, biome: t.biome, sell, t: g.time, stock: g.townStock(t) };
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
  for (const t of g.nearTowns) if (Math.hypot(t.x - g.v.x, t.y - g.v.y) < 48) { dock = t; break; }
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
