// Harvesting nodes, loot pickups flying home, and processing parts (smelters, looms…).
import type { Game } from '../engine';
import { TAU } from '../core/constants';
import { Pickup } from '../core/types';
import { NODE, RES_INFO, Res } from '../../content/index';
import { sfx } from '../sfx';
import { ResNode } from '../world/world';
import { collectionRoom, foragePriority } from './plan';

export function hitNode(g: Game, n: ResNode, power: number, yieldMul: number, collector: 'v' | 'a', fromX: number, fromY: number, finds?: { res: Res; chance: number }[]) {
  if (n.hp <= 0) return;
  if (g.cargoFree() <= 0) { if (Math.random() < 0.05) g.popup(fromX, fromY - 6, 'CARGO FULL', '#ff8a80'); return; }
  n.hp -= power; n.shake = 1;
  const col = RES_INFO[n.res].color;
  const chip = n.res === 'wood' ? ['#8b5a2b', '#c08a4a', '#4caf50'] : [col, '#fff', '#777'];
  g.burst(n.x, n.y - 5, 5, chip, 45, 0.45, 1.3, 0, 80);
  g.beams.push({ x1: fromX, y1: fromY, x2: n.x, y2: n.y - 4, life: 0.12, color: collector === 'a' ? '#fff' : '#ffd166' });
  sfx(n.res === 'wood' ? 'chop' : 'hit', 0.8 + Math.random() * 0.4);
  const comfortMul = 1 + g.comfort * 0.02;
  let amt = yieldMul * comfortMul * g.buffMul('yield');
  amt = Math.floor(amt) + (Math.random() < amt % 1 ? 1 : 0);
  if (amt > 0) g.dropPickup(n.x, n.y - 5, n.res, amt, collector);
  const spec = NODE[n.kind];
  const rolls = [...(spec?.find ? [spec.find] : []), ...(finds ?? [])];
  const luck = g.buffMul('luck');
  for (const f of rolls) if (Math.random() < f.chance * luck) {
    g.dropPickup(n.x, n.y - 5, f.res, 1, collector);
    g.burst(n.x, n.y - 6, 8, [RES_INFO[f.res].color, '#fff'], 60, 0.6, 1.5, 4);
  }
  if (n.hp <= 0) {
    g.world.depleted.set(n.key, g.time);
    g.stats.harvested++;
    g.dropPickup(n.x, n.y - 5, n.res, Math.ceil(2 * n.size * comfortMul), collector);
    g.burst(n.x, n.y - 5, 16, [...chip, '#fff'], 80, 0.7, 1.8, 0, 60);
    g.part(n.x, n.y - 4, 0, 0, 0.35, 14, 'rgba(255,255,255,0.8)', 3, 0, 0);
    g.shake(1.2);
    sfx('pop', 0.9);
    if (g.forageTarget === n) g.forageTarget = null;
  }
}

export function dropPickup(g: Game, x: number, y: number, kind: Res | 'coins', amt: number, home: 'v' | 'a' | null, town = false) {
  const pieces = Math.min(amt, kind === 'coins' ? 4 : 3);
  let left = amt;
  for (let i = 0; i < pieces; i++) {
    const a = i === pieces - 1 ? left : Math.floor(amt / pieces);
    left -= a;
    const ang = Math.random() * TAU, sp = 30 + Math.random() * 50;
    g.pickups.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30, kind, amt: a, age: 0, home, town: town || undefined });
  }
}

export function updateHarvest(g: Game, dt: number) {
  if (g.v.disabledT > 0) return;
  for (const h of g.harvs) {
    const hv = h.def.harvest!;
    h.cd -= dt * hv.rate;
    if (h.cd > 0) continue;
    const p = g.cellLocal(h.idx);
    const w = g.toWorld(p.x, p.y);
    let best: ResNode | null = null, bs = Infinity;
    for (const n of g.nearNodes) {
      if (n.hp <= 0) continue;
      const d = Math.hypot(n.x - w.x, n.y - w.y);
      if (d > h.range) continue;
      const bias = foragePriority(g, n.res);
      if (bias === null) continue;
      const pref = hv.bonus?.includes(n.res) ? -14 : 0;
      const score = d + pref + bias;
      if (score < bs) { bs = score; best = n; }
    }
    if (best) {
      h.cd = 1;
      const bonus = hv.bonus?.includes(best.res) ? hv.bonusMul ?? 1 : 1;
      g.hitNode(best, hv.power * (bonus > 1 ? 2 : 1), bonus, 'v', w.x, w.y, hv.find);
    } else h.cd = 0.25;
  }
}

export function updateProcess(g: Game, dt: number) {
  for (const p of g.procs) {
    p.t += dt * p.rate;
    const pr = p.def.process!;
    if (p.t < pr.every) continue;
    p.t = 0;
    if (!g.canAfford(pr.input)) continue;
    g.pay(pr.input);
    const lp = g.cellLocal(p.idx);
    const w = g.toWorld(lp.x, lp.y);
    for (const k in pr.output) { const r = k as Res; g.addRes(r, pr.output[r]!); g.gainPopup(w.x, w.y - 8, r, pr.output[r]!); }
    g.burst(w.x, w.y, 5, ['#ffd166', '#fff'], 25, 0.5);
  }
}

export function updatePickups(g: Game, dt: number) {
  const v = g.v, a = g.av;
  for (let i = g.pickups.length - 1; i >= 0; i--) {
    const p = g.pickups[i];
    p.age += dt;
    if (p.age > 70) { g.pickups.splice(i, 1); continue; }
    if (!p.home && p.age > 0.4) {
      if (Math.hypot(p.x - v.x, p.y - v.y) < g.st.magnet) p.home = 'v';
      else if (!a.inside && Math.hypot(p.x - a.x, p.y - a.y) < 45) p.home = 'a';
    }
    if (p.home === 'a' && a.inside) p.home = 'v';
    if (p.home && p.age > 0.3) {
      const tx = p.home === 'v' ? v.x : a.x, ty = p.home === 'v' ? v.y : a.y - 5;
      const dx = tx - p.x, dy = ty - p.y, d = Math.max(0.01, Math.hypot(dx, dy));
      const acc = 900 + p.age * 600;
      p.vx += (dx / d) * acc * dt; p.vy += (dy / d) * acc * dt;
      p.vx *= 1 - Math.min(1, dt * 5); p.vy *= 1 - Math.min(1, dt * 5);
      if (d < 7) { collect(g, p, tx, ty); g.pickups.splice(i, 1); continue; }
    } else { p.vx *= 1 - Math.min(1, dt * 4); p.vy *= 1 - Math.min(1, dt * 4); }
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
}

export function collect(g: Game, p: Pickup, x: number, y: number) {
  if (p.kind === 'coins') {
    g.coins += p.amt; g.stats.earned += p.amt;
    g.burst(x, y, 4, ['#ffd166', '#fff3b0'], 40, 0.35, 1.2, 4);
    sfx('coin', 1 + Math.random() * 0.2);
  } else {
    const room = collectionRoom(g, p.kind);
    if (room <= 0) { g.popup(x, y - 10, 'LIMIT', '#ffb347'); return; }
    const add = Math.min(p.amt, room, g.cargoFree());
    if (add <= 0) { g.popup(x, y - 10, 'FULL', '#ff8a80'); return; }
    g.addRes(p.kind, add);
    const tier = RES_INFO[p.kind].tier;
    g.burst(x, y, tier === 'rare' || tier === 'epic' ? 14 : 3, [RES_INFO[p.kind].color, '#fff'], tier === 'epic' ? 90 : 35, 0.5, 1.4, tier === 'common' ? 0 : 4);
    if (tier === 'epic') g.shake(2);
    sfx('pick', 0.9 + Math.random() * 0.3);
  }
  g.gainPopup(x, y, p.kind, p.amt);
}
