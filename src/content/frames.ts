import { FrameDef, shop } from './types';

/** FRAMES: the chassis floor. `pattern` picks a floor texture in game/parts.ts → drawFrame. */
export const FRAMES: FrameDef[] = [
  { id: 'f_timber', name: 'Timber Frame', desc: 'Sturdy planks. A fine all-rounder.', cost: {}, wpc: 0.4, hpc: 0, floor: '#8a6a4a', floor2: '#7a5c40', rim: '#3a2a20', pattern: 'planks' },
  { id: 'f_wicker', name: 'Wicker Frame', desc: 'Woven reeds. Almost weightless but flimsy.', cost: { fiber: 40, resin: 6 }, wpc: 0.12, hpc: -3, floor: '#c9a66b', floor2: '#b08c52', rim: '#6b4f2a', pattern: 'weave', shop: shop(['swamp', 'grass', 'forest', 'mangrove'], 1, 120) },
  { id: 'f_bone', name: 'Bone Frame', desc: 'Lashed bones. Light and surprisingly tough.', cost: { bone: 40, rope: 6 }, wpc: 0.25, hpc: 5, floor: '#e6dcc0', floor2: '#d4c8a8', rim: '#7a6a4a', pattern: 'bone', shop: shop(['#dry'], 1, 180) },
  { id: 'f_iron', name: 'Ironclad Frame', desc: 'Riveted steel. Very tough, very heavy.', cost: { metal: 12 }, wpc: 1.0, hpc: 10, floor: '#6d7680', floor2: '#5d656e', rim: '#24282d', pattern: 'rivets', shop: shop(['badlands', 'mountain'], 2, 300) },
  { id: 'f_living', name: 'Living Wood Frame', desc: 'A floor that is still growing. Slowly heals itself and feels homely.', cost: { wood: 60, honey: 6, spores: 6 }, wpc: 0.45, hpc: 2, rpc: 0.15, comfort: 2, floor: '#6a8a4a', floor2: '#5a7a3e', rim: '#3a4a22', pattern: 'leaf', shop: shop(['#wooded', '#magic'], 2, 320) },
  { id: 'f_glass', name: 'Glass Dome', desc: 'A greenhouse on wheels. Cozy, sunny, slightly fragile.', cost: { glass: 20, copper: 8 }, wpc: 0.5, hpc: -1, comfort: 3, solarMul: 1.4, floor: '#5a6e66', floor2: '#4e6058', rim: '#9fd3e8', pattern: 'glass', shop: shop(['desert', 'crystal', 'beach', 'salt'], 2, 340) },
];
