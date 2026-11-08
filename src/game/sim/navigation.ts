// Navigation helpers: obstacle-hugging 'bug' steering, giving up on unreachable targets, picking trade towns.
import type { Game } from '../engine';
import { TAU } from '../core/constants';
import { LOCO, RES_LIST } from '../../content/index';
import { Town } from '../world/world';

export function hasSellable(g: Game) { return RES_LIST.some((r) => g.autoSellRes[r] && g.res[r] - g.keep[r] >= 1); }

export function townReachable(g: Game, t: { x: number; y: number }) {
  if (g.terrMult(t.x, t.y) > 0) return true;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; if (g.terrMult(t.x + Math.cos(a) * 32, t.y + Math.sin(a) * 32) > 0) return true; }
  return false;
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
  let best: Town | null = null, bd = 1e9;
  for (const t of g.world.townsNear(v.x, v.y, 5000)) {
    const u = g.unreachable[t.key];
    if (u !== undefined && g.time - u < 300) continue;
    if (!g.townReachable(t)) continue;
    const d = Math.hypot(t.x - v.x, t.y - v.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
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
