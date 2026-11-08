// Once-a-second family bookkeeping: biome discovery, lifetime records, crew, milestones, visitors.
import type { Game } from '../engine';
import { meta } from './meta';
import { checkMilestones } from './milestones';
import { onDiscover } from './scrapbook';
import { visitorTick } from './visitors';

export interface Transient { t1: number; t2: number; lastBiome: string }

export const TR = new WeakMap<Game, Transient>();

export const tr = (g: Game) => { let s = TR.get(g); if (!s) { s = { t1: 0, t2: 0, lastBiome: '' }; TR.set(g, s); } return s; };

// ------------------------------------------------------------ the tick
export function legacyTick(g: Game, dt: number) {
  const s = tr(g);
  s.t1 += dt;
  if (s.t1 >= 1) {
    s.t1 -= 1;
    const t = g.world.terrainAt(g.v.x, g.v.y);
    g.biomeTime[t] = (g.biomeTime[t] ?? 0) + 1;
    if (t !== s.lastBiome) {
      s.lastBiome = t;
      if (!g.runBiomes.includes(t)) g.runBiomes.push(t);
      onDiscover(g, 'biomes', t);
    }
    const L = meta.lifetime;
    L.farthest = Math.max(L.farthest, g.distTiles());
    L.comfortMax = Math.max(L.comfortMax, g.comfort);
    L.cellsMax = Math.max(L.cellsMax, g.gridW * g.gridH);
    L.netWorthMax = Math.max(L.netWorthMax, g.netWorth());
    if (g.crew && g.time > g.crew.until) {
      g.addLog(`📓 ${g.crew.name} hopped off. ${g.crew.line}`, '#e0c8ff');
      meta.guestbook.unshift({ date: Date.now(), gen: meta.generation, icon: '🎒', text: g.crew.line });
      g.crew = null;
    }
  }
  s.t2 += dt;
  if (s.t2 >= 2) { s.t2 = 0; checkMilestones(g); }
  visitorTick(g, dt);
}
