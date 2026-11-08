// Cosmetic picker: trim paint, flag and trinket (unlocked by milestones & the Scrapbook).
import { useState } from 'react';
import { COSMETICS, CosmeticKind } from '../../content/index';
import { meta, saveMeta } from '../../game/family/meta';

export function HouseStyle() {
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  return (
    <>
      <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-amber-300">House style</h3>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(['paint', 'flag', 'trinket'] as CosmeticKind[]).map((kind) => (
          <div key={kind} className="rounded-xl bg-white/[0.03] p-2.5">
            <div className="mb-1.5 text-[11px] font-bold uppercase text-stone-400">{kind === 'paint' ? 'Trim paint' : kind === 'flag' ? 'Flag' : 'Trinket'}</div>
            <div className="flex flex-wrap gap-1">
              {COSMETICS.filter((c) => c.kind === kind).map((c) => {
                const have = meta.cosmetics.includes(c.id);
                const on = meta.equipped[kind] === c.id;
                return (
                  <button key={c.id} title={have ? c.name : `Locked: ${c.hint}`} disabled={!have} onClick={() => { meta.equipped[kind] = c.id; saveMeta(); refresh(); }}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${on ? 'border-amber-300 bg-amber-400/20 text-amber-100' : have ? 'border-white/10 text-stone-200 hover:bg-white/10' : 'border-dashed border-white/10 text-stone-600'}`}>
                    <span className="inline-block h-3 w-3 rounded-full border border-black/30" style={{ background: !have ? '#222' : c.color === 'rainbow' ? 'linear-gradient(90deg,#e74c3c,#f1c40f,#2ecc71,#3498db,#9b59b6)' : c.color || 'transparent' }} />
                    {have ? c.name : '???'}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
