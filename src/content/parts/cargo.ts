import { ModuleDef, shop } from '../types';

export const CARGO: ModuleDef[] = [
  { id: 'crate', name: 'Cargo Crate', cat: 'cargo', desc: 'Honest wooden storage.', cost: { wood: 12 }, weight: 1.5, color: '#b5835a', cargo: 40 },
  { id: 'sacks', name: 'Woven Sacks', cat: 'cargo', desc: 'Less space than a crate, but weighs almost nothing.', cost: { rope: 6 }, weight: 0.4, color: '#c9a66b', cargo: 30, shop: shop(['grass', 'swamp', 'forest', 'savanna'], 1, 60) },
  { id: 'bonerack', name: 'Bone Rack', cat: 'cargo', desc: 'Lashed bones and hooks. Cheap, light-ish storage.', cost: { bone: 20 }, weight: 0.8, color: '#e6dcc0', cargo: 35, shop: shop(['#dry'], 1, 70) },
  { id: 'cocoon', name: 'Silk Cocoon', cat: 'cargo', desc: 'A stretchy silken pod. Roomy and feather-light.', cost: { silk: 12, resin: 6 }, weight: 0.6, color: '#efeaf8', cargo: 60, art: 'sacks', shop: shop(['jungle', 'shroom'], 2, 260) },
  { id: 'balloon', name: 'Lift Balloon', cat: 'cargo', desc: 'Storage with NEGATIVE weight. Fragile. Lifts more next to something hot.', cost: { rope: 10, resin: 8, fiber: 20 }, weight: -2.5, hp: -10, color: '#e85d75', cargo: 45, shop: shop(['grass', 'snow', 'beach', 'savanna'], 2, 240) },
  { id: 'hold', name: 'Iron Hold', cat: 'cargo', desc: 'A cavernous steel vault. Very heavy.', cost: { metal: 8, stone: 20 }, weight: 3.5, color: '#6d7b8d', cargo: 130, shop: shop(['badlands', 'mountain'], 2, 220) },
  { id: 'icebox', name: 'Ice Chest', cat: 'cargo', desc: 'Keeps rare goods pristine: rare & epic goods sell for +15%.', cost: { ice: 15, wood: 20, glass: 4 }, weight: 2, color: '#d8f0ff', cargo: 50, preserve: true, tags: ['cold'], shop: shop(['#cold', 'beach'], 2, 180) },
];
