import type { ResourceDef } from './types';

/**
 * RESOURCES: add a line to add a resource. It will automatically appear in the
 * Stores panel, markets, the price journal and auto-sell lists.
 */
export const RESOURCES: ResourceDef[] = [
  // ---- common ----
  { id: 'wood', name: 'Wood', icon: '🪵', color: '#c08a4a', base: 2, tier: 'common', found: 'Trees everywhere; driftwood on beaches' },
  { id: 'stone', name: 'Stone', icon: '🪨', color: '#9aa3ad', base: 2, tier: 'common', found: 'Boulders in most lands' },
  { id: 'fiber', name: 'Fiber', icon: '🌾', color: '#cdd66a', base: 2, tier: 'common', found: 'Tall grass, reeds, heather & bushes' },
  { id: 'sand', name: 'Sand', icon: '⏳', color: '#e9cf8a', base: 2, tier: 'common', found: 'Dunes in deserts and on beaches' },
  { id: 'salt', name: 'Salt', icon: '🧂', color: '#f4f1ea', base: 3, tier: 'common', found: 'Salt crystals glittering on the Salt Flats' },

  // ---- uncommon ----
  { id: 'iron', name: 'Iron Ore', icon: '⛏️', color: '#d9824b', base: 5, tier: 'uncommon', found: 'Ore rocks in badlands, crags & prism fields' },
  { id: 'copper', name: 'Copper', icon: '🥉', color: '#e08a5a', base: 6, tier: 'uncommon', found: 'Green-veined rocks in badlands, deserts & mesas' },
  { id: 'resin', name: 'Resin', icon: '🧴', color: '#e0a030', base: 6, tier: 'uncommon', found: 'Oozes from trees, especially pines' },
  { id: 'fuel', name: 'Crude Oil', icon: '🛢️', color: '#3b3b46', base: 6, tier: 'uncommon', found: 'Oil seeps in swamps & deserts' },
  { id: 'scrap', name: 'Scrap', icon: '🪛', color: '#7f8c8d', base: 4, tier: 'uncommon', found: 'Old ruins; dropped by critters' },
  { id: 'ice', name: 'Ice', icon: '🧊', color: '#a8e0ff', base: 5, tier: 'uncommon', found: 'Ice spires in tundra, glaciers & ice shelves' },
  { id: 'bone', name: 'Bone', icon: '🦴', color: '#efe6cf', base: 5, tier: 'uncommon', found: 'Bone piles on the Bone Flats & savannas; skeletons' },
  { id: 'spores', name: 'Spores', icon: '🍄', color: '#c78bff', base: 6, tier: 'uncommon', found: 'Mushrooms, most of all in the Shroomwood' },
  { id: 'honey', name: 'Honey', icon: '🍯', color: '#f5b631', base: 7, tier: 'uncommon', found: 'Wild hives in meadows, jungles & bloom meadows' },

  // ---- rare ----
  { id: 'sulfur', name: 'Sulfur', icon: '🌋', color: '#f2e14c', base: 12, tier: 'rare', found: 'Steaming vents in badlands, crags & ashlands' },
  { id: 'pearl', name: 'Pearl', icon: '🦪', color: '#f3eefc', base: 18, tier: 'rare', found: 'Clams in shallows, reefs & on beaches' },
  { id: 'amber', name: 'Amber', icon: '🔶', color: '#ff9f1c', base: 20, tier: 'rare', found: 'Ancient trees deep in old forests' },
  { id: 'crystal', name: 'Crystal', icon: '💎', color: '#b07cff', base: 15, tier: 'rare', found: 'Prism fields and crags' },
  { id: 'coral', name: 'Coral', icon: '🪸', color: '#ff7f9f', base: 16, tier: 'rare', found: 'Coral reefs in warm shallows' },
  { id: 'obsidian', name: 'Obsidian', icon: '⬛', color: '#3a2a4a', base: 18, tier: 'rare', found: 'Glassy rocks & lava pools in the Ashlands' },
  { id: 'silk', name: 'Silk', icon: '🕸️', color: '#f0f0ff', base: 14, tier: 'rare', found: 'Webs in jungles & the Shroomwood; spiders drop it' },

  // ---- epic ----
  { id: 'starmetal', name: 'Starmetal', icon: '☄️', color: '#7fe0ff', base: 60, tier: 'epic', found: 'Fallen meteors & craters, only very far from home' },

  // ---- refined (made by processing parts) ----
  { id: 'metal', name: 'Metal', icon: '🔩', color: '#cfd8dc', base: 18, tier: 'refined', found: 'Smelted from iron ore (or forged with obsidian)' },
  { id: 'glass', name: 'Glass', icon: '🪟', color: '#bfe9f0', base: 14, tier: 'refined', found: 'Fired from sand in a kiln' },
  { id: 'rope', name: 'Rope', icon: '🧶', color: '#d9b88a', base: 8, tier: 'refined', found: 'Woven from fiber on a loom, or spun from silk' },
  { id: 'gears', name: 'Gears', icon: '⚙️', color: '#d4a84b', base: 25, tier: 'refined', found: 'Machined from copper + iron' },
];
