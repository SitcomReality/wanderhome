// Settlement residents: the first slice lives in Homeport only.
// They are schedule-driven walkers, not a second pathfinding system. Their state is transient:
// the roster and positions are rebuilt from the clock when a save loads.
import type { Game } from '../engine';
import { DAY } from '../core/constants';
import type { DayPhase, Resident, Spoils } from '../core/types';
import { RESIDENTS, RES_INFO } from '../../content/index';
import type { ResidentDef } from '../../content/index';
import type { SettlementPlan } from '../world/settlement';

/** The one settlement that has residents in this slice. Remove this gate when the model is proven. */
export const RESIDENT_TOWN_KEY = 'home';

const WALK_SPEED = 18;
const LOOT_SPEED = 30;
const FLEE_SPEED = 34;
const SPOIL_LIFE = 90;
const LOOT_RANGE = 320;
const THREAT_RANGE = 120;
const WATCHDOG_RANGE = 80;

export function dayPhase(g: Game): DayPhase {
  const dl = g.daylight();
  const ph = (g.time / DAY + 0.15) % 1;
  if (dl < 0.15) return 'night';
  if (dl < 0.55 && ph > 0.45) return 'dusk';
  return 'day';
}

/** Build the Homeport roster once per session. */
export function ensureResidents(g: Game) {
  if (g.residentTown === RESIDENT_TOWN_KEY && g.residents.length) return;
  const town = g.world.homeTown;
  if (!town) return;
  const plan = g.settlementPlan(town);
  const phase = dayPhase(g);
  g.residentTown = town.key;
  g.residents = RESIDENTS.map((def, i) => makeResident(def, i, plan, phase));
  if (!g.residentGreeted) {
    g.residentGreeted = true;
    g.addLog('🏡 A few people live in Homeport. They have their own days.', '#ffd166');
  }
  for (const r of g.residents) assignSchedule(g, r, phase, plan);
}

function makeResident(def: ResidentDef, i: number, plan: SettlementPlan, phase: DayPhase): Resident {
  const house = plan.houses[i % plan.houses.length] ?? plan.center;
  const home = { x: house.x, y: house.y + 3 };
  const night = phase === 'night' && def.role !== 'watch';
  return {
    def, x: home.x, y: home.y, tx: home.x, ty: home.y, home,
    activity: night ? 'in for the night' : 'at home', spot: 'home', state: night ? 'home' : 'walk',
    phase, walk: i * 1.7, facing: 0, walking: false, indoors: night,
    shakenUntil: 0, seed: (i + 0.37) * 7.1,
  };
}

function spotName(spot: Resident['spot']) {
  return spot === 'field' ? 'the bean rows' : spot === 'workshop' ? 'the workshop' : spot === 'well' ? 'the well' : spot === 'green' ? 'the green' : spot === 'watch' ? 'the watchtower' : spot === 'wild' ? 'the wild edge' : 'home';
}

function spotActivity(r: Resident, phase: DayPhase) {
  if (phase === 'dusk') return r.def.role === 'kid' ? 'playing one last game on the green' : 'trading news at the well';
  switch (r.spot) {
    case 'field': return 'tending the bean rows';
    case 'workshop': return 'mending a kettle';
    case 'well': return 'trading news at the well';
    case 'green': return r.def.role === 'kid' ? 'playing tag with a beetle' : 'enjoying the green';
    case 'watch': return 'watching the treeline';
    case 'wild': return 'gathering windfall';
    default: return 'at home';
  }
}

function sendTo(g: Game, r: Resident, x: number, y: number, spot: Resident['spot']) {
  r.tx = x; r.ty = y; r.spot = spot; r.activity = `heading to ${spotName(spot)}`;
  r.state = 'walk';
  if (g.time < r.shakenUntil) r.activity = 'keeping out of the way';
}

function assignSchedule(g: Game, r: Resident, phase: DayPhase, plan: SettlementPlan) {
  if (g.time < r.shakenUntil) {
    sendTo(g, r, r.home.x, r.home.y, 'home');
    return;
  }
  if (phase === 'night') {
    if (r.def.role === 'watch') sendTo(g, r, plan.watch.x, plan.watch.y, 'watch');
    else {
      sendTo(g, r, r.home.x, r.home.y, 'home');
      r.activity = 'heading home for the night';
    }
    return;
  }
  if (phase === 'dusk') {
    if (r.def.role === 'kid') sendTo(g, r, plan.green.x + (r.seed % 7) - 3, plan.green.y + 4, 'green');
    else sendTo(g, r, plan.well.x + (r.seed % 7) - 3, plan.well.y + 4, 'well');
    return;
  }
  switch (r.def.role) {
    case 'gardener':
      sendTo(g, r, plan.field.x + (r.seed % 9) - 4, plan.field.y + 4, 'field');
      break;
    case 'tinker':
      sendTo(g, r, plan.workshop.x + 7, plan.workshop.y + 8, 'workshop');
      break;
    case 'kid':
      sendTo(g, r, plan.green.x + (r.seed % 11) - 5, plan.green.y, 'green');
      break;
    case 'watch':
      sendTo(g, r, plan.watch.x, plan.watch.y, 'watch');
      break;
  }
}

function move(r: Resident, dt: number, speed: number) {
  const dx = r.tx - r.x, dy = r.ty - r.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) { r.walking = false; return true; }
  r.walking = true;
  r.facing = Math.atan2(dy, dx);
  r.walk += dt * (speed / WALK_SPEED);
  const step = Math.min(d, speed * dt);
  r.x += (dx / d) * step; r.y += (dy / d) * step;
  return false;
}

function arrive(g: Game, r: Resident) {
  if (r.spot === 'home') {
    if (r.phase === 'night' || g.time < r.shakenUntil) {
      r.indoors = true; r.state = 'home'; r.activity = g.time < r.shakenUntil ? 'keeping out of the way' : 'in for the night';
    } else {
      r.state = 'home'; r.activity = 'at home';
    }
    return;
  }
  r.state = r.spot === 'watch' || r.spot === 'field' || r.spot === 'workshop' ? 'work' : 'social';
  r.activity = spotActivity(r, r.phase);
}

function startLoot(g: Game, r: Resident, s: Spoils) {
  r.state = 'loot'; r.spot = 'wild';
  r.tx = s.x; r.ty = s.y;
  r.activity = 'sprinting for the spoils';
  if (Math.hypot(g.v.x - s.x, g.v.y - s.y) < 600) g.addLog(`🏃 ${r.def.name} spotted the town watch's kill and sprinted for it.`, '#ffd166');
}

function updateLoot(g: Game, r: Resident, dt: number) {
  const s = g.residentSpoils.find((q) => !q.claimed && Math.hypot(q.x - r.tx, q.y - r.ty) < 2);
  if (!s) { r.state = 'walk'; assignSchedule(g, r, r.phase, g.settlementPlan(g.world.homeTown)); return; }
  const threat = g.mobs.some((m) => Math.hypot(m.x - r.x, m.y - r.y) < WATCHDOG_RANGE || Math.hypot(m.x - s.x, m.y - s.y) < WATCHDOG_RANGE);
  if (threat) {
    s.claimed = true; // the chance is gone; the resident chooses sense
    r.state = 'flee'; r.spot = 'home';
    r.tx = r.home.x; r.ty = r.home.y;
    r.shakenUntil = g.time + 75;
    r.activity = 'beating a retreat';
    if (Math.hypot(g.v.x - r.x, g.v.y - r.y) < 600) g.addLog(`${r.def.name} thought better of it and ran for home.`, '#ffd166');
    return;
  }
  if (!move(r, dt, LOOT_SPEED)) return;
  s.claimed = true;
  const i = g.pickups.findIndex((p) => p.town && Math.hypot(p.x - s.x, p.y - s.y) < 32);
  if (i >= 0) {
    const p = g.pickups[i];
    g.pickups.splice(i, 1);
    const what = p.kind === 'coins' ? `${p.amt} coins` : `${p.amt} ${RES_INFO[p.kind].name.toLowerCase()}`;
    if (Math.hypot(g.v.x - s.x, g.v.y - s.y) < 600) g.addLog(`🏃 ${r.def.name} scooped up ${what} for the town.`, '#ffd166');
  } else if (Math.hypot(g.v.x - s.x, g.v.y - s.y) < 600) {
    g.addLog(`${r.def.name} reached the spoils just as they vanished.`, '#7fd1e8');
  }
  r.state = 'walk';
  assignSchedule(g, r, r.phase, g.settlementPlan(g.world.homeTown));
}

function updateFlee(r: Resident, dt: number) {
  if (!move(r, dt, FLEE_SPEED)) return;
  r.indoors = true; r.state = 'home'; r.activity = 'keeping out of the way';
}

/** Called by weapons.killMob when a town-watch shot lands the killing blow. */
export function onTownKill(g: Game, x: number, y: number) {
  let town = null, bd = 340;
  for (const t of g.nearTowns) { const d = Math.hypot(t.x - x, t.y - y); if (d < bd) { bd = d; town = t; } }
  if (!town || town.key !== RESIDENT_TOWN_KEY) return;
  if (g.residentSpoils.length > 4) return;
  g.residentSpoils.push({ x, y, t: g.time + 2, claimed: false, hesitated: false });
}

function updateSpoils(g: Game) {
  if (!g.residentSpoils.length) return;
  for (const s of g.residentSpoils) {
    if (s.claimed || g.time < s.t) continue;
    const r = g.residents.find((q) => q.def.trait === 'bold' && !q.indoors && q.state !== 'loot' && q.state !== 'flee' && q.shakenUntil <= g.time);
    if (!r || Math.hypot(r.x - s.x, r.y - s.y) > LOOT_RANGE) continue;
    const threat = g.mobs.some((m) => Math.hypot(m.x - s.x, m.y - s.y) < THREAT_RANGE);
    if (threat) {
      if (!s.hesitated) {
        s.hesitated = true;
        if (Math.hypot(g.v.x - s.x, g.v.y - s.y) < 600) g.addLog(`${r.def.name} eyed the spoils, then the critter, and decided to be sensible.`, '#7fd1e8');
      }
      continue;
    }
    startLoot(g, r, s);
    break;
  }
  g.residentSpoils = g.residentSpoils.filter((s) => !s.claimed && g.time - s.t < SPOIL_LIFE);
}

function chatter(g: Game, dt: number) {
  g.residentChatterT -= dt;
  if (g.residentChatterT > 0) return;
  g.residentChatterT = 90 + Math.random() * 60;
  if (Math.hypot(g.world.homeTown.x - g.v.x, g.world.homeTown.y - g.v.y) > 650) return;
  const outside = g.residents.filter((r) => !r.indoors);
  if (!outside.length) return;
  const r = outside[(Math.random() * outside.length) | 0];
  g.addLog(`💬 ${r.def.line}`, '#ffe8a3');
}

export function updateResidents(g: Game, dt: number) {
  ensureResidents(g);
  if (!g.residents.length) return;
  const phase = dayPhase(g);
  g.residentPhase = phase;
  updateSpoils(g);

  for (const r of g.residents) {
    if (g.time < r.shakenUntil) {
      if (!r.indoors) {
        if (r.state !== 'flee') { r.state = 'flee'; r.tx = r.home.x; r.ty = r.home.y; r.activity = 'keeping out of the way'; }
        updateFlee(r, dt);
      } else { r.state = 'home'; r.activity = 'keeping out of the way'; }
      continue;
    }
    if (r.state === 'loot') { updateLoot(g, r, dt); continue; }
    if (r.state === 'flee') { updateFlee(r, dt); if (r.indoors) r.state = 'home'; continue; }

    if (r.phase !== phase) {
      r.phase = phase;
      if (phase === 'day' && r.indoors) { r.indoors = false; r.x = r.home.x; r.y = r.home.y; }
      assignSchedule(g, r, phase, g.settlementPlan(g.world.homeTown));
    }
    if (r.indoors) {
      if (phase === 'day' && r.shakenUntil <= g.time) {
        r.indoors = false; r.x = r.home.x; r.y = r.home.y;
        assignSchedule(g, r, phase, g.settlementPlan(g.world.homeTown));
      } else { r.activity = phase === 'night' ? 'in for the night' : 'at home'; continue; }
    }
    if (move(r, dt, WALK_SPEED)) arrive(g, r);
  }
  chatter(g, dt);
}
