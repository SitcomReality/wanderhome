// Driving: engine power, throttle, autopilot target selection, movement, exhaust & stuck recovery.
import type { Game } from '../engine';
import { angDiff } from '../core/math';
import { RES_INFO, TERRAIN_INFO } from '../../content/index';
import { hash2 } from '../world/noise';
import { ResNode, TILE } from '../world/world';
import { curious } from './exploration';
import { foragePriority } from './plan';
import { PARK_SECONDS, WAYPOINT_PARK_SECONDS, park, updatePark } from './rest';
import { inTownSafeZone } from './towns';
import { chooseAngle, giveUp, lineClear, navSteer, pickTradeTown, resetNav } from './navigation';

export function livePower(g: Game, moving: boolean, dt: number) {
  let p = 0;
  const starved: string[] = [];
  const sun = g.daylight();
  const wind = g.wind() * g.openness(g.world.terrainAt(g.v.x, g.v.y));
  for (const e of g.st.cells.values()) {
    const d = e.def;
    if (!d.power) continue;
    if (d.power < 0) { p += d.power; continue; }
    if (d.solar) { p += d.power * e.power * Math.max(0.1, sun); continue; }
    if (d.sail) { p += d.power * e.power * wind; continue; }
    if (d.burns) {
      const need = d.burns.rate * e.burn * dt * (moving ? 1 : 0.15);
      if (g.res[d.burns.res] >= need && g.res[d.burns.res] > 0) { g.res[d.burns.res] -= need; p += d.power * e.power; }
      else starved.push(`${d.name} (${RES_INFO[d.burns.res].name})`);
      continue;
    }
    p += d.power * e.power;
  }
  g.starved = starved;
  g.power = Math.max(0, p);
  return p;
}

export function updateVehicle(g: Game, dt: number) {
  const v = g.v;
  updatePark(g);
  v.flash = Math.max(0, v.flash - dt);
  v.invulnT = Math.max(0, v.invulnT - dt);
  v.shieldT = Math.max(0, v.shieldT - dt);
  if (v.disabledT > 0) {
    v.disabledT -= dt;
    v.speed = 0;
    if (Math.random() < dt * 12 * g.pMul) g.part(v.x + (Math.random() - 0.5) * g.hw, v.y + (Math.random() - 0.5) * g.hh, (Math.random() - 0.5) * 6, -12 - Math.random() * 10, 1.6, 3 + Math.random() * 3, Math.random() < 0.5 ? '#555' : '#777', 2, -4, 0.5);
    if (v.disabledT <= 0) { v.hp = g.maxHp * 0.5; v.invulnT = 15; g.addLog('Repairs complete. Back on the road!', '#2ecc71'); }
    livePower(g, false, dt);
    return;
  }
  v.hp = Math.min(g.maxHp, v.hp + g.st.regen * g.buffMul('regen') * dt);

  const avatarOut = !g.av.inside;
  let throttle = 0;
  const cargoFull = g.cargoFree() <= 0;

  if (g.parked) {
    throttle = 0;
  } else if (g.manual && !avatarOut) {
    const k = g.keys;
    if (k.has('w') || k.has('arrowup')) throttle = 1;
    if (k.has('s') || k.has('arrowdown')) throttle = -0.5;
    let turn = 0;
    if (k.has('a') || k.has('arrowleft')) turn -= 1;
    if (k.has('d') || k.has('arrowright')) turn += 1;
    v.angle += turn * 1.9 * dt * (throttle < 0 ? -1 : 1);
    if (g.time - g.lastInput > 25) { g.manual = false; g.addLog('You wandered off. Autopilot resumed.', '#7fd1e8'); }
  } else if (!avatarOut) {
    throttle = 1;
    g.tradeCd = Math.max(0, g.tradeCd - dt);
    let target: { x: number; y: number; key: string } | null = null;
    if (g.waypoint) {
      target = { x: g.waypoint.x, y: g.waypoint.y, key: 'wp' };
      if (Math.hypot(g.waypoint.x - v.x, g.waypoint.y - v.y) < 24) {
        const atTown = inTownSafeZone(g, g.waypoint.x, g.waypoint.y);
        g.waypoint = null; target = null;
        park(g, atTown ? PARK_SECONDS : WAYPOINT_PARK_SECONDS, atTown ? 'waypoint-town' : 'waypoint');
        throttle = 0;
      }
    } else {
      if (g.settings.returnWhenFull && g.tradeCd <= 0 && !g.tradeRun && g.cargoUsed() >= g.cargoCap * 0.9) {
        if (!g.hasSellable()) { g.tradeCd = 60; g.addLog('Cargo is full, but everything is locked or not set to auto-sell.', '#ffb347'); }
        else {
          const best = pickTradeTown(g);
          if (best) { g.tradeRun = best; g.tradeRunT = 0; g.addLog(`Cargo nearly full. Heading to ${best.name} to trade.`, '#ffd166'); }
          else g.tradeCd = 45;
        }
      }
      if (g.tradeRun) {
        g.tradeRunT += dt;
        if (g.tradeRunT > 240) giveUp(g, 'town:' + g.tradeRun.key);
      }
      if (g.tradeRun) target = { x: g.tradeRun.x, y: g.tradeRun.y, key: 'town:' + g.tradeRun.key };
      else if (curious(g)) target = g.curTarget;
      else if (g.mode === 'forage' && g.harvs.length && !cargoFull) {
        g.forageT -= dt;
        if (!g.forageTarget || g.forageTarget.hp <= 0 || g.forageT <= 0) {
          g.forageT = 2;
          let best: ResNode | null = null, bs = 1e9;
          for (const n of g.nearNodes) {
            if (n.hp <= 0) continue;
            const bl = g.nodeBlacklist.get(n.key);
            if (bl !== undefined && g.time - bl < 120) continue;
            const d = Math.hypot(n.x - v.x, n.y - v.y);
            if (d > 200 || g.terrMult(n.x, n.y) <= 0) continue;
            const ang = Math.abs(angDiff(Math.atan2(n.y - v.y, n.x - v.x), v.angle));
            const bias = foragePriority(g, n.res);
            if (bias === null) continue;
            let sc = d + ang * 45 + bias;
            for (const h of g.harvs) if (h.def.harvest!.bonus?.includes(n.res)) sc -= 50;
            if (RES_INFO[n.res].tier === 'rare' || RES_INFO[n.res].tier === 'epic') sc -= 60;
            if (sc < bs && lineClear(g, v.x, v.y, n.x, n.y)) { bs = sc; best = n; }
          }
          g.forageTarget = best;
        }
        if (g.forageTarget) target = { x: g.forageTarget.x, y: g.forageTarget.y, key: 'node:' + g.forageTarget.key };
      } else if (g.mode === 'heading') g.wanderA = g.headingAngle;
    }
    if (!g.parked) {
      if (!target && g.mode !== 'heading') g.wanderA += (hash2(Math.floor(g.time * 0.4), 7, g.world.seed) - 0.5) * dt * 0.9;
      g.steerT -= dt;
      if (g.steerT <= 0) {
        g.steerT = 0.16;
        if (target) {
          g.steerAngle = navSteer(g, target.x, target.y, target.key, 0.16);
          const lim = target.key.startsWith('node:') ? 6 : target.key.startsWith('lm:') ? 20 : 50;
          if (g.nav.noProg > lim) giveUp(g, target.key);
        } else { if (g.nav.key) resetNav(g, ''); g.steerAngle = chooseAngle(g, g.wanderA); }
      }
      const diff = angDiff(g.steerAngle, v.angle);
      v.angle += Math.max(-1.5 * dt, Math.min(1.5 * dt, diff));
      if (g.harvs.length && !cargoFull) {
        for (const n of g.nearNodes) if (n.hp > 0 && foragePriority(g, n.res) !== null && Math.hypot(n.x - v.x, n.y - v.y) < 34) { throttle = 0.3; break; }
      }
      if (g.dockPause > 0) { g.dockPause -= dt; throttle = 0; }
    }
  }

  const moving = throttle !== 0;
  livePower(g, moving, dt);
  let target = throttle * g.baseSpeed() * (g.manual ? 1.25 : 1);
  if (avatarOut) target = 0;
  v.speed += (target - v.speed) * Math.min(1, dt * 2.5);
  const cur = g.terrMult(v.x, v.y);
  const c = Math.cos(v.angle), s = Math.sin(v.angle);
  const dir = v.speed >= 0 ? 1 : -1;
  const nx = v.x + c * v.speed * dt * Math.max(cur, 0.35), ny = v.y + s * v.speed * dt * Math.max(cur, 0.35);
  const fx = nx + c * g.hw * dir, fy = ny + s * g.hw * dir;
  if (cur <= 0 || (g.terrMult(nx, ny) > 0 && g.terrMult(fx, fy) > 0)) {
    g.stats.distance += Math.hypot(nx - v.x, ny - v.y) / TILE;
    v.x = nx; v.y = ny;
  } else v.speed *= 0.4;
  g.speedNow = Math.abs(v.speed) * Math.max(cur, 0.35);

  if (g.speedNow > 3) {
    for (const p of smokers(g)) {
      if (Math.random() < dt * 8 * g.pMul) {
        const w = g.toWorld(p.x - 3, p.y);
        g.part(w.x, w.y, -c * 8 + (Math.random() - 0.5) * 6, -s * 8 - 6, 1.1, 2 + Math.random() * 2, p.color, 2, -3, 0.6);
      }
    }
    if (Math.random() < dt * 10 * g.pMul && g.loco !== 'hover') {
      const col = TERRAIN_INFO[g.world.terrainAt(v.x, v.y)].color;
      const back = g.toWorld(-g.hw - 2, (Math.random() - 0.5) * g.hh * 2);
      g.part(back.x, back.y, -c * 10 + (Math.random() - 0.5) * 8, -s * 10 + (Math.random() - 0.5) * 8, 0.7, 1.5 + Math.random() * 2,
        `rgba(${col[0] * 0.8 | 0},${col[1] * 0.8 | 0},${col[2] * 0.8 | 0},0.7)`, 2, 0, 2);
    }
  }

  g.stuckCheckT += dt;
  if (g.stuckCheckT > 3) {
    const moved = Math.hypot(v.x - g.lastPos.x, v.y - g.lastPos.y);
    if (!avatarOut && !g.manual && !g.parked && g.dockPause <= 0 && moved < 6) {
      g.stuckT += g.stuckCheckT;
      g.wanderA = v.angle + Math.PI * (0.6 + Math.random() * 0.8);
      g.forageTarget = null;
      g.steerAngle = g.wanderA;
      g.nav.side = -g.nav.side; g.nav.follow = false;
      if (g.stuckT > 12) {
        if (g.waypoint) giveUp(g, 'wp');
        else if (g.tradeRun) giveUp(g, 'town:' + g.tradeRun.key);
        g.stuckT = 0;
      }
    } else g.stuckT = 0;
    g.lastPos = { x: v.x, y: v.y };
    g.stuckCheckT = 0;
  }
}

export function smokers(g: Game) {
  const out: { x: number; y: number; color: string }[] = [];
  for (const e of g.st.cells.values()) {
    const id = e.def.id;
    const p = g.cellLocal(e.idx);
    if (id === 'combust' || id === 'brimstone') out.push({ ...p, color: 'rgba(60,60,60,0.55)' });
    else if (id === 'steam' || id === 'smelter' || id === 'kiln') out.push({ ...p, color: 'rgba(235,235,235,0.6)' });
    else if (id === 'distill') out.push({ ...p, color: 'rgba(120,220,180,0.5)' });
    else if (id === 'frost') out.push({ ...p, color: 'rgba(220,245,255,0.6)' });
  }
  return out;
}
