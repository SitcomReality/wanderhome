// Compact stat grid for a run (retirement preview & the family shelf).
import { BIOME } from '../../content/index';
import { fmtNum } from '../../game/engine';
import { PastGen } from '../../game/family/meta';

const fmtTime = (sec: number) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; };

export function SummaryGrid({ s }: { s: PastGen }) {
  const rows: [string, string][] = [
    ['Time on road', fmtTime(s.playTime)], ['Tiles rolled', fmtNum(s.distance)], ['Net worth', '🪙 ' + fmtNum(s.netWorth)], ['Coins earned', fmtNum(s.earned)],
    ['Biomes', String(s.biomes)], ['Towns', String(s.towns)], ['Landmarks', String(s.landmarks)], ['Favourite', BIOME[s.favorite]?.name ?? '—'],
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {rows.map(([k, v]) => <div key={k} className="rounded-lg bg-white/5 px-2 py-1.5"><div className="text-[10px] text-stone-500">{k}</div><div className="truncate text-sm font-black text-stone-100">{v}</div></div>)}
    </div>
  );
}
