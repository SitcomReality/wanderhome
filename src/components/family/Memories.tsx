import { useState } from 'react';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { BIOMES, BIOME, RESOURCES, MOBS, LANDMARKS, PARTS, BOOK_CATS, BookCat, BOOK_REWARDS, TOWN_BOOK_TARGET, TIER_COLOR, BIOME_FLAVOR, MOB_FLAVOR, MILESTONES, MILESTONE_GROUPS, MilestoneGroup } from '../../content/index';
import { meta, BookEntry } from '../../game/family/meta';
import { bookFound, bookPct, bookTotal, statValue, milestoneTotals, rewardText, TIER_NAMES, TIER_COLORS } from '../../game/family/index';
import { drawPostcard } from '../../game/art/postcardArt';
import { Modal, Bar, CanvasArt, PartIcon } from '../common/ui';

type Tab = 'book' | 'postcards' | 'milestones' | 'guests';
const LM_ICON: Record<string, string> = { stones: '🪨', statue: '🗽', skeleton: '🦴', airship: '🎈', lighthouse: '🗼', windmill: '🌬️', hut: '🛖', shrine: '⛩️', spring: '♨️', ring: '🍄', obelisk: '🗿', chest: '🧰', crater: '☄️', totem: '🪵', wreck: '⚓', camp: '🏕️' };
const BAND_HINT: Record<string, string> = { deep: 'Somewhere out at sea', shallow: 'In warm coastal waters', shore: 'Along a distant shore', land: 'Out in the wide lowlands', high: 'Up in the highlands', summit: 'At the top of the world' };
const date = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

interface Entry { id: string; name: string; chip: React.ReactNode; flavor: string; hint: string; e?: BookEntry; countLabel: string }

function entriesFor(cat: BookCat, game: Game): Entry[] {
  const book = meta.book[cat];
  switch (cat) {
    case 'biomes': return BIOMES.map((b) => ({ id: b.id, name: b.name, e: book[b.id], countLabel: 'visits', flavor: BIOME_FLAVOR[b.id] ?? '', hint: BAND_HINT[b.band] ?? '',
      chip: <span className="block h-8 w-8 rounded-lg border border-black/30" style={{ background: `linear-gradient(135deg, rgb(${b.color.join(',')}), rgb(${b.color.map((c) => c * 0.7).join(',')}))` }} /> }));
    case 'resources': return RESOURCES.map((r) => ({ id: r.id, name: r.name, e: book[r.id], countLabel: 'pickups', flavor: r.found, hint: `A ${r.tier} resource`,
      chip: <span className="text-2xl">{r.icon}</span> }));
    case 'critters': return MOBS.map((m) => ({ id: m.id, name: m.name, e: book[m.id], countLabel: 'bonked', flavor: MOB_FLAVOR[m.id] ?? '', hint: m.biomes.length ? `Roams the ${BIOME[m.biomes[0]]?.name ?? 'wilds'}` : 'Roams far from home',
      chip: <span className="block h-7 w-7 rounded-full border-2 border-black/30" style={{ background: m.color }} /> }));
    case 'landmarks': return LANDMARKS.map((l) => ({ id: l.id, name: l.name, e: book[l.id], countLabel: 'visits', flavor: l.lines[0] ?? '', hint: l.where === 'any' ? 'Could be anywhere' : 'Found in certain lands',
      chip: <span className="text-2xl">{LM_ICON[l.shape] ?? '🗿'}</span> }));
    case 'blueprints': return PARTS.map((p) => ({ id: p.id, name: p.name, e: book[p.id], countLabel: 'learned', flavor: p.desc, hint: `A ${p.catName.toLowerCase()} design`,
      chip: book[p.id] ? <PartIcon id={p.id} size={32} /> : <span className="text-xl">📐</span> }));
    case 'towns': {
      const out: Entry[] = Object.entries(book).map(([id, e]) => {
        const kt = game.towns[id.split(':').slice(1).join(':')];
        const name = e.name ?? kt?.name ?? 'A town', biome = e.biome ?? kt?.biome ?? 'grass';
        return { id, name, e, countLabel: 'visits', flavor: `A ${BIOME[biome]?.name ?? 'quiet'} town${e.gen !== meta.generation ? ` (met by generation ${e.gen})` : ''}.`, hint: '',
          chip: <span className="flex h-8 w-8 items-center justify-center rounded-lg text-lg" style={{ background: `rgb(${(BIOME[biome]?.color ?? [120, 160, 90]).join(',')})` }}>🏘️</span> };
      });
      for (let i = out.length; i < TOWN_BOOK_TARGET; i++) out.push({ id: 'unknown' + i, name: '???', countLabel: '', flavor: '', hint: 'A town yet to be met', chip: <span className="text-xl">🏘️</span> });
      return out;
    }
  }
}

function Scrapbook({ game }: { game: Game }) {
  const [cat, setCat] = useState<BookCat>('biomes');
  const entries = entriesFor(cat, game);
  const claimed = meta.bookRewards[cat] ?? 0;
  return (
    <>
      <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {BOOK_CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-xl border p-2 text-left transition ${cat === c.id ? 'border-amber-300/60 bg-amber-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'}`}>
            <div className="text-sm font-bold text-stone-100">{c.icon} {c.name}</div>
            <Bar value={bookPct(c.id)} max={100} color="#ffc8dd" className="mt-1 !h-1.5" />
            <div className="mt-0.5 text-[10px] text-stone-500">{Math.floor(bookPct(c.id))}%</div>
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
        <span>{bookFound(cat)} / {bookTotal(cat)} found · rewards:</span>
        {BOOK_REWARDS[cat].map((r, i) => (
          <span key={i} className={`rounded-md border px-1.5 py-0.5 ${i < claimed ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200' : 'border-white/10 text-stone-400'}`}>
            {i < claimed ? '✓' : `${(i + 1) * 25}%`} {rewardText(r).join(' ')}
          </span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((x) => x.e ? (
          <div key={x.id} className="flex gap-2.5 rounded-xl border border-white/10 bg-gradient-to-br from-[#2a2430] to-[#211d26] p-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">{x.chip}</div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2"><b className="truncate text-sm text-stone-100">{x.name}</b>{cat === 'resources' && <span className="text-[9px] uppercase" style={{ color: TIER_COLOR[RESOURCES.find((r) => r.id === x.id)?.tier ?? 'common'] }}>{RESOURCES.find((r) => r.id === x.id)?.tier}</span>}</div>
              <div className="text-[11px] italic leading-snug text-stone-400">{x.flavor}</div>
              <div className="mt-0.5 text-[10px] text-stone-500">First seen {date(x.e.first)} · {x.countLabel} ×{fmtNum(x.e.count)}</div>
            </div>
          </div>
        ) : (
          <div key={x.id} className="flex gap-2.5 rounded-xl border border-dashed border-white/10 bg-black/20 p-2.5 opacity-70">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/40 text-xl text-stone-600 grayscale brightness-0 invert-[.25]">{cat === 'blueprints' || cat === 'towns' ? '?' : x.chip}</div>
            <div className="min-w-0"><b className="text-sm text-stone-500">???</b><div className="text-[11px] text-stone-600">{x.hint}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function Postcards() {
  const [limit, setLimit] = useState(36);
  if (!meta.postcards.length) return <p className="text-sm text-stone-500">No postcards yet. Your first new biome, landmark or town will send one home.</p>;
  return (
    <>
      <p className="mb-3 text-xs text-stone-400">{meta.postcards.length} postcards on the wall, kept across every generation.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {meta.postcards.slice(0, limit).map((c) => (
          <figure key={c.id} className="rotate-[-0.6deg] rounded-lg bg-[#f6efe2] p-1.5 shadow-lg shadow-black/40 transition hover:rotate-0 even:rotate-[0.8deg]">
            <CanvasArt w={156} h={100} k={c.id} className="w-full rounded" draw={(ctx, w, h) => drawPostcard(ctx, w, h, c)} />
            <figcaption className="px-0.5 pt-1">
              <div className="truncate text-[11px] font-black text-stone-800">{c.title}</div>
              <div className="text-[10px] italic leading-snug text-stone-600">“{c.line}”</div>
              <div className="mt-0.5 text-[9px] text-stone-500">{date(c.date)} · Gen {c.gen}</div>
            </figcaption>
          </figure>
        ))}
      </div>
      {limit < meta.postcards.length && <div className="mt-3 text-center"><button className="text-xs text-sky-300" onClick={() => setLimit(limit + 36)}>Show more…</button></div>}
    </>
  );
}

function Milestones({ game }: { game: Game }) {
  const [filter, setFilter] = useState<MilestoneGroup | 'all' | 'open'>('all');
  const tot = milestoneTotals();
  const list = MILESTONES.filter((m) => filter === 'all' || (filter === 'open' ? (meta.milestones[m.id] ?? 0) < m.tiers.length : m.group === filter));
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-[180px] flex-1"><div className="mb-0.5 flex justify-between text-xs text-stone-300"><b>Milestones</b><span>{tot.got} / {tot.all} tiers · {Math.floor(tot.pct)}%</span></div><Bar value={tot.got} max={tot.all} color="#ffd166" /></div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {(['all', 'open', ...MILESTONE_GROUPS] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${filter === f ? 'bg-amber-300 text-stone-900' : 'bg-white/5 text-stone-300 hover:bg-white/10'}`}>{f === 'all' ? 'All' : f === 'open' ? 'In progress' : f}</button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((m) => {
          const tier = Math.min(m.tiers.length, meta.milestones[m.id] ?? 0);
          const done = tier >= m.tiers.length;
          const v = statValue(game, m.stat);
          const goal = done ? m.tiers[m.tiers.length - 1] : m.tiers[tier];
          const prev = tier > 0 && !done ? m.tiers[tier - 1] : 0;
          return (
            <div key={m.id} className={`rounded-xl border p-2.5 ${done ? 'border-amber-300/30 bg-amber-400/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><b className="text-sm text-stone-100">{m.name}</b>
                    <span className="flex gap-0.5">{m.tiers.map((_, i) => <span key={i} title={m.tiers.length > 1 ? TIER_NAMES[i] : 'Done'} className="h-3 w-3 rounded-full border border-black/40" style={{ background: i < tier ? (m.tiers.length > 1 ? TIER_COLORS[i] : '#ffd166') : 'rgba(255,255,255,0.08)' }} />)}</span></div>
                  <div className="text-[11px] text-stone-400">{m.desc}</div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-stone-400">
                <Bar value={done ? 1 : v - prev} max={done ? 1 : goal - prev} color={done ? '#ffd166' : '#7fd1e8'} />
                <span className="whitespace-nowrap tabular-nums">{fmtNum(Math.floor(Math.min(v, goal) * 10) / 10)} / {fmtNum(goal)}{m.unit ? ` ${m.unit}` : ''}</span>
              </div>
              {!done && <div className="mt-1 text-[10px] text-emerald-300/80">Next: {rewardText(m.rewards[tier] ?? {}).join(' · ') || 'Bragging rights'}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Guestbook() {
  if (!meta.guestbook.length) return <p className="text-sm text-stone-500">No visitors yet. Every so often someone (or something) stops by the house.</p>;
  return (
    <div className="space-y-1.5">
      {meta.cat && <div className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-2 text-sm text-amber-100">🐈 {meta.cat.name} has lived with the family since {date(meta.cat.adopted)}.</div>}
      {meta.guestbook.map((g, i) => (
        <div key={i} className="flex gap-2 rounded-lg bg-white/[0.03] p-2 text-[12px] text-stone-300"><span className="text-lg">{g.icon}</span><div><div>{g.text}</div><div className="text-[10px] text-stone-500">{date(g.date)} · Gen {g.gen}</div></div></div>
      ))}
    </div>
  );
}

export function Memories({ game, onClose, tick, initial = 'book' }: { game: Game; onClose: () => void; tick: number; initial?: Tab }) {
  void tick;
  const [tab, setTab] = useState<Tab>(initial);
  const tabs: [Tab, string][] = [['book', '📖 Scrapbook'], ['postcards', `💌 Postcards (${meta.postcards.length})`], ['milestones', `🏅 Milestones · ${Math.floor(milestoneTotals().pct)}%`], ['guests', '🚪 Guestbook']];
  return (
    <Modal wide onClose={onClose} title={<span>📖 Family Memories <span className="text-sm font-normal text-stone-400">· the {meta.family}s</span></span>}>
      <div className="mb-4 flex flex-wrap gap-1">
        {tabs.map(([t, l]) => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-xs font-black ${tab === t ? 'bg-amber-400 text-stone-900' : 'bg-white/5 text-stone-300 hover:bg-white/10'}`}>{l}</button>)}
      </div>
      {tab === 'book' && <Scrapbook game={game} />}
      {tab === 'postcards' && <Postcards />}
      {tab === 'milestones' && <Milestones game={game} />}
      {tab === 'guests' && <Guestbook />}
    </Modal>
  );
}
