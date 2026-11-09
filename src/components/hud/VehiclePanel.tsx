// Bottom-left HUD card: biome, clock, hull, status, buffs, crew and autopilot controls.
import { useState } from 'react';
import type { Game, DriveMode } from '../../game/engine';
import { BuffDef, RES_INFO, TERRAIN_INFO, describeBuff, locoSpeed } from '../../content/index';
import { fmtNum } from '../../game/engine';
import { TILE } from '../../game/world/world';
import { Bar, Btn } from '../common/ui';
import { Toggle } from './Toggle';

function parkClock(game: Game) {
  const s = Math.max(0, Math.ceil(game.parkUntil - game.time));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** One-line description of what the house is up to right now. */
export function driveStatus(game: Game) {
  const v = game.v;
  let status = '';
  if (v.disabledT > 0) status = `🔧 Repairing… ${Math.ceil(v.disabledT)}s`;
  else if (game.parked) {
    status = `⏸️ Parked${game.docked ? ` in ${game.docked.name}` : ''} · ${parkClock(game)} left`;
    if (game.inTownSafeZone()) status += ' · 🛡️ town watch';
    if (!game.av.inside) status += ' · 🚶 on foot';
  } else if (!game.av.inside) status = game.av.returning ? '💤 Wanderer heading home…' : '🚶 On foot. The house is waiting';
  else if (game.manual) status = '🕹️ Manual driving';
  else if (game.waypoint) status = `📍 To waypoint (${Math.round(Math.hypot(game.waypoint.x - v.x, game.waypoint.y - v.y) / TILE)}t)${game.nav.follow ? ' · finding a way around…' : ''}`;
  else if (game.tradeRun) status = `🛒 Trade run → ${game.tradeRun.name}${game.nav.follow ? ' · detouring…' : ''}`;
  else if (game.docked) status = `🏘️ Passing through ${game.docked.name}${game.inTownSafeZone() ? ' · 🛡️ town watch' : ''}`;
  else status = { forage: '🌿 Foraging', wander: '🍃 Wandering', heading: '🧭 Holding heading' }[game.mode];
  if (game.cargoFree() <= 0) status += ' · 📦 FULL';
  return status;
}

export function VehiclePanel({ game }: { game: Game }) {
  const [, force] = useState(0);
  const terr = game.world.terrainAt(game.v.x, game.v.y);
  const day = game.daylight();
  const v = game.v;
  const hasSail = game.hasModule('sail');
  const dry = [...new Set(game.weapons.filter((w) => w.dry).map((w) => w.def.weapon!.ammo ? RES_INFO[w.def.weapon!.ammo.res].name : ''))].filter(Boolean);
  const status = driveStatus(game);
  const setMode = (m: DriveMode, ang?: number) => {
    game.mode = m; game.manual = false; game.waypoint = null;
    game.parked = false; game.parkUntil = 0;
    if (ang !== undefined) game.headingAngle = ang;
    game.lastInput = game.time;
  };
  return (
    <div className="pointer-events-auto absolute bottom-2 left-2 w-[min(340px,calc(100%-16px))] rounded-xl border border-white/10 bg-black/60 p-2.5 shadow-xl backdrop-blur sm:bottom-3 sm:left-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-black text-amber-100">{TERRAIN_INFO[terr].name} <span className="font-normal text-stone-400">{locoSpeed(game.loco, terr) ? `×${locoSpeed(game.loco, terr)}` : '✕'}</span></span>
        <span className="tabular-nums text-stone-400">{day > 0.5 ? '☀️' : day > 0.15 ? '🌇' : '🌙'} {game.clockString()}{hasSail && ` · 🌬️${Math.round(game.wind() * 100)}%`} · {fmtNum(Math.floor(game.distTiles()))}t from home</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px]">
        <span className="w-10 text-stone-400">Hull</span>
        <Bar value={v.hp} max={game.maxHp} color={v.hp < game.maxHp * 0.3 ? '#ff5c5c' : '#2ecc71'} />
        <span className="w-14 text-right tabular-nums text-stone-300">{Math.ceil(v.hp)}/{game.maxHp}</span>
      </div>
      {!game.av.inside && (
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          <span className="w-10 text-stone-400">You</span>
          <Bar value={game.av.hp} max={game.av.maxHp} color="#ff7a59" />
          <span className="w-14 text-right tabular-nums text-stone-300">{Math.ceil(game.av.hp)}/{game.av.maxHp}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between text-[11px] text-stone-400">
        <span>💨 {(game.speedNow / TILE).toFixed(2)} t/s</span>
        <span>⚡ {game.power.toFixed(0)} / ⚖️ {game.weight.toFixed(0)}</span>
        <span>🛋️ {game.comfort}</span>
      </div>
      {game.starved.length > 0 && <div className="mt-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[11px] text-rose-200">⛽ Out of fuel: {[...new Set(game.starved)].join(', ')}</div>}
      {dry.length > 0 && <div className="mt-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] text-amber-200">🔫 Out of ammo: {dry.join(', ')}</div>}
      <div className="mt-1.5 truncate rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-sky-200">{status}</div>
      {game.crew && <div className="mt-1 truncate text-[11px] text-violet-200">🎒 {game.crew.name} the {game.crew.role} is riding along ({Math.ceil((game.crew.until - game.time) / 60)}m)</div>}
      {game.buffs.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {game.buffs.map((b) => (
            <span key={b.id} title={describeBuff(b as unknown as BuffDef)} className="rounded-md border border-sky-300/25 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-100">
              {b.icon} {b.name} <span className="font-normal text-sky-300/80">{Math.ceil((b.until - game.time) / 60)}m</span>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Btn active={!game.manual && game.mode === 'forage'} onClick={() => setMode('forage')} title="Seek out resources">🌿 Forage</Btn>
        <Btn active={!game.manual && game.mode === 'wander'} onClick={() => setMode('wander')} title="Meander aimlessly">🍃 Wander</Btn>
        <span className="ml-1 inline-flex gap-0.5" title="Hold a compass heading, great for long trips">
          {(['N', 'E', 'S', 'W'] as const).map((d, i) => {
            const ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][i];
            return <Btn key={d} active={!game.manual && game.mode === 'heading' && Math.abs(game.headingAngle - ang) < 0.01} onClick={() => setMode('heading', ang)} className="!px-1.5">{d}</Btn>;
          })}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <Toggle on={game.settings.autoSell} onClick={() => { game.settings.autoSell = !game.settings.autoSell; force((n) => n + 1); }} title="Sell unlocked goods automatically when in a town">💰 Auto-sell</Toggle>
        <Toggle on={game.settings.returnWhenFull} onClick={() => { game.settings.returnWhenFull = !game.settings.returnWhenFull; force((n) => n + 1); }} title="Drive to the nearest reachable town when cargo is ~90% full">🛒 Trade runs</Toggle>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <Btn active={game.manual} onClick={() => game.toggleManual()}>🕹️ Drive <span className="opacity-50">T</span></Btn>
        <Btn active={game.parked} onClick={() => game.togglePark()}>{game.parked ? '▶ Resume' : '⏸ Park'} <span className="opacity-50">P</span></Btn>
        <Btn onClick={() => game.keyDown('e')}>{game.av.inside ? '🚪 Step out' : '🏠 Board'} <span className="opacity-50">E</span></Btn>
        <Btn onClick={() => game.action()}>{game.av.inside ? '📯 Honk' : '👊 Swing'} <span className="opacity-50">Space</span></Btn>
      </div>
    </div>
  );
}
