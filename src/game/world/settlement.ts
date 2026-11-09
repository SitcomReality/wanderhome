// Deterministic settlement layout: houses, workplaces and social spots shared by town art and residents.
import type { Game } from '../engine';
import { BIOME } from '../../content/index';
import { Town } from './world';

export interface SettlementPlan {
  townKey: string;
  center: { x: number; y: number };
  houses: { x: number; y: number }[];
  workshop: { x: number; y: number };
  well: { x: number; y: number };
  green: { x: number; y: number };
  field: { x: number; y: number };
  wild: { x: number; y: number };
  gate: { x: number; y: number };
  watch: { x: number; y: number };
}

/** The six house positions drawn by townArt.ts, in draw order. */
export const TOWN_HOUSE_OFFSETS = [[-24, -10], [18, -14], [-14, 12], [22, 10], [-30, 6], [4, -20]] as const;

/** How many of those houses this town actually shows (3–6). Keep townArt and the plan in step. */
export function townHouseCount(t: Town) {
  return 3 + Math.floor(((t.seedv * 997 * 10) % 1) * 4);
}

function landAt(g: Game, x: number, y: number) {
  const b = BIOME[g.world.terrainAt(x, y)];
  return !!b && b.band !== 'deep' && b.band !== 'shallow' && !b.noWalk;
}

function pickLand(g: Game, t: Town, offsets: readonly (readonly [number, number])[], fallback: { x: number; y: number }) {
  for (const [ox, oy] of offsets) {
    const x = t.x + ox, y = t.y + oy;
    if (landAt(g, x, y)) return { x, y };
  }
  return fallback;
}

/**
 * First slice: one plan per town, cached by the Game. It is deliberately data-light:
 * a few anchors are enough for residents to look like they have somewhere to be.
 */
export function planSettlement(g: Game, t: Town): SettlementPlan {
  const count = townHouseCount(t);
  const houses = TOWN_HOUSE_OFFSETS.slice(0, count).map(([ox, oy]) => ({ x: t.x + ox, y: t.y + oy }));
  const center = { x: t.x, y: t.y };
  const workshop = houses[1] ?? { x: t.x + 18, y: t.y - 14 };
  const well = pickLand(g, t, [[10, 8], [10, -8], [-10, 8], [0, 14]], { x: t.x + 10, y: t.y + 8 });
  const green = pickLand(g, t, [[0, 26], [0, -26], [26, 0], [-26, 0]], { x: t.x, y: t.y + 26 });
  const field = pickLand(g, t, [[52, 18], [-52, 20], [54, -20], [-54, -18], [42, 36], [-42, -34]], { x: t.x + 42, y: t.y });
  const wild = pickLand(g, t, [[64, -26], [-64, 26], [48, 42], [-48, -42], [0, 66]], field);
  const gate = pickLand(g, t, [[0, 42], [42, 0], [-42, 0], [0, -42]], { x: t.x, y: t.y + 42 });
  return {
    townKey: t.key, center, houses, workshop, well, green, field, wild, gate,
    watch: { x: t.x - 34, y: t.y + 4 },
  };
}
