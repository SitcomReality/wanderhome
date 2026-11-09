/**
 * Game: the simulation entrypoint. It owns all run state and orchestrates one tick in update().
 * The actual behaviour lives in focused modules (sim/*, render/*); public methods below are thin
 * delegators so the UI can keep calling game.sell(), game.render(), etc.
 */
import type { OfflineReport } from './sim/offline';
import { CELL, DAY, SAVE_KEY, TAU, nominalSpeed, noCaps, zeroRes } from './core/constants';
import { ActiveBuff, Beam, Bolt, BuildGoal, Cloud, DayPhase, DriveMode, HarvState, KnownTown, LogMsg, Mob, Particle, Pickup, Popup, ProcState, Projectile, Resident, ResidentMemory, Rumor, Settings, Spoils, TownCat, VisitedMark, WeaponState } from './core/types';
import { BIOME, BuffDef, BuffStat, Cost, GRID_MAX_H, GRID_MAX_W, MobDef, RES_INFO, RES_LIST, Res, STARTER_PARTS, Terrain, locoSpeed } from '../content/index';
import { ActiveVisitor, Crew, Toast, applyNewRunPerks, extraCargo, extraComfort, legacyTick, meta, onDiscover, permMul, syncBook } from './family/index';
import { hashString } from './world/noise';
import { sfxState } from './sfx';
import { Stats, computeStats } from './vehicleStats';
import { Landmark, ResNode, TILE, Town, World } from './world/world';
import type { SettlementPlan } from './world/settlement';
import * as Driving from './sim/driving';
import * as Navigation from './sim/navigation';
import * as Avatar from './sim/avatar';
import * as Harvest from './sim/harvest';
import * as Weapons from './sim/weapons';
import * as Critters from './sim/critters';
import * as Towns from './sim/towns';
import * as Exploration from './sim/exploration';
import * as Effects from './sim/effects';
import * as Input from './sim/input';
import * as Workshop from './sim/workshop';
import * as Plan from './sim/plan';
import * as Rest from './sim/rest';
import * as Residents from './sim/residents';
import * as Settlement from './world/settlement';
import * as Persistence from './sim/persistence';
import * as Minimap from './render/minimap';
import * as VehicleRender from './render/vehicleRender';
import * as WorldRender from './render/worldRender';

// Re-exported so UI code can keep importing these from the engine entrypoint.
export { CELL, SAVE_KEY, nominalSpeed } from './core/constants';
export { angDiff } from './core/math';
export { fmtNum } from './core/format';
export type { Settings, ActiveBuff, VisitedMark, DriveMode, LogMsg, KnownTown, Rumor } from './core/types';

export class Game {
  world: World;
  seedStr: string;
  coins = 150;
  res: Record<Res, number> = { ...zeroRes(), wood: 15, stone: 20, fiber: 10, scrap: 15 };
  keep: Record<Res, number> = { ...zeroRes(), wood: 20, stone: 15, fiber: 10, fuel: 15, iron: 10, ice: 10, sulfur: 5, rope: 5 };
  /** Voluntary collection limit per resource. -1 = no limit. */
  collectCap: Record<Res, number> = noCaps();
  /** The build the autopilot is gathering for, if any. */
  goal: BuildGoal | null = null;
  autoSellRes: Record<Res, boolean> = Object.fromEntries(RES_LIST.map((r) => [r, RES_INFO[r].tier === 'common' || RES_INFO[r].tier === 'uncommon'])) as Record<Res, boolean>;
  seenRes: Res[] = ['wood', 'stone', 'fiber', 'scrap'];
  gridW = 3; gridH = 2;
  grid: (string | null)[] = new Array(GRID_MAX_W * GRID_MAX_H).fill(null);
  loco = 'wheels';
  frame = 'f_timber';
  ownedLocos: string[] = ['wheels'];
  ownedFrames: string[] = ['f_timber'];
  known: string[] = [...STARTER_PARTS];
  pins: string[] = [];
  rumors: Rumor[] = [];
  towns: Record<string, KnownTown> = {};
  unreachable: Record<string, number> = {};
  v = { x: 0, y: 0, angle: 0, speed: 0, hp: 80, flash: 0, disabledT: 0, invulnT: 0, shieldT: 0 };
  av = { inside: true, lx: 0, ly: 0, x: 0, y: 0, hp: 30, maxHp: 30, tx: 0, ty: 0, hasTarget: false, enterOnArrive: false, facing: 0, walk: 0, flash: 0, stunT: 0, exitCd: 0, idleT: 0, swingCd: 0, slingCd: 0, harvCd: 0, returning: false };
  mobs: Mob[] = []; pickups: Pickup[] = []; particles: Particle[] = []; projectiles: Projectile[] = [];
  popups: Popup[] = []; beams: Beam[] = []; bolts: Bolt[] = []; clouds: Cloud[] = [];
  cam = { x: 0, y: 0, zoom: 3 };
  shakeAmt = 0;
  time = 0;
  mode: DriveMode = 'forage';
  headingAngle = 0;
  waypoint: { x: number; y: number } | null = null;
  manual = false;
  settings: Settings = { shake: 1, particles: 1, dmgNumbers: true, sound: false, clouds: true, autoSell: true, returnWhenFull: true, volume: 0.35, ambient: true };
  stats = { distance: 0, kills: 0, harvested: 0, earned: 0, playTime: 0, breakdowns: 0, townsVisited: 0, landmarks: 0 };
  buffs: ActiveBuff[] = [];
  // legacy / scrapbook / visitors
  runBiomes: string[] = [];
  biomeTime: Record<string, number> = {};
  crew: Crew | null = null;
  visitor: ActiveVisitor | null = null;
  visitorT = 300;
  toasts: Toast[] = [];
  sky: { kind: 'aurora' | 'meteors'; until: number } | null = null;
  offlineSeen = false;
  /** family systems (milestones, visitors, scrapbook) only tick during real play, not behind the title screen */
  legacyOn = false;
  /** true once the player has actually played this run (or it came from a save) */
  played = false;
  /** set once this run has been retired / folded into lifetime stats, so it can never count twice */
  retired = false;
  folded = false;
  visited: Record<string, VisitedMark> = {};
  nearLandmarks: Landmark[] = [];
  lmT = 0;
  view = { w: 400, h: 300 };
  rates: Record<string, number> = {};
  townSat: Record<string, Partial<Record<Res, number>>> = {};
  docked: Town | null = null;
  /** Temporary stop requested by the player. Always auto-resumes when `parkUntil` passes. */
  parked = false;
  parkUntil = 0;
  /** Transient town-watch cooldowns & chatter throttles, keyed by town key. */
  townDefCd: Record<string, number> = {};
  townDefLog: Record<string, number> = {};
  /** Transient approach points for towns that sit on unreachable ground, keyed by town + locomotion. */
  townGates: Record<string, { x: number; y: number } | null> = {};
  /** First-slice Homeport residents; transient, rebuilt from the clock when a save loads. */
  residents: Resident[] = [];
  residentTown: string | null = null;
  residentSpoils: Spoils[] = [];
  residentChatterT = 45;
  residentGreeted = false;
  residentPhase: DayPhase = 'day';
  residentMemory: ResidentMemory = { visits: 0, honks: 0, firstDay: -1, lastDay: -1, lastVisit: 0, lastHonk: 0 };
  townCat: TownCat | null = null;
  residentHonkLog = 0;
  residentWatchReact = 0;
  settlementPlans: Record<string, SettlementPlan> = {};
  log: LogMsg[] = [];
  lastInput = 0;
  keys = new Set<string>();
  offlineReport: OfflineReport | null = null;
  /** wall-clock ms up to which away time has already been credited (see sim/offline.ts) */
  offlineClock = 0;
  dpr = 1;

  // derived
  st!: Stats;
  power = 0;
  starved: string[] = [];
  harvs: HarvState[] = []; weapons: WeaponState[] = []; procs: ProcState[] = [];
  hw = 13.5; hh = 9;
  speedNow = 0;
  get maxHp() { return this.st.maxHp; }
  get cargoCap() { return this.st.cargoCap; }
  get comfort() { return this.st.comfort; }
  get weight() { return this.st.weight; }

  // internal
  mobId = 0; logId = 0; rumorId = 0;
  nearNodes: ResNode[] = []; viewNodes: ResNode[] = [];
  nearTowns: Town[] = [];
  steerAngle = 0; steerT = 0; avoidSide = 1; wanderA = 0;
  forageTarget: ResNode | null = null; forageT = 0;
  nodeBlacklist = new Map<string, number>();
  nav = { follow: false, side: 1, bestD: 1e9, startD: 0, noProg: 0, followT: 0, key: '' };
  tradeRun: Town | null = null; tradeCd = 0; tradeRunT = 0;
  stuckT = 0; lastPos = { x: 0, y: 0 }; stuckCheckT = 0;
  spawnT = 25; secT = 0; rateT = 0; rateSnap: Record<string, number> = {};
  dockPause = 0; autoSellT = 0; lastDockKey = '';
  lossWindow = { start: -9999, budget: 0 };
  townT = 0;
  stockCache = new Map<string, string[]>();
  minimapCanvas: HTMLCanvasElement | null = null; mmCenter = { x: 1e9, y: 1e9 };
  homeX = 0; homeY = 0;

  constructor(seedStr: string, save?: any) {
    this.seedStr = seedStr;
    this.world = new World(hashString(seedStr));
    this.homeX = (this.world.spawnTX + 0.5) * TILE; this.homeY = (this.world.spawnTY + 0.5) * TILE;
    this.v.x = this.homeX; this.v.y = this.homeY;
    this.setCell(2, 0, 'cockpit'); this.setCell(2, 1, 'claw'); this.setCell(0, 0, 'crate'); this.setCell(0, 1, 'catapult');
    if (save) { Persistence.applySave(this, save); this.played = true; }
    // A retiring family picks perks & inheritance on the inheritance screen instead (see InheritancePick).
    else if (!meta.pendingInheritance) applyNewRunPerks(this);
    this.computeStats();
    syncBook(this);
    if (!save) this.v.hp = this.maxHp;
    this.cam.x = this.v.x; this.cam.y = this.v.y;
    this.steerAngle = this.v.angle; this.wanderA = this.v.angle;
    this.lastPos = { x: this.v.x, y: this.v.y };
    this.rateSnap = this.snapshotTotals();
    if (!save) {
      this.addLog('Welcome to Wanderhome. Your tiny home has started rolling.', '#ffd166');
      this.addLog('Towns sell blueprints for new parts. Every region stocks different things.', '#7fd1e8');
    }
  }

  /** Called when the player starts (or continues) playing this run: family systems switch on. */
  beginPlay() {
    this.legacyOn = true;
    this.played = true;
    this.offlineClock = Math.max(this.offlineClock, Date.now());
    syncBook(this);
  }

  cellIndex(x: number, y: number) { return y * GRID_MAX_W + x; }
  setCell(x: number, y: number, id: string | null) { this.grid[this.cellIndex(x, y)] = id; }
  cellLocal(idx: number) {
    const gx = idx % GRID_MAX_W, gy = Math.floor(idx / GRID_MAX_W);
    return { x: (gx - (this.gridW - 1) / 2) * CELL, y: (gy - (this.gridH - 1) / 2) * CELL };
  }
  toWorld(lx: number, ly: number) {
    const c = Math.cos(this.v.angle), s = Math.sin(this.v.angle);
    return { x: this.v.x + lx * c - ly * s, y: this.v.y + lx * s + ly * c };
  }
  toLocal(wx: number, wy: number) {
    const dx = wx - this.v.x, dy = wy - this.v.y;
    const c = Math.cos(-this.v.angle), s = Math.sin(-this.v.angle);
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  }
  cargoUsed() { let n = 0; for (const r of RES_LIST) n += this.res[r]; return n; }
  cargoFree() { return Math.max(0, this.cargoCap - this.cargoUsed()); }
  difficulty(x: number, y: number) { return 1 + Math.hypot(x - this.homeX, y - this.homeY) / 4000; }
  distTiles() { return Math.hypot(this.v.x - this.homeX, this.v.y - this.homeY) / TILE; }
  daylight() { const ph = (this.time / DAY + 0.15) % 1; return Math.max(0, Math.min(1, Math.sin(ph * TAU) * 1.6 + 0.55)); }
  wind() { return 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(this.time / 37 + Math.sin(this.time / 91) * 2)); }
  openness(t: Terrain) { return BIOME[t]?.wind ?? 1; }
  buffMul(stat: BuffStat) { let m = permMul(this, stat); for (const b of this.buffs) if (b.stat === stat && b.until > this.time) m *= b.mult; return m; }
  addBuff(d: BuffDef) {
    const ex = this.buffs.find((b) => b.id === d.id);
    if (ex) ex.until = this.time + d.duration; else this.buffs.push({ id: d.id, name: d.name, icon: d.icon, stat: d.stat, mult: d.mult, until: this.time + d.duration });
  }
  mobCanEnter(def: MobDef, t: Terrain) {
    if (def.flying) return true;
    const b = BIOME[t];
    if (!b || b.noWalk || b.band === 'deep') return false;
    if (b.band === 'shallow') return !!def.swims;
    return true;
  }
  hasModule(id: string) { return this.grid.some((g, i) => g === id && i % GRID_MAX_W < this.gridW && Math.floor(i / GRID_MAX_W) < this.gridH); }
  clockString() {
    const ph = (this.time / DAY + 0.15) % 1;
    const hrs = (ph * 24 + 6) % 24;
    return `${String(Math.floor(hrs)).padStart(2, '0')}:${String(Math.floor((hrs % 1) * 60)).padStart(2, '0')}`;
  }
  addLog(msg: string, color = '#fff') { this.log.push({ id: ++this.logId, t: this.time, msg, color }); if (this.log.length > 40) this.log.shift(); }
  get pMul() { return [0.35, 1, 2.6][this.settings.particles] ?? 1; }
  get pMax() { return [300, 1400, 4500][this.settings.particles] ?? 1400; }
  shake(n: number) { this.shakeAmt = Math.min(14, this.shakeAmt + n); }
  isAfk() { return this.time - this.lastInput > 90; }
  canAfford(c: Cost) {
    for (const k in c) { const v = (c as any)[k] as number; if (!v) continue; if (k === 'coins') { if (this.coins < v) return false; } else if (this.res[k as Res] < v) return false; }
    return true;
  }
  pay(c: Cost) { for (const k in c) { const v = (c as any)[k] as number; if (!v) continue; if (k === 'coins') this.coins -= v; else this.res[k as Res] -= v; } }
  refund(c: Cost, f: number) { for (const k in c) { const v = Math.floor(((c as any)[k] as number) * f); if (!v) continue; if (k === 'coins') this.coins += v; else this.addRes(k as Res, v); } }
  addRes(r: Res, n: number) { this.res[r] += n; if (!this.seenRes.includes(r)) { this.seenRes.push(r); this.addLog(`✨ New resource discovered: ${RES_INFO[r].icon} ${RES_INFO[r].name}!`, '#f0a0ff'); } onDiscover(this, 'resources', r); }
  lockFor(c: Cost) { for (const k in c) if (k !== 'coins') this.keep[k as Res] = Math.max(this.keep[k as Res], (c as any)[k]); }
  netWorth() {
    let w = this.coins;
    for (const r of RES_LIST) w += this.res[r] * RES_INFO[r].base;
    return Math.floor(w);
  }

  computeStats() {
    this.st = computeStats(this.grid, this.gridW, this.gridH, this.loco, this.frame);
    const oldW = new Map(this.weapons.map((w) => [w.idx, w]));
    this.harvs = []; this.weapons = []; this.procs = [];
    for (const e of this.st.cells.values()) {
      const d = e.def;
      if (d.harvest?.rate) this.harvs.push({ idx: e.idx, def: d, cd: Math.random(), range: d.harvest.range * e.range });
      if (d.weapon) this.weapons.push({ idx: e.idx, def: d, cd: Math.random() * 0.5, angle: oldW.get(e.idx)?.angle ?? this.v.angle, recoil: 0, range: d.weapon.range * e.range, rate: d.weapon.rate * e.rate, dry: false });
      if (d.process) this.procs.push({ idx: e.idx, def: d, t: 0, rate: e.rate });
    }
    this.st.cargoCap += extraCargo();
    this.st.comfort = Math.round((this.st.comfort + extraComfort()) * 10) / 10;
    this.hw = (this.gridW * CELL) / 2; this.hh = (this.gridH * CELL) / 2;
    this.v.hp = Math.min(this.v.hp, this.maxHp);
  }

  baseSpeed() { return nominalSpeed(this.st, this.loco, this.power, this.cargoUsed()) * this.buffMul('speed'); }
  terrMult(x: number, y: number) { return locoSpeed(this.loco, this.world.terrainAt(x, y)); }

  update(dt: number) {
    dt = Math.min(dt, 0.1);
    this.time += dt;
    this.stats.playTime += dt;
    sfxState.enabled = this.settings.sound; sfxState.volume = this.settings.volume;
    this.secT += dt;
    if (this.secT >= 1) {
      this.secT -= 1;
      if (this.buffs.length) this.buffs = this.buffs.filter((b) => b.until > this.time);
      for (const k in this.townSat) for (const r of RES_LIST) { const s = this.townSat[k][r]; if (s !== undefined) this.townSat[k][r] = s + (1 - s) * 0.008; }
    }
    this.rateT += dt;
    if (this.rateT >= 10) {
      const now = this.snapshotTotals();
      for (const k in now) {
        const d = Math.max(0, now[k] - (this.rateSnap[k] ?? 0)) / this.rateT;
        this.rates[k] = (this.rates[k] ?? d) * 0.85 + d * 0.15;
      }
      this.rateSnap = now; this.rateT = 0;
    }
    this.townT -= dt;
    if (this.townT <= 0) { this.townT = 1; this.nearTowns = this.world.townsNear(this.v.x, this.v.y, 1400); }

    this.nearNodes.length = 0;
    this.world.nodesInRect(this.v.x - 230, this.v.y - 230, this.v.x + 230, this.v.y + 230, this.time, this.nearNodes);
    if (!this.av.inside) this.world.nodesInRect(this.av.x - 60, this.av.y - 60, this.av.x + 60, this.av.y + 60, this.time, this.nearNodes);
    for (const n of this.nearNodes) if (n.shake > 0) n.shake = Math.max(0, n.shake - dt * 4);

    Driving.updateVehicle(this, dt);
    Avatar.updateAvatar(this, dt);
    Harvest.updateHarvest(this, dt);
    Weapons.updateWeapons(this, dt);
    Critters.updateMobs(this, dt);
    Towns.updateTownDefense(this, dt);
    Weapons.updateProjectiles(this, dt);
    Residents.updateResidents(this, dt);
    Harvest.updatePickups(this, dt);
    Harvest.updateProcess(this, dt);
    Exploration.updateLandmarks(this, dt);
    Towns.updateDock(this, dt);
    Effects.updateFx(this, dt);
    Effects.updateCamera(this, dt);
    if (this.legacyOn) legacyTick(this, dt);
  }

  snapshotTotals() {
    const o: Record<string, number> = { coins: this.coins };
    for (const r of RES_LIST) o[r] = this.res[r];
    return o;
  }

  curTarget: { x: number; y: number; key: string } | null = null;

  static loadSave(): any | null { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
  static wipe() { localStorage.removeItem(SAVE_KEY); }

  get mmCenterWorld() { return { x: (this.mmCenter.x + 0.5) * TILE, y: (this.mmCenter.y + 0.5) * TILE }; }

  // ---- sim/navigation ----
  hasSellable() { return Navigation.hasSellable(this); }
  townReachable(t: { key?: string; x: number; y: number }) { return Navigation.townReachable(this, t); }
  townApproach(t: { key: string; x: number; y: number }) { return Navigation.townApproach(this, t); }
  settlementPlan(t: Town) { return (this.settlementPlans[t.key] ??= Settlement.planSettlement(this, t)); }
  residentsHonk() { return Residents.onHonk(this); }
  residentsWatchFire(t: Town, x: number, y: number) { return Residents.onWatchFire(this, t, x, y); }
  residentsVisit() { return Residents.onVisit(this); }

  // ---- sim/avatar ----
  exitVehicle() { return Avatar.exitVehicle(this); }
  enterVehicle() { return Avatar.enterVehicle(this); }

  // ---- sim/harvest ----
  hitNode(n: ResNode, power: number, yieldMul: number, collector: 'v' | 'a', fromX: number, fromY: number, finds?: { res: Res; chance: number }[]) { return Harvest.hitNode(this, n, power, yieldMul, collector, fromX, fromY, finds); }
  dropPickup(x: number, y: number, kind: Res | 'coins', amt: number, home: 'v' | 'a' | null, town = false) { return Harvest.dropPickup(this, x, y, kind, amt, home, town); }

  // ---- sim/weapons ----
  damageMob(m: Mob, dmg: number, numbers = true, buff = true, byTown = false) { return Weapons.damageMob(this, m, dmg, numbers, buff, byTown); }
  explode(x: number, y: number, r: number, dmg: number, scale = 1) { return Weapons.explode(this, x, y, r, dmg, scale); }

  // ---- sim/towns ----
  townDist(t: { x: number; y: number }) { return Towns.townDist(this, t); }
  townPrice(t: Town, r: Res) { return Towns.townPrice(this, t, r); }
  buyPrice(t: Town, r: Res) { return Towns.buyPrice(this, t, r); }
  townStock(t: Town): string[] { return Towns.townStock(this, t); }
  blueprintPrice(t: { x: number; y: number; mod?: number }, id: string) { return Towns.blueprintPrice(this, t, id); }
  buyBlueprint(t: Town, id: string) { return Towns.buyBlueprint(this, t, id); }
  togglePin(id: string) { return Towns.togglePin(this, id); }
  whereSold(id: string) { return Towns.whereSold(this, id); }
  sell(t: Town, r: Res, n: number) { return Towns.sell(this, t, r, n); }
  buy(t: Town, r: Res, n: number) { return Towns.buy(this, t, r, n); }
  recordKnown(t: Town) { return Towns.recordKnown(this, t); }
  bestKnown(r: Res, excludeKey?: string) { return Towns.bestKnown(this, r, excludeKey); }
  sellable(r: Res) { return Towns.sellable(this, r); }
  autoSellNow(t: Town) { return Towns.autoSellNow(this, t); }
  makeRumor(t: { x: number; y: number }) { return Towns.makeRumor(this, t); }
  townDefense(t: Town) { return Towns.townDefense(this, t); }
  inTownSafeZone(x = this.v.x, y = this.v.y) { return Towns.inTownSafeZone(this, x, y); }

  // ---- sim/exploration ----
  visitLandmark(lm: Landmark, who: 'v' | 'a') { return Exploration.visitLandmark(this, lm, who); }

  // ---- sim/effects ----
  part(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string, kind = 0, grav = 0, drag = 2) { return Effects.part(this, x, y, vx, vy, life, size, color, kind, grav, drag); }
  burst(x: number, y: number, n: number, colors: string[], speed = 60, life = 0.6, size = 1.5, kind = 0, grav = 0) { return Effects.burst(this, x, y, n, colors, speed, life, size, kind, grav); }
  popup(x: number, y: number, text: string, color: string, big = false) { return Effects.popup(this, x, y, text, color, big); }
  gainPopup(x: number, y: number, kind: Res | 'coins', amt: number) { return Effects.gainPopup(this, x, y, kind, amt); }

  // ---- sim/input ----
  keyDown(k: string) { return Input.keyDown(this, k); }
  keyUp(k: string) { return Input.keyUp(this, k); }
  toggleManual() { return Input.toggleManual(this); }
  action() { return Input.action(this); }
  click(sx: number, sy: number, W: number, H: number) { return Input.click(this, sx, sy, W, H); }
  rightClick(sx: number, sy: number, W: number, H: number) { return Input.rightClick(this, sx, sy, W, H); }
  setWaypoint(wx: number, wy: number) { return Input.setWaypoint(this, wx, wy); }
  zoomBy(d: number) { return Input.zoomBy(this, d); }

  // ---- sim/rest ----
  park(seconds?: number) { return Rest.park(this, seconds); }
  parkAtDock() { return Rest.parkAtDock(this); }
  togglePark() { return Rest.toggle(this); }
  resumePark() { return Rest.resume(this, 'manual'); }
  parkLeft() { return Rest.parkLeft(this); }

  // ---- sim/workshop ----
  placeModule(idx: number, id: string) { return Workshop.placeModule(this, idx, id); }
  removeModule(idx: number) { return Workshop.removeModule(this, idx); }
  moveModule(from: number, to: number) { return Workshop.moveModule(this, from, to); }
  buildLoco(id: string) { return Workshop.buildLoco(this, id); }
  buildFrame(id: string) { return Workshop.buildFrame(this, id); }
  expand(dir: 'w' | 'h') { return Workshop.expand(this, dir); }

  // ---- sim/plan ----
  planGoal(kind: BuildGoal['kind'], id: string) { return Plan.setGoal(this, kind, id); }
  clearGoal() { return Plan.clearGoal(this); }
  goalLabel() { return Plan.goalLabel(this); }
  goalCost() { return Plan.goalCost(this); }
  goalEntries() { return Plan.goalEntries(this); }
  goalReady() { return Plan.goalReady(this); }
  planNeeds() { return Plan.planNeeds(this); }
  wantsResource(r: Res) { return Plan.wantsResource(this, r); }

  // ---- sim/persistence ----
  save() { return Persistence.save(this); }

  // ---- render/minimap ----
  updateMinimap(size = 150, tilesPerPx = 4) { return Minimap.updateMinimap(this, size, tilesPerPx); }

  // ---- render/vehicleRender ----
  drawVehicleLocal(ctx: CanvasRenderingContext2D, t: number, opts: { garage?: boolean; speed?: number } = {}) { return VehicleRender.drawVehicleLocal(this, ctx, t, opts); }

  // ---- render/worldRender ----
  render(ctx: CanvasRenderingContext2D, W: number, H: number) { return WorldRender.render(this, ctx, W, H); }
}
