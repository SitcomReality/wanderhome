// A small on/off pill used for autopilot switches.


export function Toggle({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button title={title} onClick={onClick} className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition active:scale-95 ${on ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-white/5 text-stone-500'}`}>
      <span className={`h-2 w-2 rounded-full ${on ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-stone-600'}`} />{children}
    </button>
  );
}
