// Settlement residents: the first slice lives in Homeport only.
// They are schedule-driven walkers with small daily routines, not a second pathfinding
// system. Their state is transient: the roster and positions are rebuilt from the clock
// when a save loads, and the day's little variations come from seed + day number.
import type { Game } from '../engine';
import { DAY } from '../core/constants';
import type { DayPhase, Resident, Spoils } from '../core/types';
import { RESIDENTS, RES_INFO } from '../../content/index';
import type { ResidentDef } from '../../content/index';
import type { SettlementPlan } from '../world/settlement';
import { hash2 } from '../world/noise';

/** The one settlement that has residents in this slice. Remove this gate when the model is proven. */
export const RESIDENT_TOWN_KEY = 'home';

const WALK_SPEED = 18;
const LOOT_SPEED = 30;
const FLEE_SPEED = 34;
const SPOIL_LIFE = 90;
const LOOT_RANGE = 320;
const THREAT_RANGE = 120;
const WATCHDOG_RANGE = 80;

const GARDEN_LINES = ['tending the bean rows', 'weeding between the rows', 'planting something hopeful', 'having a word with a stubborn sprout'];
const TINKER_LINES = ['mending a kettle', 'sorting a jar of bolts', 'oiling something small', 'measuring twice'];
const KID_LINES = ['playing tag with a beetle', 'chasing a leaf', 'practising cartwheels', 'building a stick fort'];
const WATCH_LINES = ['watching the treeline', 'pacing the watchtower', 'scanning the horizon'];
const BREAK_LINES = ['taking a breather by the well', 'watching the clouds', 'sitting on the green', 'stretching out a knee', 'sharing a snack'];

export function dayPhase(g: Game): DayPhase {
  const dl = g.daylight();
  const ph = (g.time / DAY + 0.15) % 1;
  if (dl < 0.15) return 'night';
  if (dl < 0.55 && ph > 0.45) return 'dusk';
  return 'day';
}

function pick<T>(list: T[], h: number) {
  return list[Math.min(list.length - 1, Math.floor(h * list.length))];
}

/** Deterministic per-day variation: same seed, same day, same little life. */
function dayHash(r: Resident, salt: number) {
  return hash2(Math.floor(r.day), Math.floor(r.seed * 997), salt);
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
    phase, walk: i * 1.7, anim: i * 2.1, facing: 0, walking: false, indoors: night,
    shakenUntil: 0, seed: (i + 0.37) * 7.1, day: -1,
    workX: home.x, workY: home.y, workSpot: 'home', workActivity: 'at home',
    breakAt: Infinity, breakUntil: Infinity, breakFor: 0, breakX: home.x, breakY: home.y, breakSpot: 'green',
    wanderAt: 0, nextState: night ? 'home' : 'walk', nextActivity: 'at home', wakeAt: 0,
  };
}

function spotName(spot: Resident['spot']) {
  return spot === 'field' ? 'the bean rows' : spot === 'workshop' ? 'the workshop' : spot === 'well' ? 'the well' : spot === 'green' ? 'the green' : spot === 'watch' ? 'the watchtower' : spot === 'wild' ? 'the wild edge' : 'home';
}

function sendTo(g: Game, r: Resident, x: number, y: number, spot: Resident['spot'], nextState: Resident['nextState'], nextActivity: string) {
  r.tx = x; r.ty = y; r.spot = spot;
  r.state = 'walk';
  r.nextState = nextState;
  r.nextActivity = nextActivity;
  r.activity = `heading to ${spotName(spot)}`;
  if (g.time < r.shakenUntil) r.activity = 'keeping out of the way';
}

function sendHome(g: Game, r: Resident, phase: DayPhase) {
  sendTo(g, r, r.home.x, r.home.y, 'home', 'home', phase === 'night' ? 'in for the night' : 'at home');
}

/** Lay out one day's work, break and potter. Re-rolled whenever the day or phase changes. */
function startDayRoutine(g: Game, r: Resident, plan: SettlementPlan) {
  r.day = Math.floor(g.time / DAY);
  const h = (salt: number) => dayHash(r, salt);
  const role = r.def.role;
  const sideTrip = h(11) < 0.22;
  let x: number, y: number, spot: Resident['spot'], activity: string;

  if (role === 'gardener') {
    if (sideTrip) {
      spot = 'wild';
      x = plan.wild.x + (h(12) - 0.5) * 18;
      y = plan.wild.y + (h(13) - 0.5) * 10;
      activity = 'gathering windfall at the wild edge';
    } else {
      spot = 'field';
      x = plan.field.x + (h(1) - 0.5) * 30;
      y = plan.field.y + (h(2) - 0.5) * 14;
      activity = pick(GARDEN_LINES, h(3));
    }
  } else if (role === 'tinker') {
    if (sideTrip) {
      spot = 'green';
      x = plan.green.x + (h(12) - 0.5) * 24;
      y = plan.green.y + (h(13) - 0.5) * 14;
      activity = 'looking for a missing bolt on the green';
    } else {
      spot = 'workshop';
      x = plan.workshop.x + 4 + (h(1) - 0.5) * 10;
      y = plan.workshop.y + 7 + (h(2) - 0.5) * 5;
      activity = pick(TINKER_LINES, h(3));
    }
  } else if (role === 'kid') {
    if (sideTrip) {
      spot = 'field';
      x = plan.field.x + (h(12) - 0.5) * 24;
      y = plan.field.y + (h(13) - 0.5) * 12;
      activity = 'helping with the bean rows, sort of';
    } else {
      spot = 'green';
      x = plan.green.x + (h(1) - 0.5) * 28;
      y = plan.green.y + (h(2) - 0.5) * 16;
      activity = pick(KID_LINES, h(3));
    }
  } else {
    if (sideTrip) {
      spot = 'green';
      x = plan.green.x + (h(12) - 0.5) * 24;
      y = plan.green.y + (h(13) - 0.5) * 14;
      activity = 'walking a turn around the green';
    } else {
      spot = 'watch';
      x = plan.watch.x + (h(1) - 0.5) * 5;
      y = plan.watch.y + (h(2) - 0.5) * 4;
      activity = pick(WATCH_LINES, h(3));
    }
  }

  r.workX = x; r.workY = y; r.workSpot = spot; r.workActivity = activity;
  r.breakAt = g.time + 32 + h(4) * 58;
  r.breakFor = 9 + h(5) * 10;
  const breakSpots: { x: number; y: number; spot: Resident['spot'] }[] = [
    { x: plan.well.x, y: plan.well.y, spot: 'well' },
    { x: plan.green.x, y: plan.green.y, spot: 'green' },
  ];
  if (role === 'gardener') breakSpots.push({ x: plan.field.x, y: plan.field.y, spot: 'field' });
  if (role === 'watch') breakSpots.push({ x: plan.watch.x, y: plan.watch.y, spot: 'watch' });
  const b = breakSpots[Math.min(breakSpots.length - 1, Math.floor(h(6) * breakSpots.length))];
  r.breakX = b.x + (h(7) - 0.5) * 8;
  r.breakY = b.y + 4 + (h(8) - 0.5) * 5;
  r.breakSpot = b.spot;
  r.breakUntil = Infinity;
  r.wanderAt = g.time + 2 + h(9) * 5;
  r.anim = h(10) * 8;
  sendTo(g, r, x, y, spot, 'work', activity);
}

function assignSchedule(g: Game, r: Resident, phase: DayPhase, plan: SettlementPlan) {
  if (g.time < r.shakenUntil) { sendHome(g, r, phase); return; }

  if (phase === 'night') {
    r.breakAt = Infinity; r.breakUntil = Infinity;
    if (r.def.role === 'watch') {
      r.workX = plan.watch.x; r.workY = plan.watch.y; r.workSpot = 'watch'; r.workActivity = 'keeping watch';
      r.wanderAt = g.time + 3 + dayHash(r, 21) * 5;
      sendTo(g, r, r.workX, r.workY, 'watch', 'work', 'keeping watch');
    } else sendHome(g, r, phase);
    return;
  }

  if (phase === 'dusk') {
    r.breakAt = Infinity; r.breakUntil = Infinity;
    if (r.def.role === 'kid') sendTo(g, r, plan.green.x, plan.green.y + 4, 'green', 'social', 'playing one last game on the green');
    else sendTo(g, r, plan.well.x, plan.well.y + 4, 'well', 'social', 'trading news at the well');
    return;
  }

  startDayRoutine(g, r, plan);
}

function walkSpeed(r: Resident) {
  return r.def.role === 'kid' ? 22 : WALK_SPEED;
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
      r.indoors = true; r.state = 'home';
      r.activity = g.time < r.shakenUntil ? 'keeping out of the way' : 'in for the night';
    } else {
      r.state = 'home'; r.activity = 'at home';
    }
    return;
  }
  r.state = r.nextState;
  r.activity = r.nextActivity;
  if (r.state === 'rest') r.breakUntil = g.time + r.breakFor;
}

function startLoot(g: Game, r: Resident, s: Spoils) {
  r.state = 'loot'; r.spot = 'wild';
  r.tx = s.x; r.ty = s.y;
  r.activity = 'sprinting for the spoils';
  if (Math.hypot(g.v.x - s.x, g.v.y - s.y) < 600) g.addLog(`🏃 ${r.def.name} spotted the town watch's kill and sprinted for it.`, '#ffd166');
}

function updateLoot(g: Game, r: Resident, dt: number) {
  const s = g.residentSpoils.find((q) => !q.claimed && Math.hypot(q.x - r.tx, q.y - r.ty) < 2);
  if (!s) { r.state = 'walk'; assignSchedule(g, r, dayPhase(g), g.settlementPlan(g.world.homeTown)); return; }
  const threat = g.mobs.some((m) => Math.hypot(m.x - r.x, m.y - r.y) < WATCHDOG_RANGE || Math.hypot(m.x - s.x, m.y - s.y) < WATCHDOG_RANGE);
  if (threat) {
    s.claimed = true;
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
  assignSchedule(g, r, dayPhase(g), g.settlementPlan(g.world.homeTown));
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

function fidget(g: Game, r: Resident, dt: number) {
  r.anim += dt;
  if (Math.random() < dt * 0.22) r.facing += (Math.random() - 0.5) * 0.9;
  if (r.def.role === 'gardener' && Math.random() < dt * 1.1) {
    g.part(r.x + 3, r.y - 1, (Math.random() - 0.5) * 8, -10 - Math.random() * 10, 0.35, 1.2, 'rgba(105,75,45,0.75)', 2, 90, 1);
  } else if (r.def.role === 'tinker' && Math.random() < dt * 0.7) {
    g.part(r.x + 2.5, r.y - 6, (Math.random() - 0.5) * 10, -8, 0.25, 1, '#ffd166', 3, 30, 1);
  }
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
      if (phase === 'day') {
        if (r.indoors) {
          r.wakeAt = g.time + 2 + hash2(Math.floor(g.time / DAY), Math.floor(r.seed * 997), 12) * 8;
          r.breakAt = Infinity;
          r.activity = 'having a slow morning';
        } else {
          startDayRoutine(g, r, g.settlementPlan(g.world.homeTown));
        }
      } else {
        r.wakeAt = 0;
        assignSchedule(g, r, phase, g.settlementPlan(g.world.homeTown));
      }
    }

    if (r.indoors) {
      if (phase === 'day' && g.time >= r.wakeAt) {
        r.indoors = false; r.x = r.home.x; r.y = r.home.y;
        startDayRoutine(g, r, g.settlementPlan(g.world.homeTown));
      } else {
        r.activity = phase === 'night' ? 'in for the night' : phase === 'day' ? 'having a slow morning' : 'at home';
        continue;
      }
    }

    if (r.state === 'walk') {
      if (r.walking && Math.random() < dt * 2.2) g.part(r.x, r.y - 0.5, (Math.random() - 0.5) * 4, -2, 0.3, 1.1, 'rgba(210,190,150,0.35)', 2, 0, 1);
      if (move(r, dt, walkSpeed(r))) arrive(g, r);
      continue;
    }

    if (r.state === 'rest' || r.state === 'social') {
      fidget(g, r, dt);
      if (r.state === 'rest') {
        const other = g.residents.find((q) => q !== r && !q.indoors && (q.state === 'rest' || q.state === 'social') && Math.hypot(q.x - r.x, q.y - r.y) < 22);
        if (other) { r.state = 'social'; r.activity = `talking with ${other.def.name}`; r.facing = Math.atan2(other.y - r.y, other.x - r.x); }
      }
      if (r.breakUntil !== Infinity && g.time >= r.breakUntil) {
        r.breakAt = g.time + 45 + Math.random() * 45;
        r.wanderAt = g.time + 3 + Math.random() * 4;
        sendTo(g, r, r.workX, r.workY, r.workSpot, 'work', r.workActivity);
      }
      continue;
    }

    if (r.state === 'work') {
      fidget(g, r, dt);
      if (g.time >= r.breakAt) {
        r.breakAt = Infinity;
        sendTo(g, r, r.breakX, r.breakY, r.breakSpot, 'rest', pick(BREAK_LINES, Math.random()));
      } else if (g.time >= r.wanderAt) {
        const radius = r.def.role === 'gardener' ? 13 : r.def.role === 'kid' ? 18 : r.def.role === 'watch' ? 5 : 8;
        const a = Math.random() * Math.PI * 2, rad = Math.sqrt(Math.random()) * radius;
        sendTo(g, r, r.workX + Math.cos(a) * rad, r.workY + Math.sin(a) * rad, r.workSpot, 'work', r.workActivity);
        r.activity = r.workActivity;
        r.wanderAt = g.time + 2 + Math.random() * 5;
      }
      continue;
    }

    if (r.state === 'home' && phase !== 'night') {
      if (phase === 'day') startDayRoutine(g, r, g.settlementPlan(g.world.homeTown));
      else assignSchedule(g, r, phase, g.settlementPlan(g.world.homeTown));
    }
  }
  chatter(g, dt);
}
