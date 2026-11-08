// Workshop side panel: chassis size, frames and locomotion.
import { FRAMES, GRID_MAX_H, GRID_MAX_W, LOCOS, expandCost } from '../../content/index';
import type { Game } from '../../game/engine';
import { LocoTerrain, PartTraits } from '../common/PartInfo';
import { Btn, CostView, PartIcon } from '../common/ui';

export function ChassisTab({ game, refresh }: { game: Game; refresh: () => void }) {
  const ec = expandCost(game.gridW, game.gridH);
  return (
      <>
        <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">Size</h3>
        <div className="mb-3 rounded-xl bg-white/[0.03] p-2.5">
          <div className="mb-1.5 flex gap-1.5">
            <Btn disabled={game.gridW >= GRID_MAX_W || !game.canAfford(ec)} onClick={() => { game.expand('w'); refresh(); }}>Lengthen (+column)</Btn>
            <Btn disabled={game.gridH >= GRID_MAX_H || !game.canAfford(ec)} onClick={() => { game.expand('h'); refresh(); }}>Widen (+row)</Btn>
          </div>
          <CostView cost={ec} game={game} />
          <p className="mt-1 text-[10px] text-stone-500">Bigger homes hold more, but every cell of frame adds weight. Max {GRID_MAX_W}×{GRID_MAX_H}.</p>
        </div>
        <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">Frame</h3>
        <div className="mb-3 space-y-1.5">
          {FRAMES.filter((f) => game.known.includes(f.id)).map((f) => {
            const owned = game.ownedFrames.includes(f.id), eq = game.frame === f.id;
            return (
              <div key={f.id} className={`flex gap-2.5 rounded-xl border p-2 ${eq ? 'border-amber-300/60 bg-amber-400/10' : 'border-white/8 bg-white/[0.03]'}`}>
                <PartIcon id={f.id} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between"><b className="text-sm text-stone-100">{f.name}</b>{eq && <span className="text-[10px] font-bold text-amber-300">EQUIPPED</span>}</div>
                  <div className="mb-1 text-[11px] text-stone-400">{f.desc}</div>
                  <PartTraits id={f.id} />
                  {!eq && <div className="mt-1 flex items-center gap-2">{owned ? <Btn onClick={() => { game.buildFrame(f.id); refresh(); }}>Swap to this</Btn> : <><Btn disabled={!game.canAfford(f.cost)} onClick={() => { game.buildFrame(f.id); refresh(); }}>Build</Btn><CostView cost={f.cost} game={game} /></>}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">Locomotion</h3>
        <div className="space-y-1.5">
          {LOCOS.filter((l) => game.known.includes(l.id)).map((l) => {
            const owned = game.ownedLocos.includes(l.id), eq = game.loco === l.id;
            return (
              <div key={l.id} className={`flex gap-2.5 rounded-xl border p-2 ${eq ? 'border-amber-300/60 bg-amber-400/10' : 'border-white/8 bg-white/[0.03]'}`}>
                <PartIcon id={l.id} size={42} animate={eq} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between"><b className="text-sm text-stone-100">{l.name}</b>{eq && <span className="text-[10px] font-bold text-amber-300">EQUIPPED</span>}</div>
                  <div className="mb-1 text-[11px] text-stone-400">{l.desc}</div>
                  <PartTraits id={l.id} />
                  <LocoTerrain id={l.id} />
                  {!eq && <div className="mt-1 flex items-center gap-2">{owned ? <Btn onClick={() => { game.buildLoco(l.id); refresh(); }}>Swap to this</Btn> : <><Btn disabled={!game.canAfford(l.cost)} onClick={() => { game.buildLoco(l.id); refresh(); }}>Build</Btn><CostView cost={l.cost} game={game} /></>}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </>
  );
}
