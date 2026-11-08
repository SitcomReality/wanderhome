// Keeps the session healthy: a HUD refresh tick, autosave every 10 s, save on hide/unload, and
// crediting away-time when the tab comes back (through the single, double-apply-proof path).
import { RefObject, useEffect, useState } from 'react';
import type { Game } from '../game/engine';
import { applyOfflineProgress, OfflineReport } from '../game/sim/offline';

export function useSessionKeeper(gameRef: RefObject<Game>, playingRef: RefObject<boolean>, onReport: (r: OfflineReport) => void) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 200);
    const sv = setInterval(() => { if (playingRef.current) gameRef.current.save(); }, 10000);
    let hiddenAt = 0;
    const vis = () => {
      const g = gameRef.current;
      if (document.hidden) { hiddenAt = Date.now(); if (playingRef.current) g.save(); return; }
      const from = hiddenAt;
      hiddenAt = 0; // a repeated 'visible' event finds nothing to credit
      if (!from || !playingRef.current) return;
      const rep = applyOfflineProgress(g, from);
      if (rep && (rep.seconds > 120 || Object.keys(rep.gains).length)) onReport(rep);
    };
    const unload = () => { if (playingRef.current) gameRef.current.save(); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('beforeunload', unload);
    return () => { clearInterval(iv); clearInterval(sv); document.removeEventListener('visibilitychange', vis); window.removeEventListener('beforeunload', unload); };
  }, [gameRef, playingRef, onReport]);
  return tick;
}
