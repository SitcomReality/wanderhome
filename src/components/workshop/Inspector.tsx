// Details for the hovered / selected part, including its neighbour effects.
import { CAT_INFO, MOD } from '../../content/index';
import type { Game } from '../../game/engine';
import { CellEff } from '../../game/vehicleStats';
import { PartTraits } from '../common/PartInfo';
import { Btn, Chip, PartIcon } from '../common/ui';

export function Inspector({ game, focusEff, pick, sel, setSel, refresh }: { game: Game; focusEff?: CellEff; pick: string | null; sel: number | null; setSel: (n: number | null) => void; refresh: () => void }) {
  const selDef = sel !== null && game.grid[sel] ? MOD[game.grid[sel]!] : null;
  return (
    <div className="min-h-[92px]">
      {focusEff ? (
        <>
          <div className="flex items-center gap-2">
            <PartIcon id={focusEff.def.id} size={36} animate />
            <div className="min-w-0 flex-1">
              <div className="font-black text-stone-100">{focusEff.def.name} <span className="text-[10px] font-semibold text-stone-500">{CAT_INFO[focusEff.def.cat].name}</span></div>
              <div className="truncate text-[11px] text-stone-400">{focusEff.def.desc}</div>
            </div>
            {selDef && sel !== null && selDef.id !== 'cockpit' && <Btn onClick={() => { game.removeModule(sel); setSel(null); refresh(); }}>Scrap ½</Btn>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {focusEff.notes.length ? focusEff.notes.map((n, i) => <Chip key={i} tone={n.good ? 'good' : 'bad'}>{n.text}</Chip>) : <span className="text-[11px] text-stone-500">No neighbour effects.</span>}
          </div>
        </>
      ) : pick ? (
        <div className="flex items-start gap-2">
          <PartIcon id={pick} size={36} animate />
          <div><div className="font-black text-stone-100">{MOD[pick].name}</div><div className="text-[11px] text-stone-400">{MOD[pick].desc}</div><PartTraits id={pick} compact /></div>
        </div>
      ) : (
        <div className="text-[11px] leading-relaxed text-stone-500">
          <b className="text-stone-300">Placement matters:</b> tools and weapons work best on the <b>hull edge</b>. <b className="text-orange-300">Hot</b> parts speed up smelters and kilns, warm comfort parts and lift balloons.
          <b className="text-sky-300"> Cold</b> parts cool weapons and engines. <b className="text-rose-300">Noisy</b> parts ruin comfort, and comfort parts love company.
        </div>
      )}
    </div>
  );
}
