// The welcome-back card: time away, gains, and anything that happened while you were gone.
import type { Game } from '../../game/engine';
import { fmtNum } from '../../game/engine';
import { RES_INFO, Res } from '../../content/index';
import { meta } from '../../game/family/meta';
import { offlineCapSec } from '../../game/family/bonuses';
import type { OfflineReport as Report } from '../../game/sim/offline';
import { Modal, Btn } from '../common/ui';

const fmtDur = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${m}m` : `${Math.max(1, m)} min`; };

export function OfflineReport({ game, report, welcome, onClose }: { game: Game; report: Report; welcome: string; onClose: () => void }) {
  return (
    <Modal title="🌙 While you were away…" onClose={onClose}>
      <p className="text-base font-bold text-amber-100">{welcome}</p>
      <p className="mt-1 text-sm text-stone-300">The house kept rolling for <b className="text-amber-200">{fmtDur(report.seconds)}</b>{report.seconds >= offlineCapSec() - 1 ? ' (the most it can manage on its own)' : ''}. It gathered:</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(report.gains).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/5 p-3 text-center">
            <div className="text-2xl">{k === 'coins' ? '🪙' : RES_INFO[k as Res]?.icon}</div>
            <div className="text-lg font-black text-amber-100">+{fmtNum(v as number)}</div>
          </div>
        ))}
        {!Object.keys(report.gains).length && <div className="col-span-full text-sm text-stone-500">…mostly naps. Play a bit longer so it learns your income rate.</div>}
      </div>
      {(report.events.length > 0 || game.visitor || meta.cat) && (
        <div className="mt-3 space-y-1 rounded-xl bg-white/[0.04] p-2.5 text-xs text-stone-300">
          {meta.cat && <div>🐈 {meta.cat.name} slept through most of it, in a sunbeam.</div>}
          {report.events.slice(0, 6).map((e, i) => <div key={i}>{e}</div>)}
          {game.visitor && !report.events.some((e) => e.includes('waiting')) && <div>{game.visitor.icon} {game.visitor.title} is waiting at the door.</div>}
        </div>
      )}
      <p className="mt-3 text-[11px] text-stone-500">Away earnings grow with Comfort and the Long Naps family upgrade. Nothing is ever lost while you're gone.</p>
      <div className="mt-4 text-right"><Btn active onClick={onClose}>Lovely</Btn></div>
    </Modal>

  );
}
