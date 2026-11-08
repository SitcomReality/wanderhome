import { useState } from 'react';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { RES_LIST, RES_INFO, Res, TIER_COLOR } from '../../content/index';
import { Modal, Bar } from '../common/ui';

export function LockControl({ game, r, onChange }: { game: Game; r: Res; onChange?: () => void }) {
  const [, force] = useState(0);
  const set = (n: number) => { game.keep[r] = Math.max(0, Math.round(n)); force((x) => x + 1); onChange?.(); };
  const v = game.keep[r];
  return (
    <span className="inline-flex items-center gap-0.5">
      <button className="rounded px-1 text-stone-400 hover:bg-white/10 hover:text-white" onClick={() => set(v - 10)}>−</button>
      <span className={`relative inline-flex items-center rounded-md border px-1 ${v > 0 ? 'border-amber-300/40 bg-amber-400/10' : 'border-white/10 bg-black/30'}`}>
        <span className="mr-0.5 text-[10px]">{v > 0 ? '🔒' : '🔓'}</span>
        <input type="number" min={0} value={v} onChange={(e) => set(+e.target.value || 0)}
          className="w-11 bg-transparent text-right text-xs tabular-nums text-stone-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
      </span>
      <button className="rounded px-1 text-stone-400 hover:bg-white/10 hover:text-white" onClick={() => set(v + 10)}>+</button>
      <button className="ml-0.5 rounded px-1 text-[10px] text-stone-500 hover:bg-white/10 hover:text-white" title="Lock everything you currently hold" onClick={() => set(Math.floor(game.res[r]))}>all</button>
      <button className="rounded px-1 text-[10px] text-stone-500 hover:bg-white/10 hover:text-white" title="Unlock" onClick={() => set(0)}>0</button>
    </span>
  );
}

export function Stores({ game, onClose, tick }: { game: Game; onClose: () => void; tick: number }) {
  void tick;
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const seen = RES_LIST.filter((r) => game.seenRes.includes(r));
  const hidden = RES_LIST.length - seen.length;
  const used = game.cargoUsed();

  return (
    <Modal title="📦 Stores & Locks" onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-stone-400">
        <span className="font-bold text-stone-200">Cargo {Math.floor(used)}/{game.cargoCap}</span>
        <div className="w-40"><Bar value={used} max={game.cargoCap} color="#7fd1e8" /></div>
        <span><b className="text-amber-200">🔒 Lock</b> sets how much of each resource is never auto-sold. Use it to save up for a part.</span>
        <span className="ml-auto flex gap-1">
          <button className={`rounded-lg border px-2 py-1 font-bold ${game.settings.autoSell ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200' : 'border-white/10 text-stone-400'}`} onClick={() => { game.settings.autoSell = !game.settings.autoSell; refresh(); }}>💰 Auto-sell {game.settings.autoSell ? 'ON' : 'OFF'}</button>
          <button className={`rounded-lg border px-2 py-1 font-bold ${game.settings.returnWhenFull ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200' : 'border-white/10 text-stone-400'}`} onClick={() => { game.settings.returnWhenFull = !game.settings.returnWhenFull; refresh(); }}>🛒 Trade runs {game.settings.returnWhenFull ? 'ON' : 'OFF'}</button>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-stone-500">
            <tr><th className="py-1">Resource</th><th>Have</th><th>Lock (keep)</th><th className="text-center">Auto-sell</th><th>Sellable</th>{game.docked && <th>Here</th>}<th>Best known</th><th>Where to find</th></tr>
          </thead>
          <tbody>
            {seen.map((r) => {
              const info = RES_INFO[r];
              const best = game.bestKnown(r);
              const rate = (game.rates[r] ?? 0) * 60;
              return (
                <tr key={r} className="border-t border-white/5 align-middle">
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{info.icon}</span>
                      <div><div className="font-bold text-stone-100">{info.name}</div><div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: TIER_COLOR[info.tier] }}>{info.tier}</div></div>
                    </div>
                  </td>
                  <td className="tabular-nums text-stone-200">{fmtNum(Math.floor(game.res[r]))}{rate > 0.05 && <div className="text-[10px] text-emerald-300/80">+{rate.toFixed(1)}/min</div>}</td>
                  <td><LockControl game={game} r={r} onChange={refresh} /></td>
                  <td className="text-center"><input type="checkbox" className="h-4 w-4 accent-amber-400" checked={game.autoSellRes[r]} onChange={(e) => { game.autoSellRes[r] = e.target.checked; refresh(); }} /></td>
                  <td className="tabular-nums text-stone-400">{game.autoSellRes[r] ? game.sellable(r) : '—'}</td>
                  {game.docked && <td className="tabular-nums text-stone-200">{game.townPrice(game.docked, r).toFixed(1)}</td>}
                  <td className="text-[11px] text-stone-400">{best ? <>{best.sell[r].toFixed(1)} @ {best.name}</> : '—'}</td>
                  <td className="max-w-[220px] text-[11px] text-stone-500">{info.found}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hidden > 0 && <p className="mt-3 text-center text-xs text-stone-500">…and {hidden} resource{hidden > 1 ? 's' : ''} you haven't discovered yet.</p>}
    </Modal>
  );
}
