// Juice: particles, popups, ambient weather, clouds, screen shake decay and the camera.
import type { Game } from '../engine';
import { TAU } from '../core/constants';
import { fmtNum } from '../core/format';
import { Cloud } from '../core/types';
import { BIOME, RES_INFO, Res } from '../../content/index';

export function part(g: Game, x: number, y: number, vx: number, vy: number, life: number, size: number, color: string, kind = 0, grav = 0, drag = 2) {
  if (g.particles.length >= g.pMax) return;
  g.particles.push({ x, y, vx, vy, life, max: life, size, color, kind, grav, drag });
}

export function burst(g: Game, x: number, y: number, n: number, colors: string[], speed = 60, life = 0.6, size = 1.5, kind = 0, grav = 0) {
  const count = Math.max(1, Math.round(n * g.pMul));
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU, sp = speed * (0.3 + Math.random() * 0.9);
    g.part(x, y, Math.cos(a) * sp, Math.sin(a) * sp, life * (0.5 + Math.random() * 0.8), size * (0.6 + Math.random() * 0.8), colors[(Math.random() * colors.length) | 0], kind, grav);
  }
}

export function popup(g: Game, x: number, y: number, text: string, color: string, big = false) {
  if (g.popups.length > 70) g.popups.shift();
  g.popups.push({ x, y, text, color, life: big ? 1.6 : 1.1, max: big ? 1.6 : 1.1, big });
}

export function gainPopup(g: Game, x: number, y: number, kind: Res | 'coins', amt: number) {
  const icon = kind === 'coins' ? '🪙' : RES_INFO[kind].icon;
  for (const p of g.popups) {
    if (p.key === kind && p.life > p.max - 0.45 && Math.abs(p.x - x) < 40 && Math.abs(p.y - y) < 40) {
      p.amt! += amt; p.text = `+${fmtNum(p.amt!)} ${icon}`; p.life = p.max - 0.1; return;
    }
  }
  if (g.popups.length > 70) g.popups.shift();
  const tier = kind === 'coins' ? null : RES_INFO[kind].tier;
  const col = kind === 'coins' ? '#ffd166' : tier === 'rare' ? '#9cc8ff' : tier === 'epic' ? '#f0a0ff' : '#ffffff';
  g.popups.push({ x, y: y - 6, text: `+${fmtNum(amt)} ${icon}`, color: col, life: 1.2, max: 1.2, big: tier === 'epic', key: kind, amt, icon });
}

export function updateAmbient(g: Game, dt: number) {
  const a = BIOME[g.world.terrainAt(g.cam.x, g.cam.y)]?.ambient;
  if (!a) return;
  if (a.night && g.daylight() > 0.4) return;
  let n = a.rate * dt * g.pMul;
  const wind = g.wind(), vw = g.view.w, vh = g.view.h;
  while (n > 0) {
    if (n < 1 && Math.random() > n) break;
    n -= 1;
    const x = g.cam.x + (Math.random() - 0.5) * vw, y = g.cam.y + (Math.random() - 0.5) * vh;
    const c = a.color;
    switch (a.kind) {
      case 'snow': g.part(x, y, 6 + wind * 10, 10 + Math.random() * 6, 4 + Math.random() * 2, 0.6 + Math.random() * 0.7, c ?? 'rgba(255,255,255,0.9)', 1, 0, 0); break;
      case 'leaves': case 'petals': g.part(x, y, 8 + wind * 14, 5 + Math.random() * 4, 4 + Math.random() * 2, 1.4, c ?? '#e08a3a', 6, 0, 0); break;
      case 'ash': { const ember = Math.random() < 0.15; g.part(x, y, wind * 6, -3 - Math.random() * 4, 4, ember ? 0.9 : 0.8, ember ? '#ff9f43' : c ?? 'rgba(110,110,110,0.8)', ember ? 7 : 1, 0, 0); break; }
      case 'sand': g.part(x, y, 40 + wind * 40, (Math.random() - 0.5) * 4, 1.4, 0.7, c ?? 'rgba(230,200,140,0.6)', 0, 0, 0); break;
      case 'fireflies': g.part(x, y, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 3 + Math.random() * 3, 1.1, c ?? '#d4ff7a', 7, 0, 0.2); break;
      case 'spores': g.part(x, y, (Math.random() - 0.5) * 4, -2 - Math.random() * 3, 5, 0.8, c ?? '#c8a0ff', 7, 0, 0); break;
      case 'bubbles': g.part(x, y, 0, -6, 1.6, 1.2, c ?? 'rgba(220,250,255,0.7)', 3, 0, 0); break;
      case 'mist': g.part(x, y, 3 + wind * 4, 0, 6, 14 + Math.random() * 10, c ?? 'rgba(230,235,240,0.08)', 2, 0, 0); break;
    }
  }
}

export function updateFx(g: Game, dt: number) {
  if (g.settings.ambient) updateAmbient(g, dt);
  for (let i = g.particles.length - 1; i >= 0; i--) {
    const p = g.particles[i];
    p.life -= dt;
    if (p.life <= 0) { g.particles[i] = g.particles[g.particles.length - 1]; g.particles.pop(); continue; }
    p.vy += p.grav * dt;
    const dr = 1 - Math.min(1, p.drag * dt);
    p.vx *= dr; p.vy *= dr;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = g.popups.length - 1; i >= 0; i--) { const p = g.popups[i]; p.life -= dt; p.y -= dt * (p.big ? 10 : 18); if (p.life <= 0) g.popups.splice(i, 1); }
  for (let i = g.beams.length - 1; i >= 0; i--) { g.beams[i].life -= dt; if (g.beams[i].life <= 0) g.beams.splice(i, 1); }
  for (let i = g.bolts.length - 1; i >= 0; i--) { g.bolts[i].life -= dt; if (g.bolts[i].life <= 0) g.bolts.splice(i, 1); }
  g.shakeAmt = Math.max(0, g.shakeAmt - dt * 18);
  if (g.settings.clouds) {
    if (g.clouds.length < 9 && Math.random() < dt * 0.25) {
      const parts = [] as Cloud['parts'];
      const n = 4 + ((Math.random() * 5) | 0);
      for (let i = 0; i < n; i++) parts.push({ dx: (i - n / 2) * 9 + Math.random() * 6, dy: (Math.random() - 0.5) * 8, r: 9 + Math.random() * 10 });
      const fresh = g.clouds.length < 3 && g.time < 5;
      g.clouds.push({ x: g.cam.x + (fresh ? (Math.random() - 0.5) * 700 : -520 - Math.random() * 100), y: g.cam.y + (Math.random() - 0.5) * 500, parts, speed: 5 + Math.random() * 6 });
    }
    for (let i = g.clouds.length - 1; i >= 0; i--) {
      const c = g.clouds[i]; c.x += c.speed * dt * (0.5 + g.wind());
      if (Math.abs(c.x - g.cam.x) > 900 || Math.abs(c.y - g.cam.y) > 700) g.clouds.splice(i, 1);
    }
  }
}

export function updateCamera(g: Game, dt: number) {
  const tx = g.av.inside ? g.v.x + Math.cos(g.v.angle) * g.speedNow * 0.8 : g.av.x;
  const ty = g.av.inside ? g.v.y + Math.sin(g.v.angle) * g.speedNow * 0.8 : g.av.y;
  g.cam.x += (tx - g.cam.x) * Math.min(1, dt * 3);
  g.cam.y += (ty - g.cam.y) * Math.min(1, dt * 3);
}
