// The Legacy Sparks shop: permanent family upgrades with 3 ranks each.
import { useState } from 'react';
import type { Game } from '../../game/engine';
import { LEGACY_UPGRADES } from '../../content/index';
import { buyPerk } from '../../game/family/index';
import { meta, rankOf } from '../../game/family/meta';
import { Btn } from '../common/ui';

export function FamilyUpgrades({ game, onChange }: { game: Game; onChange?: () => void }) {
  const [, force] = useState(0);
  const refresh = () => { force((n) => n + 1); onChange?.(); };
  return (
    <>
      <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-amber-300">Family upgrades</h3>
      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {LEGACY_UPGRADES.map((u) => {
          const r = rankOf(u.id);
          const cost = r < 3 ? u.costs[r] : 0;
          const cur = r ? u.fmt(u.values[r - 1]) : '';
          const next = r < 3 ? u.fmt(u.values[r]) : '';
          return (
            <div key={u.id} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="flex items-center gap-2"><span className="text-2xl">{u.icon}</span><div className="min-w-0"><div className="text-sm font-bold text-stone-100">{u.name}</div>
                <div className="flex gap-0.5">{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 w-5 rounded-full ${i < r ? 'bg-amber-300' : 'bg-white/10'}`} />)}</div></div></div>
              <p className="mt-1 flex-1 text-[11px] text-stone-400">{u.desc}</p>
              {u.effect === 'supplies' ? <p className="text-[11px] text-emerald-300">{r ? `Rank ${r} hamper` : ''}{r < 3 ? `${r ? ' → ' : ''}bigger hamper` : ''}</p>
                : <p className="text-[11px] text-emerald-300">{cur}{cur && next ? ' → ' : ''}{next}</p>}
              <div className="mt-1.5">{r < 3 ? <Btn disabled={meta.sparks < cost} onClick={() => { if (buyPerk(u.id)) { game.computeStats(); refresh(); } }}>Buy rank {r + 1} · ✨{cost}</Btn> : <span className="text-[11px] font-bold text-amber-300">MAX</span>}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
