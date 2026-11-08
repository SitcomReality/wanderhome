// Title screen: journey-so-far card, continue, and starting a new house from a seed.
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { BIOME } from '../../content/index';
import { meta, bookCount, favoriteBiome } from '../../game/family/meta';
import { randomSeed } from '../../app/bootGame';

export interface TitleProps { game: Game; hasSave: boolean; recovered: boolean; seed: string; setSeed: (s: string) => void; onContinue: () => void; onNew: () => void }

export function TitleScreen({ game, hasSave, recovered, seed, setSeed, onContinue, onNew }: TitleProps) {
  const L = meta.lifetime;
  const fav = favoriteBiome(game.biomeTime);
  const showJourney = hasSave || meta.generation > 1 || meta.postcards.length > 0;
  const journey: [string, string][] = [
    ['Generation', String(meta.generation)],
    ['Days on road', fmtNum(Math.floor((L.playTime + (game.played && !game.folded ? game.stats.playTime : 0)) / 480))],
    ['Tiles rolled', fmtNum(Math.floor(L.distance + (game.played && !game.folded ? game.stats.distance : 0)))],
    ['Biomes', String(bookCount('biomes'))],
    ['Towns met', String(bookCount('towns'))],
    ['Favourite', fav ? BIOME[fav]?.name ?? '—' : '—'],
  ];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-[#120f1a]/70 via-[#120f1a]/45 to-[#120f1a]/85 p-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-200/20 bg-[#1d1a22]/85 p-6 text-center shadow-2xl backdrop-blur-md sm:p-7">
        <div className="text-5xl">🏠🛞</div>
        <h1 className="mt-2 bg-gradient-to-r from-amber-200 via-orange-300 to-pink-300 bg-clip-text text-5xl font-black tracking-tight text-transparent">Wanderhome</h1>
        <p className="mt-2 text-sm text-stone-300">An idle little home on wheels that wanders an endless world, collects stuff, bonks critters and makes number go up, while you watch your sitcom.</p>
        {recovered && <p className="mt-2 rounded-lg bg-rose-500/15 p-2 text-[11px] text-rose-200">Your previous save couldn't be read, so it was kept safe as a backup save. Starting fresh for now.</p>}
        {showJourney && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left">
            <div className="mb-2 flex items-baseline justify-between"><b className="text-sm text-amber-100">Journey so far · the {meta.family}s</b>{meta.cat && <span className="text-[11px] text-stone-400">🐈 {meta.cat.name}</span>}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {journey.map(([k, v]) => <div key={k} className="rounded-lg bg-black/25 px-2 py-1"><div className="text-[9px] uppercase tracking-wider text-stone-500">{k}</div><div className="truncate text-sm font-black text-stone-100">{v}</div></div>)}
            </div>
            {meta.postcards[0] && <div className="mt-2 truncate text-[11px] italic text-stone-400">💌 “{meta.postcards[0].line}”</div>}
          </div>
        )}
        {hasSave && (
          <button onClick={() => onContinue()} className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-lg font-black text-stone-900 shadow-lg transition hover:scale-[1.02] active:scale-95">
            Continue journey →
            <div className="text-xs font-semibold opacity-70">seed "{game.seedStr}" · 🪙 {fmtNum(Math.floor(game.coins))}</div>
          </button>
        )}
        <div className="mt-5 text-left">
          <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400">World seed</label>
          <div className="mt-1 flex gap-2">
            <input id="input_seed" value={seed} onChange={(e) => setSeed(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onNew()}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-stone-100 outline-none focus:border-amber-300" />
            <button onClick={() => setSeed(randomSeed())} className="rounded-xl border border-white/15 bg-white/5 px-3 text-lg hover:bg-white/10" title="Random seed">🎲</button>
          </div>
        </div>
        <button onClick={() => onNew()} className={`mt-3 w-full rounded-xl py-3 font-black transition hover:scale-[1.02] active:scale-95 ${hasSave ? 'border border-white/15 bg-white/5 text-stone-200' : 'bg-gradient-to-r from-amber-400 to-orange-400 text-lg text-stone-900 shadow-lg'}`}>
          {hasSave ? 'Start a new house (family & Scrapbook kept)' : 'Begin the journey →'}
        </button>
        <p className="mt-4 text-[11px] text-stone-500">Same seed → same world. Saves automatically. Sound is off by default.</p>
      </div>
    </div>

  );
}
