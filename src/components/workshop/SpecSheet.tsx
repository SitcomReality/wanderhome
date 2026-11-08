// Live vehicle stats with a preview of the hovered change.
import { RES_INFO, Res } from '../../content/index';
import type { Game } from '../../game/engine';
import { nominalSpeed } from '../../game/engine';
import { Stats } from '../../game/vehicleStats';
import { TILE } from '../../game/world/world';
import { Chip } from '../common/ui';
import { StatRow } from './StatRow';

export function SpecSheet({ game, nst }: { game: Game; nst?: Stats }) {
  const st = game.st;
  const spd = (s: Stats) => nominalSpeed(s, game.loco) / TILE;
  return (
    <div className="space-y-1">
      <StatRow label="Speed" cur={spd(st)} next={nst && spd(nst)} fmt={(n) => `${n.toFixed(2)}t/s`} max={4} />
      <StatRow label="Power" cur={st.powerMax} next={nst?.powerMax} max={80} />
      <StatRow label="Weight" cur={st.weight} next={nst?.weight} fmt={(n) => n.toFixed(1)} invert max={60} />
      <StatRow label="Cargo" cur={st.cargoCap} next={nst?.cargoCap} max={800} />
      <StatRow label="Hull" cur={st.maxHp} next={nst?.maxHp} max={600} />
      <StatRow label="Firepower" cur={st.dps} next={nst?.dps} max={150} />
      <StatRow label="Comfort" cur={st.comfort} next={nst?.comfort} fmt={(n) => n.toFixed(1)} max={40} />
      <div className="flex flex-wrap gap-1 pt-0.5 text-[10px] text-stone-400">
        <span>Upkeep:</span>
        {Object.entries((nst ?? st).upkeep).length ? Object.entries((nst ?? st).upkeep).map(([r, v]) => <Chip key={r}>{RES_INFO[r as Res].icon} {((v as number) * 60).toFixed(1)}/min</Chip>) : <Chip tone="good">none</Chip>}
        <span className="ml-1">Regen {(nst ?? st).regen.toFixed(1)}/s · Pull {(nst ?? st).magnet}</span>
      </div>
    </div>
  );
}
