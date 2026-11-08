import { ModuleDef, shop } from '../types';

export const DEFENSE: ModuleDef[] = [
  { id: 'armor', name: 'Stone Slab', cat: 'defense', desc: '+30 hull. Half as good away from the edge. Heavy.', cost: { stone: 30 }, weight: 2.5, color: '#7d858c', hp: 30, tags: ['edge'] },
  { id: 'ironplate', name: 'Iron Plating', cat: 'defense', desc: '+60 hull. Heavy. Half as good away from the edge.', cost: { metal: 6 }, weight: 3.5, color: '#8a96a3', hp: 60, tags: ['edge'], shop: shop(['badlands', 'mountain', 'mesa'], 1, 120) },
  { id: 'coralplate', name: 'Coral Plating', cat: 'defense', desc: '+45 hull and slowly regrows. Light for its strength.', cost: { coral: 12, stone: 10 }, weight: 2, color: '#ff8fa8', hp: 45, regen: 0.4, tags: ['edge'], art: 'ironplate', shop: shop(['reef', 'beach', 'mangrove'], 2, 240) },
  { id: 'hedge', name: 'Living Hedge', cat: 'defense', desc: 'Light, self-healing greenery. +15 hull, +0.6 regen, +1 comfort.', cost: { wood: 15, fiber: 15 }, weight: 1, color: '#4f9a4a', hp: 15, regen: 0.6, comfort: 1, shop: shop(['#wooded', 'grass', 'swamp'], 1, 90) },
  { id: 'repair', name: 'Repair Bay', cat: 'defense', desc: 'Tiny robot arms patch the hull at +1.5/s.', cost: { gears: 4, scrap: 15 }, weight: 1.5, color: '#27ae60', regen: 1.5, hp: 5, tags: ['noisy'], shop: shop('any', 2, 220) },
  { id: 'spikes', name: 'Ram Spikes', cat: 'defense', desc: 'Hurts anything that touches you. Must be on the edge.', cost: { iron: 12 }, weight: 1.5, color: '#616a6b', spikes: 10, hp: 8, tags: ['edge'], shop: shop(['badlands', 'desert'], 1, 80) },
  { id: 'bonespikes', name: 'Bone Spikes', cat: 'defense', desc: 'Cheap jagged bones. Lighter, slightly weaker spikes.', cost: { bone: 15 }, weight: 0.8, color: '#d8ccb0', spikes: 7, hp: 4, tags: ['edge'], art: 'spikes', shop: shop(['#dry', 'moor'], 1, 60) },
  { id: 'shield', name: 'Prism Ward', cat: 'defense', desc: 'Blocks a hit every few seconds. Drains 4 power.', cost: { crystal: 25, copper: 15, glass: 10 }, weight: 1.5, color: '#5ad1e6', shield: 1, power: -4, shop: shop(['crystal'], 3, 700) },
  { id: 'scarecrow', name: 'Scarecrow', cat: 'defense', desc: 'Fewer critters show up. Slightly unsettling (−1 comfort).', cost: { fiber: 10, wood: 5 }, weight: 0.5, color: '#d4a74a', scare: 0.25, comfort: -1, shop: shop(['grass', 'forest', 'savanna'], 1, 50) },
  { id: 'totem', name: 'Warding Totem', cat: 'defense', desc: 'Carved guardian. Far fewer critters, and it is rather cozy (+1 comfort).', cost: { wood: 20, bone: 10, honey: 4 }, weight: 1.5, color: '#a0603a', scare: 0.35, comfort: 1, shop: shop(['jungle', 'savanna', 'mangrove'], 2, 200) },
];
