// The Workshop overlay: workbench + inspector + spec sheet on the left, tabbed side panel on the right.
import { useMemo, useState } from 'react';
import { MOD } from '../../content/index';
import type { Game } from '../../game/engine';
import { Stats, computeStats } from '../../game/vehicleStats';
import { ChassisTab } from './ChassisTab';
import { Inspector } from './Inspector';
import { LeadsTab } from './LeadsTab';
import { PartsTab } from './PartsTab';
import { SpecSheet } from './SpecSheet';
import { Workbench } from './Workbench';
import { activeCell } from './util';

type Tab = 'parts' | 'chassis' | 'leads';

export function Workshop({ game, onClose, tick }: { game: Game; onClose: () => void; tick: number }) {
  void tick;
  const [tab, setTab] = useState<Tab>('parts');
  const [pick, setPick] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const active = (idx: number) => activeCell(game, idx);

  // hypothetical stats preview
  const preview = useMemo<{ st: Stats; grid: (string | null)[] } | null>(() => {
    if (hover === null || !active(hover)) return null;
    const g = [...game.grid];
    if (sel !== null && sel !== hover) { const a = g[sel]; g[sel] = g[hover]; g[hover] = a; }
    else if (pick && !g[hover] && MOD[pick]) g[hover] = pick;
    else return null;
    return { st: computeStats(g, game.gridW, game.gridH, game.loco, game.frame), grid: g };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, sel, pick, game.grid.join(','), game.gridW, game.gridH, game.loco, game.frame]);

  const focusIdx = sel ?? hover;
  const focusEff = focusIdx !== null ? (preview && hover === focusIdx ? preview.st.cells.get(focusIdx) : game.st.cells.get(focusIdx)) : undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-2 backdrop-blur-[2px] sm:p-4" onMouseDown={onClose}>
      <div className="relative flex h-full max-h-[900px] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-amber-200/20 bg-[#17151c] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-amber-900/40 via-stone-900/40 to-sky-900/30 px-4 py-2.5">
          <div>
            <h2 className="text-lg font-black tracking-wide text-amber-100">Workshop</h2>
            <p className="text-[11px] text-stone-400">Click a part to pick it up, then click a cell to move or swap it. Hover to preview a change before you commit.</p>
          </div>
          <div className="flex items-center gap-1">
            {(['parts', 'chassis', 'leads'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${tab === t ? 'bg-amber-400 text-stone-900' : 'text-stone-300 hover:bg-white/10'}`}>
                {t === 'parts' ? 'Parts' : t === 'chassis' ? 'Chassis' : `Leads${game.pins.length + game.rumors.length ? ` · ${game.pins.length + game.rumors.length}` : ''}`}
              </button>
            ))}
            <button onClick={onClose} className="ml-2 rounded-lg px-2 py-1 text-stone-300 hover:bg-white/10">✕</button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(220px,1fr)_auto] lg:grid-cols-[1fr_400px] lg:grid-rows-1">
          {/* workbench */}
          <div className="flex min-h-0 flex-col">
            <Workbench game={game} pick={pick} sel={sel} hover={hover} preview={preview} setPick={setPick} setSel={setSel} setHover={setHover} refresh={refresh} />
            {/* inspector + spec sheet */}
            <div className="grid gap-3 border-t border-white/10 bg-black/20 p-3 md:grid-cols-2">
              <Inspector game={game} focusEff={focusEff} pick={pick} sel={sel} setSel={setSel} refresh={refresh} />
              <SpecSheet game={game} nst={preview?.st} />
            </div>
          </div>

          {/* side panel */}
          <div className="min-h-0 overflow-y-auto border-l border-white/10 bg-[#1c1922] p-3">
            {tab === 'parts' && <PartsTab game={game} pick={pick} setPick={setPick} setSel={setSel} refresh={refresh} />}

            {tab === 'chassis' && <ChassisTab game={game} refresh={refresh} />}

            {tab === 'leads' && <LeadsTab game={game} refresh={refresh} onClose={onClose} />}
          </div>
        </div>
      </div>
    </div>
  );
}
