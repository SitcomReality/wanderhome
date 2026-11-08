// One row of the Workshop spec sheet: current value with a green/red preview of a hovered change.


export function StatRow({ label, cur, next, fmt = (n: number) => n.toFixed(0), invert = false, max }: { label: string; cur: number; next?: number; fmt?: (n: number) => string; invert?: boolean; max: number }) {
  const d = next !== undefined ? next - cur : 0;
  const good = invert ? d < 0 : d > 0;
  const pct = Math.min(100, (Math.max(0, next ?? cur) / max) * 100);
  return (
    <div className="grid grid-cols-[74px_1fr_auto] items-center gap-2 text-[11px]">
      <span className="text-stone-400">{label}</span>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-black/40">
        <div className="absolute inset-y-0 left-0 rounded-full bg-amber-300/70" style={{ width: `${Math.min(100, (Math.max(0, cur) / max) * 100)}%` }} />
        {next !== undefined && Math.abs(d) > 0.001 && <div className={`absolute inset-y-0 left-0 rounded-full ${good ? 'bg-emerald-400' : 'bg-rose-400'} opacity-70`} style={{ width: `${pct}%` }} />}
      </div>
      <span className="w-[86px] text-right tabular-nums text-stone-100">
        {fmt(next ?? cur)}
        {next !== undefined && Math.abs(d) > 0.001 && <b className={`ml-1 ${good ? 'text-emerald-300' : 'text-rose-300'}`}>{d > 0 ? '+' : ''}{fmt(d)}</b>}
      </span>
    </div>
  );
}
