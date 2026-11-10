// Minimap: terrain bitmap, towns (visited / wishlisted), sights, waypoint and the house. Click to set a waypoint.
import { useEffect, useRef } from 'react';
import type { Game } from '../../game/engine';
import { LANDMARK } from '../../content/index';
import { TILE } from '../../game/world/world';

const MM = 150, TPP = 4;

export function Minimap({ game, tick }: { game: Game; tick: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    game.updateMinimap(MM, TPP);
    const cv = ref.current;
    if (!cv || !game.minimapCanvas) return;
    const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, MM, MM);
    ctx.drawImage(game.minimapCanvas, 0, 0);
    const c = game.mmCenterWorld;
    const toM = (x: number, y: number) => [(x - c.x) / (TILE * TPP) + MM / 2, (y - c.y) / (TILE * TPP) + MM / 2];
    for (const t of game.world.townsNear(c.x, c.y, MM * TILE * TPP * 0.75)) {
      const [x, y] = toM(t.x, t.y);
      const kt = game.towns[t.key];
      const hasPin = kt?.stock.some((id) => game.pins.includes(id) && !game.known.includes(id));
      const size = t.tier === 'city' ? 3.4 : t.tier === 'town' ? 2.7 : t.tier === 'village' ? 2.1 : 1.6;
      ctx.fillStyle = '#000'; ctx.fillRect(x - size - 1, y - size - 1, size * 2 + 2, size * 2 + 2);
      ctx.fillStyle = hasPin ? '#7fd1e8' : kt ? '#ffd166' : '#b8b8b8'; ctx.fillRect(x - size, y - size, size * 2, size * 2);
      if (t.tier === 'city') { ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 0.6, y - 3.4, 1.2, 1.2); }
    }
    const span = (MM / 2) * TILE * TPP;
    for (const k in game.visited) {
      const v = game.visited[k];
      if (Math.abs(v.x - c.x) > span || Math.abs(v.y - c.y) > span) continue;
      const [x, y] = toM(v.x, v.y);
      ctx.fillStyle = LANDMARK[v.id]?.repeat ? '#c8a0ff' : '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    const wp = game.waypoint ?? game.tradeRun;
    if (wp) { const [x, y] = toM(wp.x, wp.y); ctx.strokeStyle = '#7fd1e8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.stroke(); }
    const [hx, hy] = toM(game.homeX, game.homeY);
    ctx.fillStyle = '#ff6b9a'; ctx.fillRect(hx - 1, hy - 1, 2, 2);
    const [vx, vy] = toM(game.v.x, game.v.y);
    ctx.save(); ctx.translate(vx, vy); ctx.rotate(game.v.angle);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -3.5); ctx.lineTo(-3, 3.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }, [tick, game]);
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * MM, my = ((e.clientY - r.top) / r.height) * MM;
    const c = game.mmCenterWorld;
    game.setWaypoint(c.x + (mx - MM / 2) * TILE * TPP, c.y + (my - MM / 2) * TILE * TPP);
    game.lastInput = game.time;
  };
  return (
    <div className="pointer-events-auto rounded-xl border border-white/15 bg-black/50 p-1.5 shadow-lg backdrop-blur">
      <canvas ref={ref} width={MM} height={MM} onClick={onClick} className="block h-[140px] w-[140px] cursor-crosshair rounded-lg sm:h-[170px] sm:w-[170px]" style={{ imageRendering: 'pixelated' }} title="Click to set a waypoint" />
      <div className="mt-1 flex justify-between px-1 text-[10px] text-stone-400"><span><span className="text-amber-300">■</span> town <span className="text-sky-300">■</span> wish <span className="text-violet-300">●</span> sight</span><span>click = go</span></div>
    </div>
  );
}
