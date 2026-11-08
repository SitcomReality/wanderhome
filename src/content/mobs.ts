import type { MobDef } from './types';

/**
 * MOBS: critters that roam the world. `shape` picks a drawing in game/draw.ts.
 * Stats scale up with distance from home automatically.
 */
export const MOBS: MobDef[] = [
  { id: 'slime', name: 'Slime', shape: 'blob', color: '#6ee36e', hp: 12, speed: 16, dmg: 3, r: 6, coins: 2, biomes: ['grass', 'forest', 'swamp', 'beach', 'bloom'], drop: 'resin' },
  { id: 'beetle', name: 'Bark Beetle', shape: 'bug', color: '#8e5b3a', hp: 22, speed: 21, dmg: 4, r: 6, coins: 3, biomes: ['forest', 'badlands', 'grass', 'autumn', 'savanna'], drop: 'fiber' },
  { id: 'crab', name: 'Snippy Crab', shape: 'crab', color: '#e2583e', hp: 18, speed: 20, dmg: 4, r: 6, coins: 3, biomes: ['beach', 'reef', 'mangrove', 'iceshelf'], swims: true, drop: 'coral' },
  { id: 'scorp', name: 'Dune Scorpion', shape: 'scorp', color: '#d4a03c', hp: 28, speed: 27, dmg: 5, r: 7, coins: 4, biomes: ['desert', 'badlands', 'beach', 'mesa', 'salt'], drop: 'copper', minDist: 80 },
  { id: 'croc', name: 'Bog Croc', shape: 'croc', color: '#4d7a3a', hp: 40, speed: 18, dmg: 7, r: 8, coins: 5, biomes: ['swamp', 'shallow', 'mangrove'], swims: true, drop: 'pearl', minDist: 80 },
  { id: 'spider', name: 'Weaver Spider', shape: 'spider', color: '#3a2a4a', hp: 26, speed: 30, dmg: 5, r: 6, coins: 4, biomes: ['jungle', 'shroom', 'swamp'], drop: 'silk', minDist: 60 },
  { id: 'shroomling', name: 'Shroomling', shape: 'blob', color: '#b07ce0', hp: 20, speed: 18, dmg: 4, r: 6, coins: 3, biomes: ['shroom'], drop: 'spores' },
  { id: 'skeleton', name: 'Rattlebones', shape: 'skeleton', color: '#efe6cf', hp: 30, speed: 22, dmg: 6, r: 6, coins: 5, biomes: ['boneyard', 'moor'], drop: 'bone', minDist: 60 },
  { id: 'bat', name: 'Dusk Bat', shape: 'bat', color: '#4a3a5a', hp: 14, speed: 38, dmg: 3, r: 5, coins: 3, biomes: ['moor', 'ash', 'shroom', 'forest', 'autumn', 'jungle'], flying: true, night: true, drop: 'spores' },
  { id: 'yeti', name: 'Lil Yeti', shape: 'yeti', color: '#f2f6fb', hp: 48, speed: 19, dmg: 8, r: 8, coins: 6, biomes: ['snow', 'mountain', 'taiga', 'glacier'], drop: 'ice', minDist: 80 },
  { id: 'golem', name: 'Rubble Golem', shape: 'golem', color: '#8a7a6a', hp: 90, speed: 11, dmg: 11, r: 9, coins: 9, biomes: ['mountain', 'mesa', 'ash', 'badlands', 'glacier'], drop: 'iron', minDist: 140 },
  { id: 'wisp', name: 'Prism Wisp', shape: 'wisp', color: '#e0b3ff', hp: 18, speed: 34, dmg: 5, r: 5, coins: 6, biomes: ['crystal', 'snow', 'peak', 'bloom'], flying: true, drop: 'crystal', minDist: 60 },
  { id: 'emberling', name: 'Emberling', shape: 'wisp', color: '#ff8a3a', hp: 22, speed: 32, dmg: 6, r: 5, coins: 6, biomes: ['ash', 'mesa'], flying: true, drop: 'sulfur', minDist: 80 },
  { id: 'frostling', name: 'Frostling', shape: 'wisp', color: '#bfeaff', hp: 22, speed: 30, dmg: 6, r: 5, coins: 6, biomes: ['glacier', 'iceshelf', 'peak', 'taiga'], flying: true, drop: 'ice', minDist: 80 },
  { id: 'drone', name: 'Bandit Drone', shape: 'drone', color: '#e74c3c', hp: 34, speed: 40, dmg: 6, r: 6, coins: 8, biomes: [], flying: true, drop: 'gears', minDist: 180, roam: 0.18 },
];
