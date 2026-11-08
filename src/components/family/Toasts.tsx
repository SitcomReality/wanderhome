// Stack of short-lived toast notifications (milestones, discoveries, visitors).
import type { Game } from '../../game/engine';


export function Toasts({ game, tick }: { game: Game; tick: number }) {
  void tick;
  const now = performance.now();
  const live = game.toasts.filter((t) => now - t.at < 5500);
  if (!live.length) return null;
  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-40 flex w-[min(380px,calc(100%-16px))] -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-28">
      {live.map((t) => (
        <div key={t.id} className="flex w-full animate-[toastin_0.35s_ease-out] items-center gap-2.5 rounded-xl border bg-[#1d1a22]/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{ borderColor: t.color + '66', opacity: Math.min(1, (5500 - (now - t.at)) / 600) }}>
          <span className="text-2xl">{t.icon}</span>
          <div className="min-w-0"><div className="text-sm font-black" style={{ color: t.color }}>{t.title}</div><div className="truncate text-[11px] text-stone-300">{t.text}</div></div>
        </div>
      ))}
    </div>
  );
}
