// Saving and loading the current run (the family meta is saved separately).
import type { Game } from '../engine';
import { SAVE_KEY, noCaps, zeroRes } from '../core/constants';
import { BIOME, FRAME, GRID_MAX_H, GRID_MAX_W, LOCO, MOD, PART, RESIDENT_ROLES, RESIDENT_TRAITS, RES_LIST, Res, ResidentDef, STARTER_PARTS, TERRAIN_INFO } from '../../content/index';
import { meta, saveMeta } from '../family/meta';
import { applyOfflineProgress } from './offline';
import { validGoal } from './plan';

export function save(g: Game) {
  if ((globalThis as any).__wanderhausNoSave) return;
  const data = {
    v: 6, gen: meta.generation, seedStr: g.seedStr, coins: g.coins, res: g.res, keep: g.keep, collectCap: g.collectCap, goal: g.goal, seenRes: g.seenRes, gridW: g.gridW, gridH: g.gridH, grid: g.grid,
    loco: g.loco, ownedLocos: g.ownedLocos, frame: g.frame, ownedFrames: g.ownedFrames, known: g.known, pins: g.pins, rumors: g.rumors,
    vx: g.v.x, vy: g.v.y, angle: g.v.angle, hp: g.v.hp,
    settings: g.settings, stats: g.stats, towns: g.towns, townSat: g.townSat, autoSellRes: g.autoSellRes, residentMemory: g.residentMemory,
    townWealth: g.townWealth, townMemory: g.townMemory, residentBonds: g.residentBonds,
    movers: g.movers, moveOffer: g.moveOffer, departedByTown: g.departedByTown, movedIn: g.movedIn,
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
  const num = (v: any, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const str = (v: any, fallback: string) => (typeof v === 'string' && v ? v : fallback);
  const mem = s.residentMemory ?? {};
  const legacyHome = {
    visits: Math.max(0, Math.floor(num(mem.visits, 0))),
    honks: Math.max(0, Math.floor(num(mem.honks, 0))),
    firstDay: Math.floor(num(mem.firstDay, -1)),
    lastDay: Math.floor(num(mem.lastDay, -1)),
    lastVisit: num(mem.lastVisit, 0),
    lastHonk: num(mem.lastHonk, 0),
  };
  g.townMemory = {};
  if (s.townMemory && typeof s.townMemory === 'object') {
    for (const key of Object.keys(s.townMemory).slice(0, 180)) {
      const m = s.townMemory[key];
      if (!m || typeof m !== 'object') continue;
      g.townMemory[key] = {
        visits: Math.max(0, Math.floor(num(m.visits, 0))),
        honks: Math.max(0, Math.floor(num(m.honks, 0))),
        trades: Math.max(0, Math.floor(num(m.trades, 0))),
        firstDay: Math.floor(num(m.firstDay, -1)),
        lastDay: Math.floor(num(m.lastDay, -1)),
        lastVisit: num(m.lastVisit, 0),
        lastHonk: num(m.lastHonk, 0),
      };
    }
  }
  if (!g.townMemory.home) g.townMemory.home = { ...legacyHome, trades: 0 };
  g.residentMemory = {
    visits: g.townMemory.home.visits,
    honks: g.townMemory.home.honks,
    firstDay: g.townMemory.home.firstDay,
    lastDay: g.townMemory.home.lastDay,
    lastVisit: g.townMemory.home.lastVisit,
    lastHonk: g.townMemory.home.lastHonk,
  };
  g.townWealth = {};
  if (s.townWealth && typeof s.townWealth === 'object') {
    for (const key of Object.keys(s.townWealth).slice(0, 300)) {
      const v = s.townWealth[key];
      if (typeof v === 'number' && Number.isFinite(v)) g.townWealth[key] = Math.max(0, Math.min(100, v));
    }
  }
  const cleanDef = (v: any): ResidentDef | null => {
    if (!v || typeof v !== 'object' || typeof v.id !== 'string' || !v.id || typeof v.name !== 'string' || !v.name) return null;
    const role = RESIDENT_ROLES.includes(v.role) ? v.role : null;
    const trait = RESIDENT_TRAITS.includes(v.trait) ? v.trait : null;
    if (!role || !trait) return null;
    return {
      id: v.id.slice(0, 100), name: v.name.slice(0, 80), role, trait,
      color: str(v.color, '#c98b4b').slice(0, 24), accent: str(v.accent, '#f3e3c3').slice(0, 24),
      line: str(v.line, `${v.name} is getting on with the day.`).slice(0, 260),
      remember: str(v.remember, 'Good to see you again.').slice(0, 260),
      quirk: typeof v.quirk === 'string' ? v.quirk.slice(0, 120) : undefined,
    };
  };
  g.residentBonds = {};
  if (s.residentBonds && typeof s.residentBonds === 'object') {
    for (const key of Object.keys(s.residentBonds).slice(0, 400)) {
      const b = s.residentBonds[key];
      if (!b || typeof b !== 'object') continue;
      g.residentBonds[key] = {
        met: Math.max(0, Math.floor(num(b.met, 0))),
        honks: Math.max(0, Math.floor(num(b.honks, 0))),
        rides: Math.max(0, Math.floor(num(b.rides, 0))),
        lastDay: Math.floor(num(b.lastDay, -1)),
      };
    }
  }
  g.departedByTown = {};
  if (s.departedByTown && typeof s.departedByTown === 'object') {
    for (const key of Object.keys(s.departedByTown).slice(0, 180)) {
      const list = s.departedByTown[key];
      if (Array.isArray(list)) g.departedByTown[key] = list.filter((v: any) => typeof v === 'string').slice(0, 60);
    }
  }
  g.movedIn = {};
  if (s.movedIn && typeof s.movedIn === 'object') {
    for (const key of Object.keys(s.movedIn).slice(0, 180)) {
      const list = s.movedIn[key];
      if (!Array.isArray(list)) continue;
      g.movedIn[key] = list.map(cleanDef).filter((d: ResidentDef | null): d is ResidentDef => !!d).slice(0, 60);
    }
  }
  g.movers = [];
  if (Array.isArray(s.movers)) {
    for (const m of s.movers.slice(0, 8)) {
      const def = cleanDef(m?.def);
      if (!def || typeof m.fromKey !== 'string' || typeof m.toKey !== 'string') continue;
      const gift = m.gift && typeof m.gift === 'object' ? m.gift : {};
      const resKind = gift.res && RES_LIST.includes(gift.res.kind) ? gift.res.kind : null;
      g.movers.push({
        def, fromKey: m.fromKey, fromName: str(m.fromName, 'a settlement'), toKey: m.toKey, toName: str(m.toName, 'a settlement'),
        acceptedAt: num(m.acceptedAt, g.time),
        gift: {
          coins: typeof gift.coins === 'number' && Number.isFinite(gift.coins) ? Math.max(0, Math.floor(gift.coins)) : undefined,
          res: resKind ? { kind: resKind, amt: Math.max(1, Math.floor(num(gift.res.amt, 1))) } : undefined,
        },
      });
    }
  }
  g.moveOffer = null;
  if (s.moveOffer && typeof s.moveOffer === 'object') {
    const def = cleanDef(s.moveOffer.def);
    if (def && typeof s.moveOffer.fromKey === 'string' && typeof s.moveOffer.toKey === 'string') {
      g.moveOffer = {
        def, fromKey: s.moveOffer.fromKey, fromName: str(s.moveOffer.fromName, 'a settlement'),
        toKey: s.moveOffer.toKey, toName: str(s.moveOffer.toName, 'a settlement'), since: num(s.moveOffer.since, g.time),
      };
    }
  }
  if (g.visitor) delete (g.visitor as any).left;
  applyOfflineProgress(g, typeof s.lastSave === 'number' ? s.lastSave : Date.now(), { advanceWorld: true, minSeconds: 60 });
}
