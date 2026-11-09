import { useState } from 'react';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { GRID_MAX_H, GRID_MAX_W, RES_LIST, RES_INFO, Res, TIER_COLOR } from '../../content/index';
import { goalCoins, goalEntries, goalLabel, goalReady, planDirect, planInputs, planNeeds } from '../../game/sim/plan';
import { Modal, Bar, Btn } from '../common/ui';

/** The lower bound: keep this much of a resource back from auto-sell. */
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

/** The upper bound: stop voluntarily collecting this resource once you hold this much. */
export function CapControl({ game, r, onChange }: { game: Game; r: Res; onChange?: () => void }) {
  const [, force] = useState(0);
  const v = game.collectCap[r];
  const set = (n: number) => { game.collectCap[r] = n < 0 ? -1 : Math.max(0, Math.round(n)); force((x) => x + 1); onChange?.(); };
  return (
    <span className="inline-flex items-center gap-0.5" title="Stop collecting at this amount. Blank means no limit.">
      <button className="rounded px-1 text-stone-400 hover:bg-white/10 hover:text-white" onClick={() => set(v < 0 ? -1 : v - 10)}>−</button>
      <span className={`relative inline-flex items-center rounded-md border px-1 ${v >= 0 ? 'border-sky-300/40 bg-sky-400/10' : 'border-white/10 bg-black/30'}`}>
        <span className="mr-0.5 text-[10px]">{v >= 0 ? '⏳' : '∞'}</span>
        <input type="text" inputMode="numeric" placeholder="∞" value={v >= 0 ? v : ''}
          onChange={(e) => {
            const t = e.target.value.trim();
            if (!/^\d*$/.test(t)) return;
            set(t === '' ? -1 : +t);
          }}
          className="w-11 bg-transparent text-right text-xs tabular-nums text-stone-100 outline-none placeholder:text-stone-500" />
      </span>
      <button className="rounded px-1 text-stone-400 hover:bg-white/10 hover:text-white" onClick={() => set((v < 0 ? Math.floor(game.res[r]) : v) + 10)}>+</button>
      <button className="rounded px-1 text-[10px] text-stone-500 hover:bg-white/10 hover:text-white" title="Stop collecting at what you have now" onClick={() => set(Math.floor(game.res[r]))}>now</button>
      <button className="rounded px-1 text-[10px] text-stone-500 hover:bg-white/10 hover:text-white" title="No limit" onClick={() => set(-1)}>∞</button>
    </span>
  );
}

function GoalSection({ game, refresh }: { game: Game; refresh: () => void }) {
  const goal = game.goal;
  const entries = goalEntries(game);
  const coins = goalCoins(game);
  const inputs = (Object.entries(planInputs(game)) as [Res, number][]).filter(([, n]) => n > 0);
  const ready = goalReady(game);
  const canExpand = game.gridW < GRID_MAX_W || game.gridH < GRID_MAX_H;
  return (
    <div className={`mb-3 rounded-xl border p-2.5 ${goal ? 'border-amber-300/30 bg-amber-400/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <b className="uppercase tracking-wider text-amber-300">🎯 Plan</b>
        {goal ? (
          <>
            <b className="text-stone-100">{goalLabel(game)}</b>
            <span className={ready ? 'font-bold text-emerald-300' : 'text-stone-400'}>{ready ? 'Ready to build!' : 'Gathering…'}</span>
            <span className="ml-auto flex flex-wrap justify-end gap-1">
              {canExpand && goal.kind !== 'expand' && <Btn onClick={() => { game.planGoal('expand', 'next'); refresh(); }}>Plan chassis upgrade</Btn>}
              <Btn onClick={() => { game.clearGoal(); refresh(); }}>Clear plan</Btn>
            </span>
          </>
        ) : (
          <>
            <span className="text-stone-400">No plan yet. Choose “🎯 Plan” on a known part, frame, or locomotion in the Workshop, or plan your next chassis upgrade here.</span>
            {canExpand && <Btn onClick={() => { game.planGoal('expand', 'next'); refresh(); }}>Plan chassis upgrade</Btn>}
          </>
        )}
      </div>
      {goal && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {entries.map(({ r, need, have }) => {
            const met = have >= need;
            return (
              <span key={r} className={`rounded-md border px-1.5 py-0.5 tabular-nums ${met ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-300/20 bg-black/20 text-stone-200'}`}>
                {RES_INFO[r].icon} {fmtNum(Math.min(have, need))}/{fmtNum(need)}{met ? ' ✓' : ''}
              </span>
            );
          })}
          {coins > 0 && (
            <span className={`rounded-md border px-1.5 py-0.5 tabular-nums ${game.coins >= coins ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-300/20 bg-black/20 text-stone-200'}`}>
              🪙 {fmtNum(Math.floor(game.coins))}/{fmtNum(coins)}{game.coins >= coins ? ' ✓' : ''}
            </span>
          )}
        </div>
      )}
      {goal && inputs.length > 0 && (
        <div className="mt-1 text-[10px] text-stone-500">
          ⚙️ Also gathering inputs for installed processors: {inputs.map(([r, n]) => `${RES_INFO[r].icon} ${fmtNum(n)}`).join(' · ')}
        </div>
      )}
      {goal && entries.some(({ r, need }) => game.collectCap[r] >= 0 && game.collectCap[r] < need) && (
        <div className="mt-1 text-[10px] text-rose-300">
          ⚠ A collection limit is below the plan target; raise it (or press ∞) to keep gathering.
        </div>
      )}
    </div>
  );
}

export function Stores({ game, onClose, tick }: { game: Game; onClose: () => void; tick: number }) {
  void tick;
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const seen = RES_LIST.filter((r) => game.seenRes.includes(r));
  const hidden = RES_LIST.length - seen.length;
  const used = game.cargoUsed();
  const needs = planNeeds(game);
  const direct = planDirect(game);

  return (
    <Modal title="📦 Supplies & Plans" onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-stone-400">
        <span className="font-bold text-stone-200">Cargo {Math.floor(used)}/{game.cargoCap}</span>
        <div className="w-40"><Bar value={used} max={game.cargoCap} color="#7fd1e8" /></div>
        <span className="max-w-xl"><b className="text-amber-200">🔒 Lock</b> is never auto-sold. <b className="text-sky-200">⏳ Collect up to</b> stops gathering at a limit. <b className="text-amber-200">🎯 Plan</b> reserves cargo room and sends the house after a specific build.</span>
        <span className="ml-auto flex gap-1">
          <button className={`rounded-lg border px-2 py-1 font-bold ${game.settings.autoSell ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200' : 'border-white/10 text-stone-400'}`} onClick={() => { game.settings.autoSell = !game.settings.autoSell; refresh(); }}>💰 Auto-sell {game.settings.autoSell ? 'ON' : 'OFF'}</button>
          <button className={`rounded-lg border px-2 py-1 font-bold ${game.settings.returnWhenFull ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200' : 'border-white/10 text-stone-400'}`} onClick={() => { game.settings.returnWhenFull = !game.settings.returnWhenFull; refresh(); }}>🛒 Trade runs {game.settings.returnWhenFull ? 'ON' : 'OFF'}</button>
        </span>
      </div>

      <GoalSection game={game} refresh={refresh} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-stone-500">
            <tr>
              <th className="py-1">Resource</th><th>Have</th><th>Lock</th><th>Collect up to</th><th>Plan</th><th className="text-center">Auto-sell</th><th>Sellable</th>
              {game.docked && <th>Here</th>}<th>Best known</th><th>Where to find</th>
            </tr>
          </thead>
          <tbody>
            {seen.map((r) => {
              const info = RES_INFO[r];
              const best = game.bestKnown(r);
              const rate = (game.rates[r] ?? 0) * 60;
              const have = Math.floor(game.res[r]);
              const target = needs[r] ?? 0;
              const planned = target > 0;
              const isInput = !((direct[r] ?? 0) > 0);
              const capBlocks = planned && game.collectCap[r] >= 0 && game.collectCap[r] < target;
              return (
                <tr key={r} className={`border-t border-white/5 align-middle ${planned ? 'bg-amber-400/[0.04]' : ''}`}>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{info.icon}</span>
                      <div><div className="font-bold text-stone-100">{info.name}</div><div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: TIER_COLOR[info.tier] }}>{info.tier}</div></div>
                    </div>
                  </td>
                  <td className="tabular-nums text-stone-200">{fmtNum(have)}{rate > 0.05 && <div className="text-[10px] text-emerald-300/80">+{rate.toFixed(1)}/min</div>}</td>
                  <td><LockControl game={game} r={r} onChange={refresh} /></td>
                  <td><CapControl game={game} r={r} onChange={refresh} /></td>
                  <td className="text-[11px] tabular-nums">
                    {planned ? (
                      <span className={have >= target ? 'font-bold text-emerald-300' : 'text-amber-200'} title={capBlocks ? 'Your collection limit is below the plan target, so gathering will pause here' : isInput ? 'Input for a processor making a planned resource' : 'Needed for the active plan'}>
                        🎯 {fmtNum(Math.min(have, target))}/{fmtNum(target)}{isInput ? ' ⚙️' : ''}{capBlocks ? ' ⚠' : ''}
                      </span>
                    ) : <span className="text-stone-600">—</span>}
                  </td>
                  <td className="text-center"><input type="checkbox" className="h-4 w-4 accent-amber-400" checked={game.autoSellRes[r]} onChange={(e) => { game.autoSellRes[r] = e.target.checked; refresh(); }} /></td>
                  <td className="tabular-nums text-stone-400">{game.autoSellRes[r] ? game.sellable(r) : '—'}</td>
                  {game.docked && <td className="tabular-nums text-stone-200">{game.townPrice(game.docked, r).toFixed(1)}</td>}
                  <td className="text-[11px] text-stone-400">
                    {best ? (
                      <span>
                        {best.sell[r].toFixed(1)} @ {best.name}
                        <button className="ml-1 rounded bg-sky-400/20 px-1 text-sky-200 hover:bg-sky-400/40" onClick={() => { game.setWaypoint(best.x, best.y); onClose(); }}>go</button>
                      </span>
                    ) : '—'}
                  </td>
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
