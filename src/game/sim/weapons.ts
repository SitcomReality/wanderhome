// Turrets & projectiles: targeting, firing each weapon kind, damage, kills and explosions.
import type { Game } from '../engine';
import { angDiff } from '../core/math';
import { Mob } from '../core/types';
import { onDiscover } from '../family/index';
import { sfx } from '../sfx';

export function updateWeapons(g: Game, dt: number) {
  if (g.v.disabledT > 0) return;
  for (const w of g.weapons) {
    w.recoil = Math.max(0, w.recoil - dt * (w.def.weapon!.kind === 'lob' ? 1.5 : 10));
    w.cd -= dt;
    const lp = g.cellLocal(w.idx);
    const p = g.toWorld(lp.x, lp.y);
    const wd = w.def.weapon!;
    let best: Mob | null = null, bd = w.range;
    for (const m of g.mobs) { const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd) { bd = d; best = m; } }
    if (!best) { w.angle += angDiff(g.v.angle, w.angle) * Math.min(1, dt * 2); continue; }
    const want = Math.atan2(best.y - p.y, best.x - p.x);
    w.angle += angDiff(want, w.angle) * Math.min(1, dt * 12);
    if (w.cd > 0 || Math.abs(angDiff(want, w.angle)) > 0.4) continue;
    if (wd.ammo) {
      if (g.res[wd.ammo.res] < wd.ammo.per) { w.dry = true; w.cd = 1; continue; }
      g.res[wd.ammo.res] -= wd.ammo.per;
    }
    w.dry = false;
    w.cd = 1 / w.rate;
    w.recoil = 1;
    const c = Math.cos(w.angle), s = Math.sin(w.angle);
    const mx = p.x + c * 6, my = p.y + s * 6;
    switch (wd.kind) {
      case 'pea':
      case 'mg': {
        const sp = (Math.random() - 0.5) * 0.12;
        g.projectiles.push({ kind: 'bullet', x: mx, y: my, vx: Math.cos(w.angle + sp) * 400, vy: Math.sin(w.angle + sp) * 400, dmg: wd.dmg, life: 0.5, target: null });
        g.part(mx, my, c * 20, s * 20, 0.06, wd.kind === 'mg' ? 4 : 2.5, '#fff6a0', 1, 0, 0);
        if (wd.kind === 'mg') g.part(p.x, p.y, -s * 30 + (Math.random() - 0.5) * 20, c * 30 - 20, 0.6, 1, '#e0b040', 0, 140, 1);
        sfx('shot', 0.9 + Math.random() * 0.3);
        break;
      }
      case 'flame': {
        const n = Math.max(1, Math.round(3 * g.pMul));
        for (let i = 0; i < n; i++) {
          const a = w.angle + (Math.random() - 0.5) * 0.5, spd = 110 + Math.random() * 60;
          const eff = wd.effect ?? 'burn';
          const pal = eff === 'burn' ? ['#ffb347', '#ff6b35'] : eff === 'poison' ? [wd.color ?? '#9be070', '#5fbf3a'] : ['#ffffff', wd.color ?? '#dff6ff'];
          g.part(mx, my, Math.cos(a) * spd, Math.sin(a) * spd, 0.4 + Math.random() * 0.15, 2 + Math.random() * 2.5, pal[(Math.random() * 2) | 0], eff === 'burn' ? 5 : 2, eff === 'burn' ? -20 : -4, 3);
        }
        for (const m of [...g.mobs]) {
          if (Math.hypot(m.x - p.x, m.y - p.y) > w.range) continue;
          if (Math.abs(angDiff(Math.atan2(m.y - p.y, m.x - p.x), w.angle)) < 0.4) {
            const eff = wd.effect ?? 'burn';
            if (eff === 'burn') { m.burnT = 2.5; m.burnKind = 'fire'; } else if (eff === 'poison') { m.burnT = 4; m.burnKind = 'poison'; } else m.slowT = 2;
            g.damageMob(m, wd.dmg, false);
          }
        }
        break;
      }
      case 'rocket': {
        g.projectiles.push({ kind: 'rocket', x: mx, y: my, vx: c * 60 - s * (Math.random() - 0.5) * 80, vy: s * 60 + c * (Math.random() - 0.5) * 80, dmg: wd.dmg, life: 3, target: best });
        g.burst(mx, my, 6, ['#ddd', '#aaa'], 30, 0.5, 2.5, 2);
        sfx('zap', 0.4);
        break;
      }
      case 'tesla': {
        const hit: Mob[] = [best];
        let cur = best;
        for (let i = 0; i < 3; i++) {
          let nb: Mob | null = null, nd = 70;
          for (const m of g.mobs) { if (hit.includes(m)) continue; const d = Math.hypot(m.x - cur.x, m.y - cur.y); if (d < nd) { nd = d; nb = m; } }
          if (!nb) break; hit.push(nb); cur = nb;
        }
        let px = p.x, py = p.y - 4;
        hit.forEach((m, i) => {
          const pts: number[] = [px, py];
          for (let k = 1; k < 6; k++) { const t = k / 6; pts.push(px + (m.x - px) * t + (Math.random() - 0.5) * 8, py + (m.y - py) * t + (Math.random() - 0.5) * 8); }
          pts.push(m.x, m.y);
          g.bolts.push({ pts, life: 0.18 });
          g.burst(m.x, m.y, 6, ['#bfe9ff', '#fff', '#6ab7ff'], 70, 0.3, 1.2);
          px = m.x; py = m.y;
          g.damageMob(m, wd.dmg * Math.pow(0.8, i), true);
        });
        g.shake(1);
        sfx('zap');
        break;
      }
      case 'bubble':
        g.projectiles.push({ kind: 'bubble', x: mx, y: my, vx: c * 140 + (Math.random() - 0.5) * 20, vy: s * 140 + (Math.random() - 0.5) * 20, dmg: wd.dmg, life: 1.2, target: null });
        break;
      case 'harpoon':
        g.projectiles.push({ kind: 'harpoon', x: mx, y: my, vx: c * 320, vy: s * 320, dmg: wd.dmg, life: 0.8, target: null, sx: p.x, sy: p.y });
        sfx('shot', 0.5);
        break;
      case 'frost':
        g.projectiles.push({ kind: 'frost', x: mx, y: my, vx: c * 260, vy: s * 260, dmg: wd.dmg, life: 0.7, target: null, color: wd.color });
        g.burst(mx, my, 4, [wd.color ?? '#e8f6ff', '#a8e0ff'], 30, 0.3, 1.2, 1);
        break;
      case 'lob': {
        const lead = Math.hypot(best.x - p.x, best.y - p.y) / 120;
        const tx = best.x + best.vx * lead * 0.6, ty = best.y + best.vy * lead * 0.6;
        g.projectiles.push({ kind: 'stone', x: p.x, y: p.y, vx: 0, vy: 0, dmg: wd.dmg, life: 9, target: null, sx: p.x, sy: p.y, tx, ty, t: 0, T: Math.max(0.5, lead), splash: wd.splash });
        sfx('chop', 0.5);
        break;
      }
    }
  }
}

export function damageMob(g: Game, m: Mob, dmg: number, numbers = true) {
  dmg *= g.buffMul('damage');
  m.hp -= dmg; m.flash = 0.08;
  if (numbers && g.settings.dmgNumbers && dmg >= 1) g.popup(m.x + (Math.random() - 0.5) * 6, m.y - m.def.r - 4, String(Math.round(dmg)), '#ffeb99');
  if (m.hp <= 0) killMob(g, m);
}

export function killMob(g: Game, m: Mob) {
  const i = g.mobs.indexOf(m);
  if (i < 0) return;
  g.mobs.splice(i, 1);
  g.stats.kills++;
  onDiscover(g, 'critters', m.def.id);
  g.burst(m.x, m.y, 18, [m.def.color, '#fff', '#ffd166'], 90, 0.7, 2, 0, 80);
  g.burst(m.x, m.y, 8, ['#ff6b9a', '#7fd1e8', '#ffd166', '#b388ff'], 120, 1, 1.4, 0, 120);
  g.part(m.x, m.y, 0, 0, 0.3, 16, 'rgba(255,255,255,0.9)', 3, 0, 0);
  g.shake(1.5);
  sfx('pop', 0.6 + Math.random() * 0.4);
  const d = g.difficulty(m.x, m.y);
  g.dropPickup(m.x, m.y, 'coins', Math.max(1, Math.round(m.def.coins * d * (0.7 + Math.random() * 0.6))), null);
  if (Math.random() < 0.35) g.dropPickup(m.x, m.y, 'scrap', 1 + Math.floor(Math.random() * 2 * d), null);
  if (m.def.drop && Math.random() < 0.3) g.dropPickup(m.x, m.y, m.def.drop, 1, null);
}

export function explode(g: Game, x: number, y: number, r: number, dmg: number, scale = 1) {
  for (const m of [...g.mobs]) {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < r + m.def.r) { const a = Math.atan2(m.y - y, m.x - x); m.vx += Math.cos(a) * 120 * scale; m.vy += Math.sin(a) * 120 * scale; g.damageMob(m, dmg * (1 - (d / (r + m.def.r)) * 0.6)); }
  }
  g.part(x, y, 0, 0, 0.4, r * 1.2, 'rgba(255,240,200,0.9)', 3, 0, 0);
  if (scale >= 1) {
    g.part(x, y, 0, 0, 0.18, r * 0.8, '#fff7d6', 1, 0, 0);
    g.burst(x, y, 26, ['#ffdd57', '#ff9f43', '#ff6b35', '#fff'], 150, 0.5, 3, 5, 0);
    g.burst(x, y, 14, ['#444', '#666', '#888'], 50, 1.4, 4, 2, -10);
  }
  g.burst(x, y, 10 * scale + 4, ['#5d4037', '#333', '#9aa3ad'], 140, 0.9, 1.4, 0, 200);
  g.shake(5 * scale);
  sfx('boom', 0.8 + Math.random() * 0.3);
}

export function updateProjectiles(g: Game, dt: number) {
  for (let i = g.projectiles.length - 1; i >= 0; i--) {
    const p = g.projectiles[i];
    p.life -= dt;
    if (p.kind === 'stone') {
      p.t! += dt;
      const k = Math.min(1, p.t! / p.T!);
      p.x = p.sx! + (p.tx! - p.sx!) * k; p.y = p.sy! + (p.ty! - p.sy!) * k;
      if (k >= 1) {
        g.explode(p.x, p.y, p.splash ?? 20, p.dmg, 0.45);
        g.burst(p.x, p.y, 10, ['#9aa3ad', '#7d858c', '#c8b090'], 70, 0.6, 2, 0, 120);
        g.projectiles.splice(i, 1);
      }
      continue;
    }
    if (p.kind === 'rocket') {
      if (!p.target || !g.mobs.includes(p.target)) {
        let bd = 260; p.target = null;
        for (const m of g.mobs) { const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd) { bd = d; p.target = m; } }
      }
      const ns = Math.min(280, Math.hypot(p.vx, p.vy) + 300 * dt);
      let ang = Math.atan2(p.vy, p.vx);
      if (p.target) ang += angDiff(Math.atan2(p.target.y - p.y, p.target.x - p.x), ang) * Math.min(1, dt * 6);
      p.vx = Math.cos(ang) * ns; p.vy = Math.sin(ang) * ns;
      if (Math.random() < 0.9 * g.pMul) g.part(p.x, p.y, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, 0.8, 2.2, 'rgba(200,200,200,0.7)', 2, -5, 1);
      g.part(p.x, p.y, -p.vx * 0.1, -p.vy * 0.1, 0.1, 2, '#ffb347', 5, 0, 0);
    }
    if (p.kind === 'frost' && Math.random() < 0.6 * g.pMul) g.part(p.x, p.y, 0, 0, 0.35, 1.4, '#e8f6ff', 1, 0, 0);
    if (p.kind === 'bubble') { p.vx *= 1 - dt * 0.6; p.vy *= 1 - dt * 0.6; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    let hit: Mob | null = null;
    for (const m of g.mobs) if (Math.hypot(m.x - p.x, m.y - p.y) < m.def.r + 2) { hit = m; break; }
    if (hit || p.life <= 0) {
      if (p.kind === 'rocket') g.explode(p.x, p.y, 34, p.dmg);
      else if (hit) {
        if (p.kind === 'bubble') { hit.slowT = 2.5; g.burst(p.x, p.y, 8, ['#bdf3ff', '#fff'], 50, 0.4, 1.2, 1); sfx('pop', 1.5); }
        else if (p.kind === 'frost') { hit.slowT = 3; g.burst(p.x, p.y, 10, ['#e8f6ff', '#a8e0ff', '#fff'], 60, 0.5, 1.4, 4); }
        else if (p.kind === 'harpoon') {
          const a = Math.atan2(g.v.y - hit.y, g.v.x - hit.x);
          hit.vx = Math.cos(a) * 220; hit.vy = Math.sin(a) * 220; hit.slowT = 1;
          g.burst(p.x, p.y, 6, ['#cfd8dc', '#fff'], 50, 0.3); g.shake(1);
        } else g.burst(p.x, p.y, 3, ['#fff6a0', '#fff'], 50, 0.2, 1);
        if (p.kind !== 'harpoon') { hit.vx += p.vx * 0.05; hit.vy += p.vy * 0.05; }
        g.damageMob(hit, p.dmg);
      } else if (p.kind === 'bubble') g.burst(p.x, p.y, 4, ['#bdf3ff', '#fff'], 30, 0.3, 1, 1);
      g.projectiles.splice(i, 1);
    }
  }
}
