// Workshop side panel: wishlist, blueprints seen in towns, and rumours.
import { PART } from '../../content/index';
import type { Game } from '../../game/engine';
import { TILE } from '../../game/world/world';
import { Btn, PartIcon } from '../common/ui';
import { PinCard } from './PinCard';

export function LeadsTab({ game, refresh, onClose }: { game: Game; refresh: () => void; onClose: () => void }) {
  // seen-but-unknown blueprints across visited towns
  const seen = new Map<string, { town: string; x: number; y: number; d: number }>();
  for (const k in game.towns) {
    const kt = game.towns[k];
    const d = Math.hypot(kt.x - game.v.x, kt.y - game.v.y) / TILE;
    for (const id of kt.stock) if (!game.known.includes(id)) { const s = seen.get(id); if (!s || d < s.d) seen.set(id, { town: kt.name, x: kt.x, y: kt.y, d }); }
  }
  return (
      <>
        <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">📌 Wishlist</h3>
        {game.pins.length === 0 && <p className="mb-3 text-[11px] text-stone-500">Pin blueprints you spot in town workshops to track them here, and to save up the resources to build them.</p>}
        <div className="mb-3 space-y-1.5">
          {game.pins.map((id) => <PinCard key={id} game={game} id={id} onChange={refresh} />)}
        </div>
        <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">🔭 Seen in town workshops</h3>
        {seen.size === 0 ? <p className="mb-3 text-[11px] text-stone-500">Nothing yet. Visit towns to browse their workshops.</p> : (
          <div className="mb-3 space-y-1">
            {[...seen.entries()].sort((a, b) => a[1].d - b[1].d).map(([id, s]) => (
              <div key={id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-1.5">
                <PartIcon id={id} size={30} />
                <div className="min-w-0 flex-1 text-[11px]"><b className="text-stone-200">{PART[id].name}</b> <span className="text-stone-500">{PART[id].catName}</span><div className="text-stone-500">{s.town} · {Math.round(s.d)}t away</div></div>
                <Btn onClick={() => { game.togglePin(id); refresh(); }} active={game.pins.includes(id)}>📌</Btn>
                <Btn onClick={() => { game.setWaypoint(s.x, s.y); onClose(); }}>Go</Btn>
              </div>
            ))}
          </div>
        )}
        <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">📜 Rumors</h3>
        {game.rumors.length === 0 ? <p className="text-[11px] text-stone-500">Townsfolk gossip about far-off workshops. Discover new towns to hear more.</p> : (
          <div className="space-y-1">
            {game.rumors.map((r) => (
              <div key={r.id} className="rounded-lg border border-violet-300/10 bg-violet-400/5 p-2 text-[11px] italic text-violet-100/90">
                “{r.text}” <span className="not-italic text-stone-500">· {r.where}</span>
              </div>
            ))}
          </div>
        )}
      </>
  );
}
