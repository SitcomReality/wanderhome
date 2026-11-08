// The animated workbench canvas: draws the house, ghosts, synergy highlights and handles cell clicks.
import { useEffect, useRef } from 'react';
import { FRAMES, GRID_MAX_W, LOCOS, MOD } from '../../content/index';
import { drawPart } from '../../game/art/moduleArt';
import { drawTurret } from '../../game/art/turretArt';
import type { Game } from '../../game/engine';
import { CELL } from '../../game/engine';
import { Stats } from '../../game/vehicleStats';
import { activeCell, benchScale } from './util';

export interface WorkbenchProps {
  game: Game; pick: string | null; sel: number | null; hover: number | null; preview: { st: Stats } | null;
  setPick: (id: string | null) => void; setSel: (n: number | null) => void; setHover: (n: number | null) => void; refresh: () => void;
}
export function Workbench({ game, pick, sel, hover, preview, setPick, setSel, setHover, refresh }: WorkbenchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ pick, sel, hover });
  stateRef.current = { pick, sel, hover };
  const previewRef = useRef(preview);
  previewRef.current = preview;
  const active = (idx: number) => activeCell(game, idx);
  const selDef = sel !== null && game.grid[sel] ? MOD[game.grid[sel]!] : null;

  // canvas workbench
  useEffect(() => {
    const cv = canvasRef.current!, wrap = wrapRef.current!;
    const ctx = cv.getContext('2d')!;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const loop = (now: number) => {
      const W = wrap.clientWidth, H = wrap.clientHeight;
      if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      const t = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // workshop floor
      const g = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, '#2d3a52'); g.addColorStop(1, '#141824');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(127,209,232,0.07)'; ctx.lineWidth = 1;
      for (let x = (W / 2) % 20; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = (H / 2) % 20; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const S = benchScale(game, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.scale(S, S);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2, 3, game.hw + 8, game.hh + 7, 0, 0, Math.PI * 2); ctx.fill();
      game.drawVehicleLocal(ctx, t, { garage: true, speed: 4 });
      const { pick: pk, sel: sl, hover: hv } = stateRef.current;
      const pv = previewRef.current;
      const pickEdge = pk ? MOD[pk]?.tags?.includes('edge') : false;
      for (let gy = 0; gy < game.gridH; gy++) for (let gx = 0; gx < game.gridW; gx++) {
        const idx = gy * GRID_MAX_W + gx;
        const p = game.cellLocal(idx);
        const x = p.x - CELL / 2, y = p.y - CELL / 2;
        const empty = !game.grid[idx];
        const edge = gx === 0 || gy === 0 || gx === game.gridW - 1 || gy === game.gridH - 1;
        if (empty) {
          ctx.setLineDash([1, 1]); ctx.strokeStyle = pk ? (pickEdge && !edge ? 'rgba(255,180,90,0.6)' : 'rgba(110,231,160,0.7)') : 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.25;
          ctx.strokeRect(x + 0.6, y + 0.6, CELL - 1.2, CELL - 1.2); ctx.setLineDash([]);
        }
        // synergy deltas
        if (pv) {
          const a = game.st.cells.get(idx), b = pv.st.cells.get(idx);
          if (a && b && a.def.id === b.def.id) {
            const sa = a.mul * a.range * a.rate * a.power / a.burn, sb = b.mul * b.range * b.rate * b.power / b.burn;
            if (Math.abs(sb - sa) > 0.01) {
              ctx.fillStyle = sb > sa ? `rgba(110,231,160,${0.25 + 0.15 * Math.sin(t * 6)})` : `rgba(255,100,110,${0.25 + 0.15 * Math.sin(t * 6)})`;
              ctx.fillRect(x, y, CELL, CELL);
            }
          }
        }
        if (idx === sl) { ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 0.6; ctx.strokeRect(x + 0.3, y + 0.3, CELL - 0.6, CELL - 0.6); }
        else if (idx === hv) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.4; ctx.strokeRect(x + 0.3, y + 0.3, CELL - 0.6, CELL - 0.6); }
      }
      // ghost of pick / moved part
      if (hv !== null && active(hv)) {
        const ghost = sl !== null ? game.grid[sl] : pk && !game.grid[hv] ? pk : null;
        if (ghost && sl !== hv) {
          const p = game.cellLocal(hv);
          ctx.save(); ctx.globalAlpha = 0.65 + 0.2 * Math.sin(t * 5); ctx.translate(p.x, p.y);
          drawPart(ctx, ghost, CELL - 0.6, t);
          const w = MOD[ghost]?.weapon; if (w) drawTurret(ctx, w.kind, 0, 0, CELL - 0.6, t);
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(252,211,77,0.75)'; ctx.font = '700 11px ui-rounded, system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('FRONT ➜', W - 12, H / 2);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const cellAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const W = r.width, H = r.height;
    const S = benchScale(game, W, H);
    const lx = (e.clientX - r.left - W / 2) / S, ly = (e.clientY - r.top - H / 2) / S;
    const gx = Math.floor(lx / CELL + game.gridW / 2), gy = Math.floor(ly / CELL + game.gridH / 2);
    if (gx < 0 || gy < 0 || gx >= game.gridW || gy >= game.gridH) return null;
    return gy * GRID_MAX_W + gx;
  };
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const idx = cellAt(e);
    if (idx === null) { setSel(null); return; }
    const id = game.grid[idx];
    if (sel !== null) {
      if (sel !== idx) game.moveModule(sel, idx);
      setSel(null); refresh(); return;
    }
    if (pick && !id) { if (game.placeModule(idx, pick)) { refresh(); if (!game.canAfford(MOD[pick].cost)) setPick(null); } return; }
    if (id) { setSel(idx); setPick(null); }
  };

  return (
    <div ref={wrapRef} className="relative min-h-[220px] flex-1">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-pointer" onClick={onClick} onMouseMove={(e) => setHover(cellAt(e))} onMouseLeave={() => setHover(null)}
        onContextMenu={(e) => { e.preventDefault(); setPick(null); setSel(null); }} />
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/50 px-2 py-1 text-[11px] text-stone-300">
        {FRAMES.find((f) => f.id === game.frame)?.name} · {LOCOS.find((l) => l.id === game.loco)?.name} · {game.gridW}×{game.gridH}
      </div>
      {(pick || sel !== null) && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-amber-100">
          {pick ? <>Placing <b>{MOD[pick].name}</b>: click an empty cell · right-click to cancel</> : <>Moving <b>{selDef?.name}</b>: click a cell to swap · right-click to cancel</>}
        </div>
      )}
    </div>
  );
}
