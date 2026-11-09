// Draws one frame of the world: terrain, objects, critters, the house, lighting, particles and popups.
import type { Game } from '../engine';
import { TAU } from '../core/constants';
import { NODE, RES_INFO } from '../../content/index';
import { drawAvatar } from '../art/avatarArt';
import { drawMob } from '../art/mobArt';
import { drawShadow } from '../art/primitives';
import { drawTown } from '../art/townArt';
import { drawLandmark } from '../art/landmarkArt';
import { drawSkyFx } from '../art/houseArt';
import { drawNode } from '../art/nodeArt';
import { TOWN_SAFE_RADIUS } from '../sim/towns';
import { CHUNK_PX } from '../world/world';

export function render(g: Game, ctx: CanvasRenderingContext2D, W: number, H: number) {
  const z = g.cam.zoom * g.dpr;
  const sh = g.shakeAmt * g.settings.shake;
  const ox = (Math.random() - 0.5) * sh * 2, oy = (Math.random() - 0.5) * sh * 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1b2433';
  ctx.fillRect(0, 0, W, H);
  const camX = Math.round(g.cam.x * z) / z, camY = Math.round(g.cam.y * z) / z;
  ctx.setTransform(z, 0, 0, z, Math.round(W / 2 - camX * z + ox), Math.round(H / 2 - camY * z + oy));
  const vw = W / z, vh = H / z;
  g.view = { w: vw, h: vh };
  const x0 = camX - vw / 2 - 20, y0 = camY - vh / 2 - 20, x1 = camX + vw / 2 + 20, y1 = camY + vh / 2 + 20;

  const cx0 = Math.floor(x0 / CHUNK_PX), cy0 = Math.floor(y0 / CHUNK_PX), cx1 = Math.floor(x1 / CHUNK_PX), cy1 = Math.floor(y1 / CHUNK_PX);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const ch = g.world.getChunk(cx, cy);
    ctx.drawImage(ch.canvas, cx * CHUNK_PX, cy * CHUNK_PX, CHUNK_PX + 0.5, CHUNK_PX + 0.5);
  }
  const t = g.time;

  const tgt = g.waypoint ?? (g.tradeRun ? { x: g.tradeRun.x, y: g.tradeRun.y } : null);
  if (tgt) {
    const p = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.strokeStyle = g.waypoint ? `rgba(127,209,232,${0.5 + p * 0.5})` : `rgba(255,209,102,${0.5 + p * 0.5})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(tgt.x, tgt.y, 6 + p * 3, 0, TAU); ctx.stroke();
    ctx.setLineDash([3, 3]); ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(g.v.x, g.v.y); ctx.lineTo(tgt.x, tgt.y); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  for (const town of g.nearTowns) {
    if (town.x < x0 - 60 || town.x > x1 + 60 || town.y < y0 - 60 || town.y > y1 + 60) continue;
    const near = Math.hypot(town.x - g.v.x, town.y - g.v.y) < TOWN_SAFE_RADIUS;
    const danger = g.mobs.some((m) => Math.hypot(m.x - town.x, m.y - town.y) < TOWN_SAFE_RADIUS + 20);
    ctx.save();
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = danger ? 'rgba(255,209,102,0.32)' : `rgba(127,209,232,${near ? 0.22 : 0.1})`;
    ctx.lineWidth = danger ? 1.2 : 0.7;
    ctx.beginPath(); ctx.arc(town.x, town.y, TOWN_SAFE_RADIUS, 0, TAU); ctx.stroke();
    ctx.restore();
    drawTown(ctx, town, t, g.docked?.key === town.key);
  }
  for (const lm of g.nearLandmarks) if (lm.x > x0 - 60 && lm.x < x1 + 60 && lm.y > y0 - 60 && lm.y < y1 + 80) drawLandmark(ctx, lm, t, !!g.visited[lm.key]);

  // world objects (all of them), then the vehicle on top
  g.viewNodes.length = 0;
  g.world.nodesInRect(x0, y0, x1, y1 + 24, t, g.viewNodes);
  g.viewNodes.sort((a, b) => a.y - b.y);
  for (const n of g.viewNodes) drawNode(ctx, n, t);

  for (const p of g.pickups) {
    const bob = Math.sin(t * 6 + p.x) * 1;
    if (p.kind === 'coins') {
      ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.arc(p.x, p.y + bob, 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(p.x - 0.3, p.y + bob - 0.3, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff6c8'; ctx.fillRect(p.x - 1, p.y + bob - 1.4, 0.8, 0.8);
    } else {
      const tier = RES_INFO[p.kind].tier;
      if (tier === 'rare' || tier === 'epic') { ctx.fillStyle = tier === 'epic' ? 'rgba(240,160,255,0.35)' : 'rgba(124,184,255,0.3)'; ctx.beginPath(); ctx.arc(p.x, p.y + bob, 5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(p.x - 2, p.y + bob - 2, 4.4, 4.4);
      ctx.fillStyle = RES_INFO[p.kind].color; ctx.fillRect(p.x - 2.2, p.y + bob - 2.2, 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(p.x - 2.2, p.y + bob - 2.2, 1.5, 1);
    }
  }

  const drawMobs = (flying: boolean) => {
    for (const m of g.mobs) {
      if (!!m.def.flying !== flying) continue;
      if (m.x < x0 || m.x > x1 || m.y < y0 || m.y > y1) continue;
      drawMob(ctx, m.def, m.x, m.y, t, m.facing, m.flash > 0, m.slowT > 0, m.burnT > 0 ? m.burnKind : false);
      if (m.hp < m.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(m.x - 6, m.y - m.def.r - 6, 12, 1.6);
        ctx.fillStyle = '#ff5c5c'; ctx.fillRect(m.x - 6, m.y - m.def.r - 6, (12 * Math.max(0, m.hp)) / m.maxHp, 1.6);
      }
    }
  };
  drawMobs(false);

  // harpoon ropes under the vehicle
  for (const p of g.projectiles) if (p.kind === 'harpoon') { ctx.strokeStyle = 'rgba(220,200,160,0.8)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(g.v.x, g.v.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }

  // vehicle: always on top of world features
  drawShadow(ctx, g.v.x + 2, g.v.y + 3, g.hw + 5, g.hh + 4);
  ctx.save(); ctx.translate(g.v.x, g.v.y); ctx.rotate(g.v.angle);
  g.drawVehicleLocal(ctx, t);
  ctx.restore();

  if (!g.av.inside) {
    const a = g.av;
    drawAvatar(ctx, a.x, a.y, a.facing, a.walk, a.flash > 0);
    if (a.hp < a.maxHp) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(a.x - 5, a.y - 14, 10, 1.4); ctx.fillStyle = '#2ecc71'; ctx.fillRect(a.x - 5, a.y - 14, (10 * a.hp) / a.maxHp, 1.4); }
    if (a.returning) { ctx.fillStyle = '#fff'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💤', a.x + 5, a.y - 13 - Math.sin(t * 3) * 1.5); }
  }
  drawMobs(true);

  const dl = g.daylight();
  const night = (1 - dl) * 0.6;
  if (night > 0.02) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(14,18,52,${night})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const toS = (x: number, y: number) => [(x - camX) * z + W / 2 + ox, (y - camY) * z + H / 2 + oy];
    const light = (x: number, y: number, r: number, col: string) => {
      const [sx, sy] = toS(x, y);
      const gx = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * z);
      gx.addColorStop(0, col); gx.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gx; ctx.fillRect(sx - r * z, sy - r * z, r * z * 2, r * z * 2);
    };
    const a = night * 0.6;
    const hl = g.toWorld(g.hw + 26, 0);
    light(hl.x, hl.y, 34, `rgba(255,240,180,${a})`);
    light(g.v.x, g.v.y, 40 + g.st.light * 60, `rgba(255,${g.st.light ? 170 : 200},${g.st.light ? 70 : 120},${a * (g.st.light ? 0.9 : 0.6)})`);
    for (const town of g.nearTowns) light(town.x, town.y, 60, `rgba(255,190,100,${a * 0.8})`);
    for (const n of g.viewNodes) {
      const gx = NODE[n.kind]?.glow;
      if (gx) light(n.x, n.y - 4, 16 * n.size, gx.replace(/,\s*[\d.]+\)$/, `,${a * 0.6})`));
    }
    for (const lm of g.nearLandmarks) if (lm.def.shape === 'lighthouse' || lm.def.shape === 'camp' || lm.def.shape === 'obelisk') light(lm.x, lm.y - 10, 40, `rgba(255,220,150,${a * 0.6})`);
    if (!g.av.inside) light(g.av.x, g.av.y, 20, `rgba(255,220,160,${a * 0.5})`);
    ctx.restore();
  }

  for (const b of g.beams) {
    ctx.strokeStyle = b.color; ctx.globalAlpha = Math.min(1, b.life * 10); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(b.x2 - 1, b.y2 - 1, 2, 2);
  }
  ctx.globalAlpha = 1;

  for (const p of g.projectiles) {
    if (p.kind === 'bullet') { ctx.strokeStyle = p.color ?? '#fff6a0'; ctx.lineWidth = p.town ? 1.3 : 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02); ctx.stroke(); }
    else if (p.kind === 'pebble') { ctx.fillStyle = '#ddd'; ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6); }
    else if (p.kind === 'bubble') {
      ctx.strokeStyle = 'rgba(200,245,255,0.9)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(180,230,255,0.25)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 1, 1);
    } else if (p.kind === 'stone') {
      const k = Math.min(1, p.t! / p.T!), h = Math.sin(k * Math.PI) * (12 + p.T! * 18);
      drawShadow(ctx, p.x, p.y, 2.5, 1.2);
      ctx.fillStyle = '#8a929a'; ctx.beginPath(); ctx.arc(p.x, p.y - h, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b5bcc3'; ctx.fillRect(p.x - 1.2, p.y - h - 1.4, 1.2, 1);
    } else if (p.kind === 'frost') {
      ctx.fillStyle = p.color ?? '#e8f6ff'; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7fc8f0'; ctx.lineWidth = 0.5; ctx.stroke();
    } else if (p.kind === 'harpoon') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-4, -0.4, 4, 0.8); ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(0, -1.4); ctx.lineTo(0, 1.4); ctx.fill();
      ctx.restore();
    } else {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = '#ddd'; ctx.fillRect(-3, -1, 6, 2); ctx.fillStyle = '#e74c3c'; ctx.fillRect(2, -1, 2, 2);
      ctx.restore();
    }
  }

  for (const p of g.particles) {
    const k = p.life / p.max;
    switch (p.kind) {
      case 0: ctx.fillStyle = p.color; ctx.globalAlpha = Math.min(1, k * 2); ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); break;
      case 1: ctx.fillStyle = p.color; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, TAU); ctx.fill(); break;
      case 2: ctx.fillStyle = p.color; ctx.globalAlpha = k * 0.8; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - k), 0, TAU); ctx.fill(); break;
      case 3: ctx.strokeStyle = p.color; ctx.globalAlpha = k; ctx.lineWidth = 1.5 * k + 0.3; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - k) + 1, 0, TAU); ctx.stroke(); break;
      case 4: ctx.fillStyle = p.color; ctx.globalAlpha = k; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 0.3, p.y - 0.3, 0.6, 0.6); break;
      case 5:
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = k > 0.6 ? '#fff3c4' : p.color; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + (1 - k) * 0.9), 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 6: {
        const fl = Math.abs(Math.sin(p.life * 6 + p.x));
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.min(1, k * 3);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size * 0.25 * fl, p.size, Math.max(0.3, p.size * 0.5 * fl));
        break;
      }
      case 7:
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.min(1, k * 3) * (0.5 + 0.5 * Math.sin(p.life * 5 + p.x));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + (1 - k) * 0.9), 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;
    }
  }
  ctx.globalAlpha = 1;

  for (const b of g.bolts) {
    ctx.globalCompositeOperation = 'lighter';
    for (const [w, c] of [[3, 'rgba(100,180,255,0.4)'], [1.2, '#e8f6ff']] as [number, string][]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(b.pts[0], b.pts[1]);
      for (let i = 2; i < b.pts.length; i += 2) ctx.lineTo(b.pts[i], b.pts[i + 1]);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  if (g.settings.clouds) {
    for (const c of g.clouds) { ctx.fillStyle = 'rgba(10,20,40,0.12)'; for (const p of c.parts) { ctx.beginPath(); ctx.arc(c.x + p.dx + 30, c.y + p.dy + 40, p.r, 0, TAU); ctx.fill(); } }
    for (const c of g.clouds) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 - night * 0.4})`;
      for (const p of c.parts) { ctx.beginPath(); ctx.arc(c.x + p.dx, c.y + p.dy, p.r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = `rgba(255,255,255,${0.35 - night * 0.3})`;
      for (const p of c.parts) { ctx.beginPath(); ctx.arc(c.x + p.dx - 2, c.y + p.dy - 3, p.r * 0.6, 0, TAU); ctx.fill(); }
    }
  }

  drawSkyFx(ctx, g, W, H);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of g.popups) {
    const sx = (p.x - camX) * z + W / 2, sy = (p.y - camY) * z + H / 2;
    const age = p.max - p.life;
    const pop = age < 0.12 ? 0.6 + (age / 0.12) * 0.6 : age < 0.25 ? 1.2 - ((age - 0.12) / 0.13) * 0.2 : 1;
    const size = (p.big ? 22 : p.key ? 15 : 12) * pop * g.dpr;
    ctx.globalAlpha = Math.min(1, p.life * 2.5);
    ctx.font = `900 ${size}px ui-rounded, system-ui, sans-serif`;
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(20,16,30,0.85)';
    ctx.strokeText(p.text, sx, sy); ctx.fillStyle = p.color; ctx.fillText(p.text, sx, sy);
  }
  ctx.globalAlpha = 1;

  if (tgt) {
    const sx = (tgt.x - camX) * z + W / 2, sy = (tgt.y - camY) * z + H / 2;
    if (sx < 0 || sy < 0 || sx > W || sy > H) {
      const ang = Math.atan2(sy - H / 2, sx - W / 2);
      const ex = W / 2 + Math.cos(ang) * (Math.min(W, H) / 2 - 40), ey = H / 2 + Math.sin(ang) * (Math.min(W, H) / 2 - 40);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang);
      ctx.fillStyle = g.waypoint ? '#7fd1e8' : '#ffd166';
      ctx.beginPath(); ctx.moveTo(14 * g.dpr, 0); ctx.lineTo(-6 * g.dpr, -8 * g.dpr); ctx.lineTo(-6 * g.dpr, 8 * g.dpr); ctx.fill();
      ctx.restore();
    }
  }
}
