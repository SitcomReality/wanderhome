import { useRef, useState } from 'react';
import type { Game } from '../../game/engine';
import { exportString, downloadSave, parseImport, applyImport, ExportBundle } from '../../game/saveTransfer';
import { Btn } from '../common/ui';
import { ResetSave } from './ResetSave';

export function SaveTransfer({ game }: { game: Game }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [pending, setPending] = useState<{ bundle: ExportBundle; summary: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    const s = exportString(game);
    setCode(s);
    try { await navigator.clipboard.writeText(s); setMsg({ tone: 'ok', text: 'Save code copied to your clipboard.' }); }
    catch { setMsg({ tone: 'ok', text: 'Save code is in the box below. Select it and copy.' }); }
  };
  const check = (text: string) => {
    const r = parseImport(text);
    if (!r.ok) { setPending(null); setMsg({ tone: 'err', text: r.error }); return; }
    setPending({ bundle: r.bundle, summary: r.summary }); setMsg(null);
  };

  return (
    <div className="mt-4">
      <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-amber-300">Save backup</h3>
      <p className="mb-2 text-[11px] text-stone-500">Export copies your house <i>and</i> the family (Scrapbook, postcards, milestones, perks). Import always backs up your current data first.</p>
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={doExport}>📋 Copy save code</Btn>
        <Btn onClick={() => downloadSave(game)}>💾 Download .json</Btn>
        <Btn onClick={() => fileRef.current?.click()}>📂 Load file…</Btn>
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const t = await f.text(); setCode(t.slice(0, 2_000_000)); check(t); } e.target.value = ''; }} />
      </div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste a save code here to import…" rows={3}
        className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[10px] text-stone-300 outline-none focus:border-amber-300/50" />
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Btn disabled={!code.trim()} onClick={() => check(code)}>Check & import…</Btn>
        {msg && <span className={`text-[11px] ${msg.tone === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</span>}
      </div>
      {pending && (
        <div className="mt-2 rounded-xl border border-amber-300/30 bg-amber-400/10 p-2.5 text-xs text-amber-100">
          <div className="mb-1 font-bold">Replace your current game with this save?</div>
          <div className="mb-2 text-stone-300">{pending.summary}</div>
          <div className="flex gap-1.5">
            <Btn active onClick={() => { (globalThis as any).__wanderhausNoSave = true; applyImport(pending.bundle); window.location.reload(); }}>Yes, import & reload</Btn>
            <Btn onClick={() => setPending(null)}>Cancel</Btn>
          </div>
        </div>
      )}
      <ResetSave />
    </div>
  );
}
