import { useState } from 'react';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { Modal, Btn } from '../common/ui';
import { SaveTransfer } from './SaveTransfer';

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2.5">
      <div>
        <div className="text-sm font-bold text-stone-100">{label}</div>
        {hint && <div className="text-[11px] text-stone-500">{hint}</div>}
      </div>
      <div className="flex shrink-0 gap-1">{children}</div>
    </div>
  );
}

export function Settings({ game, onClose, onNewGame }: { game: Game; onClose: () => void; onNewGame: () => void }) {
  const [, force] = useState(0);
  const s = game.settings;
  const set = (fn: () => void) => { fn(); force((n) => n + 1); };
  const fmtTime = (sec: number) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; };
  const [confirm, setConfirm] = useState(false);

  return (
    <Modal title="⚙️ Settings & Journey" onClose={onClose}>
      <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">Juice</h3>
      <Row label="Screen shake" hint="How much explosions rattle your screen">
        {['Off', 'Mild', 'Hearty', 'CHAOS'].map((l, i) => <Btn key={l} active={s.shake === [0, 0.5, 1, 2][i]} onClick={() => set(() => (s.shake = [0, 0.5, 1, 2][i]))}>{l}</Btn>)}
      </Row>
      <Row label="Particles" hint="Sparkles, debris, smoke & confetti">
        {['Calm', 'Normal', 'EXTREME'].map((l, i) => <Btn key={l} active={s.particles === i} onClick={() => set(() => (s.particles = i))}>{l}</Btn>)}
      </Row>
      <Row label="Damage numbers"><Btn active={s.dmgNumbers} onClick={() => set(() => (s.dmgNumbers = !s.dmgNumbers))}>{s.dmgNumbers ? 'On' : 'Off'}</Btn></Row>
      <Row label="Clouds" hint="A tribute to the original .fx_cloud"><Btn active={s.clouds} onClick={() => set(() => (s.clouds = !s.clouds))}>{s.clouds ? 'On' : 'Off'}</Btn></Row>
      <Row label="Weather & ambience" hint="Snow, falling leaves, fireflies, ash, spores, drifting sand…"><Btn active={s.ambient !== false} onClick={() => set(() => (s.ambient = s.ambient === false))}>{s.ambient !== false ? 'On' : 'Off'}</Btn></Row>
      <Row label="Sound effects" hint="Off by default so you can hear your sitcom">
        <Btn active={s.sound} onClick={() => set(() => (s.sound = !s.sound))}>{s.sound ? 'On' : 'Off'}</Btn>
        {s.sound && <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => set(() => (s.volume = +e.target.value))} className="w-24 accent-amber-400" />}
      </Row>

      <h3 className="mt-4 mb-1 text-xs font-black uppercase tracking-widest text-amber-300">Autopilot</h3>
      <Row label="Auto-sell at towns" hint="Sells checked resources whenever parked in a town"><Btn active={s.autoSell} onClick={() => set(() => (s.autoSell = !s.autoSell))}>{s.autoSell ? 'On' : 'Off'}</Btn></Row>
      <Row label="Trade run when full" hint="Drives to the nearest town when cargo is ~90% full"><Btn active={s.returnWhenFull} onClick={() => set(() => (s.returnWhenFull = !s.returnWhenFull))}>{s.returnWhenFull ? 'On' : 'Off'}</Btn></Row>

      <SaveTransfer game={game} />

      <h3 className="mt-4 mb-2 text-xs font-black uppercase tracking-widest text-amber-300">Journey</h3>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          ['World seed', `"${game.seedStr}"`],
          ['Time on road', fmtTime(game.stats.playTime)],
          ['Tiles rolled', fmtNum(Math.floor(game.stats.distance))],
          ['From home', `${fmtNum(Math.floor(game.distTiles()))} t`],
          ['Coins earned', fmtNum(Math.floor(game.stats.earned))],
          ['Nodes harvested', fmtNum(game.stats.harvested)],
          ['Critters bonked', fmtNum(game.stats.kills)],
          ['Towns found', String(Object.keys(game.towns).length)],
          ['Blueprints known', String(game.known.length)],
          ['Breakdowns', String(game.stats.breakdowns)],
          ['Landmarks seen', String(game.stats.landmarks ?? 0)],
          ['Net worth', '🪙 ' + fmtNum(game.netWorth())],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-white/5 p-2"><div className="text-[11px] text-stone-500">{k}</div><div className="truncate font-black text-stone-100">{v}</div></div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-rose-400/20 bg-rose-500/5 p-3">
        <div className="text-xs text-stone-400">Start over on a fresh world. Your current home is lost, but the family (Scrapbook, perks, postcards) stays. Retiring from the Family panel earns Sparks instead.</div>
        {confirm ? (
          <div className="flex gap-1"><Btn onClick={() => setConfirm(false)}>Keep</Btn><Btn className="!bg-rose-500/80" onClick={onNewGame}>Really wipe</Btn></div>
        ) : <Btn onClick={() => setConfirm(true)}>New journey…</Btn>}
      </div>
    </Modal>
  );
}
