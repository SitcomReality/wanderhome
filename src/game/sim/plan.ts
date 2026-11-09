// Supplies planning: the build the house is gathering for, collection limits, and the
// sell-floor that keeps plan materials from being auto-sold. Costs are always derived
// from content so a balance change cannot leave a stale plan behind.
import type { Game } from '../engine';
import { Cost, FRAME, GRID_MAX_H, GRID_MAX_W, LOCO, MOD, RES_INFO, RES_LIST, Res, expandCost } from '../../content/index';
import type { BuildGoal, BuildGoalKind } from '../core/types';

export type PlanNeeds = Partial<Record<Res, number>>;
export interface GoalEntry { r: Res; need: number; have: number }

function costFor(g: Game, goal: BuildGoal): Cost | null {
  if (goal.kind === 'module') return MOD[goal.id]?.cost ?? null;
  if (goal.kind === 'frame') return FRAME[goal.id]?.cost ?? null;
  if (goal.kind === 'loco') return LOCO[goal.id]?.cost ?? null;
  if (goal.kind === 'expand') return g.gridW < GRID_MAX_W || g.gridH < GRID_MAX_H ? expandCost(g.gridW, g.gridH) : null;
  return null;
}

export function validGoal(g: Game, goal: unknown): goal is BuildGoal {
  if (!goal || typeof goal !== 'object') return false;
  const x = goal as Partial<BuildGoal>;
  if (typeof x.id !== 'string') return false;
  if (x.kind === 'module') return !!MOD[x.id];
  if (x.kind === 'frame') return !!FRAME[x.id];
  if (x.kind === 'loco') return !!LOCO[x.id];
  if (x.kind === 'expand') return x.id === 'next' && (g.gridW < GRID_MAX_W || g.gridH < GRID_MAX_H);
  return false;
}

/** Cost of the active plan, or null when there is no plan (or it is no longer buildable). */
export function goalCost(g: Game): Cost | null {
  return g.goal ? costFor(g, g.goal) : null;
}

export function goalLabel(g: Game): string {
  const goal = g.goal;
  if (!goal) return '';
  if (goal.kind === 'module') return `Build ${MOD[goal.id]?.name ?? 'part'}`;
  if (goal.kind === 'frame') return `Rebuild as ${FRAME[goal.id]?.name ?? 'a new frame'}`;
  if (goal.kind === 'loco') return `Fit ${LOCO[goal.id]?.name ?? 'new locomotion'}`;
  return `Chassis expansion (${g.gridW}×${g.gridH})`;
}

/** Direct resources in the plan, with the total amount the house wants to hold. */
export function planDirect(g: Game): PlanNeeds {
  const cost = goalCost(g);
  const out: PlanNeeds = {};
  if (!cost) return out;
  for (const r of RES_LIST) {
    const n = Math.ceil(cost[r] ?? 0);
    if (n > 0) out[r] = n;
  }
  return out;
}

export function goalEntries(g: Game): GoalEntry[] {
  const direct = planDirect(g);
  return RES_LIST.filter((r) => (direct[r] ?? 0) > 0).map((r) => ({ r, need: direct[r]!, have: Math.floor(g.res[r]) }));
}

export function goalCoins(g: Game): number {
  return Math.ceil(goalCost(g)?.coins ?? 0);
}

export function goalReady(g: Game): boolean {
  const cost = goalCost(g);
  if (!cost) return false;
  for (const k in cost) {
    const need = cost[k] ?? 0;
    if (need <= 0) continue;
    if (k === 'coins') { if (g.coins < need) return false; }
    else if (g.res[k as Res] < need) return false;
  }
  return true;
}

/**
 * Everything the plan needs, including inputs for refined resources made by installed
 * processors. The autopilot focuses these, protection keeps them from auto-sell, and the
 * collection cap stops at the target.
 */
export function planNeeds(g: Game): PlanNeeds {
  const needs = planDirect(g);
  const queue = Object.keys(needs) as Res[];
  const seen = new Set<Res>();
  while (queue.length) {
    const r = queue.shift()!;
    if (seen.has(r)) continue;
    seen.add(r);
    if (RES_INFO[r]?.tier !== 'refined') continue;
    const missing = Math.max(0, Math.ceil(needs[r] ?? 0) - Math.floor(g.res[r]));
    if (missing <= 0) continue;
    const proc = [...g.st.cells.values()].map((e) => e.def).find((d) => d.process && (d.process.output[r] ?? 0) > 0);
    if (!proc?.process) continue;
    const outQty = proc.process.output[r] ?? 1;
    const batches = Math.ceil(missing / outQty);
    for (const k in proc.process.input) {
      const rr = k as Res;
      const qty = Math.max(needs[rr] ?? 0, Math.ceil((proc.process.input[rr] ?? 0) * batches));
      if (qty > (needs[rr] ?? 0)) { needs[rr] = qty; queue.push(rr); }
    }
  }
  return needs;
}

/** Refined-resource inputs the plan will also gather (for display). */
export function planInputs(g: Game): PlanNeeds {
  const direct = planDirect(g);
  const all = planNeeds(g);
  const out: PlanNeeds = {};
  for (const r of RES_LIST) {
    const target = all[r] ?? 0;
    if (target > (direct[r] ?? 0)) out[r] = target;
  }
  return out;
}

/** Total items still missing for the plan. Used to reserve cargo space for them. */
export function planRemaining(g: Game): number {
  const needs = planNeeds(g);
  let n = 0;
  for (const r of RES_LIST) n += Math.max(0, Math.ceil(needs[r] ?? 0) - Math.floor(g.res[r]));
  return n;
}

/** The amount of a resource the plan protects from auto-sell (direct needs plus processor inputs). */
export function goalProtect(g: Game, r: Res): number {
  return Math.ceil(planNeeds(g)[r] ?? 0);
}

export function collectLimit(g: Game, r: Res): number {
  return g.collectCap[r] >= 0 ? g.collectCap[r] : Infinity;
}

/**
 * Should the autopilot target a node of this resource? A plan stops at its targets and
 * leaves enough cargo room for everything still missing; surplus gathering is allowed only
 * when that room is safe (or when there is no plan).
 */
export function wantsResource(g: Game, r: Res): boolean {
  if (g.cargoFree() <= 0) return false;
  if (g.res[r] >= collectLimit(g, r)) return false;
  const needs = planNeeds(g);
  const target = needs[r];
  if (target !== undefined) return g.res[r] < target;
  if (!g.goal) return true;
  if ((g.st.upkeep[r] ?? 0) > 0) return true; // always keep the engines fed
  return g.cargoFree() > planRemaining(g) + 2;
}

/** How many more of `r` a pickup may add before hitting a collection limit or plan target. */
export function collectionRoom(g: Game, r: Res): number {
  const have = Math.floor(g.res[r]);
  let room = g.collectCap[r] >= 0 ? Math.max(0, g.collectCap[r] - have) : Infinity;
  const target = planNeeds(g)[r];
  if (target !== undefined) room = Math.min(room, Math.max(0, Math.ceil(target) - have));
  return room;
}

/**
 * Forage scoring bias for one resource, or null when the autopilot should ignore it.
 * Negative is more attractive; plan targets get a strong pull, filler a mild penalty.
 */
export function foragePriority(g: Game, r: Res): number | null {
  if (g.cargoFree() <= 0) return null;
  if (g.res[r] >= collectLimit(g, r)) return null;
  const needs = planNeeds(g);
  const target = needs[r];
  if (target !== undefined) {
    if (g.res[r] >= target) return null;
    const direct = planDirect(g)[r];
    return (direct ?? 0) > 0 ? -160 : -110;
  }
  if (!g.goal) return 0;
  if ((g.st.upkeep[r] ?? 0) > 0) return 0;
  let remaining = 0;
  for (const k of RES_LIST) remaining += Math.max(0, Math.ceil(needs[k] ?? 0) - Math.floor(g.res[k]));
  return g.cargoFree() > remaining + 2 ? 40 : null;
}

/** Point the autopilot at a build and lift any manual cap that would block it. */
export function setGoal(g: Game, kind: BuildGoalKind, id: string): boolean {
  const goal: BuildGoal = { kind, id };
  if (!validGoal(g, goal)) return false;
  const cost = costFor(g, goal);
  if (!cost) return false;
  g.goal = goal;
  // A manual limit below a plan target would stall gathering; lift those limits (never lower one).
  const needs = planNeeds(g);
  for (const r of RES_LIST) {
    const need = Math.ceil(needs[r] ?? 0);
    if (need > 0 && g.collectCap[r] >= 0 && g.collectCap[r] < need) g.collectCap[r] = need;
  }
  g.addLog(`🎯 Plan: ${goalLabel(g)}. The house will gather what it needs.`, '#7fd1e8');
  return true;
}

export function clearGoal(g: Game): void {
  if (!g.goal) return;
  g.goal = null;
  g.addLog('Plan cleared. Autopilot is back to ordinary foraging.', '#7fd1e8');
}

/** Clear the plan when its build actually happens (a new plan can be set afterwards). */
export function completeGoal(g: Game, kind: BuildGoalKind, id?: string): void {
  if (!g.goal || g.goal.kind !== kind) return;
  if (id !== undefined && g.goal.id !== id) return;
  const label = goalLabel(g);
  g.goal = null;
  g.addLog(`🎯 Plan complete: ${label}!`, '#2ecc71');
}
