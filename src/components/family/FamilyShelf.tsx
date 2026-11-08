// Past generations with tiny painted portraits; click one for its run summary.
import { useState } from 'react';
import { BIOME } from '../../content/index';
import { drawPortrait } from '../../game/art/postcardArt';
import { fmtNum } from '../../game/engine';
import { meta } from '../../game/family/meta';
import { CanvasArt } from '../common/ui';
import { SummaryGrid } from './RunSummary';

export function FamilyShelf() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-amber-300">The family shelf</h3>
      {meta.past.length === 0 ? <p className="text-xs text-stone-500">No retired houses yet. Generation {meta.generation} is still writing the first chapter.</p> : (
        <div className="space-y-1.5">
          {meta.past.map((g, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-2">
              <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <CanvasArt w={36} h={36} k={g.portrait} draw={(ctx, w) => drawPortrait(ctx, w, g.portrait)} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-stone-100">{g.family} · Generation {g.gen}</div>
                  <div className="text-[11px] text-stone-400">{fmtNum(g.distance)} tiles · loved the {BIOME[g.favorite]?.name ?? 'road'} · retired {new Date(g.date).toLocaleDateString()}</div>
                </div>
                <span className="text-sm font-bold text-amber-200">✨ {g.sparks}</span>
              </button>
              {open === i && <div className="mt-2"><SummaryGrid s={g} /></div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
