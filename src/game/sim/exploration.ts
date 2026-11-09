// Landmarks: idle curiosity detours and visiting (rewards, buffs, rumours, map reveals).
import type { Game } from '../engine';
import { describeBuff } from '../../content/index';
import { onDiscover } from '../family/index';
import { sfx } from '../sfx';
import { Landmark } from '../world/world';

/** Idle curiosity: drift towards a nearby unvisited landmark. */
export function curious(g: Game) {
  g.curTarget = null;
  if (g.mode === 'heading') return false;
  let best: Landmark | null = null, bd = 300;
  for (const lm of g.nearLandmarks) {
    if (g.visited[lm.key]) continue;
    const bl = g.nodeBlacklist.get('lm:' + lm.key);
    if (bl !== undefined && g.time - bl < 300) continue;
    const d = Math.hypot(lm.x - g.v.x, lm.y - g.v.y);
    if (d < bd && g.terrMult(lm.x, lm.y) > 0) { bd = d; best = lm; }
  }
  if (best) g.curTarget = { x: best.x, y: best.y, key: 'lm:' + best.key };
  return !!best;
}

export function updateLandmarks(g: Game, dt: number) {
  g.lmT -= dt;
  if (g.lmT <= 0) { g.lmT = 1.5; g.nearLandmarks = g.world.landmarksNear(g.v.x, g.v.y, 1000); }
  for (const lm of g.nearLandmarks) {
    const byHouse = Math.hypot(lm.x - g.v.x, lm.y - g.v.y) < lm.def.radius + Math.max(g.hw, g.hh);
    const byFoot = !g.av.inside && Math.hypot(lm.x - g.av.x, lm.y - g.av.y) < lm.def.radius + 4;
    if (byHouse || byFoot) g.visitLandmark(lm, byFoot && !byHouse ? 'a' : 'v');
  }
}

export function visitLandmark(g: Game, lm: Landmark, who: 'v' | 'a') {
  const d = lm.def;
  const prev = g.visited[lm.key];
  if (prev && (!d.repeat || g.time - prev.t < d.repeat)) return;
  const first = !prev;
  g.visited[lm.key] = { t: g.time, x: lm.x, y: lm.y, id: d.id };
  if (first) g.stats.landmarks++;
  onDiscover(g, 'landmarks', d.id, { name: d.name, biome: lm.biome });
  const rnd = (r: [number, number]) => Math.round(r[0] + Math.random() * (r[1] - r[0]));
  g.addLog(`${first ? '✨' : '↺'} ${d.name}: ${d.lines[(Math.random() * d.lines.length) | 0]}`, '#ffe8a3');
  g.popup(lm.x, lm.y - 30, d.name, '#ffe8a3', true);
  g.burst(lm.x, lm.y - 10, 30, [...(d.colors ?? []), '#fff', '#ffd166', '#7fd1e8'], 110, 1, 1.6, 4, 40);
  g.part(lm.x, lm.y - 8, 0, 0, 0.6, 40, 'rgba(255,240,200,0.8)', 3, 0, 0);
  g.shake(2); sfx('buy');
  if (first && d.reward) {
    if (d.reward.coins) g.dropPickup(lm.x, lm.y - 6, 'coins', Math.round(rnd(d.reward.coins) * g.difficulty(lm.x, lm.y)), who);
    for (const r in d.reward.res ?? {}) { const n = rnd(d.reward.res![r]); if (n > 0) g.dropPickup(lm.x, lm.y - 6, r, n, who); }
  }
  if (d.buff) { g.addBuff(d.buff); g.addLog(`${d.buff.icon} ${d.buff.name}: ${describeBuff(d.buff)} for ${Math.round(d.buff.duration / 60)} min.`, '#7fd1e8'); }
  if (d.rumor) g.makeRumor(lm);
  if (d.reveal) {
    let n = 0;
    for (const t of g.world.townsNear(lm.x, lm.y, d.reveal)) if (!g.towns[t.key]) { g.recordKnown(t); n++; }
    if (n) g.addLog(`🗺️ You spot ${n} distant town${n > 1 ? 's' : ''}. Added to your journal.`, '#ffd166');
  }
}
