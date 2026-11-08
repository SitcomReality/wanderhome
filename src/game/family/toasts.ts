// Toast notifications + noting events into the away report.
import type { Game } from '../engine';

// ------------------------------------------------------------ types used by the engine/UI
export interface Toast { id: number; icon: string; title: string; text: string; color: string; at: number }

export let toastId = 0;

export function toast(g: Game, icon: string, title: string, text: string, color = '#ffd166') {
  g.toasts.push({ id: ++toastId, icon, title, text, color, at: performance.now() });
  if (g.toasts.length > 5) g.toasts.shift();
}

export function awayEvent(g: Game, line: string) { if (g.offlineReport && !g.offlineSeen) g.offlineReport.events.push(line); }
