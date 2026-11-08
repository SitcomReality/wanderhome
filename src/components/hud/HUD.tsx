// The in-game HUD: wallet & cargo, log, minimap and menu buttons, vehicle panel and help.
import { useState } from 'react';
import type { Game } from '../../game/engine';
import { RES_INFO, RES_LIST, TIER_COLOR } from '../../content/index';
import { fmtNum } from '../../game/engine';
import { coffeeReady, drinkCoffee, retireProgress } from '../../game/family/index';
import { meta } from '../../game/family/meta';
import { Bar } from '../common/ui';
import { PinCard } from '../workshop/PinCard';
import { Minimap } from './Minimap';
import { VehiclePanel } from './VehiclePanel';

export type ModalKind = 'garage' | 'trade' | 'settings' | 'stores' | 'memories' | 'legacy';

export function HUD({ game, tick, open, onHide }: { game: Game; tick: number; open: (m: ModalKind) => void; onHide: () => void }) {
  const [help, setHelp] = useState(true);
  const [, force] = useState(0);
  const used = game.cargoUsed();
  const cpm = (game.rates.coins ?? 0) * 60;


  const logs = game.log.filter((l) => game.time - l.t < 14).slice(-6);
  const resShown = RES_LIST.filter((r) => game.res[r] >= 1 || (game.keep[r] > 0 && game.seenRes.includes(r) && game.res[r] > 0));

  return (
    <div className="pointer-events-none absolute inset-0 select-none text-stone-100">
      {/* top-left */}
      <div className="absolute left-2 top-2 flex max-w-[calc(100%-210px)] flex-col gap-1.5 sm:left-3 sm:top-3">
        <div className="pointer-events-auto flex w-fit items-end gap-3 rounded-xl border border-amber-200/20 bg-black/55 px-3 py-2 shadow-lg backdrop-blur">
          <div>
            <div className="coin-pop text-2xl font-black leading-none tracking-tight text-amber-200 drop-shadow sm:text-3xl" key={Math.floor(game.coins)}>🪙 {fmtNum(Math.floor(game.coins))}</div>
            <div className="mt-0.5 text-[10px] text-stone-400">net worth {fmtNum(game.netWorth())} · {cpm >= 0.1 ? `~${fmtNum(Math.round(cpm * 10) / 10)}/min` : 'warming up'}</div>
            <div className="text-[10px] text-stone-500">Generation {meta.generation} · the {meta.family}s{meta.cat ? ` · 🐈 ${meta.cat.name}` : ''}</div>
          </div>
        </div>
        <button onClick={() => open('stores')} title="Stores & locks (I)" className="pointer-events-auto max-w-md rounded-xl border border-white/10 bg-black/50 px-2 py-1.5 text-left backdrop-blur transition hover:border-amber-200/30">
          <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[13px]">
            {resShown.length === 0 && <span className="text-xs text-stone-500">Empty cargo</span>}
            {resShown.map((r) => (
              <span key={r} title={`${RES_INFO[r].name}${game.keep[r] ? ` · locked ${game.keep[r]}` : ''}`} className="tabular-nums">
                {RES_INFO[r].icon}<b className="ml-0.5" style={{ color: RES_INFO[r].tier === 'common' ? undefined : TIER_COLOR[RES_INFO[r].tier] }}>{fmtNum(Math.floor(game.res[r]))}</b>
                {game.keep[r] > 0 && <span className={`ml-[1px] text-[9px] ${game.res[r] >= game.keep[r] ? 'text-amber-300' : 'text-stone-500'}`}>🔒</span>}
              </span>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-400">
            <span>📦</span><Bar value={used} max={game.cargoCap} color={used >= game.cargoCap ? '#ff5c5c' : used > game.cargoCap * 0.8 ? '#ffb347' : '#7fd1e8'} />
            <span className="whitespace-nowrap tabular-nums">{Math.floor(used)}/{game.cargoCap}</span>
            <span className="whitespace-nowrap text-stone-500">· click to lock</span>
          </div>
        </button>
        {game.pins.length > 0 && (
          <div className="pointer-events-auto flex max-w-xs flex-col gap-1">
            {game.pins.slice(0, 2).map((id) => <PinCard key={id} game={game} id={id} small onChange={() => force((n) => n + 1)} />)}
            {game.pins.length > 2 && <button onClick={() => open('garage')} className="w-fit text-[10px] text-sky-300">+{game.pins.length - 2} more in Workshop → Leads</button>}
          </div>
        )}
        <div className="mt-1 flex flex-col gap-1">
          {logs.map((l) => (
            <div key={l.id} className="w-fit max-w-sm rounded-lg bg-black/55 px-2 py-1 text-xs shadow backdrop-blur" style={{ color: l.color, opacity: Math.min(1, (14 - (game.time - l.t)) / 3) }}>{l.msg}</div>
          ))}
        </div>
      </div>

      {/* top-right */}
      <div className="absolute right-2 top-2 flex flex-col items-end gap-2 sm:right-3 sm:top-3">
        <Minimap game={game} tick={tick} />
        <div className="pointer-events-auto flex gap-1.5">
          <button onClick={() => open('garage')} className="rounded-xl border border-amber-300/40 bg-amber-400/90 px-3 py-2 text-sm font-black text-stone-900 shadow-lg transition hover:scale-105 active:scale-95">🔧 Workshop <span className="opacity-50">G</span></button>
          <button onClick={() => open('trade')} className={`rounded-xl border px-3 py-2 text-sm font-black shadow-lg transition hover:scale-105 active:scale-95 ${game.docked ? 'animate-pulse border-emerald-300 bg-emerald-400 text-stone-900' : 'border-white/15 bg-black/60 text-stone-100'}`}>{game.docked ? '🏘️ Town' : '📒 Journal'} <span className="opacity-50">B</span></button>
        </div>
        <div className="pointer-events-auto flex gap-1.5">
          {coffeeReady() && <button onClick={() => { drinkCoffee(game); force((n) => n + 1); }} className="rounded-xl border border-amber-200/30 bg-amber-900/50 px-2.5 py-1.5 text-sm shadow-lg transition hover:scale-105" title="Morning coffee: a small cozy buff, once a day. No streaks.">☕</button>}
          <button onClick={() => open('memories')} className="rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-sm shadow-lg transition hover:scale-105" title="Scrapbook, postcards & milestones (J)">📖</button>
          <button onClick={() => open('legacy')} className={`rounded-xl border px-2.5 py-1.5 text-sm shadow-lg transition hover:scale-105 ${retireProgress(game).ready ? 'border-amber-300/60 bg-amber-500/30' : 'border-white/15 bg-black/60'}`} title="Family & legacy (L)">🌳</button>
          <button onClick={() => open('settings')} className="rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-sm shadow-lg transition hover:scale-105" title="Settings">⚙️</button>
          <button onClick={onHide} className="rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-bold shadow-lg transition hover:scale-105" title="Hide the interface (H)">🙈 Hide UI <span className="opacity-50">H</span></button>
        </div>
      </div>

      {/* bottom-left: vehicle */}
      <VehiclePanel game={game} />

      {/* bottom-right */}
      <div className="pointer-events-auto absolute bottom-2 right-2 max-w-[270px] sm:bottom-3 sm:right-3">
        {help ? (
          <div className="rounded-xl border border-white/10 bg-black/55 p-2.5 text-[11px] leading-relaxed text-stone-300 backdrop-blur">
            <div className="mb-1 flex justify-between"><b className="text-amber-100">How to (not) play</b><button onClick={() => setHelp(false)} className="text-stone-500 hover:text-white">✕</button></div>
            Do nothing: your home drives, harvests, fights & trades by itself.<br />
            <b>WASD</b> walk inside · walk off the edge (or <b>E</b>) to go outside<br />
            <b>Click</b> map: waypoint · <b>Wheel</b>: zoom · <b>T</b>: drive<br />
            <b>G</b> workshop · <b>B</b> town · <b>I</b> stores · <b>J</b> memories · <b>L</b> family · <b>H</b> hide UI
          </div>
        ) : <button onClick={() => setHelp(true)} className="rounded-full bg-black/60 px-3 py-1.5 text-xs">❔</button>}
      </div>
    </div>
  );
}
