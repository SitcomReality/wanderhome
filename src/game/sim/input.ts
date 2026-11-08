// Player input: keys, clicks, honk/swing, manual driving, waypoints and zoom.
import type { Game } from '../engine';
import { sfx } from '../sfx';
import { ResNode } from '../world/world';
import { resetNav } from './navigation';

export function keyDown(g: Game, k: string) {
  k = k.toLowerCase();
  g.lastInput = g.time;
  if (g.av.returning) { g.av.returning = false; g.av.hasTarget = false; g.av.enterOnArrive = false; }
  if (k === 'e') {
    if (g.av.inside) g.exitVehicle();
    else if (Math.hypot(g.av.x - g.v.x, g.av.y - g.v.y) < 50) g.enterVehicle();
    else g.addLog("Too far from the house. Walk closer (or wait, and you'll wander home).", '#7fd1e8');
    return;
  }
  if (k === 't') { g.toggleManual(); return; }
  if (k === ' ') { g.action(); return; }
  g.keys.add(k);
}

export function keyUp(g: Game, k: string) { g.keys.delete(k.toLowerCase()); }

export function toggleManual(g: Game) {
  if (!g.av.inside) { g.addLog('Get back in the house to drive!', '#7fd1e8'); return; }
  g.manual = !g.manual;
  g.waypoint = null; g.tradeRun = null;
  g.addLog(g.manual ? '🕹️ You took the wheel. (WASD to drive, +25% speed, T to release)' : 'Autopilot engaged.', '#7fd1e8');
}

export function action(g: Game) {
  g.lastInput = g.time;
  const a = g.av;
  if (a.inside) {
    if (a.swingCd > 0) return;
    a.swingCd = 4;
    g.part(g.v.x, g.v.y, 0, 0, 0.5, 70, 'rgba(255,255,255,0.7)', 3, 0, 0);
    for (const m of [...g.mobs]) {
      const d = Math.hypot(m.x - g.v.x, m.y - g.v.y);
      if (d < 80) { const ang = Math.atan2(m.y - g.v.y, m.x - g.v.x); m.vx = Math.cos(ang) * 220; m.vy = Math.sin(ang) * 220; m.fleeT = 1.5; g.damageMob(m, 4); }
    }
    g.popup(g.v.x, g.v.y - g.hh - 8, 'HONK!', '#ffd166', true);
    g.shake(3); sfx('zap', 0.5);
    return;
  }
  if (a.swingCd > 0) return;
  a.swingCd = 0.3;
  let hitSomething = false;
  for (const m of [...g.mobs]) if (Math.hypot(m.x - a.x, m.y - a.y + 4) < 24) { const ang = Math.atan2(m.y - a.y, m.x - a.x); m.vx = Math.cos(ang) * 150; m.vy = Math.sin(ang) * 150; hitSomething = true; g.damageMob(m, 8); }
  let best: ResNode | null = null, bd = 28;
  for (const n of g.nearNodes) { if (n.hp <= 0) continue; const d = Math.hypot(n.x - a.x, n.y - a.y); if (d < bd) { bd = d; best = n; } }
  if (best) { g.hitNode(best, 2, 2, 'a', a.x, a.y - 5); hitSomething = true; }
  g.part(a.x + Math.cos(a.facing) * 6, a.y - 4 + Math.sin(a.facing) * 6, 0, 0, 0.15, 8, 'rgba(255,255,255,0.8)', 3, 0, 0);
  if (hitSomething) g.shake(1);
}

export function click(g: Game, sx: number, sy: number, W: number, H: number) {
  g.lastInput = g.time;
  const wx = (sx - W / 2) / g.cam.zoom + g.cam.x, wy = (sy - H / 2) / g.cam.zoom + g.cam.y;
  const lp = g.toLocal(wx, wy);
  if (g.av.inside) {
    if (Math.abs(lp.x) < g.hw + 2 && Math.abs(lp.y) < g.hh + 2) { g.exitVehicle(); return; }
    g.setWaypoint(wx, wy);
  } else {
    g.av.tx = wx; g.av.ty = wy; g.av.hasTarget = true; g.av.returning = false;
    g.av.enterOnArrive = Math.abs(lp.x) < g.hw + 4 && Math.abs(lp.y) < g.hh + 4;
    g.burst(wx, wy, 4, ['#fff'], 20, 0.3, 1);
  }
}

export function setWaypoint(g: Game, wx: number, wy: number) {
  g.waypoint = { x: wx, y: wy }; g.manual = false; g.tradeRun = null;
  resetNav(g, '');
  g.burst(wx, wy, 8, ['#7fd1e8', '#fff'], 40, 0.5, 1.4);
}

export function zoomBy(g: Game, d: number) {
  const steps = [1.5, 2, 2.5, 3, 4, 5];
  let i = steps.findIndex((s) => s >= g.cam.zoom - 0.01);
  i = Math.max(0, Math.min(steps.length - 1, i + d));
  g.cam.zoom = steps[i];
}
