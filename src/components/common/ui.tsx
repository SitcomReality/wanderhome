import { ReactNode, useEffect, useRef } from 'react';
import { Cost, RES_INFO, Res } from '../../content/index';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { drawPartIcon } from '../../game/art/partIcon';

export function PartIcon({ id, size = 44, animate = false, className = '' }: { id: string; size?: number; animate?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr; cv.height = size * dpr;
    const ctx = cv.getContext('2d')!;
    let raf = 0;
    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      drawPartIcon(ctx, id, size, t);
    };
    if (animate) { const loop = (now: number) => { draw(now / 1000); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
    else draw(1.3);
    return () => cancelAnimationFrame(raf);
  }, [id, size, animate]);
  return <canvas ref={ref} className={className} style={{ width: size, height: size }} />;
}

/** Small static canvas painted by `draw` (re-drawn when `k` changes). */
export function CanvasArt({ w, h, draw, k, className = '' }: { w: number; h: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; k: string | number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, w, h]);
  return <canvas ref={ref} className={className} style={{ width: w, height: h }} />;
}

export function Chip({ children, tone = 'neutral', title }: { children: ReactNode; tone?: 'neutral' | 'good' | 'bad' | 'hot' | 'cold' | 'info'; title?: string }) {
  const cls = {
    neutral: 'bg-white/8 text-stone-300 border-white/10',
    good: 'bg-emerald-400/10 text-emerald-200 border-emerald-300/20',
    bad: 'bg-rose-400/10 text-rose-200 border-rose-300/20',
    hot: 'bg-orange-400/15 text-orange-200 border-orange-300/25',
    cold: 'bg-sky-400/15 text-sky-200 border-sky-300/25',
    info: 'bg-violet-400/10 text-violet-200 border-violet-300/20',
  }[tone];
  return <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-[1px] text-[10px] font-semibold ${cls}`}>{children}</span>;
}

export function CostView({ cost, game, className = '' }: { cost: Cost; game: Game; className?: string }) {
  const entries = Object.entries(cost).filter(([, v]) => v);
  if (!entries.length) return <span className={`text-emerald-300 text-xs ${className}`}>Free</span>;
  return (
    <span className={`inline-flex flex-wrap gap-x-2 gap-y-0.5 text-xs ${className}`}>
      {entries.map(([k, v]) => {
        const have = k === 'coins' ? game.coins : game.res[k as Res];
        const ok = have >= (v as number);
        return (
          <span key={k} className={ok ? 'text-stone-200' : 'text-rose-400'}>
            {k === 'coins' ? '🪙' : RES_INFO[k as Res].icon}
            {fmtNum(v as number)}
          </span>
        );
      })}
    </span>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-2 backdrop-blur-[2px] sm:p-6" onMouseDown={onClose}>
      <div
        className={`relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-amber-200/20 bg-[#1d1a22]/95 shadow-2xl shadow-black/60 ${wide ? 'max-w-6xl' : 'max-w-2xl'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-amber-500/15 to-fuchsia-500/10 px-5 py-3">
          <h2 className="font-black tracking-wide text-amber-100 text-lg">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-stone-300 hover:bg-white/10 hover:text-white">✕</button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function Bar({ value, max, color, className = '' }: { value: number; max: number; color: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-black/50 ${className}`}>
      <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Btn({ children, onClick, disabled, active, className = '', title }: { children: ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean; className?: string; title?: string }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? 'border-amber-300 bg-amber-400/90 text-stone-900' : 'border-white/15 bg-white/5 text-stone-100 hover:bg-white/15'
      } ${className}`}
    >
      {children}
    </button>
  );
}
