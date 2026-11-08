// A wishlisted blueprint: where it's sold, or what it costs to build once known.
import { PART } from '../../content/index';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { Btn, CostView, PartIcon } from '../common/ui';

export function PinCard({ game, id, onChange, small = false }: { game: Game; id: string; onChange?: () => void; small?: boolean }) {
  const p = PART[id];
  if (!p) return null;
  const known = game.known.includes(id);
  const where = game.whereSold(id);
  const owned = (p.kind === 'loco' && game.ownedLocos.includes(id)) || (p.kind === 'frame' && game.ownedFrames.includes(id));
  return (
    <div className={`flex items-start gap-2 rounded-xl border border-sky-300/15 bg-sky-400/5 ${small ? 'p-1.5' : 'p-2'}`}>
      <PartIcon id={id} size={small ? 28 : 36} />
      <div className="min-w-0 flex-1 text-[11px]">
        <div className="flex items-center justify-between gap-1">
          <b className="truncate text-stone-100">{p.name}</b>
          <button className="text-stone-500 hover:text-white" title="Unpin" onClick={() => { game.togglePin(id); onChange?.(); }}>✕</button>
        </div>
        {owned ? <div className="text-emerald-300">Built ✓</div> : known ? (
          <>
            <div className="text-emerald-300">Blueprint known · build cost:</div>
            <CostView cost={p.cost} game={game} />
            <div className="mt-1 flex gap-1"><Btn onClick={() => { game.lockFor(p.cost); onChange?.(); }} title="Stop auto-selling these resources until you have enough">🔒 Save up</Btn></div>
          </>
        ) : (
          <>
            <div className="text-stone-400">{where ? <>Sold at <b className="text-stone-200">{where.name}</b> · {Math.round(where.d)}t · <span className="text-amber-200">🪙{fmtNum(game.blueprintPrice(where, id))}</span></> : 'Location unknown'}</div>
            {where && <div className="mt-1"><Btn onClick={() => { game.setWaypoint(where.x, where.y); onChange?.(); }}>📍 Go there</Btn></div>}
          </>
        )}
      </div>
    </div>
  );
}
