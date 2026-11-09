// Saving and loading the current run (the family meta is saved separately).
import type { Game } from '../engine';
import { SAVE_KEY, noCaps, zeroRes } from '../core/constants';
import { BIOME, FRAME, GRID_MAX_H, GRID_MAX_W, LOCO, MOD, PART, RES_LIST, Res, STARTER_PARTS, TERRAIN_INFO } from '../../content/index';
import { meta, saveMeta } from '../family/meta';
import { applyOfflineProgress } from './offline';
import { validGoal } from './plan';

export function save(g: Game) {
  if ((globalThis as any).__wanderhausNoSave) return;
  const data = {
    v: 5, gen: meta.generation, seedStr: g.seedStr, coins: g.coins, res: g.res, keep: g.keep, collectCap: g.collectCap, goal: g.goal, seenRes: g.seenRes, gridW: g.gridW, gridH: g.gridH, grid: g.grid,
    loco: g.loco, ownedLocos: g.ownedLocos, frame: g.frame, ownedFrames: g.ownedFrames, known: g.known, pins: g.pins, rumors: g.rumors,
    vx: g.v.x, vy: g.v.y, angle: g.v.angle, hp: g.v.hp,
    settings: g.settings, stats: g.stats, towns: g.towns, townSat: g.townSat, autoSellRes: g.autoSellRes, residentMemory: g.residentMemory,
    rates: g.rates, mode: g.mode, headingAngle: g.headingAngle, time: g.time, lastSave: Date.now(),
    visited: g.visited, buffs: g.buffs.map((b) => ({ ...b, left: b.until - g.time })),
    runBiomes: g.runBiomes, biomeTime: g.biomeTime, crew: g.crew ? { ...g.crew, left: g.crew.until - g.time } : null,
    visitor: g.visitor ? { ...g.visitor, left: Math.max(0, g.visitor.expires - g.time) } : null,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  saveMeta();
}

export function applySave(g: Game, s: any) {
  const oldRes = { ...(s.res ?? {}) };
  if (oldRes.ore !== undefined) { oldRes.iron = (oldRes.iron ?? 0) + oldRes.ore; delete oldRes.ore; }
  g.coins = s.coins ?? g.coins;
  g.res = { ...zeroRes() };
  for (const r of RES_LIST) if (typeof oldRes[r] === 'number') g.res[r] = oldRes[r];
  if (s.keep) for (const r of RES_LIST) if (typeof s.keep[r] === 'number') g.keep[r] = s.keep[r];
  g.collectCap = noCaps();
  if (s.collectCap) for (const r of RES_LIST) {
    const v = s.collectCap[r];
    if (typeof v === 'number' && Number.isFinite(v)) g.collectCap[r] = v < 0 ? -1 : Math.max(0, Math.floor(v));
  }
  g.seenRes = Array.isArray(s.seenRes) ? s.seenRes.filter((r: string) => RES_LIST.includes(r as Res)) : RES_LIST.filter((r) => g.res[r] > 0);
  for (const r of ['wood', 'stone', 'fiber'] as Res[]) if (!g.seenRes.includes(r)) g.seenRes.push(r);
  g.gridW = s.gridW; g.gridH = s.gridH;
  g.grid = (s.grid as (string | null)[]).map((id) => (id === 'lamp' ? 'lava' : id && MOD[id] ? id : null));
  while (g.grid.length < GRID_MAX_W * GRID_MAX_H) g.grid.push(null);
  if (!g.grid.includes('cockpit')) g.grid[g.cellIndex(g.gridW - 1, 0)] = 'cockpit';
  g.goal = validGoal(g, s.goal) ? s.goal : null;
  g.ownedLocos = (s.ownedLocos ?? ['wheels']).filter((l: string) => LOCO[l]);
  g.loco = LOCO[s.loco] ? s.loco : 'wheels';
  g.ownedFrames = (s.ownedFrames ?? ['f_timber']).filter((f: string) => FRAME[f]);
  g.frame = FRAME[s.frame] ? s.frame : 'f_timber';
  g.known = Array.from(new Set([...STARTER_PARTS, ...(Array.isArray(s.known) ? s.known : []), ...g.grid.filter((gx): gx is string => !!gx && gx !== 'cockpit'), ...g.ownedLocos, ...g.ownedFrames])).filter((id) => PART[id]);
  g.pins = (s.pins ?? []).filter((id: string) => PART[id]);
  g.rumors = (s.rumors ?? []).filter((r: any) => PART[r.partId]).map((r: any) => ({ ...r, where: r.where ?? `${TERRAIN_INFO[r.biome]?.name ?? 'Distant'} towns` }));
  g.rumorId = g.rumors.reduce((m, r) => Math.max(m, r.id), 0);
  g.v.x = s.vx; g.v.y = s.vy; g.v.angle = s.angle; g.v.hp = s.hp;
  g.settings = { ...g.settings, ...s.settings };
  g.stats = { ...g.stats, ...s.stats };
  const towns = s.towns ?? (Array.isArray(s.known) ? {} : s.known) ?? {};
  g.towns = {};
  if (towns && !Array.isArray(towns)) for (const k in towns) { const kt = towns[k]; g.towns[k] = { ...kt, sell: { ...zeroRes(), ...kt.sell }, stock: kt.stock ?? [] }; }
  g.townSat = s.townSat ?? {};
  if (s.autoSellRes) for (const r of RES_LIST) if (typeof s.autoSellRes[r] === 'boolean') g.autoSellRes[r] = s.autoSellRes[r];
  g.rates = s.rates ?? {};
  g.mode = s.mode ?? 'forage'; g.headingAngle = s.headingAngle ?? 0;
  g.time = s.time ?? 0;
  g.lastInput = g.time;
  g.visited = s.visited ?? {};
  // v3 fields (absent in v2 saves; defaults keep everything else intact)
  g.runBiomes = Array.isArray(s.runBiomes) ? s.runBiomes.filter((b: string) => BIOME[b]) : [];
  g.biomeTime = s.biomeTime && typeof s.biomeTime === 'object' ? s.biomeTime : {};
  g.crew = s.crew && s.crew.left > 0 ? { name: s.crew.name, role: s.crew.role, line: s.crew.line, stat: s.crew.stat, mult: s.crew.mult, until: g.time + s.crew.left } : null;
  g.buffs = (s.buffs ?? []).filter((b: any) => b.left > 0).map((b: any) => ({ id: b.id, name: b.name, icon: b.icon, stat: b.stat, mult: b.mult, until: g.time + b.left }));
  // visitor that was waiting when the game was saved (it resolves itself, positively, once play resumes)
  g.visitor = s.visitor && typeof s.visitor.left === 'number' && s.visitor.kind ? { ...s.visitor, expires: g.time + Math.max(0, s.visitor.left) } : null;
  const mem = s.residentMemory ?? {};
  const num = (v: any, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  g.residentMemory = {
    visits: Math.max(0, Math.floor(num(mem.visits, 0))),
    honks: Math.max(0, Math.floor(num(mem.honks, 0))),
    firstDay: Math.floor(num(mem.firstDay, -1)),
    lastDay: Math.floor(num(mem.lastDay, -1)),
    lastVisit: num(mem.lastVisit, 0),
    lastHonk: num(mem.lastHonk, 0),
  };
  if (g.visitor) delete (g.visitor as any).left;
  applyOfflineProgress(g, typeof s.lastSave === 'number' ? s.lastSave : Date.now(), { advanceWorld: true, minSeconds: 60 });
}
