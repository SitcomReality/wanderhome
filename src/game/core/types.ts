// Runtime entity shapes used by the simulation (mobs, particles, projectiles…) plus a few shared records.
import { BuffStat, MobDef, ModuleDef, Res, ResidentDef, Terrain } from '../../content/index';

export interface Settings {
  shake: number; particles: number; dmgNumbers: boolean; sound: boolean; clouds: boolean;
  autoSell: boolean; returnWhenFull: boolean; volume: number; ambient: boolean;
}
export interface ActiveBuff { id: string; name: string; icon: string; stat: BuffStat; mult: number; until: number }
export interface VisitedMark { t: number; x: number; y: number; id: string }
export type DriveMode = 'forage' | 'wander' | 'heading';

export interface Mob {
  id: number; def: MobDef; x: number; y: number; vx: number; vy: number; hp: number; maxHp: number; dmg: number; speed: number;
  slowT: number; burnT: number; burnKind: 'fire' | 'poison'; flash: number; atkCd: number; wanderA: number; facing: number; fleeT: number;
}
export interface Pickup { x: number; y: number; vx: number; vy: number; kind: Res | 'coins'; amt: number; age: number; home: 'v' | 'a' | null; /** dropped by a town watch kill; residents may race for it */ town?: boolean }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: number; grav: number; drag: number }
export interface Projectile {
  kind: 'bullet' | 'rocket' | 'bubble' | 'pebble' | 'stone' | 'harpoon' | 'frost'; x: number; y: number; vx: number; vy: number; dmg: number; life: number; target: Mob | null;
  sx?: number; sy?: number; tx?: number; ty?: number; t?: number; T?: number; splash?: number; color?: string;
  /** Fired by a town watch; ignores the player's damage buffs. */
  town?: boolean;
}
export interface Popup { x: number; y: number; text: string; color: string; life: number; max: number; big: boolean; key?: string; amt?: number; icon?: string }
export interface Beam { x1: number; y1: number; x2: number; y2: number; life: number; color: string }
export interface Bolt { pts: number[]; life: number }
export interface Cloud { x: number; y: number; parts: { dx: number; dy: number; r: number }[]; speed: number }
export interface LogMsg { id: number; t: number; msg: string; color: string }
export interface WeaponState { idx: number; def: ModuleDef; cd: number; angle: number; recoil: number; range: number; rate: number; dry: boolean }
export interface HarvState { idx: number; def: ModuleDef; cd: number; range: number }
export interface ProcState { idx: number; def: ModuleDef; t: number; rate: number }
export interface KnownTown { name: string; x: number; y: number; biome: Terrain; sell: Record<Res, number>; t: number; stock: string[] }
export interface Rumor { id: number; text: string; partId: string; where: string; t: number }

/** What the house is currently gathering for. Costs are derived from content, never saved. */
export type BuildGoalKind = 'module' | 'frame' | 'loco' | 'expand';
export interface BuildGoal { kind: BuildGoalKind; id: string }


// ---------------------------------------------------------------- residents
export type DayPhase = 'day' | 'dusk' | 'night';
export type ResidentState = 'walk' | 'work' | 'play' | 'gather' | 'social' | 'home' | 'loot' | 'flee';
/** A transient person in the active settlement. The first slice only populates Homeport. */
export interface Resident {
  def: ResidentDef;
  x: number; y: number;
  tx: number; ty: number;
  home: { x: number; y: number };
  activity: string;
  spot: 'home' | 'field' | 'workshop' | 'well' | 'green' | 'watch' | 'wild';
  state: ResidentState;
  phase: DayPhase;
  walk: number;
  facing: number;
  walking: boolean;
  indoors: boolean;
  shakenUntil: number;
  seed: number;
}
/** A town-watch kill outside the ring, waiting for a brave resident or a careful one. */
export interface Spoils { x: number; y: number; t: number; claimed: boolean; hesitated: boolean }
