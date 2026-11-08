// The Family overlay: sparks, family name, retirement, and the sections below it.
import { useState } from 'react';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { retireAward, retireProgress, runSummary } from '../../game/family/index';
import { meta, saveMeta } from '../../game/family/meta';
import { Bar, Btn, Modal } from '../common/ui';
import { FamilyShelf } from './FamilyShelf';
import { FamilyUpgrades } from './FamilyUpgrades';
import { HouseStyle } from './HouseStyle';
import { SummaryGrid } from './RunSummary';

export function FamilyPanel({ game, onClose, onRetire, tick }: { game: Game; onClose: () => void; onRetire: () => void; tick: number }) {
  void tick;
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const [confirm, setConfirm] = useState(false);
  const [retiring, setRetiring] = useState(false); // blocks a double-click from retiring twice
  const [nameEdit, setNameEdit] = useState(false);
  const p = retireProgress(game);
  const award = retireAward(game);

  return (
    <Modal wide onClose={onClose} title={<span>🌳 The {meta.family} family <span className="text-sm font-normal text-stone-400">· Generation {meta.generation}</span></span>}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-lg font-black text-amber-100">✨ {meta.sparks} <span className="text-xs font-semibold text-amber-200/70">Legacy Sparks</span></div>
        {nameEdit ? (
          <span className="flex items-center gap-1">
            <input autoFocus defaultValue={meta.family} maxLength={20} onBlur={(e) => { meta.family = e.target.value.trim() || meta.family; saveMeta(); setNameEdit(false); }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-stone-100 outline-none" />
          </span>
        ) : <Btn onClick={() => setNameEdit(true)}>✏️ Rename family</Btn>}
        <span className="text-xs text-stone-500">Sparks, upgrades, the Scrapbook, postcards, milestones and cosmetics stay with the family forever.</span>
      </div>

      {/* retirement */}
      <section className="mb-5 rounded-2xl border border-white/10 bg-gradient-to-br from-amber-900/20 to-fuchsia-900/10 p-4">
        {!confirm ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-amber-100">🔑 Retire this house</h3>
                <p className="max-w-md text-xs text-stone-400">Hand the keys to the next generation. You'll start fresh in a new world, keeping your family upgrades and memories, plus the Sparks below. Always optional. Keep rolling as long as you like.</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-stone-500">Projected award</div>
                <div className="text-2xl font-black text-amber-200">✨ {award}</div>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div><div className="mb-0.5 flex justify-between text-[11px] text-stone-400"><span>Coins earned this run</span><span>{fmtNum(p.nw)} / {fmtNum(p.nwReq)}</span></div><Bar value={p.nw} max={p.nwReq} color="#ffd166" /></div>
              <div><div className="mb-0.5 flex justify-between text-[11px] text-stone-400"><span>Biomes this run</span><span>{p.bio} / {p.bioReq}</span></div><Bar value={p.bio} max={p.bioReq} color="#c8a0ff" /></div>
            </div>
            <div className="mt-3"><Btn active={p.ready} disabled={!p.ready} onClick={() => setConfirm(true)}>{p.ready ? 'Retire this house…' : 'Not quite ready yet'}</Btn>
              <span className="ml-2 text-[11px] text-stone-500">Sparks grow with wealth, biomes, towns, landmarks, distance and generation. Tip: a compass heading finds new biomes faster.</span></div>
          </>
        ) : (
          <>
            <h3 className="mb-1 font-black text-amber-100">Pass the keys to Generation {meta.generation + 1}?</h3>
            <p className="mb-3 text-xs text-stone-400">This run's coins, cargo, parts, map and position will be reset. Your new home picks one inheritance card and keeps all family perks.</p>
            <SummaryGrid s={runSummary(game)} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Btn active disabled={retiring} onClick={() => { if (retiring) return; setRetiring(true); setConfirm(false); onRetire(); }}>Retire & earn ✨ {award}</Btn>
              <Btn onClick={() => setConfirm(false)}>Keep rolling</Btn>
            </div>
          </>
        )}
      </section>

      <FamilyUpgrades game={game} onChange={refresh} />
      <HouseStyle />
      <FamilyShelf />
    </Modal>
  );
}
