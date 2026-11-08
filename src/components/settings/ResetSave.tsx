// "Reset save": erases the house AND the family. Requires typing the family name to confirm,
// and keeps a backup copy in localStorage just in case.
import { useState } from 'react';
import { Game } from '../../game/engine';
import { meta, wipeMeta, META_KEY } from '../../game/family/meta';
import { SAVE_KEY } from '../../game/core/constants';
import { Btn } from '../common/ui';

export const RESET_BACKUP_KEY = 'wanderhaus-backup-before-reset';

/** True when the typed text matches the family name (ignoring case and surrounding spaces). */
export const resetConfirmed = (typed: string, family: string) => typed.trim().length > 0 && typed.trim().toLowerCase() === family.trim().toLowerCase();

export function ResetSave() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const ok = resetConfirmed(typed, meta.family);
  const reset = () => {
    if (!resetConfirmed(typed, meta.family)) return;
    try { localStorage.setItem(RESET_BACKUP_KEY, JSON.stringify({ save: localStorage.getItem(SAVE_KEY), meta: localStorage.getItem(META_KEY), at: Date.now() })); } catch { /* ignore */ }
    (globalThis as any).__wanderhausNoSave = true; // stop autosave / unload handlers from writing the old game back
    Game.wipe();
    wipeMeta();
    window.location.reload();
  };
  return (
    <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/5 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-stone-400"><b className="text-rose-200">Reset save</b>: erase <b>everything</b>, including the house, the {meta.family} family, Scrapbook, postcards, milestones and perks. Export first if you might want it back!</div>
        {!open && <Btn onClick={() => setOpen(true)}>Reset save…</Btn>}
      </div>
      {open && (
        <div className="mt-2 space-y-1.5">
          <label className="block text-[11px] text-stone-300">Type the family name <b className="select-all text-amber-200">{meta.family}</b> to confirm:</label>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} placeholder={meta.family}
            onKeyDown={(e) => { if (e.key === 'Enter') reset(); if (e.key === 'Escape') { setOpen(false); setTyped(''); } }}
            className={`w-full rounded-lg border bg-black/40 px-2 py-1.5 text-sm text-stone-100 outline-none ${ok ? 'border-rose-400' : 'border-white/15 focus:border-amber-300/60'}`} />
          <div className="flex gap-1.5">
            <Btn onClick={() => { setOpen(false); setTyped(''); }}>Keep everything</Btn>
            <Btn disabled={!ok} className={ok ? '!border-rose-400 !bg-rose-500/80 !text-white' : ''} onClick={reset}>Erase everything forever</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
