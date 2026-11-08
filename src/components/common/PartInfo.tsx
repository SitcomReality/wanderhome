import type { ReactElement } from 'react';
import { MOD, LOCO, FRAME, PART, RES_INFO, Res, GROUNDS, BIOMES } from '../../content/index';
import { Chip } from './ui';

const rn = (r: Res) => `${RES_INFO[r].icon} ${RES_INFO[r].name}`;

export function PartTraits({ id, compact = false }: { id: string; compact?: boolean }) {
  const p = PART[id];
  if (!p) return null;
  const chips: ReactElement[] = [];
  const add = (k: string, tone: Parameters<typeof Chip>[0]['tone'], text: string, title?: string) => chips.push(<Chip key={k} tone={tone} title={title}>{text}</Chip>);

  if (p.kind === 'module') {
    const m = MOD[id];
    if (m.power && m.power > 0) add('pw', 'good', `⚡ +${m.power}${m.solar ? ' by day' : m.sail ? ' × wind' : ''}`);
    if (m.power && m.power < 0) add('pwd', 'bad', `⚡ ${m.power} drain`);
    if (m.burns) add('burn', 'neutral', `burns ${rn(m.burns.res)} ${(m.burns.rate * 60).toFixed(1)}/min`);
    if (!m.burns && m.power && m.power > 0 && !m.solar && !m.sail) add('free', 'good', 'no fuel');
    if (m.cargo) add('cg', 'good', `📦 +${m.cargo}`);
    if (m.hp) add('hp', m.hp > 0 ? 'good' : 'bad', `❤️ ${m.hp > 0 ? '+' : ''}${m.hp} hull`);
    if (m.regen) add('rg', 'good', `🔧 +${m.regen}/s`);
    if (m.comfort) add('cf', m.comfort > 0 ? 'good' : 'bad', `🛋️ ${m.comfort > 0 ? '+' : ''}${m.comfort} comfort`);
    if (m.harvest?.bonus) add('hv', 'good', `${m.harvest.bonus.map((r) => RES_INFO[r].icon).join('')} ×${m.harvest.bonusMul}`);
    if (m.harvest?.rate && !compact) add('rng', 'neutral', `reach ${m.harvest.range}`);
    if (m.harvest?.find) add('find', 'info', `finds ${m.harvest.find.map((f) => RES_INFO[f.res].icon).join('')}`);
    if (m.harvest?.magnet) add('mg', 'good', `🧲 +${m.harvest.magnet} pull`);
    if (m.weapon) {
      add('dps', 'neutral', `💥 ${(m.weapon.dmg * m.weapon.rate).toFixed(0)} dps${m.weapon.splash ? ' splash' : ''}`);
      if (!compact) add('wr', 'neutral', `range ${m.weapon.range}`);
      add('ammo', m.weapon.ammo ? 'neutral' : 'good', m.weapon.ammo ? `ammo: ${rn(m.weapon.ammo.res)}` : 'no ammo');
      if (m.weapon.effect === 'poison') add('fx', 'info', '☠️ poisons');
      if (m.weapon.effect === 'slow' || m.weapon.kind === 'bubble') add('fx', 'cold', '🐌 slows');
      if (m.weapon.effect === 'burn') add('fx', 'hot', '🔥 ignites');
    }
    if (m.process) add('pr', 'info', `${Object.entries(m.process.input).map(([r, n]) => `${n}${RES_INFO[r as Res].icon}`).join('+')} → ${Object.entries(m.process.output).map(([r, n]) => `${n}${RES_INFO[r as Res].icon}`).join('')} /${m.process.every}s`);
    if (m.shield) add('sh', 'good', '🛡️ blocks hits');
    if (m.scare) add('sc', 'good', '👻 fewer critters');
    if (m.preserve) add('pres', 'good', 'rare goods +15% value');
    if (m.light) add('lt', 'good', 'big night light');
    for (const t of m.tags ?? []) {
      if (t === 'noisy') add('t' + t, 'bad', '📢 noisy', 'Annoys comfort parts next to it');
      if (t === 'hot') add('t' + t, 'hot', '🔥 hot', 'Speeds up heat-loving neighbours, warms comfort, lifts balloons');
      if (t === 'cold') add('t' + t, 'cold', '❄️ cold', 'Cools weapons (+fire rate) and hot engines (−fuel)');
      if (t === 'edge') add('t' + t, 'neutral', '▣ edge-mounted', 'Weaker when placed away from the hull edge');
      if (t === 'quiet' && !compact) add('t' + t, 'good', '🤫 quiet');
    }
    add('wt', m.weight < 0 ? 'good' : m.weight >= 3 ? 'bad' : 'neutral', `⚖️ ${m.weight}`);
  } else if (p.kind === 'loco') {
    const l = LOCO[id];
    add('sp', l.speed >= 1 ? 'good' : 'neutral', `💨 ×${l.speed}`);
    add('wt', l.weight >= 4 ? 'bad' : 'neutral', `⚖️ ${l.weight}`);
    if (l.hp) add('hp', l.hp > 0 ? 'good' : 'bad', `❤️ ${l.hp > 0 ? '+' : ''}${l.hp}`);
  } else {
    const f = FRAME[id];
    add('wt', f.wpc <= 0.2 ? 'good' : f.wpc >= 0.8 ? 'bad' : 'neutral', `⚖️ ${f.wpc}/cell`);
    if (f.hpc) add('hp', f.hpc > 0 ? 'good' : 'bad', `❤️ ${f.hpc > 0 ? '+' : ''}${f.hpc}/cell`);
    if (f.comfort) add('cf', 'good', `🛋️ +${f.comfort}`);
    if (f.solarMul) add('sol', 'good', `☀️ ×${f.solarMul}`);
    if (f.rpc) add('rpc', 'good', `🔧 +${f.rpc}/s per cell`);
  }
  return <div className="flex flex-wrap gap-1">{chips}</div>;
}

/** Speed chip per ground type. Hover a chip to see which biomes use that ground. */
export function LocoTerrain({ id }: { id: string }) {
  const l = LOCO[id];
  return (
    <div className="mt-1 flex flex-wrap gap-[3px]">
      {GROUNDS.map((g) => {
        const m = l.ground[g.id] ?? 0;
        const n = parseInt(g.color.slice(1), 16), lum = ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
        const biomes = BIOMES.filter((b) => b.ground === g.id).map((b) => b.name).join(', ');
        return (
          <div key={g.id} title={`${g.name}: ${m ? `×${m}` : 'impassable'}\n(${biomes})`} className="flex min-w-[30px] flex-col items-center rounded-[4px] border border-black/30 px-0.5 text-[9px] font-bold leading-tight"
            style={{ background: g.color, opacity: m ? 1 : 0.35, color: lum > 520 ? '#222' : '#fff' }}>
            <span className="text-[7px] font-semibold opacity-80">{g.name.split(' ')[0]}</span>
            <span>{m ? m.toFixed(1) : '✕'}</span>
          </div>
        );
      })}
    </div>
  );
}
