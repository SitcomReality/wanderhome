// Workshop side panel: the parts you know how to build.
import { useState } from 'react';
import { CAT_INFO, MOD, ModCat, PART } from '../../content/index';
import type { Game } from '../../game/engine';
import { PartTraits } from '../common/PartInfo';
import { Btn, CostView, PartIcon } from '../common/ui';
import { activeCell } from './util';

export function PartsTab({ game, pick, setPick, setSel, refresh }: { game: Game; pick: string | null; setPick: (id: string | null) => void; setSel: (n: number | null) => void; refresh: () => void }) {
  const [cat, setCat] = useState<ModCat | 'all'>('all');
  const active = (idx: number) => activeCell(game, idx);
  const knownMods = game.known.filter((id) => PART[id]?.kind === 'module');
  const cats = (Object.keys(CAT_INFO) as ModCat[]).filter((c) => c !== 'core' && knownMods.some((id) => MOD[id].cat === c));
  const shownMods = knownMods.filter((id) => cat === 'all' || MOD[id].cat === cat).sort((a, b) => MOD[a].cat.localeCompare(MOD[b].cat));
  return (
      <>
        <div className="mb-2 flex flex-wrap gap-1">
          <button onClick={() => setCat('all')} className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cat === 'all' ? 'bg-stone-200 text-stone-900' : 'bg-white/5 text-stone-300'}`}>All</button>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cat === c ? 'text-stone-900' : 'bg-white/5 text-stone-300'}`} style={cat === c ? { background: CAT_INFO[c].color } : undefined}>{CAT_INFO[c].name}</button>
          ))}
        </div>
        {cat !== 'all' && <p className="mb-2 text-[11px] text-stone-500">{CAT_INFO[cat].blurb}</p>}
        <div className="space-y-1.5">
          {shownMods.map((id) => {
            const m = MOD[id];
            const ok = game.canAfford(m.cost);
            const on = pick === id;
            const planned = game.goal?.kind === 'module' && game.goal.id === id;
            const count = game.grid.filter((g, i) => g === id && active(i)).length;
            const choose = () => { setPick(on ? null : id); setSel(null); };
            return (
              <div key={id} role="button" tabIndex={0} onClick={choose}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } }}
                className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-2 text-left transition ${on ? 'border-emerald-300/70 bg-emerald-400/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.07]'}`}>
                <div className="shrink-0 rounded-lg bg-black/30 p-0.5" style={{ boxShadow: `inset 0 0 0 1px ${CAT_INFO[m.cat].color}55` }}><PartIcon id={id} size={42} animate={on} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-stone-100">{m.name}</span>
                    {count > 0 && <span className="text-[10px] text-stone-500">×{count}</span>}
                  </div>
                  <div className="mb-1 text-[11px] leading-snug text-stone-400">{m.desc}</div>
                  <PartTraits id={id} compact />
                  <div className={`mt-1 flex flex-wrap items-center gap-1.5 ${ok ? '' : 'opacity-80'}`}>
                    <CostView cost={m.cost} game={game} />
                    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <Btn onClick={() => { game.planGoal('module', id); refresh(); }} active={planned} title="Gather the missing resources for this part">🎯 {planned ? 'Planned' : 'Plan'}</Btn>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-white/10 p-3 text-center text-[11px] text-stone-500">
          📐 {game.known.length} blueprints known. Each region's towns sell different ones, so travel to find more.
        </div>
      </>
  );
}
