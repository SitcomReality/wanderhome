import { useState } from 'react';
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { RES_LIST, RES_INFO, TERRAIN_INFO, PART, TIER_COLOR } from '../../content/index';
import { TILE } from '../../game/world/world';
import { SETTLEMENT_TIERS, settlementStyle } from '../../game/world/settlement';
import { Modal, Btn, PartIcon, CostView, Bar } from '../common/ui';
import { PartTraits, LocoTerrain } from '../common/PartInfo';
import { LockControl } from './Stores';

type Tab = 'market' | 'workshop' | 'journal';

const ROLE_LABEL: Record<string, string> = {
  gardener: 'gardener', tinker: 'tinker', kid: 'kid', watch: 'watch', baker: 'baker', courier: 'courier',
};

export function TownPanel({ game, onClose, tick }: { game: Game; onClose: () => void; tick: number }) {
  void tick;
  const town = game.docked;
  const [tab, setTab] = useState<Tab>(town ? 'workshop' : 'journal');
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const dist = (x: number, y: number) => Math.round(Math.hypot(x - game.v.x, y - game.v.y) / TILE);
  const goTown = (key: string, x: number, y: number) => {
    let t = key === 'home' ? game.world.homeTown : game.world.townInRegion(...key.split(':').map(Number) as [number, number]);
    if (!t) t = game.nearTowns.find((q) => q.key === key) ?? null;
    const p = t ? game.townApproach(t) : null;
    game.setWaypoint(p?.x ?? x, p?.y ?? y);
    onClose();
  };
  const known = Object.entries(game.towns);
  const tabs: Tab[] = town ? ['workshop', 'market', 'journal'] : ['journal'];
  const seenRes = RES_LIST.filter((r) => game.seenRes.includes(r));
  const defense = town ? game.townDefense(town) : null;
  const prosperity = town ? game.townProsperity(town) : null;
  const style = town ? settlementStyle(town) : null;
  const info = town ? SETTLEMENT_TIERS[town.tier] : null;
  const residents = town ? game.residents.filter((r) => r.townKey === town.key) : [];
  const cat = town ? game.townCats[town.key] : undefined;
  const memory = town ? game.townMemory[town.key] : undefined;
  const offer = town && game.moveOffer?.fromKey === town.key ? game.moveOffer : null;

  return (
    <Modal wide onClose={onClose} title={town ? <span>🏘️ {town.name} <span className="text-sm font-normal text-stone-400">· {info?.label ?? 'settlement'} · {TERRAIN_INFO[town.biome].name}</span></span> : '📒 Travel Journal'}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider ${tab === t ? 'bg-amber-400 text-stone-900' : 'bg-white/5 text-stone-300 hover:bg-white/10'}`}>
            {t === 'workshop' ? '📐 Workshop' : t === 'market' ? '⚖️ Market' : '📒 Journal'}
          </button>
        ))}
        {defense && <span className="rounded-md border border-sky-300/20 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-200" title={`${defense.name}: about ${defense.damage} damage per shot at ${Math.round(defense.range)}px range. Armed from local goods, prosperity and the workshop's wares.`}>🛡️ {defense.name}</span>}
        <span className="ml-auto text-xs text-stone-400">🪙 <b className="text-amber-200">{fmtNum(Math.floor(game.coins))}</b> · 📦 {Math.floor(game.cargoUsed())}/{game.cargoCap}</span>
      </div>

      {town && info && prosperity && style && (
        <div className="mb-3 grid gap-2 md:grid-cols-[1.15fr_1fr]">
          <div className="rounded-xl border border-amber-300/15 bg-amber-400/5 px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <b className="text-sm text-amber-100">{info.icon} {info.label === 'city' ? 'A proper city' : info.label === 'town' ? 'A busy town' : info.label === 'village' ? 'A village' : 'A tiny hamlet'}</b>
              <span className="text-[10px] text-stone-400">{game.residentTowns[town.key] ? residents.length : town.pop} {(game.residentTowns[town.key] ? residents.length : town.pop) === 1 ? 'resident' : 'residents'} · {info.blurb}</span>
            </div>
            <div className="mt-1 text-[11px] text-stone-300"><b className="text-stone-200">{style.name}</b> · local character: {style.specialty}.</div>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-stone-500">
              <span title="Visits and trades are remembered per town">🧠 {memory?.visits ?? 0} visit{memory?.visits === 1 ? '' : 's'} · {memory?.trades ?? 0} traded</span>
              {(memory?.visits ?? 0) > 1 && <span className="font-bold text-amber-200">👋 familiar face</span>}
              {game.movers.length > 0 && <span className="text-sky-200">🚚 {game.movers.length} passenger{game.movers.length > 1 ? 's' : ''} aboard</span>}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/5 px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200/90">{prosperity.icon} {prosperity.label}</span>
              <span className="text-[10px] tabular-nums text-stone-400">{Math.round(prosperity.value)} / 100</span>
            </div>
            <Bar value={prosperity.value} max={100} color="#6ee7b7" className="my-1.5" />
            <div className="text-[10px] leading-relaxed text-stone-400">{prosperity.blurb}. {prosperity.value >= 100 ? 'This town is as comfortable as it gets.' : `Trading here fills the town's little budget; at ${prosperity.next} it will feel a change.`}</div>
          </div>
        </div>
      )}

      {offer && (
        <div className="mb-3 rounded-xl border border-sky-300/25 bg-sky-400/10 px-3 py-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <b className="text-sm text-sky-100">🧳 {offer.def.name} would like a lift to {offer.toName}</b>
            <span className="text-[10px] uppercase tracking-wider text-sky-300/80">{ROLE_LABEL[offer.def.role]} · {offer.def.trait}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-stone-300">They have people in {offer.toName}, or at least a very good excuse.</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Btn active onClick={() => { game.takeMover(); refresh(); }}>Take them aboard</Btn>
            <Btn onClick={() => { game.dismissMoveOffer(); refresh(); }}>Not today</Btn>
            <span className="text-[10px] text-stone-500">They will ride along until you dock at {offer.toName}.</span>
          </div>
        </div>
      )}

      {town && residents.length > 0 && (
        <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-300">🏡 Around {town.name}</span>
            <span className="text-[10px] text-stone-500">{game.residentPhase === 'night' ? '🌙 mostly in for the night' : game.residentPhase === 'dusk' ? '🌆 gathering for the evening' : '☀️ out and about'}</span>
          </div>
          <div className="grid max-h-48 gap-x-4 gap-y-1 overflow-y-auto pr-1 sm:grid-cols-2">
            {residents.map((r) => {
              const bond = game.residentBonds[r.def.id];
              return (
                <div key={r.def.id} className="flex items-baseline gap-1.5 text-[11px]" title={`${ROLE_LABEL[r.def.role] ?? r.def.role} · ${r.def.trait}${r.def.quirk ? ` · ${r.def.quirk}` : ''}`}>
                  <b className="shrink-0" style={{ color: r.def.color }}>{r.def.name}</b>
                  <span className="shrink-0 text-[9px] uppercase tracking-wide text-stone-600">{ROLE_LABEL[r.def.role] ?? r.def.role}</span>
                  <span className="truncate text-stone-400">{r.activity}</span>
                  {(bond?.met ?? 0) > 1 && <span className="shrink-0 text-[9px] text-amber-300" title={`You have met ${bond?.met} days · ${bond?.honks ?? 0} honks · ${bond?.rides ?? 0} rides`}>👋</span>}
                </div>
              );
            })}
          </div>
          {cat && (
            <div className="mt-1 flex items-baseline gap-1.5 border-t border-white/5 pt-1 text-[11px]">
              <b className="shrink-0 text-amber-200">🐈 {cat.name}</b>
              <span className="truncate text-stone-400">{cat.activity}</span>
            </div>
          )}
        </div>
      )}

      {town && tab === 'workshop' && (
        <>
          <p className="mb-3 text-xs text-stone-400">This town's tinkers sell blueprints. Learn one and you can build it in your Workshop forever. Every region stocks different designs, and rarer ones only turn up far from home.</p>
          <div className="grid gap-2 md:grid-cols-2">
            {game.townStock(town).map((id) => {
              const p = PART[id];
              const k = game.known.includes(id);
              const price = game.blueprintPrice(town, id);
              const pinned = game.pins.includes(id);
              return (
                <div key={id} className={`flex gap-3 rounded-xl border p-2.5 ${k ? 'border-emerald-300/20 bg-emerald-400/5' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="shrink-0 rounded-lg bg-black/30 p-1"><PartIcon id={id} size={52} animate /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2"><b className="text-stone-100">{p.name}</b><span className="text-[10px] uppercase tracking-wider text-stone-500">{p.catName}{p.shop && p.shop.tier > 1 ? ` · tier ${p.shop.tier}` : ''}</span></div>
                    <div className="mb-1 text-[11px] text-stone-400">{p.desc}</div>
                    <PartTraits id={id} compact />
                    {p.kind === 'loco' && <LocoTerrain id={id} />}
                    <div className="mt-1 text-[10px] text-stone-500">Build cost: <CostView cost={p.cost} game={game} /></div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {k ? <span className="text-xs font-bold text-emerald-300">✓ Blueprint known</span> : (
                        <>
                          <Btn active disabled={game.coins < price} onClick={() => { game.buyBlueprint(town, id); refresh(); }}>Learn for 🪙{fmtNum(price)}</Btn>
                          <Btn active={pinned} onClick={() => { game.togglePin(id); refresh(); }} title="Add to wishlist">📌 {pinned ? 'Pinned' : 'Pin'}</Btn>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {town && tab === 'market' && (
        <>
          <p className="mb-2 text-[11px] text-stone-500">Selling lots floods the local market, and prices recover over time. Every sale also fills this town's budget, which slowly improves its market, watch and streets. Locked amounts are never auto-sold. Press <b className="text-stone-300">I</b> anywhere to edit locks, collection limits, and build plans in Supplies.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-wider text-stone-500">
                <tr><th className="py-1">Resource</th><th>Have</th><th>Lock</th><th>Sell</th><th>Buy</th><th>Best elsewhere</th><th className="text-right">Trade</th><th className="text-center">Auto</th></tr>
              </thead>
              <tbody>
                {seenRes.map((r) => {
                  const sp = game.townPrice(town, r), bp = game.buyPrice(town, r);
                  const best = game.bestKnown(r, town.key);
                  const margin = best ? best.sell[r] / bp : 0;
                  const have = Math.floor(game.res[r]);
                  const unl = game.sellable(r);
                  return (
                    <tr key={r} className="border-t border-white/5">
                      <td className="py-1.5 font-bold text-stone-100">{RES_INFO[r].icon} {RES_INFO[r].name} <span className="text-[9px] uppercase" style={{ color: TIER_COLOR[RES_INFO[r].tier] }}>{RES_INFO[r].tier}</span></td>
                      <td className="tabular-nums text-stone-300">{have}</td>
                      <td><LockControl game={game} r={r} onChange={refresh} /></td>
                      <td className={sp > RES_INFO[r].base * 1.2 ? 'font-bold text-emerald-300' : sp < RES_INFO[r].base * 0.8 ? 'text-rose-300' : 'text-stone-200'}>{sp.toFixed(1)}</td>
                      <td className="text-stone-300">{Math.ceil(bp)}</td>
                      <td className="text-[11px]">
                        {best ? (
                          <span className={margin > 1.1 ? 'text-emerald-300' : 'text-stone-500'}>
                            {best.sell[r].toFixed(1)} @ {best.name} ({dist(best.x, best.y)}t){margin > 1.1 && <b> +{Math.round((margin - 1) * 100)}%</b>}
                            <button className="ml-1 rounded bg-sky-400/20 px-1 text-sky-200 hover:bg-sky-400/40" onClick={() => goTown(best.key, best.x, best.y)}>go</button>
                          </span>
                        ) : <span className="text-stone-600">—</span>}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <span className="inline-flex gap-1">
                          <Btn disabled={have < 1} onClick={() => { game.sell(town, r, 10); refresh(); }}>−10</Btn>
                          <Btn disabled={unl < 1} onClick={() => { game.sell(town, r, unl); refresh(); }} title="Sell everything above your lock">Sell unlocked</Btn>
                          <Btn disabled={game.coins < bp || game.cargoFree() < 1} onClick={() => { game.buy(town, r, 1); refresh(); }}>+1</Btn>
                          <Btn disabled={game.coins < bp * 10 || game.cargoFree() < 10} onClick={() => { game.buy(town, r, 10); refresh(); }}>+10</Btn>
                        </span>
                      </td>
                      <td className="text-center"><input type="checkbox" className="h-4 w-4 accent-amber-400" checked={game.autoSellRes[r]} onChange={(e) => { game.autoSellRes[r] = e.target.checked; refresh(); }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'journal' && (
        <>
          {!town && <p className="mb-3 text-sm text-stone-400">Not parked at a town. Roll up to one (🚩) to trade and browse its workshop. Here's everything you've learned on the road:</p>}
          {known.length === 0 ? <p className="text-xs text-stone-500">No towns yet. Homeport is just east of where you started.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left uppercase tracking-wider text-stone-500">
                  <tr><th className="py-1">Town</th><th>Kind</th><th>Biome</th><th>Dist</th><th>Places</th>{seenRes.map((r) => <th key={r} title={RES_INFO[r].name}>{RES_INFO[r].icon}</th>)}<th>Workshop</th><th></th></tr>
                </thead>
                <tbody>
                  {known.sort((a, b) => dist(a[1].x, a[1].y) - dist(b[1].x, b[1].y)).map(([k, kt]) => {
                    const tier = kt.tier ? SETTLEMENT_TIERS[kt.tier] : null;
                    const wealth = game.townWealth[k] ?? 0;
                    return (
                      <tr key={k} className="border-t border-white/5">
                        <td className="py-1.5 font-bold text-stone-200">{kt.name}</td>
                        <td className="text-stone-400">{tier ? `${tier.icon} ${tier.label}` : k === 'home' ? '🏡 village' : '—'}</td>
                        <td className="text-stone-400">{TERRAIN_INFO[kt.biome].name}</td>
                        <td className="text-stone-400">{dist(kt.x, kt.y)}t</td>
                        <td className="text-stone-400">{kt.pop ?? '—'} · {wealth >= 75 ? '✨' : wealth >= 50 ? '🏮' : wealth >= 25 ? '🪴' : '🌱'}</td>
                        {seenRes.map((r) => {
                          const best = game.bestKnown(r);
                          const isBest = best?.key === k && known.length > 1;
                          return <td key={r} className={isBest ? 'font-black text-emerald-300' : 'text-stone-300'}>{kt.sell[r].toFixed(0)}</td>;
                        })}
                        <td>
                          <span className="flex gap-0.5">
                            {kt.stock.map((id) => <span key={id} title={`${PART[id]?.name}${game.known.includes(id) ? ' (known)' : ''}`} className={game.known.includes(id) ? 'opacity-35' : ''}><PartIcon id={id} size={20} /></span>)}
                          </span>
                        </td>
                        <td><button className="rounded bg-sky-400/20 px-1.5 text-sky-200 hover:bg-sky-400/40" onClick={() => goTown(k, kt.x, kt.y)}>go</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
