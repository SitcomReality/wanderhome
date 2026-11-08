import { ModuleDef, shop } from '../types';

export const COMFORT: ModuleDef[] = [
  { id: 'plant', name: 'Potted Plant', cat: 'comfort', desc: '+1 comfort. A little friend.', cost: { wood: 4, fiber: 4 }, weight: 0.5, color: '#58d68d', comfort: 1, tags: ['quiet'] },
  { id: 'bunk', name: 'Cozy Bunk', cat: 'comfort', desc: '+2 comfort. A nap spot.', cost: { wood: 25, fiber: 10 }, weight: 1.5, color: '#c39bd3', comfort: 2, tags: ['quiet'], shop: shop(['#wooded', 'grass'], 1, 60) },
  { id: 'trophy', name: 'Bone Trophy Wall', cat: 'comfort', desc: '+2 comfort. Rustic décor with a story behind every piece.', cost: { bone: 15, wood: 10 }, weight: 1, color: '#c8b890', comfort: 2, shop: shop(['#dry', 'moor'], 1, 70) },
  { id: 'hearth', name: 'Hearth', cat: 'comfort', desc: '+2 comfort. Warms its neighbours (counts as heat).', cost: { stone: 30 }, weight: 2, color: '#8a7a6a', comfort: 2, tags: ['hot'], shop: shop(['#cold', 'mountain'], 1, 120) },
  { id: 'terrarium', name: 'Shroom Terrarium', cat: 'comfort', desc: '+3 comfort. Softly glowing mushrooms in a jar.', cost: { glass: 6, spores: 10 }, weight: 1, color: '#5a3a7a', comfort: 3, light: 0.4, tags: ['quiet'], shop: shop(['#magic', 'autumn'], 1, 150) },
  { id: 'library', name: 'Tiny Library', cat: 'comfort', desc: '+4 comfort, but useless next to anything noisy.', cost: { wood: 30, rope: 10 }, weight: 2, color: '#7b4b2a', comfort: 4, tags: ['quiet'], shop: shop(['#wooded', 'grass'], 2, 220) },
  { id: 'records', name: 'Record Player', cat: 'comfort', desc: '+3 comfort. Sitcom-grade vibes.', cost: { copper: 8, gears: 3 }, weight: 1, color: '#f5b041', comfort: 3, shop: shop(['badlands', 'beach', 'mesa'], 2, 180) },
  { id: 'aquarium', name: 'Aquarium', cat: 'comfort', desc: '+5 comfort. Heavy with water, full of tiny fish.', cost: { glass: 12, pearl: 4 }, weight: 2.5, color: '#4aa3df', comfort: 5, tags: ['quiet'], shop: shop(['beach', 'reef'], 2, 260) },
  { id: 'coralgarden', name: 'Coral Garden', cat: 'comfort', desc: '+4 comfort. A rock pool of living colour.', cost: { coral: 8, glass: 6 }, weight: 2, color: '#2a6a8a', comfort: 4, tags: ['quiet'], shop: shop(['beach', 'mangrove', 'reef'], 2, 220) },
  { id: 'hottub', name: 'Hot Spring Tub', cat: 'comfort', desc: '+5 comfort. Hot (warms neighbours) and very heavy.', cost: { stone: 40, salt: 10, iron: 6 }, weight: 3.5, color: '#6a7a8a', comfort: 5, tags: ['hot'], shop: shop(['#cold', '#volcanic'], 2, 260) },
  { id: 'amberlamp', name: 'Amber Lantern', cat: 'comfort', desc: '+3 comfort. Lights up the night far around you.', cost: { amber: 5, glass: 4 }, weight: 0.5, color: '#ff9f1c', comfort: 3, light: 1, tags: ['quiet'], shop: shop(['forest', 'autumn'], 3, 300) },
  { id: 'lava', name: 'Lava Lamp', cat: 'comfort', desc: '+2 comfort. Groovy.', cost: { glass: 4, crystal: 2 }, weight: 0.5, color: '#ff6f91', comfort: 2, shop: shop(['crystal', 'desert', 'salt'], 1, 100) },
];
