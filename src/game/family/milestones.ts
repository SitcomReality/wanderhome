// Milestone progress (statValue), auto-claiming tiers and Scrapbook completion rewards.
import { BIOMES, BOOK_CATS, BOOK_REWARDS, MILESTONES, RES_INFO, StatKey } from '../../content';
import type { Game } from '../engine';
import { grant } from './bonuses';
import { bookCount, meta, saveMeta, totalPerkRanks } from './meta';
import { bookSteps } from './scrapbook';
import { awayEvent, toast } from './toasts';

// ------------------------------------------------------------ milestones
export const TIER_NAMES = ['Bronze', 'Silver', 'Gold'];

export const TIER_COLORS = ['#e0a070', '#d8dee6', '#ffd166'];

export function statValue(g: Game, key: StatKey): number {
  const L = meta.lifetime, s = g.stats;
  switch (key) {
    case 'distance': return L.distance + s.distance;
    case 'farthest': return Math.max(L.farthest, g.distTiles());
    case 'playHours': return (L.playTime + s.playTime) / 3600;
    case 'days': return (L.playTime + s.playTime) / 480;
    case 'comfort': return Math.max(L.comfortMax, g.comfort);
    case 'cells': return Math.max(L.cellsMax, g.gridW * g.gridH);
    case 'blueprints': return bookCount('blueprints');
    case 'netWorth': return Math.max(L.netWorthMax, g.netWorth());
    case 'breakdowns': return L.breakdowns + s.breakdowns;
    case 'harvested': return L.harvested + s.harvested;
    case 'earned': return L.earned + s.earned;
    case 'resources': return bookCount('resources');
    case 'rare': return Object.keys(meta.book.resources).filter((r) => RES_INFO[r] && (RES_INFO[r].tier === 'rare' || RES_INFO[r].tier === 'epic')).length;
    case 'kills': return L.kills + s.kills;
    case 'species': return bookCount('critters');
    case 'towns': return bookCount('towns');
    case 'bought': return L.bought;
    case 'biomes': return bookCount('biomes');
    case 'allBiomes': return BIOMES.every((b) => meta.book.biomes[b.id]) ? 1 : 0;
    case 'postcards': return meta.postcards.length;
    case 'landmarks': return L.landmarks + (s.landmarks ?? 0);
    case 'landmarkKinds': return bookCount('landmarks');
    case 'retirements': return L.retirements;
    case 'sparks': return meta.sparksEarned;
    case 'perks': return totalPerkRanks();
    case 'awayHours': return L.awayMax / 3600;
    case 'visitors': return L.visitors;
    case 'cat': return meta.cat ? 1 : 0;
    case 'coffees': return L.coffees;
  }
}

export function milestoneTotals() {
  let got = 0, all = 0;
  for (const m of MILESTONES) { all += m.tiers.length; got += Math.min(m.tiers.length, meta.milestones[m.id] ?? 0); }
  return { got, all, pct: all ? (got / all) * 100 : 0 };
}

export function checkMilestones(g: Game) {
  let changed = false;
  for (const m of MILESTONES) {
    let tier = meta.milestones[m.id] ?? 0;
    if (tier >= m.tiers.length) continue;
    const v = statValue(g, m.stat);
    while (tier < m.tiers.length && v >= m.tiers[tier]) {
      const rw = grant(g, m.rewards[tier] ?? {});
      tier++;
      meta.milestones[m.id] = tier;
      const label = `${m.name}${m.tiers.length > 1 ? ` · ${TIER_NAMES[tier - 1]}` : ''}`;
      toast(g, m.icon, `Milestone: ${label}`, rw.join('  ·  ') || m.desc, m.tiers.length > 1 ? TIER_COLORS[tier - 1] : '#ffd166');
      g.addLog(`🏅 Milestone: ${label}${rw.length ? ` (${rw.join(', ')})` : ''}`, '#ffd166');
      awayEvent(g, `🏅 ${label}`);
      changed = true;
    }
  }
  for (const c of BOOK_CATS) {
    let claimed = meta.bookRewards[c.id] ?? 0;
    const steps = bookSteps(c.id);
    while (claimed < steps) {
      const rw = grant(g, BOOK_REWARDS[c.id][claimed]);
      claimed++;
      meta.bookRewards[c.id] = claimed;
      toast(g, c.icon, `Scrapbook: ${c.name} ${claimed * 25}%`, rw.join('  ·  '), '#ffc8dd');
      g.addLog(`📖 Scrapbook ${c.name} ${claimed * 25}% complete! ${rw.join(', ')}`, '#ffc8dd');
      changed = true;
    }
  }
  if (changed) { g.computeStats(); saveMeta(); }
}
