// The little wanderer: walking inside the house, stepping out, harvesting & slingshot on foot, wandering home when idle.
import type { Game } from '../engine';
import { Mob } from '../core/types';
import { BIOME } from '../../content/index';
import { sfx } from '../sfx';
import { ResNode } from '../world/world';

export function inputVec(g: Game) {
  const k = g.keys;
  let x = 0, y = 0;
  if (k.has('w') || k.has('arrowup')) y -= 1;
  if (k.has('s') || k.has('arrowdown')) y += 1;
  if (k.has('a') || k.has('arrowleft')) x -= 1;
  if (k.has('d') || k.has('arrowright')) x += 1;
  const l = Math.hypot(x, y);
  return l ? { x: x / l, y: y / l } : { x: 0, y: 0 };
}

export function updateAvatar(g: Game, dt: number) {
  const a = g.av;
  a.flash = Math.max(0, a.flash - dt);
  a.exitCd = Math.max(0, a.exitCd - dt);
  a.swingCd = Math.max(0, a.swingCd - dt);
  if (a.stunT > 0) a.stunT -= dt;
  if (a.inside) {
    a.hp = Math.min(a.maxHp, a.hp + 3 * dt);
    const bx = g.hw - 2.5, by = g.hh - 2.5;
    if (g.manual) {
      const p = g.cellLocal(g.grid.findIndex((gx) => gx === 'cockpit'));
      a.lx += (p.x - a.lx) * Math.min(1, dt * 5); a.ly += (p.y - a.ly) * Math.min(1, dt * 5);
      return;
    }
    const iv = inputVec(g);
    if (iv.x || iv.y) {
      const c = Math.cos(-g.v.angle), s = Math.sin(-g.v.angle);
      a.lx += (iv.x * c - iv.y * s) * 22 * dt; a.ly += (iv.x * s + iv.y * c) * 22 * dt;
      a.walk += dt * 14;
      a.facing = Math.atan2(iv.y, iv.x);
      if (Math.abs(a.lx) > bx + 3 || Math.abs(a.ly) > by + 3) g.exitVehicle();
      return;
    }
    a.idleT -= dt;
    if (a.idleT <= 0) {
      a.idleT = 3 + Math.random() * 5;
      const p = g.cellLocal(g.cellIndex((Math.random() * g.gridW) | 0, (Math.random() * g.gridH) | 0));
      a.tx = p.x; a.ty = p.y;
    }
    const dx = a.tx - a.lx, dy = a.ty - a.ly, d = Math.hypot(dx, dy);
    if (d > 0.5) { a.lx += (dx / d) * 8 * dt; a.ly += (dy / d) * 8 * dt; a.walk += dt * 8; a.facing = Math.atan2(dy, dx) + g.v.angle; }
    a.lx = Math.max(-bx, Math.min(bx, a.lx)); a.ly = Math.max(-by, Math.min(by, a.ly));
    return;
  }
  a.hp = Math.min(a.maxHp, a.hp + 0.5 * dt);
  if (a.stunT > 0) return;
  let iv = inputVec(g);
  if (g.time - g.lastInput > 25 && !a.returning) { a.returning = true; g.addLog('Your wanderer yawns and heads home…', '#7fd1e8'); }
  if (a.returning) { a.tx = g.v.x; a.ty = g.v.y; a.hasTarget = true; a.enterOnArrive = true; }
  if (!iv.x && !iv.y && a.hasTarget) {
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d < 3) a.hasTarget = false; else iv = { x: dx / d, y: dy / d };
  }
  if (iv.x || iv.y) {
    const sp = 52 * (BIOME[g.world.terrainAt(a.x, a.y)]?.walk ?? 1);
    const nx = a.x + iv.x * sp * dt, ny = a.y + iv.y * sp * dt;
    if (!BIOME[g.world.terrainAt(nx, ny)]?.noWalk || a.returning) { a.x = nx; a.y = ny; }
    a.walk += dt * 16;
    a.facing = Math.atan2(iv.y, iv.x);
  }
  const lp = g.toLocal(a.x, a.y);
  if (a.exitCd <= 0 && Math.abs(lp.x) < g.hw + 1 && Math.abs(lp.y) < g.hh + 1 && (a.enterOnArrive || iv.x || iv.y)) g.enterVehicle();
  a.harvCd -= dt;
  if (a.harvCd <= 0) {
    let best: ResNode | null = null, bd = 22;
    for (const n of g.nearNodes) { if (n.hp <= 0) continue; const d = Math.hypot(n.x - a.x, n.y - a.y); if (d < bd) { bd = d; best = n; } }
    if (best) { a.harvCd = 0.33; g.hitNode(best, 1, 2, 'a', a.x, a.y - 5); } else a.harvCd = 0.1;
  }
  a.slingCd -= dt;
  if (a.slingCd <= 0) {
    let best: Mob | null = null, bd = 90;
    for (const m of g.mobs) { const d = Math.hypot(m.x - a.x, m.y - a.y); if (d < bd) { bd = d; best = m; } }
    if (best) {
      a.slingCd = 0.55;
      const ang = Math.atan2(best.y - a.y, best.x - a.x);
      g.projectiles.push({ kind: 'pebble', x: a.x, y: a.y - 5, vx: Math.cos(ang) * 220, vy: Math.sin(ang) * 220, dmg: 5, life: 0.6, target: null });
    } else a.slingCd = 0.2;
  }
}

export function exitVehicle(g: Game) {
  const a = g.av;
  if (!a.inside || g.v.disabledT > 0) return;
  const side = a.ly >= 0 ? 1 : -1;
  const p = g.toWorld(Math.max(-g.hw, Math.min(g.hw, a.lx)), side * (g.hh + 7));
  a.x = p.x; a.y = p.y; a.inside = false; a.exitCd = 0.9; a.hasTarget = false; a.enterOnArrive = false; a.returning = false;
  g.manual = false;
  g.burst(p.x, p.y, 6, ['#fff', '#ffd166'], 30, 0.4);
  g.addLog('Stepped outside. The house waits for you. (Autopilot paused)', '#ffd166');
}

export function enterVehicle(g: Game) {
  const a = g.av;
  if (a.inside) return;
  const lp = g.toLocal(a.x, a.y);
  a.lx = Math.max(-g.hw + 2.5, Math.min(g.hw - 2.5, lp.x)); a.ly = Math.max(-g.hh + 2.5, Math.min(g.hh - 2.5, lp.y));
  a.inside = true; a.returning = false; a.hasTarget = false; a.enterOnArrive = false; a.idleT = 1;
  g.burst(a.x, a.y, 8, ['#fff', '#7fd1e8'], 30, 0.4);
  sfx('pop', 1.2);
}
