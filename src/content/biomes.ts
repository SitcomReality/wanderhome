import type { BiomeDef } from './types';

/** Human-readable phrases for '#tags', used in rumours ("…towns in frosty lands sell…"). */
export const BIOME_TAGS: Record<string, string> = {
  cold: 'frosty lands', hot: 'sun-baked lands', wet: 'soggy lands', dry: 'parched lands', wooded: 'wooded lands',
  coastal: 'coastal towns', rocky: 'rocky highlands', magic: 'strange, shimmering lands', fertile: 'fertile lowlands', volcanic: 'volcanic wastes',
};

/**
 * BIOMES
 * How the world picks a biome:
 *  1. Elevation picks a band: deep → shallow → shore → land → high → summit.
 *  2. On 'land', patch biomes are tested in list order; the first whose noise passes wins.
 *  3. Otherwise the biome in that band whose `climate` is nearest the local temp/moisture wins.
 * To add a biome: pick a band, give it a climate point (or a patch rule), a ground and some nodes.
 */
export const BIOMES: BiomeDef[] = [
  // ================= water =================
  { id: 'deep', name: 'Deep Sea', band: 'deep', color: [38, 78, 140], jitter: 6, ground: 'deep', tags: ['wet'],
    texture: { style: 'water' }, nodes: [], wind: 1.2, noWalk: true, noTowns: true },
  { id: 'shallow', name: 'Shallows', band: 'shallow', climate: { temp: 0, moist: 0 }, color: [62, 128, 186], jitter: 8, ground: 'shallow', tags: ['wet', 'coastal'],
    texture: { style: 'water' }, nodes: [['clam', 0.012, { rich: true }]], wind: 1.2, walk: 0.5, noTowns: true },
  { id: 'reef', name: 'Coral Reef', band: 'shallow', climate: { temp: 0.65, moist: 0.2 }, color: [66, 158, 192], jitter: 10, ground: 'shallow', tags: ['wet', 'coastal', 'hot'],
    texture: { style: 'water', specks: [['#ff8fab', 0.012], ['#ffd166', 0.006]] }, nodes: [['coral', 0.06], ['clam', 0.02, { rich: true }]],
    wind: 1.1, walk: 0.5, noTowns: true, ambient: { kind: 'bubbles', rate: 3 } },

  // ================= shores =================
  { id: 'beach', name: 'Beach', band: 'shore', climate: { temp: 0.2, moist: 0 }, color: [226, 208, 150], jitter: 10, ground: 'sand', tags: ['coastal'],
    texture: { style: 'sand' }, goods: { cheap: ['sand', 'pearl', 'wood', 'coral'], dear: ['iron', 'metal', 'amber', 'copper', 'gears'] },
    nodes: [['drift', 0.015], ['dune', 0.025], ['clam', 0.012, { rich: true }], ['palm', 0.008], ['ruin', 0.006], ['rock', 0.008]] },
  { id: 'iceshelf', name: 'Ice Shelf', band: 'shore', climate: { temp: -0.8, moist: 0 }, color: [214, 232, 244], jitter: 8, ground: 'snow', tags: ['cold', 'coastal'],
    texture: { style: 'cracked' }, goods: { cheap: ['ice', 'pearl', 'salt'], dear: ['wood', 'fuel', 'honey', 'fiber'] },
    nodes: [['ice', 0.03, { rich: true }], ['clam', 0.008], ['rock', 0.01]], walk: 0.75, ambient: { kind: 'snow', rate: 6 } },
  { id: 'mangrove', name: 'Mangrove Coast', band: 'shore', climate: { temp: 0.6, moist: 0.7 }, color: [74, 106, 74], jitter: 12, ground: 'mud', tags: ['wet', 'coastal', 'hot'],
    texture: { style: 'swamp' }, goods: { cheap: ['wood', 'pearl', 'fiber', 'silk'], dear: ['stone', 'metal', 'ice', 'glass'] },
    nodes: [['mangrove_tree', 0.12], ['reeds', 0.05], ['clam', 0.01], ['web', 0.004]], wind: 0.5, walk: 0.75, ambient: { kind: 'fireflies', rate: 3, night: true } },

  // ================= land (climate) =================
  { id: 'grass', name: 'Meadows', band: 'land', climate: { temp: 0, moist: -0.1 }, color: [112, 170, 82], jitter: 14, ground: 'firm', tags: ['fertile'],
    texture: { style: 'grass', specks: [['#f0e678', 0.015]] }, goods: { cheap: ['fiber', 'wood', 'rope', 'honey'], dear: ['iron', 'copper', 'glass', 'sulfur', 'ice'] },
    nodes: [['tree', 0.035], ['bush', 0.02], ['tallgrass', 0.05], ['rock', 0.015], ['flower', 0.015], ['berry', 0.006], ['hive', 0.003], ['ruin', 0.003, { rich: true }]] },
  { id: 'forest', name: 'Old Forest', band: 'land', climate: { temp: 0.05, moist: 0.35 }, color: [62, 122, 66], jitter: 12, ground: 'dense', tags: ['wooded', 'fertile'],
    texture: { style: 'grass', specks: [['#f0e678', 0.008]] }, goods: { cheap: ['wood', 'resin', 'amber', 'spores'], dear: ['sand', 'stone', 'metal', 'glass', 'copper'] },
    nodes: [['tree', 0.28], ['bush', 0.04], ['ancient', 0.005, { rich: true }], ['mushroom', 0.008], ['rock', 0.01], ['ruin', 0.004], ['tallgrass', 0.02], ['hive', 0.003]], wind: 0.25 },
  { id: 'autumn', name: 'Amber Woods', band: 'land', climate: { temp: -0.2, moist: 0.15 }, color: [150, 136, 72], jitter: 14, ground: 'dense', tags: ['wooded'],
    texture: { style: 'grass', specks: [['#e07a2a', 0.03], ['#c0392b', 0.012], ['#f2c14e', 0.02]] }, goods: { cheap: ['wood', 'resin', 'spores', 'honey'], dear: ['salt', 'sand', 'coral', 'copper'] },
    nodes: [['autumn_tree', 0.22], ['mushroom', 0.015], ['berry', 0.015], ['rock', 0.012], ['ancient', 0.003, { rich: true }]], wind: 0.35, ambient: { kind: 'leaves', rate: 5, color: '#e0812f' } },
  { id: 'taiga', name: 'Pine Taiga', band: 'land', climate: { temp: -0.45, moist: 0.35 }, color: [96, 132, 104], jitter: 12, ground: 'snow', tags: ['cold', 'wooded'],
    texture: { style: 'grass', specks: [['#eef4fa', 0.06]] }, goods: { cheap: ['wood', 'resin', 'ice'], dear: ['fuel', 'honey', 'sand', 'copper', 'coral'] },
    nodes: [['pine', 0.2], ['rock', 0.02], ['berry', 0.006], ['mushroom', 0.006], ['ice', 0.005, { rich: true }]], wind: 0.3, walk: 0.75, ambient: { kind: 'snow', rate: 3 } },
  { id: 'snow', name: 'Frost Tundra', band: 'land', climate: { temp: -0.8, moist: -0.1 }, color: [226, 236, 244], jitter: 8, ground: 'snow', tags: ['cold'],
    texture: { style: 'snow', specks: [['#c8dcf5', 0.03]] }, goods: { cheap: ['ice', 'crystal'], dear: ['wood', 'fuel', 'sulfur', 'fiber', 'rope', 'amber'] },
    nodes: [['pine', 0.045], ['ice', 0.02, { rich: true }], ['rock', 0.025]], walk: 0.75, ambient: { kind: 'snow', rate: 8 } },
  { id: 'moor', name: 'Misty Moor', band: 'land', climate: { temp: -0.35, moist: -0.45 }, color: [118, 120, 96], jitter: 14, ground: 'firm', tags: ['wet'],
    texture: { style: 'grass', specks: [['#9b6bb0', 0.05], ['#b48fc8', 0.02]] }, goods: { cheap: ['fiber', 'stone', 'bone'], dear: ['honey', 'glass', 'fuel', 'coral'] },
    nodes: [['heather', 0.08], ['rock', 0.03], ['ruin', 0.006], ['bones', 0.004], ['tallgrass', 0.02]], wind: 1.2, ambient: { kind: 'mist', rate: 1.5 } },
  { id: 'swamp', name: 'Murk Swamp', band: 'land', climate: { temp: 0.15, moist: 0.85 }, color: [78, 98, 70], jitter: 14, ground: 'mud', tags: ['wet'],
    texture: { style: 'swamp' }, goods: { cheap: ['fuel', 'fiber', 'resin', 'spores'], dear: ['stone', 'metal', 'gears', 'ice', 'sand'] },
    nodes: [['dead', 0.08], ['oil', 0.025], ['reeds', 0.07], ['bush', 0.02], ['clam', 0.004], ['web', 0.003]], wind: 0.6, walk: 0.75, ambient: { kind: 'fireflies', rate: 3, night: true } },
  { id: 'jungle', name: 'Jungle', band: 'land', climate: { temp: 0.7, moist: 0.65 }, color: [44, 112, 54], jitter: 14, ground: 'dense', tags: ['hot', 'wet', 'wooded'],
    texture: { style: 'grass', specks: [['#ff6b9a', 0.006], ['#ffd166', 0.004]] }, goods: { cheap: ['wood', 'honey', 'silk', 'fiber'], dear: ['ice', 'salt', 'metal', 'stone'] },
    nodes: [['jungle_tree', 0.3], ['palm', 0.02], ['hive', 0.01], ['web', 0.008], ['bush', 0.03], ['flower', 0.01]], wind: 0.2, walk: 0.8, ambient: { kind: 'fireflies', rate: 4, night: true } },
  { id: 'savanna', name: 'Golden Savanna', band: 'land', climate: { temp: 0.4, moist: -0.3 }, color: [196, 176, 96], jitter: 14, ground: 'firm', tags: ['hot', 'dry'],
    texture: { style: 'grass', specks: [['#e8d48a', 0.03]] }, goods: { cheap: ['fiber', 'bone', 'honey'], dear: ['ice', 'pearl', 'resin', 'glass'] },
    nodes: [['dry_grass', 0.07], ['acacia', 0.02], ['bones', 0.006], ['hive', 0.004], ['rock', 0.012]], wind: 1.1 },
  { id: 'desert', name: 'Dune Sea', band: 'land', climate: { temp: 0.75, moist: -0.7 }, color: [222, 186, 112], jitter: 12, ground: 'sand', tags: ['hot', 'dry'],
    texture: { style: 'sand' }, goods: { cheap: ['sand', 'fuel', 'glass', 'copper'], dear: ['wood', 'ice', 'fiber', 'rope', 'pearl'] },
    nodes: [['cactus', 0.03], ['oil', 0.016, { rich: true }], ['dune', 0.04], ['rock', 0.02], ['copper', 0.008, { rich: true }], ['ruin', 0.008, { rich: true }], ['bones', 0.004]],
    wind: 1.1, ambient: { kind: 'sand', rate: 6 } },
  { id: 'badlands', name: 'Rust Badlands', band: 'land', climate: { temp: 0.6, moist: 0.15 }, color: [184, 110, 72], jitter: 16, ground: 'rough', tags: ['hot', 'dry', 'rocky'],
    texture: { style: 'plain' }, goods: { cheap: ['iron', 'copper', 'sulfur', 'scrap', 'metal'], dear: ['wood', 'fiber', 'ice', 'resin', 'pearl'] },
    nodes: [['rock', 0.04], ['ore', 0.03, { rich: true }], ['copper', 0.025, { rich: true }], ['vent', 0.012, { rich: true }], ['ruin', 0.04], ['dead', 0.01]] },

  // ================= land (patches; checked in order) =================
  { id: 'crystal', name: 'Prism Fields', band: 'land', patch: { seed: 4242, scale: 0.009, threshold: 0.43 }, color: [146, 108, 186], jitter: 18, ground: 'crystal', tags: ['magic', 'rocky'],
    texture: { style: 'crystal', specks: [['#e6c8ff', 0.03]] }, goods: { cheap: ['crystal', 'starmetal'], dear: ['wood', 'fuel', 'fiber', 'gears', 'resin'] },
    nodes: [['crystal', 0.07, { rich: true }], ['ore', 0.06], ['copper', 0.04], ['rock', 0.02]], mobs: ['wisp'] },
  { id: 'ash', name: 'Ashlands', band: 'land', patch: { seed: 6161, scale: 0.007, threshold: 0.45, temp: [0.25, 9] }, color: [60, 52, 52], jitter: 12, ground: 'rough', tags: ['volcanic', 'hot', 'rocky'],
    texture: { style: 'ash' }, goods: { cheap: ['obsidian', 'sulfur', 'stone'], dear: ['ice', 'wood', 'honey', 'fiber', 'pearl'] },
    nodes: [['lava', 0.018], ['obsidian_rock', 0.03, { rich: true }], ['vent', 0.02, { rich: true }], ['dead', 0.012], ['bones', 0.004]], walk: 0.85, ambient: { kind: 'ash', rate: 10 } },
  { id: 'shroom', name: 'Shroomwood', band: 'land', patch: { seed: 5151, scale: 0.008, threshold: 0.42, moist: [0.15, 9] }, color: [96, 84, 120], jitter: 14, ground: 'dense', tags: ['magic', 'wet', 'wooded'],
    texture: { style: 'grass', specks: [['#c8a0ff', 0.02], ['#7fe0ff', 0.008]] }, goods: { cheap: ['spores', 'silk', 'resin'], dear: ['salt', 'sand', 'metal', 'sulfur'] },
    nodes: [['giant_shroom', 0.03], ['glowcap', 0.05], ['mushroom', 0.05], ['web', 0.012]], wind: 0.3, ambient: { kind: 'spores', rate: 5 } },
  { id: 'salt', name: 'Salt Flats', band: 'land', patch: { seed: 7171, scale: 0.01, threshold: 0.44, temp: [0.15, 9], moist: [-9, -0.15] }, color: [236, 232, 222], jitter: 8, ground: 'flat', tags: ['dry', 'hot'],
    texture: { style: 'cracked' }, goods: { cheap: ['salt', 'glass'], dear: ['wood', 'fiber', 'honey', 'resin', 'ice'] },
    nodes: [['salt', 0.04], ['bones', 0.006], ['ruin', 0.004]], wind: 1.3, ambient: { kind: 'sand', rate: 2, color: 'rgba(255,255,255,0.6)' } },
  { id: 'bloom', name: 'Bloom Meadow', band: 'land', patch: { seed: 8181, scale: 0.012, threshold: 0.47, temp: [-0.35, 0.55], moist: [-0.4, 0.6] }, color: [120, 176, 90], jitter: 14, ground: 'firm', tags: ['fertile', 'magic'],
    texture: { style: 'grass', specks: [['#ff9ec7', 0.03], ['#fff3a0', 0.025], ['#ffffff', 0.02], ['#a0c4ff', 0.015]] }, goods: { cheap: ['honey', 'fiber'], dear: ['obsidian', 'iron', 'scrap', 'sulfur'] },
    nodes: [['flower', 0.12], ['hive', 0.02], ['bush', 0.02], ['tree', 0.01]], ambient: { kind: 'petals', rate: 5, color: '#ffb3d1' } },
  { id: 'boneyard', name: 'Bone Flats', band: 'land', patch: { seed: 9191, scale: 0.009, threshold: 0.46, moist: [-9, 0] }, color: [214, 200, 160], jitter: 10, ground: 'sand', tags: ['dry'],
    texture: { style: 'sand', specks: [['#f5f0e0', 0.02]] }, goods: { cheap: ['bone', 'scrap'], dear: ['honey', 'wood', 'pearl', 'coral'] },
    nodes: [['bones', 0.05], ['skull', 0.006], ['rock', 0.01], ['ruin', 0.006]], mobs: ['skeleton'] },

  // ================= highlands =================
  { id: 'mountain', name: 'Crags', band: 'high', climate: { temp: 0, moist: 0 }, color: [120, 116, 120], jitter: 18, ground: 'rock', tags: ['rocky'],
    texture: { style: 'rock' }, goods: { cheap: ['stone', 'iron', 'sulfur'], dear: ['wood', 'fuel', 'fiber', 'pearl', 'glass'] },
    nodes: [['rock', 0.05], ['ore', 0.05, { rich: true }], ['crystal', 0.03], ['vent', 0.02, { rich: true }]], wind: 0.7, walk: 0.6 },
  { id: 'mesa', name: 'Red Mesa', band: 'high', climate: { temp: 0.6, moist: -0.4 }, color: [178, 94, 62], jitter: 14, ground: 'rock', tags: ['rocky', 'hot', 'dry'],
    texture: { style: 'stripes' }, goods: { cheap: ['copper', 'stone', 'sand'], dear: ['ice', 'wood', 'pearl', 'honey'] },
    nodes: [['mesa_rock', 0.05], ['copper', 0.03, { rich: true }], ['cactus', 0.01], ['vent', 0.008]], wind: 0.9, walk: 0.6 },
  { id: 'glacier', name: 'Glacier', band: 'high', climate: { temp: -0.7, moist: 0 }, color: [200, 224, 240], jitter: 10, ground: 'rock', tags: ['cold', 'rocky'],
    texture: { style: 'cracked' }, goods: { cheap: ['ice', 'crystal'], dear: ['wood', 'fuel', 'honey', 'sulfur'] },
    nodes: [['ice', 0.06, { rich: true }], ['rock', 0.02]], walk: 0.6, ambient: { kind: 'snow', rate: 6 } },

  // ================= summit =================
  { id: 'peak', name: 'High Peaks', band: 'summit', color: [196, 196, 206], jitter: 10, ground: 'cliff', tags: ['cold', 'rocky'],
    texture: { style: 'peak' }, nodes: [['ice', 0.04], ['rock', 0.03]], noWalk: true, noTowns: true, ambient: { kind: 'snow', rate: 6 } },
];
