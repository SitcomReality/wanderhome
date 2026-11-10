// Settlement residents: every nearby hamlet, village, town and city has its own people.
// They are schedule-driven walkers with a tiny path network, small daily routines, traits,
// reactions and memories. Their bodies and positions are transient: the roster is rebuilt
// from the town seed and clock when a save loads. Only the memories and moving days persist.
import type { Game } from '../engine';
import { DAY } from '../core/constants';
import type { DayPhase, Resident, ResidentBond, Spoils, TownCat, TownMemory } from '../core/types';
import { CAT_NAMES, RESIDENTS, RES_INFO, RESIDENT_TRAITS, TOWN_CAT, makeGeneratedResident } from '../../content/index';
import type { ResidentDef, ResidentRole, Res } from '../../content/index';
import { routeAlongPaths } from '../world/settlement';
import type { SettlementPlan } from '../world/settlement';
import { hash2 } from '../world/noise';
import { addTownWealth } from './towns';
import type { Town } from '../world/world';

/** Homeport's key; kept as a named anchor for old save memory and the home cat. */
export const RESIDENT_TOWN_KEY = 'home';

const WALK_SPEED = 18;
const LOOT_SPEED = 30;
const FLEE_SPEED = 34;
const SPOIL_LIFE = 90;
const LOOT_RANGE = 320;
const THREAT_RANGE = 120;
const WATCHDOG_RANGE = 80;
const CAT_WALK = 12;
const CAT_RUN = 30;
const ACTIVE_RADIUS = 1400;
const DROP_RADIUS = 1700;
const MAX_RESIDENTS = 220;

const ROLE_PATTERN: ResidentRole[] = ['watch', 'gardener', 'tinker', 'kid', 'baker', 'courier', 'gardener', 'tinker', 'kid', 'watch', 'baker', 'courier'];
const CAT_COLORS = [['#c98b4b', '#f3e3c3'], ['#8d8d8d', '#e8e8e8'], ['#3f3f46', '#d6d3d1'], ['#d9b88a', '#fff1d0'], ['#b07cff', '#f0e6ff'], ['#f0e2c0', '#8d6e63']];

const GARDEN_LINES = ['tending the bean rows', 'weeding between the rows', 'planting something hopeful', 'having a word with a stubborn sprout'];
const TINKER_LINES = ['mending a kettle', 'sorting a jar of bolts', 'oiling something small', 'measuring twice'];
const KID_LINES = ['playing tag with a beetle', 'chasing a leaf', 'practising cartwheels', 'building a stick fort'];
const WATCH_LINES = ['watching the treeline', 'pacing the watchtower', 'scanning the horizon'];
const BAKER_LINES = ['coaxing a stubborn starter', 'dusting a loaf with flour', 'telling the oven to be reasonable', 'braiding dough very seriously'];
const COURIER_LINES = ['sorting the morning parcels', 'checking the road for news', 'reading an address twice', 'delivering something important and small'];
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

function emptyMemory(): TownMemory {
  return { visits: 0, honks: 0, trades: 0, firstDay: -1, lastDay: -1, lastVisit: 0, lastHonk: 0 };
}

export function ensureTownMemory(g: Game, key: string): TownMemory {
  return (g.townMemory[key] ??= emptyMemory());
}

function bondFor(g: Game, id: string): ResidentBond {
  return (g.residentBonds[id] ??= { met: 0, honks: 0, rides: 0, lastDay: -1 });
}

function meet(g: Game, def: ResidentDef) {
  const b = bondFor(g, def.id);
  const day = Math.floor(g.time / DAY);
  if (b.lastDay !== day) { b.met++; b.lastDay = day; }
}

function mirrorHome(g: Game, m: TownMemory) {
  if (m === g.townMemory[RESIDENT_TOWN_KEY]) {
    g.residentMemory = {
      visits: m.visits, honks: m.honks, firstDay: m.firstDay,
      lastDay: m.lastDay, lastVisit: m.lastVisit, lastHonk: m.lastHonk,
    };
  }
}

function townSeed(t: Town) {
  return (Math.floor(t.seedv * 1e6) ^ Math.imul(t.tx, 73856093) ^ Math.imul(t.ty, 19349663)) >>> 0;
}

function rosterForTown(g: Game, t: Town): ResidentDef[] {
  const seed = townSeed(t);
  const base = t.key === RESIDENT_TOWN_KEY ? RESIDENTS : [];
  const out: ResidentDef[] = [];
  for (let i = 0; i < Math.max(1, t.pop); i++) {
    const hand = base[i];
    if (hand) { out.push(hand); continue; }
    const h = hash2(t.tx + i * 13, t.ty - i * 7, seed);
    const role = ROLE_PATTERN[(i + Math.floor(h * ROLE_PATTERN.length)) % ROLE_PATTERN.length];
    const trait = RESIDENT_TRAITS[Math.floor(hash2(t.tx - i * 5, t.ty + i * 11, seed + 77) * RESIDENT_TRAITS.length) % RESIDENT_TRAITS.length];
    out.push(makeGeneratedResident({ townKey: t.key, townName: t.name, index: i, seed, role, trait }));
  }
  for (const def of g.movedIn[t.key] ?? []) {
    if (!out.some((q) => q.id === def.id)) out.push(def);
  }
  const departed = new Set(g.departedByTown[t.key] ?? []);
  const living = out.filter((def) => !departed.has(def.id));
  if (living.length) return living;
  // A town should not become a ghost town because everyone happened to move at once.
  const role = ROLE_PATTERN[0];
  return [makeGeneratedResident({ townKey: t.key, townName: t.name, index: t.pop, seed, role, trait: 'steady' })];
}

function makeResident(def: ResidentDef, i: number, plan: SettlementPlan, phase: DayPhase, townKey: string): Resident {
  const house = plan.houses[i % Math.max(1, plan.houses.length)] ?? { x: plan.center.x, y: plan.center.y, door: plan.center, seed: 0.5 };
  const home = { x: house.door.x, y: house.door.y };
  const night = phase === 'night' && def.role !== 'watch';
  const seed = hash2(Math.floor(plan.center.x / 16), Math.floor(plan.center.y / 16), i + 37);
  return {
    def, townKey, x: home.x, y: home.y, tx: home.x, ty: home.y, route: [], routeAt: 0, home,
    activity: night ? 'in for the night' : 'at home', spot: 'home', state: night ? 'home' : 'walk',
    phase, walk: i * 1.7 + seed, anim: i * 2.1 + seed * 4, facing: 0, walking: false, indoors: night,
    shakenUntil: 0, seed: seed * 13 + i * 7.1, day: -1,
    workX: home.x, workY: home.y, workSpot: 'home', workActivity: 'at home',
    breakAt: Infinity, breakUntil: Infinity, breakFor: 0, breakX: home.x, breakY: home.y, breakSpot: 'green',
    wanderAt: 0, nextState: night ? 'home' : 'walk', nextActivity: 'at home', wakeAt: 0,
    reactUntil: 0, reactKind: null, traitAt: 3 + i * 2 + seed * 5,
  };
}

function planFor(g: Game, r: { townKey: string }): SettlementPlan | null {
  const t = g.residentTowns[r.townKey];
  return t ? g.settlementPlan(t) : null;
}

function ensureCat(g: Game, t: Town) {
  if (g.townCats[t.key]) return;
  const roll = hash2(t.tx, t.ty, 7070 + g.world.seed);
  if (t.key !== RESIDENT_TOWN_KEY && roll > 0.78) return;
  const plan = g.settlementPlan(t);
  const h = hash2(t.tx, t.ty, 7071 + g.world.seed);
  const palette = CAT_COLORS[Math.floor(h * CAT_COLORS.length) % CAT_COLORS.length];
  const name = t.key === RESIDENT_TOWN_KEY ? TOWN_CAT.name : CAT_NAMES[Math.floor(hash2(t.ty, t.tx, 7072) * CAT_NAMES.length) % CAT_NAMES.length];
  g.townCats[t.key] = {
    townKey: t.key, name,
    color: t.key === RESIDENT_TOWN_KEY ? TOWN_CAT.color : palette[0],
    accent: t.key === RESIDENT_TOWN_KEY ? TOWN_CAT.accent : palette[1],
    x: plan.well.x + 7, y: plan.well.y + 4, tx: plan.well.x + 7, ty: plan.well.y + 4,
    facing: 0, walk: 0, anim: 0, state: 'sleep', until: g.time + 9, nextAt: g.time + 12,
    activity: 'asleep by the well',
  };
}

function spawnTown(g: Game, t: Town) {
  const plan = g.settlementPlan(t);
  const defs = rosterForTown(g, t);
  const phase = dayPhase(g);
  // Register the town before assigning routines: sendTo() needs planFor() to find it.
  g.residentTowns[t.key] = t;
  ensureCat(g, t);
  for (const def of defs) {
    const r = makeResident(def, g.residents.filter((q) => q.townKey === t.key).length, plan, phase, t.key);
    g.residents.push(r);
    assignSchedule(g, r, phase, plan);
  }
}

/** Keep only settlements near enough to be seen; spawn their people when first approached. */
export function ensureResidents(g: Game) {
  const home = g.world.homeTown;
  const towns = g.nearTowns.filter((t) => Math.hypot(t.x - g.v.x, t.y - g.v.y) <= ACTIVE_RADIUS);
  if (home && !towns.some((t) => t.key === home.key) && Math.hypot(home.x - g.v.x, home.y - g.v.y) <= ACTIVE_RADIUS) towns.push(home);
  towns.sort((a, b) => Math.hypot(a.x - g.v.x, a.y - g.v.y) - Math.hypot(b.x - g.v.x, b.y - g.v.y));
  for (const t of towns) {
    if (g.residentTowns[t.key]) continue;
    if (g.residents.length + t.pop > MAX_RESIDENTS) continue;
    spawnTown(g, t);
  }
  // Forget people once their town is well out of sight; their memories stay.
  const keys = new Set(towns.map((t) => t.key));
  for (const key in g.residentTowns) {
    const t = g.residentTowns[key];
    if (keys.has(key) && Math.hypot(t.x - g.v.x, t.y - g.v.y) <= DROP_RADIUS) continue;
    delete g.residentTowns[key];
    delete g.townCats[key];
  }
  g.residents = g.residents.filter((r) => g.residentTowns[r.townKey]);
  if (g.residents.length && !g.residentGreeted) {
    g.residentGreeted = true;
    if (g.played) g.addLog('🏡 Every settlement has its own people, routines and opinions.', '#ffd166');
  }
}

function spotName(spot: Resident['spot']) {
  return spot === 'field' ? 'the bean rows' : spot === 'workshop' ? 'the workshop' : spot === 'well' ? 'the well' : spot === 'green' ? 'the green' : spot === 'watch' ? 'the watchtower' : spot === 'wild' ? 'the wild edge' : spot === 'gate' ? 'the gate' : 'home';
}

function sendTo(g: Game, r: Resident, x: number, y: number, spot: Resident['spot'], nextState: Resident['nextState'], nextActivity: string) {
  const plan = planFor(g, r);
  r.tx = x; r.ty = y; r.spot = spot;
  r.route = plan ? routeAlongPaths(plan, { x: r.x, y: r.y }, { x, y }) : [{ x, y }];
  r.routeAt = 0;
  r.state = 'walk';
  r.nextState = nextState;
  r.nextActivity = nextActivity;
  r.activity = `heading to ${spotName(spot)}`;
  if (g.time < r.shakenUntil) r.activity = 'keeping out of the way';
}

function sendHome(g: Game, r: Resident, phase: DayPhase) {
  sendTo(g, r, r.home.x, r.home.y, 'home', 'home', phase === 'night' ? 'in for the night' : 'at home');
}

/** Stop what you are doing, look at something, and react for a few seconds. */
function react(g: Game, r: Resident, kind: NonNullable<Resident['reactKind']>, activity: string, x: number, y: number, forSeconds: number) {
  if (r.indoors || r.state === 'loot' || r.state === 'flee') return;
  if (g.moveOffer?.def.id === r.def.id) return;
  r.state = 'react';
  r.walking = false;
  r.reactKind = kind;
  r.reactUntil = g.time + forSeconds;
  r.facing = Math.atan2(y - r.y, x - r.x);
  r.activity = activity;
}

function returnFromReact(g: Game, r: Resident, plan: SettlementPlan) {
  r.reactKind = null;
  if (r.phase === 'day' && r.workSpot !== 'home') sendTo(g, r, r.workX, r.workY, r.workSpot, 'work', r.workActivity);
  else assignSchedule(g, r, r.phase, plan);
}

/** A small, personal exception to the day's routine: curiosity, play, a patrol, or a bold look. */
function maybeTrait(g: Game, r: Resident, plan: SettlementPlan) {
  if (g.time < r.traitAt) return false;
  r.traitAt = g.time + 6 + Math.random() * 7;
  if (g.time < r.shakenUntil || dayPhase(g) !== 'day') return false;
  if (Math.random() > 0.38) return false;

  if (r.def.trait === 'curious') {
    if ((g.parked || g.docked) && Math.hypot(g.v.x - r.x, g.v.y - r.y) < 160) {
      const side = Math.floor(r.seed) % 2 ? 1 : -1;
      sendTo(g, r, g.v.x + side * 24, g.v.y + 14, 'green', 'react', "inspecting the house's wheels");
      r.reactKind = 'curious';
      r.reactUntil = g.time + 8;
      return true;
    }
  } else if (r.def.trait === 'playful') {
    const playmate = g.residents.find((q) => q.townKey === r.townKey && q.def.role === 'watch' && !q.indoors);
    if (playmate && Math.random() < 0.55 && Math.hypot(playmate.x - r.x, playmate.y - r.y) < 190) {
      sendTo(g, r, playmate.x + 10, playmate.y + 6, 'watch', 'react', `following ${playmate.def.name} around`);
      r.reactKind = 'play';
      r.reactUntil = g.time + 7;
      return true;
    }
    const a = Math.random() * Math.PI * 2, rad = 12 + Math.random() * 16;
    sendTo(g, r, r.workX + Math.cos(a) * rad, r.workY + Math.sin(a) * rad, r.workSpot, 'react', 'chasing a beetle');
    r.reactKind = 'play';
    r.reactUntil = g.time + 5;
    return true;
  } else if (r.def.trait === 'steady') {
    const side = Math.floor(r.seed) % 2 ? 1 : -1;
    sendTo(g, r, plan.gate.x + side * 5, plan.gate.y + 4, 'gate', 'react', 'checking the gate');
    r.reactKind = 'look';
    r.reactUntil = g.time + 7;
    return true;
  } else if (r.def.trait === 'bold') {
    const mob = g.mobs.find((m) => Math.hypot(m.x - plan.gate.x, m.y - plan.gate.y) < 190);
    if (mob) {
      sendTo(g, r, plan.gate.x, plan.gate.y + 4, 'gate', 'react', 'sizing up the critter');
      r.reactKind = 'curious';
      r.reactUntil = g.time + 5;
      return true;
    }
  } else if (r.def.trait === 'dreamy') {
    sendTo(g, r, plan.green.x, plan.green.y + 2, 'green', 'react', 'watching the clouds');
    r.reactKind = 'look';
    r.reactUntil = g.time + 8;
    return true;
  } else if (r.def.trait === 'wry') {
    sendTo(g, r, plan.well.x, plan.well.y + 4, 'well', 'react', 'telling a very dry joke');
    r.reactKind = 'play';
    r.reactUntil = g.time + 5;
    return true;
  }
  return false;
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
  } else if (role === 'baker') {
    if (sideTrip) {
      spot = 'green';
      x = plan.green.x + (h(12) - 0.5) * 20;
      y = plan.green.y + (h(13) - 0.5) * 12;
      activity = 'looking for a quiet spot to let the dough rise';
    } else {
      spot = 'well';
      x = plan.well.x + 16 + (h(1) - 0.5) * 10;
      y = plan.well.y + 8 + (h(2) - 0.5) * 6;
      activity = pick(BAKER_LINES, h(3));
    }
  } else if (role === 'courier') {
    if (sideTrip) {
      spot = 'well';
      x = plan.well.x + (h(12) - 0.5) * 16;
      y = plan.well.y + 5 + (h(13) - 0.5) * 8;
      activity = 'taking a parcel to the well, as instructed';
    } else {
      spot = 'gate';
      x = plan.gate.x + (h(1) - 0.5) * 12;
      y = plan.gate.y + 5 + (h(2) - 0.5) * 6;
      activity = pick(COURIER_LINES, h(3));
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
  if (role === 'watch' || role === 'courier') breakSpots.push({ x: plan.watch.x, y: plan.watch.y, spot: 'watch' });
  if (role === 'baker') breakSpots.push({ x: plan.well.x + 12, y: plan.well.y + 6, spot: 'well' });
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
    else if (r.def.role === 'courier') sendTo(g, r, plan.gate.x, plan.gate.y + 4, 'gate', 'social', 'watching the road go home');
    else sendTo(g, r, plan.well.x, plan.well.y + 4, 'well', 'social', 'trading news at the well');
    return;
  }

  startDayRoutine(g, r, plan);
}

function walkSpeed(r: Resident) {
  return r.def.role === 'kid' ? 22 : WALK_SPEED;
}

function move(r: Resident, dt: number, speed: number) {
  const target = r.route[r.routeAt] ?? { x: r.tx, y: r.ty };
  const dx = target.x - r.x, dy = target.y - r.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) {
    if (r.routeAt < r.route.length - 1) { r.routeAt++; r.walking = false; return false; }
    r.route.length = 0; r.routeAt = 0; r.walking = false;
    return true;
  }
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
  if (r.state === 'react') { r.reactUntil = Math.max(r.reactUntil, g.time + 4); r.walking = false; }
  if (r.state === 'rest') r.breakUntil = g.time + r.breakFor;
}

function startLoot(g: Game, r: Resident, s: Spoils) {
  const plan = planFor(g, r);
  r.state = 'loot'; r.spot = 'wild';
  r.tx = s.x; r.ty = s.y;
  r.route = plan ? routeAlongPaths(plan, { x: r.x, y: r.y }, { x: s.x, y: s.y }) : [{ x: s.x, y: s.y }];
  r.routeAt = 0;
  r.activity = 'sprinting for the spoils';
  if (Math.hypot(g.v.x - s.x, g.v.y - s.y) < 600) g.addLog(`🏃 ${r.def.name} spotted the settlement watch's kill and sprinted for it.`, '#ffd166');
}

function updateLoot(g: Game, r: Resident, dt: number) {
  const s = g.residentSpoils.find((q) => !q.claimed && q.townKey === r.townKey && Math.hypot(q.x - r.tx, q.y - r.ty) < 2);
  const plan = planFor(g, r);
  if (!s) { r.state = 'walk'; if (plan) assignSchedule(g, r, dayPhase(g), plan); return; }
  const threat = g.mobs.some((m) => Math.hypot(m.x - r.x, m.y - r.y) < WATCHDOG_RANGE || Math.hypot(m.x - s.x, m.y - s.y) < WATCHDOG_RANGE);
  if (threat) {
    s.claimed = true;
    r.state = 'flee'; r.spot = 'home'; r.route = [];
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
  if (plan) assignSchedule(g, r, dayPhase(g), plan);
}

function updateFlee(r: Resident, dt: number) {
  if (!move(r, dt, FLEE_SPEED)) return;
  r.indoors = true; r.state = 'home'; r.activity = 'keeping out of the way';
}

function moveCat(c: TownCat, dt: number, speed: number) {
  const dx = c.tx - c.x, dy = c.ty - c.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  c.facing = Math.atan2(dy, dx);
  c.walk += dt * (speed / CAT_WALK);
  const step = Math.min(d, speed * dt);
  c.x += (dx / d) * step; c.y += (dy / d) * step;
  return false;
}

function startleCats(g: Game, x: number, y: number, forSeconds: number) {
  for (const c of Object.values(g.townCats)) {
    if (Math.hypot(c.x - x, c.y - y) > 300) continue;
    const a = Math.atan2(c.y - y, c.x - x) || 0;
    c.state = 'startle';
    c.until = g.time + forSeconds;
    c.nextAt = g.time + 1.2;
    c.activity = 'startled';
    c.tx = c.x + Math.cos(a) * 18;
    c.ty = c.y + Math.sin(a) * 10;
  }
}

function updateCat(g: Game, c: TownCat, dt: number, phase: DayPhase) {
  const t = g.residentTowns[c.townKey];
  if (!t) return;
  const plan = g.settlementPlan(t);
  c.anim += dt;

  const pip = g.residents.find((r) => r.townKey === c.townKey && r.def.role === 'kid' && !r.indoors);
  if (pip && pip.walking && Math.hypot(pip.x - c.x, pip.y - c.y) < 18 && Math.random() < dt * 0.35) startleCats(g, pip.x, pip.y, 1.2);

  if (g.time < c.until) {
    if (c.state === 'wander' || c.state === 'follow' || c.state === 'startle') moveCat(c, dt, c.state === 'startle' ? CAT_RUN : CAT_WALK);
    return;
  }

  if (phase === 'night') {
    const watcher = g.residents.find((r) => r.townKey === c.townKey && r.def.role === 'watch' && !r.indoors);
    if (watcher) {
      c.state = 'follow'; c.tx = watcher.x + 9; c.ty = watcher.y + 3;
      c.activity = `following ${watcher.def.name}`; c.until = g.time + 2.5; c.nextAt = g.time + 2.5;
      moveCat(c, dt, CAT_WALK);
      return;
    }
  }

  if (g.time >= c.nextAt) {
    c.nextAt = g.time + 8 + Math.random() * 10;
    const roll = Math.random();
    if (roll < 0.3) {
      c.state = 'sleep'; c.until = g.time + 9 + Math.random() * 10; c.activity = 'curling up for a nap';
    } else if (roll < 0.7) {
      const spot = Math.random() < 0.5 ? plan.well : plan.green;
      c.state = 'wander'; c.tx = spot.x + (Math.random() - 0.5) * 26; c.ty = spot.y + 4 + (Math.random() - 0.5) * 14;
      c.until = g.time + 5 + Math.random() * 4; c.activity = 'padding across the square';
    } else {
      c.state = 'sit'; c.until = g.time + 5 + Math.random() * 6; c.activity = 'sitting in a sunbeam';
    }
  }
  if (c.state === 'wander' || c.state === 'follow' || c.state === 'startle') moveCat(c, dt, c.state === 'startle' ? CAT_RUN : CAT_WALK);
}

function giftFor(def: ResidentDef, h: number): { coins?: number; res?: { kind: Res; amt: number } } {
  if (h < 0.52) return { coins: 10 + Math.floor(h * 34) };
  const kinds: Res[] = ['honey', 'rope', 'glass', 'scrap', 'fiber'];
  return { res: { kind: kinds[Math.floor(hash2(def.id.length, Math.floor(h * 999), 44) * kinds.length) % kinds.length], amt: 2 + Math.floor(h * 4) } };
}

function memoryLine(g: Game, r: Resident) {
  const b = g.residentBonds[r.def.id];
  if (b?.rides) return 'You gave me a lift once. I still owe you a bun.';
  if ((b?.honks ?? 0) >= 3) return 'I would know that horn anywhere.';
  return r.def.remember;
}

/** A familiar face returns. Every docked town remembers its own visitors. */
export function onVisit(g: Game, town: Town) {
  if (!g.played) return;
  ensureResidents(g);
  const m = ensureTownMemory(g, town.key);
  const day = Math.floor(g.time / DAY);
  const previous = m.visits;
  m.visits++;
  if (m.firstDay < 0) m.firstDay = day;
  m.lastDay = day;
  m.lastVisit = g.time;
  mirrorHome(g, m);

  const outside = g.residents.filter((r) => r.townKey === town.key && !r.indoors);
  for (const r of outside) meet(g, r.def);
  arriveMovers(g, town);

  if (m.visits >= 2 && outside.length) {
    const r = outside[Math.floor(Math.random() * outside.length)];
    g.addLog(`💬 ${r.def.name}: ${memoryLine(g, r)}`, '#ffe8a3');
    react(g, r, 'wave', 'glad to see the house', g.v.x, g.v.y, 3);
    if ((g.res.crystal ?? 0) + (g.res.starmetal ?? 0) >= 1) {
      const tinker = outside.find((q) => q.def.role === 'tinker');
      if (tinker) g.addLog(`💬 ${tinker.def.name}: Is that starmetal? I promise not to take it apart.`, '#ffe8a3');
    }
  } else if (previous === 0 && town.key === RESIDENT_TOWN_KEY && outside.length) {
    g.addLog(`💬 ${outside[0].def.name}: Welcome to ${town.name}. Mind the chickens.`, '#ffe8a3');
  }
  offerMove(g, town);
}

/** The horn is the easiest way to get a wave out of a town. */
export function onHonk(g: Game) {
  if (!g.played) return;
  ensureResidents(g);
  const towns = g.nearTowns.filter((t) => Math.hypot(t.x - g.v.x, t.y - g.v.y) < 700);
  if (!towns.length) return;
  for (const t of towns) {
    const m = ensureTownMemory(g, t.key);
    m.honks++;
    m.lastHonk = g.time;
    mirrorHome(g, m);
  }

  const near = g.residents.filter((r) => !r.indoors && r.state !== 'loot' && r.state !== 'flee' && Math.hypot(r.x - g.v.x, r.y - g.v.y) < 500);
  for (const r of near) {
    react(g, r, 'wave', 'waving at the house', g.v.x, g.v.y, 2.4);
    bondFor(g, r.def.id).honks++;
  }
  if (near.length && g.time - g.residentHonkLog > 12) {
    g.residentHonkLog = g.time;
    g.addLog(`👋 ${near[0].def.name} waves back.`, '#ffe8a3');
  }
  startleCats(g, g.v.x, g.v.y, 1.4);
}

/** A settlement watch has fired. Everyone outside looks up; the cats bolt. */
export function onWatchFire(g: Game, town: Town, x: number, y: number) {
  if (g.time - g.residentWatchReact < 4) return;
  g.residentWatchReact = g.time;
  const near = g.residents.filter((r) => r.townKey === town.key && !r.indoors && r.state !== 'loot' && r.state !== 'flee' && Math.hypot(r.x - x, r.y - y) < 540);
  for (const r of near) react(g, r, 'look', 'looking toward the watchtower', x, y, 3);
  startleCats(g, x, y, 1.1);
}

/** Called by weapons.killMob when a town-watch shot lands the killing blow. */
export function onTownKill(g: Game, x: number, y: number) {
  let town: Town | null = null, bd = 340;
  for (const t of g.nearTowns) { const d = Math.hypot(t.x - x, t.y - y); if (d < bd) { bd = d; town = t; } }
  if (!town) return;
  if (g.residentSpoils.length > 5) return;
  g.residentSpoils.push({ x, y, t: g.time + 2, claimed: false, hesitated: false, townKey: town.key });
}

function updateSpoils(g: Game) {
  if (!g.residentSpoils.length) return;
  for (const s of g.residentSpoils) {
    if (s.claimed || g.time < s.t) continue;
    const r = g.residents.find((q) => q.townKey === s.townKey && q.def.trait === 'bold' && !q.indoors && q.state !== 'loot' && q.state !== 'flee' && q.shakenUntil <= g.time);
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
  if (g.residentChatterT > 0 || !g.played) return;
  g.residentChatterT = 75 + Math.random() * 60;
  const outside = g.residents.filter((r) => !r.indoors && Math.hypot(r.x - g.v.x, r.y - g.v.y) < 750);
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
  } else if (r.def.role === 'baker' && Math.random() < dt * 0.5) {
    g.part(r.x + 2, r.y - 7, (Math.random() - 0.5) * 5, -5, 0.4, 1.1, 'rgba(241,231,211,0.6)', 1, 20, 1);
  }
}

/** A resident asks for a lift. Only between towns the player has actually visited. */
function offerMove(g: Game, town: Town) {
  if (g.moveOffer || g.movers.length >= 3) return;
  if (g.time < (g.moveCooldown[town.key] ?? 0)) return;
  const destinations = Object.entries(g.towns).filter(([key, kt]) => key !== town.key && Math.hypot(kt.x - town.x, kt.y - town.y) > 180);
  if (!destinations.length) return;
  const outside = g.residents.filter((r) => r.townKey === town.key && !r.indoors && r.state !== 'loot' && r.state !== 'flee');
  if (!outside.length) return;
  g.moveCooldown[town.key] = g.time + DAY * 1.4;
  const chance = 0.2 + Math.min(0.2, town.pop * 0.008) + (town.tier === 'city' ? 0.12 : 0) + (town.tier === 'town' ? 0.06 : 0);
  if (Math.random() > chance) return;
  const adults = outside.filter((r) => r.def.role !== 'kid');
  const pool = adults.length && Math.random() > 0.18 ? adults : outside;
  const r = pool[Math.floor(Math.random() * pool.length)];
  if (!r) return;
  const [toKey, to] = destinations[Math.floor(Math.random() * destinations.length)];
  g.moveOffer = { def: r.def, fromKey: town.key, fromName: town.name, toKey, toName: to.name, since: g.time };
  const plan = g.settlementPlan(town);
  sendTo(g, r, plan.gate.x + (r.seed % 2 ? 5 : -5), plan.gate.y + 4, 'gate', 'react', 'waiting by the gate with a bundle');
  r.reactKind = 'look';
  r.reactUntil = g.time + 9999;
  g.addLog(`🧳 ${r.def.name} is waiting by the gate with a bundle, hoping for a lift to ${to.name}.`, '#ffe8a3');
}

/** Send a disappointed traveller back to their ordinary day. */
function releaseWaiter(g: Game, offer: { def: ResidentDef; fromKey: string }) {
  const r = g.residents.find((q) => q.townKey === offer.fromKey && q.def.id === offer.def.id);
  if (!r) return;
  const plan = planFor(g, r);
  if (plan) assignSchedule(g, r, dayPhase(g), plan);
}

/** Accept the waiting resident's request. They travel with the house until the next stop. */
export function acceptMover(g: Game) {
  const offer = g.moveOffer;
  if (!offer || g.docked?.key !== offer.fromKey) return false;
  g.moveOffer = null;
  g.moveCooldown[offer.fromKey] = g.time + DAY * 1.4;
  (g.departedByTown[offer.fromKey] ??= []).push(offer.def.id);
  g.residents = g.residents.filter((r) => !(r.townKey === offer.fromKey && r.def.id === offer.def.id));
  const h = hash2(offer.def.id.length, Math.floor(offer.since), 93);
  g.movers.push({
    def: offer.def, fromKey: offer.fromKey, fromName: offer.fromName, toKey: offer.toKey, toName: offer.toName,
    acceptedAt: g.time, gift: giftFor(offer.def, h),
  });
  g.addLog(`🧳 ${offer.def.name} climbs aboard, bound for ${offer.toName}. They brought a small bag and a smaller cake.`, '#ffe8a3');
  return true;
}

export function dismissMove(g: Game) {
  if (!g.moveOffer) return false;
  g.moveCooldown[g.moveOffer.fromKey] = g.time + DAY * 0.7;
  releaseWaiter(g, g.moveOffer);
  g.moveOffer = null;
  return true;
}

/** Drop off anyone whose destination is the town just docked at. */
function arriveMovers(g: Game, town: Town) {
  const arriving = g.movers.filter((m) => m.toKey === town.key);
  if (!arriving.length) return;
  const plan = g.settlementPlan(town);
  const day = Math.floor(g.time / DAY);
  for (const m of arriving) {
    g.movers = g.movers.filter((q) => q !== m);
    const moved = (g.movedIn[town.key] ??= []);
    if (!moved.some((d) => d.id === m.def.id)) moved.push(m.def);
    // Coming back to a town you once left means you are no longer departed from it.
    if (g.departedByTown[town.key]) g.departedByTown[town.key] = g.departedByTown[town.key].filter((id) => id !== m.def.id);
    addTownWealth(g, town, 3);
    const b = bondFor(g, m.def.id);
    b.rides++;
    b.lastDay = day;
    let gift = '';
    if (m.gift.coins) { g.coins += m.gift.coins; gift = `${m.gift.coins} coins`; }
    if (m.gift.res) { g.addRes(m.gift.res.kind, m.gift.res.amt); gift = `${m.gift.res.amt} ${RES_INFO[m.gift.res.kind].name.toLowerCase()}`; }
    g.burst(town.x, town.y - 10, 18, ['#ffd166', '#ffe8a3', '#7fd1e8', '#fff'], 70, 0.9, 1.5, 0, 60);
    g.addLog(`🏡 ${m.def.name} steps down in ${town.name}, thanks you with ${gift || 'a nod'}, and goes to find a room.`, '#ffe8a3');
    // If the destination is alive right now, let them physically arrive at the gate.
    if (g.residentTowns[town.key]) {
      const i = g.residents.filter((r) => r.townKey === town.key).length;
      const r = makeResident(m.def, i, plan, dayPhase(g), town.key);
      r.x = plan.gate.x; r.y = plan.gate.y; r.indoors = false; r.phase = dayPhase(g);
      r.state = 'walk'; r.activity = 'arriving with a bundle';
      sendTo(g, r, r.home.x, r.home.y, 'home', 'home', 'unpacking');
      if (!g.residents.some((q) => q.def.id === m.def.id)) g.residents.push(r);
    }
    meet(g, m.def);
  }
}

export function updateResidents(g: Game, dt: number) {
  ensureResidents(g);
  const phase = dayPhase(g);
  g.residentPhase = phase;
  updateSpoils(g);
  if (g.moveOffer && g.docked?.key !== g.moveOffer.fromKey) {
    releaseWaiter(g, g.moveOffer);
    g.moveOffer = null;
  } else if (g.moveOffer && g.time - g.moveOffer.since > 210) {
    const name = g.moveOffer.def.name;
    releaseWaiter(g, g.moveOffer);
    g.moveOffer = null;
    if (g.docked && Math.hypot(g.v.x - g.docked.x, g.v.y - g.docked.y) < 700) g.addLog(`🧳 ${name} gives up on the lift and goes back to ${g.docked.name}.`, '#7fd1e8');
  }

  for (const r of g.residents) {
    const plan = planFor(g, r);
    if (!plan) continue;
    if (g.time < r.shakenUntil) {
      if (!r.indoors) {
        if (r.state !== 'flee') { r.state = 'flee'; r.route = []; r.tx = r.home.x; r.ty = r.home.y; r.activity = 'keeping out of the way'; }
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
          startDayRoutine(g, r, plan);
        }
      } else {
        r.wakeAt = 0;
        assignSchedule(g, r, phase, plan);
      }
    }

    if (r.indoors) {
      if (phase === 'day' && g.time >= r.wakeAt) {
        r.indoors = false; r.x = r.home.x; r.y = r.home.y;
        startDayRoutine(g, r, plan);
      } else {
        r.activity = phase === 'night' ? 'in for the night' : phase === 'day' ? 'having a slow morning' : 'at home';
        continue;
      }
    }

    if (r.state === 'work' || r.state === 'rest' || r.state === 'social') {
      if (maybeTrait(g, r, plan)) continue;
    }

    if (r.state === 'walk') {
      if (r.walking && Math.random() < dt * 2.2) g.part(r.x, r.y - 0.5, (Math.random() - 0.5) * 4, -2, 0.3, 1.1, 'rgba(210,190,150,0.35)', 2, 0, 1);
      if (move(r, dt, walkSpeed(r))) arrive(g, r);
      continue;
    }

    if (r.state === 'react') {
      r.anim += dt;
      if (g.time >= r.reactUntil) returnFromReact(g, r, plan);
      continue;
    }

    if (r.state === 'rest' || r.state === 'social') {
      fidget(g, r, dt);
      if (r.state === 'rest') {
        const other = g.residents.find((q) => q !== r && q.townKey === r.townKey && !q.indoors && (q.state === 'rest' || q.state === 'social') && Math.hypot(q.x - r.x, q.y - r.y) < 22);
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
        const radius = r.def.role === 'gardener' ? 13 : r.def.role === 'kid' ? 18 : r.def.role === 'watch' ? 5 : r.def.role === 'courier' ? 6 : 8;
        const a = Math.random() * Math.PI * 2, rad = Math.sqrt(Math.random()) * radius;
        sendTo(g, r, r.workX + Math.cos(a) * rad, r.workY + Math.sin(a) * rad, r.workSpot, 'work', r.workActivity);
        r.activity = r.workActivity;
        r.wanderAt = g.time + 2 + Math.random() * 5;
      }
      continue;
    }

    if (r.state === 'home' && phase !== 'night') {
      if (phase === 'day') startDayRoutine(g, r, plan);
      else assignSchedule(g, r, phase, plan);
    }
  }
  for (const c of Object.values(g.townCats)) updateCat(g, c, dt, phase);
  chatter(g, dt);
}
