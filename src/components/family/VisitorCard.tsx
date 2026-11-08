// Non-blocking visitor card. Ignoring it is always fine: it resolves positively on its own.
import { useState } from 'react';
import type { Game } from '../../game/engine';
import { PART, RES_INFO } from '../../content/index';
import { resolveVisitor } from '../../game/family/index';
import { Btn } from '../common/ui';

export function VisitorCard({ game, tick }: { game: Game; tick: number }) {
  void tick;
  const v = game.visitor;
  const [name, setName] = useState('');
  if (!v) return null;
  const left = Math.max(0, v.expires - game.time);
  const act = (c: 'a' | 'b' | 'c') => { game.lastInput = game.time; resolveVisitor(game, c, name, v.id); setName(''); };
  let buttons: React.ReactNode = null;
  switch (v.kind) {
    case 'cat':
      buttons = (<>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={v.data.name} maxLength={18} className="w-28 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-stone-100 outline-none focus:border-amber-300" />
        <Btn active onClick={() => act('a')}>Adopt 💛</Btn><Btn onClick={() => act('b')}>Pat & wave</Btn>
      </>);
      break;
    case 'trader': {
      const rc = Object.entries(v.data.resCost as Record<string, number>)[0];
      buttons = (<>
        {rc && <Btn active disabled={!game.canAfford(v.data.resCost)} onClick={() => act('a')}>Trade {rc[1]} {RES_INFO[rc[0]]?.icon}</Btn>}
        <Btn disabled={game.coins < v.data.coinPrice} onClick={() => act('b')}>Pay {v.data.coinPrice} 🪙</Btn>
        <Btn onClick={() => act('c')}>No thanks</Btn>
      </>);
      break;
    }
    case 'letter': buttons = <Btn active onClick={() => act('a')}>Open the letter</Btn>; break;
    case 'aurora': buttons = <Btn active onClick={() => act('a')}>Lie back & watch</Btn>; break;
    case 'meteors': buttons = <Btn active onClick={() => act('a')}>Make a wish</Btn>; break;
    case 'hitchhiker': buttons = (<><Btn active onClick={() => act('a')}>Hop in!</Btn><Btn onClick={() => act('b')}>Not today</Btn></>); break;
  }
  return (
    <div className="pointer-events-auto absolute left-1/2 top-2 z-30 w-[min(420px,calc(100%-16px))] -translate-x-1/2 animate-[visitorin_0.5s_ease-out] rounded-2xl border border-violet-200/25 bg-[#211c2b]/92 p-3 shadow-2xl shadow-black/50 backdrop-blur sm:top-3">
      <div className="flex items-start gap-3">
        <div className="text-3xl drop-shadow">{v.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-violet-100">{v.title}</div>
          <div className="text-xs leading-snug text-stone-300">{v.text}</div>
          {v.kind === 'trader' && PART[v.data.partId] && <div className="mt-0.5 text-[10px] text-stone-500">{PART[v.data.partId].catName} · {PART[v.data.partId].desc}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">{buttons}</div>
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-300/60 transition-[width] duration-200" style={{ width: `${(left / v.linger) * 100}%` }} /></div>
      <div className="mt-0.5 text-right text-[9px] text-stone-500">No rush. If you're busy, it'll sort itself out nicely.</div>
    </div>
  );
}
