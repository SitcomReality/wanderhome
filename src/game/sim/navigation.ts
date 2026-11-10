// Navigation helpers: obstacle-hugging 'bug' steering, giving up on unreachable targets, picking trade towns.
import type { Game } from '../engine';
import { TAU } from '../core/constants';
import { LOCO, RES_LIST } from '../../content/index';
import type { Town } from '../world/world';

export function hasSellable(g: Game) { return RES_LIST.some((r) => g.autoSellRes[r] && g.sellable(r) >= 1); }

/** A point with enough elbow room around it for the house, not just one walkable pixel. */
function openAt(g: Game, x: number, y: number) {
  if (g.terrMult(x, y) <= 0) return false;
  const r = 8;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    if (g.terrMult(x + Math.cos(a) * r, y + Math.sin(a) * r) <= 0) return false;
  }
  return true;
}

/** Closest roomy, drivable point to (x,y), searched outward from the target. */
export function walkableNear(g: Game, x: number, y: number, maxR = 64) {
  if (openAt(g, x, y)) return { x, y };
  for (let r = 8; r <= maxR; r += 8) {
    const steps = Math.max(12, Math.ceil((TAU * r) / 6));
    let best: { x: number; y: number } | null = null, bd = Infinity;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * TAU;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (!openAt(g, px, py)) continue;
      const d = Math.hypot(px - g.v.x, py - g.v.y);
      if (d < bd) { bd = d; best = { x: px, y: py }; }
    }
    if (best) return best;
  }
  return null;
}

function townFor(g: Game, t: { key: string; x: number; y: number }): Town | null {
  if (t.key === 'home') return g.world.homeTown;
  const near = g.nearTowns.find((q) => q.key === t.key);
  if (near) return near;
  const [rx, ry] = t.key.split(':').map(Number);
  return Number.isFinite(rx) && Number.isFinite(ry) ? g.world.townInRegion(rx, ry) : null;
}

/**
 * Towns are met at their gate when the streets allow it: a big city should not require
 * driving through its houses to reach the market. Cached per town + locomotion.
 */
export function townApproach(g: Game, t: { key: string; x: number; y: number }) {
  const ck = t.key + ':' + g.loco;
  if (ck in g.townGates) return g.townGates[ck];
  const town = townFor(g, t);
  if (town) {
    const plan = g.settlementPlan(town);
    const gate = walkableNear(g, plan.gate.x, plan.gate.y, 48);
    if (gate) { g.townGates[ck] = gate; return gate; }
  }
  const pt = walkableNear(g, t.x, t.y, 64);
  g.townGates[ck] = pt;
  return pt;
}

export function townReachable(g: Game, t: { key?: string; x: number; y: number }) {
  if (t.key) return !!townApproach(g, { key: t.key, x: t.x, y: t.y });
  return !!walkableNear(g, t.x, t.y, 64);
}

export function lineClear(g: Game, x0: number, y0: number, x1: number, y1: number) {
  for (let i = 1; i <= 5; i++) { const k = i / 6; if (g.terrMult(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k) <= 0) return false; }
  return true;
}

export function resetNav(g: Game, key: string) { g.nav = { follow: false, side: g.nav.side, bestD: 1e9, startD: 0, noProg: 0, followT: 0, key }; }

/** Bug-style navigation: go straight; when blocked, hug the obstacle until closer than where we started hugging. */
export function navSteer(g: Game, tx: number, ty: number, key: string, step: number) {
  const nav = g.nav;
  if (nav.key !== key) resetNav(g, key);
  const v = g.v;
  const d = Math.hypot(tx - v.x, ty - v.y);
  if (d < nav.bestD - 6) { nav.bestD = d; nav.noProg = 0; } else nav.noProg += step;
  const direct = Math.atan2(ty - v.y, tx - v.x);
  if (g.terrMult(v.x, v.y) <= 0) return direct;
  if (!nav.follow) {
    if (clearAt(g, direct, 44)) return direct;
    nav.follow = true; nav.startD = d; nav.followT = 0;
    for (let i = 1; i <= 10; i++) {
      if (clearAt(g, direct + nav.side * i * 0.3, 44)) break;
      if (clearAt(g, direct - nav.side * i * 0.3, 44)) { nav.side = -nav.side; break; }
    }
  }
  nav.followT += step;
  if (d < nav.startD - 10 && clearAt(g, direct, 44)) { nav.follow = false; return direct; }
  if (nav.followT > 28) { nav.side = -nav.side; nav.followT = 0; nav.startD = d; }
  const h = v.angle;
  for (let k = 0; k <= 22; k++) { const a = h - nav.side * 1.3 + nav.side * k * 0.25; if (clearAt(g, a, 30)) return a; }
  return h + Math.PI;
}

export function giveUp(g: Game, key: string) {
  if (key === 'wp') { g.waypoint = null; g.addLog("Couldn't find a way to that waypoint. Giving up.", '#ff8a80'); }
  else if (key.startsWith('town:') && g.tradeRun) {
    g.unreachable[g.tradeRun.key] = g.time;
    g.addLog(`No route to ${g.tradeRun.name} with these ${LOCO[g.loco].name.toLowerCase()}. Trying elsewhere.`, '#ff8a80');
    g.tradeRun = null; g.tradeCd = 4;
  } else if (key.startsWith('node:')) {
    g.nodeBlacklist.set(key.slice(5), g.time); g.forageTarget = null;
  } else if (key.startsWith('lm:')) {
    g.nodeBlacklist.set(key, g.time);
  }
  resetNav(g, '');
}

export function pickTradeTown(g: Game) {
  const v = g.v;
  const towns = g.world.townsNear(v.x, v.y, 5000)
    .sort((a, b) => Math.hypot(a.x - v.x, a.y - v.y) - Math.hypot(b.x - v.x, b.y - v.y));
  for (const t of towns) {
    const u = g.unreachable[t.key];
    if (u !== undefined && g.time - u < 300) continue;
    if (g.townReachable(t)) return t;
  }
  return null;
}

export function clearAt(g: Game, a: number, dist: number) {
  const c = Math.cos(a), s = Math.sin(a);
  for (const d of [g.hw + 4, g.hw + 18, dist]) if (g.terrMult(g.v.x + c * d, g.v.y + s * d) <= 0) return false;
  return true;
}

export function chooseAngle(g: Game, desired: number) {
  if (g.terrMult(g.v.x, g.v.y) <= 0) return desired;
  if (clearAt(g, desired, 48)) return desired;
  for (let i = 1; i <= 9; i++) for (const side of [g.avoidSide, -g.avoidSide]) {
    const a = desired + side * i * 0.35;
    if (clearAt(g, a, 48)) { g.avoidSide = side; g.wanderA = a; return a; }
  }
  return desired + Math.PI;
}
