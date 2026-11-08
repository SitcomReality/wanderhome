import type { NodeDef } from './types';

/**
 * NODES: harvestable things that spawn in the world. Biomes reference them by id.
 * `shape` picks a drawing routine in game/nodeArt.ts, and `colors` recolour it, so a
 * new tree, rock or mushroom is usually just a new palette.
 *
 * Palette slots by shape:
 *  tree/bigtree: trunk, dark, mid, light, accent   pine: trunk, dark, light, snow('' = none)
 *  palm: trunk, leafDark, leafLight, fruit          bush: dark, light, berry
 *  grass: blade, tip, cattail('' = none)            flower: stem, ...petals
 *  rock: base, light, vein, vein2                   crystal: dark, mid, light, halo
 *  pool: liquid, sheen, bubble                      mushroom: stem, cap, spots
 *  coral: c1, c2, c3                                bones/skull/web: main, shade
 */
export const NODES: NodeDef[] = [
  // ---- trees ----
  { id: 'tree', shape: 'tree', colors: ['#6b4226', '#2f7a3a', '#3e9a47', '#5cbf5a', '#e74c3c'], res: 'wood', hp: 6, find: { res: 'resin', chance: 0.06 } },
  { id: 'autumn_tree', shape: 'tree', colors: ['#5a3a22', '#b5541f', '#e07a2a', '#f2b04e', '#8e2a1a'], res: 'wood', hp: 6, find: { res: 'resin', chance: 0.1 } },
  { id: 'jungle_tree', shape: 'bigtree', colors: ['#4a3018', '#1a5a2a', '#24763a', '#3a9a4a', '#ff6b9a'], res: 'wood', hp: 10, find: { res: 'honey', chance: 0.04 }, scale: 0.85 },
  { id: 'mangrove_tree', shape: 'tree', colors: ['#5a4a32', '#2d5a3a', '#3a7048', '#5a9060', ''], res: 'wood', hp: 5, find: { res: 'fiber', chance: 0.2 } },
  { id: 'acacia', shape: 'tree', colors: ['#6b4a2a', '#6a8a3a', '#86a548', '#a8c060', ''], res: 'wood', hp: 5, scale: 1.1 },
  { id: 'ancient', shape: 'bigtree', colors: ['#5a3a20', '#1f5a32', '#2c7040', '#3f8f50', '#ff9f1c'], res: 'wood', hp: 18, find: { res: 'amber', chance: 0.35 }, glow: 'rgba(255,159,28,1)' },
  { id: 'pine', shape: 'pine', colors: ['#5b3a24', '#1b4d3e', '#2d6a4f', '#f4f9ff'], res: 'wood', hp: 7, find: { res: 'resin', chance: 0.18 } },
  { id: 'palm', shape: 'palm', colors: ['#8a6a3a', '#2e8b57', '#4fbf6a', '#7a4a1a'], res: 'wood', hp: 4, find: { res: 'fiber', chance: 0.25 } },
  { id: 'dead', shape: 'dead', colors: ['#5a4a3a', '#7da35a'], res: 'wood', hp: 4 },
  { id: 'cactus', shape: 'cactus', colors: ['#2e8b57', '#58c08a', '#ff6b9a'], res: 'wood', hp: 3, find: { res: 'fiber', chance: 0.3 } },
  { id: 'drift', shape: 'drift', colors: ['#a07850', '#c9a27a'], res: 'wood', hp: 2 },

  // ---- plants ----
  { id: 'bush', shape: 'bush', colors: ['#3f8f3f', '#4fae4a', '#c0392b'], res: 'fiber', hp: 2 },
  { id: 'berry', shape: 'bush', colors: ['#2f6f3a', '#3f8f48', '#6a3ab0'], res: 'fiber', hp: 3, find: { res: 'honey', chance: 0.08 } },
  { id: 'heather', shape: 'bush', colors: ['#5a5a3a', '#7a6a8a', '#b48fc8'], res: 'fiber', hp: 2 },
  { id: 'flower', shape: 'flower', colors: ['#3a7d3a', '#ff7eb6', '#ffd166', '#f8f9fa', '#a0c4ff'], res: 'fiber', hp: 1, find: { res: 'honey', chance: 0.05 } },
  { id: 'tallgrass', shape: 'grass', colors: ['#9cc85a', '#e6e08a', ''], res: 'fiber', hp: 2 },
  { id: 'dry_grass', shape: 'grass', colors: ['#c8b45a', '#f0e0a0', ''], res: 'fiber', hp: 2 },
  { id: 'reeds', shape: 'grass', colors: ['#6b8a3a', '#9ab060', '#6b4226'], res: 'fiber', hp: 3 },
  { id: 'hive', shape: 'hive', colors: ['#6b4a2a', '#f5b631', '#8a5a10'], res: 'honey', hp: 5, find: { res: 'resin', chance: 0.1 } },
  { id: 'mushroom', shape: 'mushroom', colors: ['#f0e6d6', '#d23a3a', '#ffffff'], res: 'spores', hp: 2 },
  { id: 'glowcap', shape: 'mushroom', colors: ['#d8e8f0', '#4ab0e0', '#c8f4ff'], res: 'spores', hp: 3, glow: 'rgba(120,210,255,1)', find: { res: 'crystal', chance: 0.03 } },
  { id: 'giant_shroom', shape: 'mushroom', colors: ['#e8dcf0', '#8a4ac8', '#e0c8ff'], res: 'spores', hp: 12, scale: 2.1, glow: 'rgba(200,140,255,1)', find: { res: 'silk', chance: 0.08 } },
  { id: 'web', shape: 'web', colors: ['#f4f4ff', 'rgba(255,255,255,0.25)'], res: 'silk', hp: 3 },
  { id: 'coral', shape: 'coral', colors: ['#ff7f9f', '#ffb347', '#c38bff'], res: 'coral', hp: 5, find: { res: 'pearl', chance: 0.05 } },

  // ---- minerals ----
  { id: 'rock', shape: 'rock', colors: ['#7d858c', '#a3abb3', '', ''], res: 'stone', hp: 6, find: { res: 'iron', chance: 0.05 } },
  { id: 'ore', shape: 'rock', colors: ['#6e6259', '#8c7e72', '#ff9f43', '#ffe08a'], res: 'iron', hp: 8 },
  { id: 'copper', shape: 'rock', colors: ['#6e5a4a', '#8a7462', '#4fd1a5', '#e08a5a'], res: 'copper', hp: 8 },
  { id: 'mesa_rock', shape: 'rock', colors: ['#9a4a2a', '#c86a3a', '#e8a070', ''], res: 'stone', hp: 7, find: { res: 'copper', chance: 0.12 } },
  { id: 'obsidian_rock', shape: 'rock', colors: ['#241a2e', '#4a3a5e', '#9a70d0', '#ff7a3a'], res: 'obsidian', hp: 10 },
  { id: 'salt', shape: 'crystal', colors: ['#d8d4cc', '#f4f1ea', '#ffffff', 'rgba(255,255,255,0.18)'], res: 'salt', hp: 4 },
  { id: 'crystal', shape: 'crystal', colors: ['#7b4fd6', '#b388ff', '#ead9ff', 'rgba(190,140,255,0.25)'], res: 'crystal', hp: 10, glow: 'rgba(180,120,255,1)' },
  { id: 'ice', shape: 'crystal', colors: ['#5aa9d6', '#a8e0ff', '#ffffff', 'rgba(160,220,255,0.2)'], res: 'ice', hp: 7, find: { res: 'crystal', chance: 0.06 }, glow: 'rgba(160,220,255,1)' },
  { id: 'vent', shape: 'vent', colors: ['#5a4a3a', '#7a6a50', '#f2e14c', 'rgba(240,240,200,1)'], res: 'sulfur', hp: 7 },
  { id: 'oil', shape: 'pool', colors: ['#15151c', 'rgba(160,90,255,0.35)', 'rgba(40,40,50,0.9)'], res: 'fuel', hp: 6 },
  { id: 'lava', shape: 'pool', colors: ['#ff6a1a', 'rgba(255,230,120,0.6)', 'rgba(255,200,80,0.9)'], res: 'obsidian', hp: 8, glow: 'rgba(255,120,40,1)', find: { res: 'sulfur', chance: 0.15 } },
  { id: 'dune', shape: 'dune', colors: ['rgba(150,110,50,0.35)', '#ecd598', '#f7e6b5'], res: 'sand', hp: 4 },
  { id: 'clam', shape: 'clam', colors: ['#d9c7b8', '#a89080', '#ffffff'], res: 'pearl', hp: 4 },
  { id: 'bones', shape: 'bones', colors: ['#efe6cf', '#b8ab8c'], res: 'bone', hp: 3 },
  { id: 'skull', shape: 'skull', colors: ['#f2ead6', '#a89a78'], res: 'bone', hp: 12, scale: 1.4, find: { res: 'scrap', chance: 0.1 } },
  { id: 'ruin', shape: 'ruin', colors: [], res: 'scrap', hp: 7, find: { res: 'gears', chance: 0.04 } },
  { id: 'meteor', shape: 'meteor', colors: ['#2b2b38', '#44445a', 'rgba(127,224,255,1)'], res: 'starmetal', hp: 16, glow: 'rgba(127,224,255,1)', global: { chance: 0.0012, minDist: 250 } },
];
