// Runtime entity shapes used by the simulation (mobs, particles, projectiles…) plus a few shared records.
import { BuffStat, MobDef, ModuleDef, Res, Terrain } from '../../content/index';

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
export interface Pickup { x: number; y: number; vx: number; vy: number; kind: Res | 'coins'; amt: number; age: number; home: 'v' | 'a' | null }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: number; grav: number; drag: number }
export interface Projectile {
  kind: 'bullet' | 'rocket' | 'bubble' | 'pebble' | 'stone' | 'harpoon' | 'frost'; x: number; y: number; vx: number; vy: number; dmg: number; life: number; target: Mob | null;
  sx?: number; sy?: number; tx?: number; ty?: number; t?: number; T?: number; splash?: number; color?: string;
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
