import { LocoDef, shop } from './types';

/**
 * LOCOMOTION: speed multipliers per ground (see grounds.ts). A missing ground means
 * impassable. `art` reuses another locomotion's drawing (game/draw.ts → drawLoco).
 */
export const LOCOS: LocoDef[] = [
  { id: 'wheels', name: 'Wobbly Wheels', desc: 'Zippy on meadows and hardpan. Struggles in sand, snow and mud.', cost: {}, speed: 1, weight: 2, hp: 0,
    ground: { sand: 0.55, flat: 1.2, firm: 1, dense: 0.8, mud: 0.4, snow: 0.5, rough: 0.85, crystal: 0.85 } },
  { id: 'tracks', name: 'Tank Treads', desc: 'Steady on any land. Tough but heavy.', cost: { iron: 30, scrap: 20 }, speed: 0.9, weight: 4, hp: 30, shop: shop(['badlands', 'mountain', '#cold'], 1, 200),
    ground: { sand: 0.9, flat: 1, firm: 1, dense: 1, mud: 0.8, snow: 0.9, rough: 1, crystal: 1 } },
  { id: 'sled', name: 'Snow Runners', desc: 'Glides fast over snow, sand & salt. Scrapes miserably over grass.', cost: { wood: 20, resin: 6 }, speed: 1.15, weight: 1, hp: 0, shop: shop(['snow', 'taiga', 'iceshelf'], 1, 140),
    ground: { snow: 1.4, sand: 1.05, flat: 1.3, crystal: 0.8, firm: 0.35, dense: 0.3, rough: 0.4, mud: 0.5 } },
  { id: 'camel', name: 'Camel Feet', desc: 'Big padded feet that love sand and rough ground. Dislike cold and mud.', cost: { fiber: 30, bone: 15, resin: 6 }, speed: 1.05, weight: 2, hp: 5, shop: shop(['desert', 'savanna', 'boneyard', 'salt'], 1, 180),
    ground: { sand: 1.35, flat: 1.15, rough: 1.05, firm: 0.85, dense: 0.5, snow: 0.4, mud: 0.3, crystal: 0.8 } },
  { id: 'fins', name: 'Paddle Fins', desc: 'Amphibious! Swims oceans, waddles slowly on land.', cost: { wood: 30, rope: 10 }, speed: 0.85, weight: 2.5, hp: 10, shop: shop(['beach', 'swamp', 'mangrove'], 1, 260),
    ground: { deep: 1.2, shallow: 1.1, sand: 0.7, mud: 0.9, flat: 0.5, firm: 0.6, dense: 0.5, snow: 0.6, rough: 0.5, crystal: 0.5 } },
  { id: 'pontoons', name: 'Pontoon Floats', desc: 'Bobs across water and bog. Clunky but cheap, and sturdier than fins.', cost: { wood: 40, resin: 10, rope: 4 }, speed: 0.8, weight: 3, hp: 20, shop: shop(['#coastal', 'swamp'], 1, 200),
    ground: { deep: 0.75, shallow: 0.95, mud: 1.05, sand: 0.6, flat: 0.5, firm: 0.5, dense: 0.4, snow: 0.5, rough: 0.4, crystal: 0.4 } },
  { id: 'stilts', name: 'Wading Stilts', desc: 'Tall legs that stride through swamps and shallows. Clumsy anywhere else.', cost: { wood: 25, resin: 10 }, speed: 0.9, weight: 2, hp: 0, shop: shop(['swamp', 'mangrove'], 2, 300),
    ground: { mud: 1.1, shallow: 0.85, sand: 0.8, flat: 0.7, firm: 0.7, dense: 0.5, snow: 0.6, rough: 0.6, crystal: 0.6 } },
  { id: 'spider', name: 'Spider Legs', desc: 'Clambers over crags & cliffs. Slow and creepy.', cost: { metal: 20, gears: 6 }, speed: 0.8, weight: 4, hp: 20, shop: shop(['mountain', 'badlands', 'mesa'], 2, 520),
    ground: { sand: 1, flat: 1, firm: 1, dense: 1, mud: 0.8, snow: 1, rough: 1, crystal: 1, shallow: 0.5, rock: 0.8, cliff: 0.55 } },
  { id: 'hover', name: 'Hover Skirt', desc: 'Glides over land & sea. Fast but fragile.', cost: { crystal: 25, metal: 12, copper: 10 }, speed: 1.35, weight: 2, hp: -15, shop: shop(['crystal', 'beach'], 3, 900),
    ground: { sand: 1, flat: 1.2, firm: 1, dense: 0.8, mud: 1.1, snow: 1, rough: 0.9, crystal: 1, deep: 1, shallow: 1 } },
];
