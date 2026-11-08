// Offline / away progress. Every credit goes through applyOfflineProgress(), which can never
// double-apply: it only credits wall-clock time after g.offlineClock (the last moment already
// credited) and then moves that clock forward.
import type { Game } from '../engine';
import { RES_LIST, Res } from '../../content/index';
import { DAY } from '../core/constants';
import { noteAway, offlineCapSec, offlineMult } from '../family/bonuses';

export interface OfflineReport { id: number; seconds: number; gains: Partial<Record<Res | 'coins', number>>; events: string[] }

/** Minimum time away (seconds) before anything is credited or reported. */
export const OFFLINE_MIN_SECONDS = 30;
let reportSeq = 0;

/**
 * Credit time away from `fromMs` (wall clock) until now.
 * @param advanceWorld also move the in-game clock forward (used when loading a save).
 * @returns the report that was created or extended, or null if nothing was credited.
 */
export function applyOfflineProgress(g: Game, fromMs: number, opts: { advanceWorld?: boolean; minSeconds?: number } = {}): OfflineReport | null {
  const now = Date.now();
  const start = Math.max(Number.isFinite(fromMs) ? fromMs : now, g.offlineClock);
  const raw = (now - start) / 1000;
  g.offlineClock = Math.max(g.offlineClock, now); // claim this span immediately, so a second call credits nothing
  if (!(raw >= (opts.minSeconds ?? OFFLINE_MIN_SECONDS))) return null;
  const secs = Math.min(offlineCapSec(), raw);
  g.computeStats();
  const mult = offlineMult(g);
  const gains: Partial<Record<Res | 'coins', number>> = {};
  for (const k of ['coins', ...RES_LIST] as (Res | 'coins')[]) {
    const rate = g.rates[k];
    if (!Number.isFinite(rate) || rate <= 0) continue;
    let n = Math.floor(rate * secs * mult);
    if (k !== 'coins') n = Math.min(n, Math.floor(g.cargoFree()));
    if (n > 0) { gains[k] = n; if (k === 'coins') g.coins += n; else g.res[k] += n; }
  }
  // Offline gains must not count as "income" for the rate estimator (that would compound next time).
  g.rateSnap = g.snapshotTotals();
  g.rateT = 0;
  noteAway(g, secs);
  if (opts.advanceWorld) g.time += Math.min(secs, DAY);
  // extend an unseen report instead of stacking a second one
  const r = g.offlineReport;
  if (r && !g.offlineSeen) {
    r.seconds += secs;
    for (const k in gains) r.gains[k] = (r.gains[k] ?? 0) + (gains[k] ?? 0);
    return r;
  }
  g.offlineReport = { id: ++reportSeq, seconds: secs, gains, events: [] };
  g.offlineSeen = false;
  return g.offlineReport;
}
