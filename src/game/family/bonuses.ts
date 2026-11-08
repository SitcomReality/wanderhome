// Permanent modifiers from legacy perks / milestone bonuses / crew, and reward granting.
import { BonusKind, BookReward, BuffStat, COSMETICS, MilestoneReward } from '../../content';
import type { Game } from '../engine';
import { meta, perkVal, unlockCosmetic } from './meta';

// ------------------------------------------------------------ permanent modifiers
/** Extra multiplier from legacy perks, milestone bonuses and crew for a buff stat. */
export function permMul(g: Game, stat: BuffStat) {
  let m = 1;
  if (stat === 'yield') m *= 1 + perkVal('yield');
  else if (stat === 'speed') m *= 1 + perkVal('speed');
  else if (stat === 'luck') m *= 1 + perkVal('luck');
  if (g.crew && g.crew.stat === stat && g.time < g.crew.until) m *= g.crew.mult;
  return m;
}

export const extraCargo = () => perkVal('cargo');

export const extraComfort = () => perkVal('comfort') + (meta.cat ? 2 : 0);

export const offlineCapSec = () => (8 + perkVal('offlineCap')) * 3600;

export function offlineMult(g: Game) {
  const b = perkVal('offlineMul');
  const m = Math.min(0.7 + b, 0.25 + g.comfort * 0.03 + b);
  return Number.isFinite(m) ? Math.max(0, m) : 0.25;
}

export function noteAway(g: Game, secs: number) {
  meta.lifetime.awayMax = Math.max(meta.lifetime.awayMax, secs);
  g.visitorT = Math.min(g.visitorT, 10);
}

export function bonusLabel(kind: BonusKind, amt: number) {
  switch (kind) {
    case 'yield': return `+${Math.round(amt * 100)}% yield`;
    case 'speed': return `+${Math.round(amt * 100)}% speed`;
    case 'comfort': return `+${amt} comfort`;
    case 'luck': return `+${Math.round(amt * 100)}% rare finds`;
    case 'cargo': return `+${amt} cargo`;
    case 'offlineCap': return `+${amt}h away cap`;
    case 'offlineMul': return `+${Math.round(amt * 100)}% away earnings`;
  }
}

export function rewardText(r: MilestoneReward | BookReward): string[] {
  const out: string[] = [];
  if (r.coins) out.push(`+${r.coins} 🪙`);
  if (r.sparks) out.push(`+${r.sparks} ✨`);
  if (r.cosmetic) out.push(`🎨 ${COSMETICS.find((c) => c.id === r.cosmetic)?.name ?? r.cosmetic}`);
  if ('bonus' in r && r.bonus) out.push(`♾️ ${bonusLabel(r.bonus.kind, r.bonus.amt)}`);
  return out;
}

export function grant(g: Game, r: MilestoneReward | BookReward) {
  if (r.coins) { g.coins += r.coins; g.burst(g.v.x, g.v.y - 10, 20, ['#ffd166', '#fff3b0'], 90, 0.8, 1.6, 4, 60); }
  if (r.sparks) { meta.sparks += r.sparks; meta.sparksEarned += r.sparks; }
  if (r.cosmetic) unlockCosmetic(r.cosmetic);
  if ('bonus' in r && r.bonus) meta.bonus[r.bonus.kind] = (meta.bonus[r.bonus.kind] ?? 0) + r.bonus.amt;
  return rewardText(r);
}
