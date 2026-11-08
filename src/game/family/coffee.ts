// Once-a-day morning coffee (no streaks, ever).
import { COFFEE_LINES } from '../../content';
import type { Game } from '../engine';
import { meta, saveMeta, todayStr } from './meta';
import { toast } from './toasts';
import { pick } from './util';

// ------------------------------------------------------------ morning coffee
export const coffeeReady = () => meta.lastCoffee !== todayStr();

export function drinkCoffee(g: Game) {
  if (!coffeeReady()) return false;
  meta.lastCoffee = todayStr();
  meta.lifetime.coffees++;
  g.addBuff({ id: 'coffee', name: 'Morning Coffee', icon: '☕', stat: 'yield', mult: 1.15, duration: 1200 });
  const line = pick(COFFEE_LINES);
  g.addLog(`☕ ${line}`, '#ffe8a3');
  toast(g, '☕', 'Morning coffee', `${line} (+15% yield for 20 min)`, '#e0b080');
  saveMeta();
  return true;
}
