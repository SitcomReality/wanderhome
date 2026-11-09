// Workshop actions: installing / moving / scrapping parts, building locomotion & frames, expanding the chassis.
import type { Game } from '../engine';
import { FRAME, GRID_MAX_H, GRID_MAX_W, LOCO, MOD, expandCost } from '../../content/index';
import { sfx } from '../sfx';
import { completeGoal } from './plan';

export function placeModule(g: Game, idx: number, id: string) {
  const d = MOD[id];
  if (!d || g.grid[idx] || !g.known.includes(id) || !g.canAfford(d.cost)) return false;
  g.pay(d.cost);
  g.grid[idx] = id;
  g.computeStats();
  sfx('buy');
  completeGoal(g, 'module', id);
  return true;
}

export function removeModule(g: Game, idx: number) {
  const id = g.grid[idx];
  if (!id || id === 'cockpit') return;
  g.refund(MOD[id].cost, 0.5);
  g.grid[idx] = null;
  g.computeStats();
  sfx('pop', 0.7);
}

export function moveModule(g: Game, from: number, to: number) {
  const a = g.grid[from], b = g.grid[to];
  g.grid[to] = a; g.grid[from] = b;
  g.computeStats();
}

export function buildLoco(g: Game, id: string) {
  const L = LOCO[id];
  if (g.ownedLocos.includes(id)) { g.loco = id; g.computeStats(); completeGoal(g, 'loco', id); return true; }
  if (!g.known.includes(id) || !g.canAfford(L.cost)) return false;
  g.pay(L.cost); g.ownedLocos.push(id); g.loco = id; g.computeStats();
  sfx('buy'); g.addLog(`New locomotion: ${L.name}!`, '#2ecc71');
  completeGoal(g, 'loco', id);
  return true;
}

export function buildFrame(g: Game, id: string) {
  const F = FRAME[id];
  if (g.ownedFrames.includes(id)) { g.frame = id; g.computeStats(); completeGoal(g, 'frame', id); return true; }
  if (!g.known.includes(id) || !g.canAfford(F.cost)) return false;
  g.pay(F.cost); g.ownedFrames.push(id); g.frame = id; g.computeStats();
  sfx('buy'); g.addLog(`Rebuilt the chassis as a ${F.name}!`, '#2ecc71');
  completeGoal(g, 'frame', id);
  return true;
}

export function expand(g: Game, dir: 'w' | 'h') {
  if (dir === 'w' && g.gridW >= GRID_MAX_W) return false;
  if (dir === 'h' && g.gridH >= GRID_MAX_H) return false;
  const c = expandCost(g.gridW, g.gridH);
  if (!g.canAfford(c)) return false;
  g.pay(c);
  if (dir === 'w') {
    for (let y = 0; y < GRID_MAX_H; y++) for (let x = GRID_MAX_W - 1; x > 0; x--) g.grid[g.cellIndex(x, y)] = g.grid[g.cellIndex(x - 1, y)];
    for (let y = 0; y < GRID_MAX_H; y++) g.grid[g.cellIndex(0, y)] = null;
    g.gridW++;
  } else g.gridH++;
  g.computeStats();
  sfx('buy');
  g.addLog(`Chassis expanded to ${g.gridW}×${g.gridH}!`, '#2ecc71');
  completeGoal(g, 'expand');
  return true;
}
