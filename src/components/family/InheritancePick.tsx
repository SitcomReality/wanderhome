// Between generations: spend fresh Sparks, then choose one inheritance card.
import { useState } from 'react';
import { INHERITANCES } from '../../content/index';
import type { Game } from '../../game/engine';
import { FamilyUpgrades } from './FamilyUpgrades';
import { meta } from '../../game/family/meta';

export function InheritancePick({ game, ids, onPick }: { game: Game; ids: string[]; onPick: (id: string) => void }) {
  const [picked, setPicked] = useState(false);
  const [, force] = useState(0);
  const cards = ids.map((id) => INHERITANCES.find((i) => i.id === id)).filter((x): x is (typeof INHERITANCES)[number] => !!x);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-h-[95vh] max-w-3xl overflow-y-auto rounded-3xl border border-amber-200/25 bg-[#1d1a22]/95 p-6 text-center shadow-2xl">
        <div className="text-4xl">🗝️</div>
        <h2 className="mt-1 text-2xl font-black text-amber-100">Generation {meta.generation} of the {meta.family} family</h2>
        <p className="mb-3 text-sm text-stone-400">First spend any Sparks you like (supplies & blueprints are packed into this new house), then choose one inheritance to start the journey.</p>
        <details className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left" open={meta.sparks > 0}>
          <summary className="cursor-pointer text-sm font-black text-amber-100">✨ {meta.sparks} Legacy Sparks to spend</summary>
          <div className="mt-2 max-h-[40vh] overflow-y-auto"><FamilyUpgrades game={game} onChange={() => force((n) => n + 1)} /></div>
        </details>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <button key={c.id} disabled={picked} onClick={() => { if (picked) return; setPicked(true); onPick(c.id); }} className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 text-left transition hover:-translate-y-1 hover:border-amber-300/60 hover:bg-amber-400/10">
              <div className="text-4xl transition group-hover:scale-110">{c.icon}</div>
              <div className="mt-2 font-black text-stone-100">{c.name}</div>
              <div className="text-xs text-stone-400">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
