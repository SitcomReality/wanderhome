// Parking: a temporary stop the player can request without turning autopilot off forever.
// Every park has a countdown; when it expires the house rolls on by itself.
import type { Game } from '../engine';
import { sfx } from '../sfx';
import { resetNav } from './navigation';

/** A long stop for town browsing or deliberate loitering. */
export const PARK_SECONDS = 600;
/** A shorter stop when a manual waypoint is reached in the open. */
export const WAYPOINT_PARK_SECONDS = 180;

type ParkReason = 'manual' | 'waypoint' | 'waypoint-town' | 'town';

export function park(g: Game, seconds = PARK_SECONDS, reason: ParkReason = 'manual'): void {
  const until = g.time + Math.max(1, seconds);
  g.parked = true;
  g.parkUntil = Math.max(g.parkUntil, until);
  g.waypoint = null;
  g.tradeRun = null;
  g.manual = false;
  g.v.speed = 0;
  g.lastInput = g.time;
  resetNav(g, '');
  const town = g.docked?.name ?? 'town';
  if (reason === 'waypoint') g.addLog('📍 Reached the waypoint. Parked for a bit.', '#7fd1e8');
  else if (reason === 'waypoint-town') g.addLog(`🏘️ Reached ${town}. Parked while you look around.`, '#ffd166');
  else if (reason === 'town') g.addLog(`🏘️ Parked in ${town}. Take your time.`, '#ffd166');
  else g.addLog(`⏸️ Parked for ${Math.round(seconds / 60)} min. Autopilot will resume when the timer ends.`, '#7fd1e8');
  g.popup(g.v.x, g.v.y - g.hh - 8, 'PARKED', '#7fd1e8');
  sfx('pop', 0.5);
}

/** Opening town services while docked keeps the house in place while the player browses. */
export function parkAtDock(g: Game): boolean {
  if (!g.docked) return false;
  if (!g.parked) park(g, PARK_SECONDS, 'town');
  else g.parkUntil = Math.max(g.parkUntil, g.time + PARK_SECONDS);
  return true;
}

export function resume(g: Game, reason: 'manual' | 'auto' | 'waypoint' | 'mode' = 'manual'): void {
  if (!g.parked) return;
  g.parked = false;
  g.parkUntil = 0;
  if (reason === 'manual') { g.lastInput = g.time; g.addLog('▶️ Autopilot resumes.', '#7fd1e8'); }
  else if (reason === 'auto') g.addLog('⏸️ Parking time is up. Back on the road.', '#7fd1e8');
}

export function toggle(g: Game): void {
  if (g.parked) resume(g, 'manual');
  else if (g.docked) parkAtDock(g);
  else park(g);
}

export function parkLeft(g: Game): number {
  return Math.max(0, g.parkUntil - g.time);
}

/** Called every driving tick so a parked house always gets back on the road eventually. */
export function updatePark(g: Game): void {
  if (g.parked && g.time >= g.parkUntil) resume(g, 'auto');
}
