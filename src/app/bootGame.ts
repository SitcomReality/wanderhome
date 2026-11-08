// Creating the first Game on page load: migrate & load the run save, or start a fresh preview world.
// A save that can't be read is copied to a backup key, never silently discarded.
import { Game } from '../game/engine';
import { SAVE_KEY } from '../game/core/constants';
import { migrateRunSave } from '../game/saveTransfer';

const W1 = ['cozy', 'rusty', 'sleepy', 'drifting', 'mossy', 'golden', 'quiet', 'wobbly', 'dusky', 'tiny', 'velvet', 'lonely'];
const W2 = ['biscuit', 'sitcom', 'teapot', 'caravan', 'lantern', 'meadow', 'pancake', 'compass', 'sofa', 'kettle', 'snail', 'turnip'];
export const randomSeed = () => `${W1[(Math.random() * W1.length) | 0]}-${W2[(Math.random() * W2.length) | 0]}-${(Math.random() * 100) | 0}`;
export const UNREADABLE_BACKUP_KEY = 'wanderhaus-save-unreadable-backup';

export interface Boot { game: Game; hadSave: boolean; recovered: boolean }
let cached: Boot | null = null;

/** Memoised so React StrictMode's double-invoked initialisers can't build (and credit offline time to) two games. */
export function bootGame(): Boot {
  if (cached) return cached;
  const raw = (() => { try { return localStorage.getItem(SAVE_KEY); } catch { return null; } })();
  if (raw) {
    try {
      const s = migrateRunSave(JSON.parse(raw));
      if (s && typeof s.seedStr === 'string') return (cached = { game: new Game(s.seedStr, s), hadSave: true, recovered: false });
    } catch { /* fall through */ }
    try { localStorage.setItem(UNREADABLE_BACKUP_KEY, raw); } catch { /* ignore */ }
    return (cached = { game: new Game(randomSeed()), hadSave: false, recovered: true });
  }
  return (cached = { game: new Game(randomSeed()), hadSave: false, recovered: false });
}
