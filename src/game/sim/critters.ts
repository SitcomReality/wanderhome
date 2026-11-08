// Critter spawning & AI, contact damage, and the (never fatal) breakdown / retreat rules.
import type { Game } from '../engine';
import { TAU } from '../core/constants';
import { BIOME, MOBS, RES_INFO, RES_LIST, Res } from '../../content/index';
import { sfx } from '../sfx';
import { killMob } from './weapons';

export function spawnMobs(g: Game, dt: number) {
  g.spawnT -= dt;
  if (g.spawnT > 0) return;
  const night = g.daylight() < 0.3;
  const dist = g.distTiles();
  const scare = g.st.scare;
  g.spawnT = ((3 + Math.random() * 4) / (night ? 1.6 : 1)) * (g.isAfk() ? 1.8 : 1) * (dist < 40 ? 2.5 : 1) * (1 + scare * 1.5);
  const max = Math.floor(Math.min(16, (dist < 60 ? 2 : 3) + Math.floor(dist / 150) + (night ? 2 : 0)) * (1 - Math.min(0.6, scare)));
  if (g.mobs.length >= max) return;
  const fx = g.av.inside ? g.v.x : g.av.x, fy = g.av.inside ? g.v.y : g.av.y;
  for (let tries = 0; tries < 4; tries++) {
    const a = Math.random() * TAU, r = 300 + Math.random() * 120;
    const x = fx + Math.cos(a) * r, y = fy + Math.sin(a) * r;
    const t = g.world.terrainAt(x, y);
    const bd = BIOME[t];
    let opts = MOBS.filter((m) => (m.biomes.includes(t) || !!bd?.mobs?.includes(m.id)) && dist >= (m.minDist ?? 0) && (!m.night || night) && g.mobCanEnter(m, t));
    for (const m of MOBS) if (m.roam && dist >= (m.minDist ?? 0) && Math.random() < m.roam) { opts = [m]; break; }
    if (!opts.length) continue;
    const def = opts[(Math.random() * opts.length) | 0];
    const d = g.difficulty(x, y);
    const hp = def.hp * d;
    g.mobs.push({ id: ++g.mobId, def, x, y, vx: 0, vy: 0, hp, maxHp: hp, dmg: def.dmg * (1 + (d - 1) * 0.6), speed: def.speed * (1 + (d - 1) * 0.15),
      slowT: 0, burnT: 0, burnKind: 'fire', flash: 0, atkCd: 1, wanderA: Math.random() * TAU, facing: 0, fleeT: 0 });
    return;
  }
}

export function updateMobs(g: Game, dt: number) {
  spawnMobs(g, dt);
  const v = g.v, a = g.av;
  const vr = Math.max(g.hw, g.hh) + 2;
  for (let i = g.mobs.length - 1; i >= 0; i--) {
    const m = g.mobs[i];
    if (!m) continue;
    m.flash = Math.max(0, m.flash - dt); m.atkCd -= dt; m.slowT -= dt; m.fleeT -= dt;
    if (m.burnT > 0) { m.burnT -= dt; m.hp -= (m.burnKind === 'poison' ? 4 : 3) * dt; if (m.hp <= 0) { killMob(g, m); continue; } }
    const dv = Math.hypot(v.x - m.x, v.y - m.y);
    const da = a.inside ? 1e9 : Math.hypot(a.x - m.x, a.y - m.y);
    if (Math.min(dv, da) > 800) { g.mobs.splice(i, 1); continue; }
    const tgtAv = da < dv;
    const tx = tgtAv ? a.x : v.x, ty = tgtAv ? a.y : v.y, td = Math.max(1, tgtAv ? da : dv);
    let dirx = 0, diry = 0;
    const sp = m.speed * (m.slowT > 0 ? 0.4 : 1);
    if (m.fleeT > 0 || (v.invulnT > 0 && !tgtAv)) { dirx = (m.x - tx) / td; diry = (m.y - ty) / td; }
    else if (td < 240) { dirx = (tx - m.x) / td; diry = (ty - m.y) / td; }
    else { m.wanderA += (Math.random() - 0.5) * dt * 2; dirx = Math.cos(m.wanderA) * 0.4; diry = Math.sin(m.wanderA) * 0.4; }
    m.vx += (dirx * sp - m.vx) * Math.min(1, dt * 3);
    m.vy += (diry * sp - m.vy) * Math.min(1, dt * 3);
    const nx = m.x + m.vx * dt, ny = m.y + m.vy * dt;
    const nt = g.world.terrainAt(nx, ny);
    if (g.mobCanEnter(m.def, nt)) { m.x = nx; m.y = ny; }
    else { m.wanderA += Math.PI * 0.5; m.vx *= -0.5; m.vy *= -0.5; }
    if (Math.abs(m.vx) + Math.abs(m.vy) > 1) m.facing = Math.atan2(m.vy, m.vx);
    for (let j = 0; j < g.mobs.length; j++) {
      const o = g.mobs[j]; if (o === m) continue;
      const dx = m.x - o.x, dy = m.y - o.y, d = Math.hypot(dx, dy), md = m.def.r + o.def.r;
      if (d > 0 && d < md) { m.x += (dx / d) * (md - d) * 0.5; m.y += (dy / d) * (md - d) * 0.5; }
    }
    if (!tgtAv && dv < vr + m.def.r && m.atkCd <= 0 && m.fleeT <= 0) {
      m.atkCd = 1.2;
      const ang = Math.atan2(m.y - v.y, m.x - v.x);
      m.vx = Math.cos(ang) * 90; m.vy = Math.sin(ang) * 90;
      if (g.st.spikes) { g.burst(m.x, m.y, 4, ['#ccc', '#fff'], 50, 0.3); g.damageMob(m, g.st.spikes); }
      if (v.invulnT <= 0 && v.disabledT <= 0) {
        if (g.st.shield > 0 && v.shieldT <= 0) {
          v.shieldT = 7 / g.st.shield;
          g.part(v.x, v.y, 0, 0, 0.5, g.hw + 10, 'rgba(90,209,230,0.9)', 3, 0, 0);
          g.popup(v.x, v.y - g.hh - 6, 'BLOCKED', '#5ad1e6');
          sfx('zap', 1.5);
          continue;
        }
        v.hp -= m.dmg; v.flash = 0.15;
        g.popup(v.x + (Math.random() - 0.5) * 10, v.y - g.hh - 6, `-${Math.round(m.dmg)}`, '#ff5c5c');
        g.burst((m.x + v.x) / 2, (m.y + v.y) / 2, 8, ['#ffcc80', '#fff', '#ff8a65'], 60, 0.35);
        g.shake(2.5);
        sfx('hurt');
        if (v.hp <= 0) breakdown(g);
      }
    } else if (tgtAv && da < 5 + m.def.r && m.atkCd <= 0 && a.stunT <= 0) {
      m.atkCd = 1;
      a.hp -= m.dmg; a.flash = 0.15;
      const ang = Math.atan2(m.y - a.y, m.x - a.x);
      m.vx = Math.cos(ang) * 80; m.vy = Math.sin(ang) * 80;
      g.popup(a.x, a.y - 12, `-${Math.round(m.dmg)}`, '#ff5c5c');
      g.shake(2); sfx('hurt', 1.3);
      if (a.hp <= 0) avatarDefeated(g);
    }
  }
}

export function breakdown(g: Game) {
  const v = g.v;
  v.hp = 0; v.disabledT = 8; v.invulnT = 0;
  g.stats.breakdowns++;
  if (g.time - g.lossWindow.start > 1800) g.lossWindow = { start: g.time, budget: g.coins * 0.1 };
  const loss = Math.floor(Math.min(g.lossWindow.budget, Math.max(3, g.coins * 0.04)));
  g.lossWindow.budget -= loss;
  g.coins = Math.max(0, g.coins - loss);
  for (const m of g.mobs) if (Math.hypot(m.x - v.x, m.y - v.y) < 260) { m.fleeT = 10; const a = Math.atan2(m.y - v.y, m.x - v.x); m.vx = Math.cos(a) * 160; m.vy = Math.sin(a) * 160; }
  g.explode(v.x, v.y, 20, 0);
  g.shake(9);
  g.addLog(loss > 0 ? `💥 Breakdown! Lost ${loss} 🪙 in repairs. Patching up…` : '💥 Breakdown! Patching up…', '#ff8a80');
  g.popup(v.x, v.y - 20, 'BREAKDOWN!', '#ff5c5c', true);
}

export function avatarDefeated(g: Game) {
  const a = g.av;
  let worst: Res = 'wood';
  for (const r of RES_LIST) if (g.res[r] > g.res[worst]) worst = r;
  const loss = Math.ceil(g.res[worst] * 0.08);
  g.res[worst] -= loss;
  g.burst(a.x, a.y, 20, ['#ff7a59', '#fff'], 80, 0.6);
  g.popup(a.x, a.y - 14, 'OUCH! Retreat!', '#ff5c5c', true);
  g.addLog(`Your wanderer got roughed up and fled home, dropping ${loss} ${RES_INFO[worst].icon}.`, '#ff8a80');
  a.hp = a.maxHp * 0.3; a.stunT = 0; a.inside = true; a.lx = 0; a.ly = 0; a.returning = false;
  for (const m of g.mobs) m.fleeT = 3;
}
