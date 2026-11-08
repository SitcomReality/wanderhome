import type { BonusKind } from './legacy';

/**
 * MILESTONES: achievements that unlock automatically. Each has 1–3 tiers. `stat` names a
 * counter computed in game/legacy.ts → statValue(). Add a stat there if you need a new one.
 * Rewards are granted automatically with a toast.
 */
export type StatKey =
  | 'distance' | 'farthest' | 'playHours' | 'days' | 'comfort' | 'cells' | 'blueprints' | 'netWorth' | 'breakdowns'
  | 'harvested' | 'earned' | 'resources' | 'rare' | 'kills' | 'species' | 'towns' | 'bought' | 'biomes' | 'allBiomes'
  | 'postcards' | 'landmarks' | 'landmarkKinds' | 'retirements' | 'sparks' | 'perks' | 'awayHours' | 'visitors' | 'cat' | 'coffees';

export type MilestoneGroup = 'Journey' | 'Home' | 'Harvest' | 'Critters' | 'Towns' | 'Biomes' | 'Landmarks' | 'Generations' | 'Offline';
export interface MilestoneReward { coins?: number; sparks?: number; cosmetic?: string; bonus?: { kind: BonusKind; amt: number } }
export interface MilestoneDef { id: string; group: MilestoneGroup; name: string; icon: string; desc: string; stat: StatKey; tiers: number[]; rewards: MilestoneReward[]; unit?: string }

export const MILESTONE_GROUPS: MilestoneGroup[] = ['Journey', 'Home', 'Harvest', 'Critters', 'Towns', 'Biomes', 'Landmarks', 'Generations', 'Offline'];

export const MILESTONES: MilestoneDef[] = [
  // Journey
  { id: 'roll', group: 'Journey', name: 'Rolling Along', icon: '🛞', desc: 'Roll across tiles (all generations).', stat: 'distance', tiers: [1000, 10000, 50000], unit: 'tiles',
    rewards: [{ coins: 100, cosmetic: 'paint_mint' }, { sparks: 3 }, { bonus: { kind: 'speed', amt: 0.03 } }] },
  { id: 'far', group: 'Journey', name: 'Far From Home', icon: '🧭', desc: 'Get far from your starting town.', stat: 'farthest', tiers: [150, 400, 1000], unit: 'tiles',
    rewards: [{ coins: 120 }, { sparks: 3 }, { sparks: 8 }] },
  { id: 'hours', group: 'Journey', name: 'Long Haul', icon: '⏳', desc: 'Spend time on the road.', stat: 'playHours', tiers: [1, 5, 20], unit: 'h',
    rewards: [{ coins: 150 }, { bonus: { kind: 'comfort', amt: 1 } }, { sparks: 10 }] },
  { id: 'days', group: 'Journey', name: 'Days on the Road', icon: '🌅', desc: 'Watch the sun rise again and again.', stat: 'days', tiers: [5, 25, 100], unit: 'days',
    rewards: [{ coins: 100 }, { sparks: 2 }, { sparks: 8 }] },
  // Home
  { id: 'cozy', group: 'Home', name: 'Cozy Corner', icon: '🛋️', desc: 'Reach a total comfort level.', stat: 'comfort', tiers: [10, 25, 50],
    rewards: [{ cosmetic: 'paint_rose' }, { cosmetic: 'trinket_bobble', bonus: { kind: 'comfort', amt: 1 } }, { bonus: { kind: 'offlineMul', amt: 0.05 } }] },
  { id: 'room', group: 'Home', name: 'Room to Grow', icon: '📏', desc: 'Expand your chassis.', stat: 'cells', tiers: [8, 15, 25], unit: 'cells',
    rewards: [{ coins: 150 }, { bonus: { kind: 'cargo', amt: 20 } }, { sparks: 8 }] },
  { id: 'tinker', group: 'Home', name: 'Tinkerer', icon: '📐', desc: 'Know blueprints (ever).', stat: 'blueprints', tiers: [15, 35, 60],
    rewards: [{ coins: 200 }, { sparks: 4 }, { sparks: 12 }] },
  { id: 'nest', group: 'Home', name: 'Nest Egg', icon: '🥚', desc: 'Reach a net worth in one run.', stat: 'netWorth', tiers: [2000, 10000, 50000], unit: '🪙',
    rewards: [{ sparks: 1 }, { sparks: 4 }, { sparks: 12 }] },
  { id: 'patched', group: 'Home', name: 'Patched Up', icon: '🩹', desc: 'Shrug off breakdowns. The house always recovers.', stat: 'breakdowns', tiers: [1, 3, 10],
    rewards: [{ coins: 80 }, { bonus: { kind: 'cargo', amt: 10 } }, { sparks: 5 }] },
  // Harvest
  { id: 'green', group: 'Harvest', name: 'Green Fingers', icon: '🌿', desc: 'Harvest resource nodes.', stat: 'harvested', tiers: [100, 1000, 5000],
    rewards: [{ coins: 100 }, { bonus: { kind: 'yield', amt: 0.03 } }, { bonus: { kind: 'yield', amt: 0.05 } }] },
  { id: 'purse', group: 'Harvest', name: 'Coin Purse', icon: '🪙', desc: 'Earn coins (all generations).', stat: 'earned', tiers: [1000, 10000, 100000],
    rewards: [{ coins: 150 }, { sparks: 3 }, { sparks: 10 }] },
  { id: 'collector', group: 'Harvest', name: 'Collector', icon: '🧺', desc: 'Find different kinds of resource.', stat: 'resources', tiers: [8, 16, 26],
    rewards: [{ coins: 120 }, { sparks: 3 }, { bonus: { kind: 'luck', amt: 0.1 } }] },
  { id: 'treasure', group: 'Harvest', name: 'Treasure Hunter', icon: '💎', desc: 'Find rare & epic resource types.', stat: 'rare', tiers: [2, 5, 8],
    rewards: [{ coins: 200 }, { bonus: { kind: 'luck', amt: 0.1 } }, { sparks: 10 }] },
  // Critters
  { id: 'pests', group: 'Critters', name: 'Pest Control', icon: '🐾', desc: 'Bonk critters.', stat: 'kills', tiers: [25, 250, 1500],
    rewards: [{ coins: 100 }, { sparks: 3 }, { sparks: 8 }] },
  { id: 'guide', group: 'Critters', name: 'Field Guide', icon: '🔍', desc: 'Meet different critter species.', stat: 'species', tiers: [4, 9, 15],
    rewards: [{ coins: 120 }, { sparks: 3 }, { sparks: 10 }] },
  // Towns
  { id: 'neighbour', group: 'Towns', name: 'Neighbourly', icon: '👋', desc: 'Meet towns (all generations).', stat: 'towns', tiers: [5, 20, 50],
    rewards: [{ coins: 150, cosmetic: 'flag_red' }, { sparks: 4 }, { sparks: 12 }] },
  { id: 'haggler', group: 'Towns', name: 'Window Shopper', icon: '🛍️', desc: 'Buy blueprints from town workshops.', stat: 'bought', tiers: [3, 10, 25],
    rewards: [{ coins: 150 }, { sparks: 3 }, { sparks: 10 }] },
  // Biomes
  { id: 'wayfarer', group: 'Biomes', name: 'Wayfarer', icon: '🗺️', desc: 'Discover biomes.', stat: 'biomes', tiers: [5, 10, 20],
    rewards: [{ coins: 150 }, { sparks: 4 }, { cosmetic: 'flag_rainbow', sparks: 10 }] },
  { id: 'carto', group: 'Biomes', name: 'Cartographer', icon: '🌍', desc: 'Discover every single biome.', stat: 'allBiomes', tiers: [1],
    rewards: [{ sparks: 25 }] },
  { id: 'postcards', group: 'Biomes', name: 'Postcard Collector', icon: '💌', desc: 'Collect postcards.', stat: 'postcards', tiers: [10, 30, 75],
    rewards: [{ coins: 150 }, { sparks: 4 }, { sparks: 12 }] },
  // Landmarks
  { id: 'sights', group: 'Landmarks', name: 'Sightseer', icon: '🗿', desc: 'Visit landmarks (all generations).', stat: 'landmarks', tiers: [10, 40, 120],
    rewards: [{ coins: 150 }, { sparks: 4 }, { sparks: 10 }] },
  { id: 'curious', group: 'Landmarks', name: 'Curious Soul', icon: '❓', desc: 'Visit different kinds of landmark.', stat: 'landmarkKinds', tiers: [5, 10, 16],
    rewards: [{ coins: 150 }, { bonus: { kind: 'luck', amt: 0.1 } }, { sparks: 15 }] },
  // Generations
  { id: 'keys', group: 'Generations', name: 'Passing the Keys', icon: '🔑', desc: 'Retire a house and start a new generation.', stat: 'retirements', tiers: [1, 3, 5],
    rewards: [{ cosmetic: 'flag_family', sparks: 2 }, { sparks: 6 }, { cosmetic: 'paint_gold', sparks: 15 }] },
  { id: 'fortune', group: 'Generations', name: 'Family Fortune', icon: '✨', desc: 'Earn Legacy Sparks.', stat: 'sparks', tiers: [25, 150, 500],
    rewards: [{ coins: 300 }, { bonus: { kind: 'offlineCap', amt: 1 } }, { bonus: { kind: 'yield', amt: 0.05 } }] },
  { id: 'heirloom', group: 'Generations', name: 'Heirloom Collection', icon: '🕰️', desc: 'Buy Legacy upgrade ranks.', stat: 'perks', tiers: [3, 10, 24],
    rewards: [{ coins: 300 }, { sparks: 5 }, { sparks: 20 }] },
  // Offline
  { id: 'welcome', group: 'Offline', name: 'Welcome Home', icon: '🏠', desc: 'Come back after time away.', stat: 'awayHours', tiers: [1, 4, 8], unit: 'h',
    rewards: [{ coins: 100 }, { bonus: { kind: 'offlineMul', amt: 0.03 } }, { sparks: 6 }] },
  { id: 'door', group: 'Offline', name: 'Open Door', icon: '🚪', desc: 'Welcome visitors to the house.', stat: 'visitors', tiers: [3, 15, 40],
    rewards: [{ cosmetic: 'trinket_pinwheel' }, { sparks: 4 }, { sparks: 10 }] },
  { id: 'cat', group: 'Offline', name: 'Purr-manent Resident', icon: '🐈', desc: 'Get adopted by a cat.', stat: 'cat', tiers: [1],
    rewards: [{ bonus: { kind: 'comfort', amt: 1 } }] },
  { id: 'coffee', group: 'Offline', name: 'Morning Person', icon: '☕', desc: 'Enjoy a morning coffee (no streaks, ever).', stat: 'coffees', tiers: [1, 7, 30],
    rewards: [{ coins: 50 }, { sparks: 2 }, { sparks: 6 }] },

  // Firsts — the small one-time moments that make the opening hour feel alive.
  // These are family-level (they persist across generations) and deliberately tiny.
  { id: 'first_light', group: 'Journey', name: 'First Light', icon: '🌅', desc: 'See your first day through.', stat: 'days', tiers: [1], unit: 'day',
    rewards: [{ coins: 25 }] },
  { id: 'first_glean', group: 'Harvest', name: 'First Glean', icon: '🌾', desc: 'Harvest your first node.', stat: 'harvested', tiers: [1],
    rewards: [{ coins: 20 }] },
  { id: 'first_coin', group: 'Harvest', name: 'First Coin', icon: '🪙', desc: 'Earn your first coin on the road.', stat: 'earned', tiers: [1],
    rewards: [{ coins: 10 }] },
  { id: 'first_town', group: 'Towns', name: 'First Post', icon: '🏘️', desc: 'Meet your first town.', stat: 'towns', tiers: [1],
    rewards: [{ coins: 30 }] },
  { id: 'first_blueprint', group: 'Home', name: 'Market Find', icon: '📐', desc: 'Buy your first blueprint from a town workshop.', stat: 'bought', tiers: [1],
    rewards: [{ coins: 25 }] },
  { id: 'first_critter', group: 'Critters', name: 'Firm Hello', icon: '🐾', desc: 'Bonk your first critter.', stat: 'kills', tiers: [1],
    rewards: [{ coins: 20 }] },
  { id: 'first_breakdown', group: 'Home', name: 'Tough Bumps', icon: '🩹', desc: 'Survive your first breakdown. The house always recovers.', stat: 'breakdowns', tiers: [1],
    rewards: [{ coins: 30 }] },
  { id: 'first_postcard', group: 'Biomes', name: 'Wish You Were Here', icon: '💌', desc: 'Collect your first postcard.', stat: 'postcards', tiers: [1],
    rewards: [{ coins: 25 }] },
  { id: 'first_landmark', group: 'Landmarks', name: 'The Old Light', icon: '🗿', desc: 'Visit your first landmark.', stat: 'landmarkKinds', tiers: [1],
    rewards: [{ coins: 30 }] },
  { id: 'first_visitor', group: 'Offline', name: 'Someone at the Door', icon: '🚪', desc: 'Welcome your first visitor.', stat: 'visitors', tiers: [1],
    rewards: [{ coins: 25 }] },
];
