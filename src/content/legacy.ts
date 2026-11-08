import type { Cost } from './types';

/**
 * LEGACY CONTENT: permanent family upgrades (bought with Legacy Sparks), inheritance cards,
 * cosmetics and Scrapbook completion rewards. All of this persists across generations.
 */

/** Permanent bonus kinds. Shared by legacy upgrades and milestone rewards. */
export type BonusKind = 'yield' | 'speed' | 'comfort' | 'luck' | 'cargo' | 'offlineCap' | 'offlineMul';

export interface LegacyUpgradeDef {
  id: string; name: string; icon: string; desc: string;
  /** spark cost for rank 1, 2, 3 */
  costs: [number, number, number];
  /** a bonus kind (value per rank, cumulative), or a special new-run effect */
  effect: BonusKind | 'supplies' | 'blueprints';
  /** total value at rank 1/2/3 (for bonus kinds & blueprints) */
  values: [number, number, number];
  /** label for a value, e.g. (v) => `+${v * 100}% yield` */
  fmt: (v: number) => string;
  /** for 'supplies': what you start with at each rank */
  supplies?: [Cost, Cost, Cost];
}

export const LEGACY_UPGRADES: LegacyUpgradeDef[] = [
  { id: 'supplies', name: 'Starting Supplies', icon: '🧺', desc: 'Every new house starts with a packed hamper.', costs: [3, 8, 18], effect: 'supplies', values: [1, 2, 3], fmt: () => '',
    supplies: [{ coins: 150, wood: 20, stone: 20 }, { coins: 400, wood: 40, stone: 40, iron: 15 }, { coins: 900, wood: 60, stone: 60, iron: 30, rope: 10, metal: 5 }] },
  { id: 'yield', name: 'Green Thumbs', icon: '🌱', desc: 'Your family just knows where the good stuff grows.', costs: [4, 10, 22], effect: 'yield', values: [0.1, 0.22, 0.36], fmt: (v) => `+${Math.round(v * 100)}% harvest yield` },
  { id: 'speed', name: 'Well-Oiled Axles', icon: '🛞', desc: 'Grandpa\'s secret grease recipe.', costs: [4, 10, 22], effect: 'speed', values: [0.06, 0.13, 0.21], fmt: (v) => `+${Math.round(v * 100)}% speed` },
  { id: 'comfort', name: 'Family Heirlooms', icon: '🕰️', desc: 'Old quilts, a cuckoo clock, a lumpy armchair. Pure comfort.', costs: [3, 8, 18], effect: 'comfort', values: [2, 5, 9], fmt: (v) => `+${v} comfort` },
  { id: 'blueprints', name: 'Inherited Blueprints', icon: '📐', desc: 'A dog-eared folder of designs, passed down.', costs: [5, 12, 26], effect: 'blueprints', values: [1, 2, 3], fmt: (v) => `start with ${v} random blueprint${v > 1 ? 's' : ''}` },
  { id: 'luck', name: 'Lucky Charm', icon: '🍀', desc: 'A four-leaf clover pressed in the logbook.', costs: [4, 10, 22], effect: 'luck', values: [0.2, 0.45, 0.75], fmt: (v) => `+${Math.round(v * 100)}% rare finds` },
  { id: 'offline', name: 'Long Naps', icon: '💤', desc: 'The house knows how to keep busy while you\'re away.', costs: [3, 8, 18], effect: 'offlineCap', values: [2, 4, 6], fmt: (v) => `+${v}h away cap & +${v * 2.5}% away earnings` },
  { id: 'cargo', name: 'Deep Pockets', icon: '🎒', desc: 'Every nook becomes a cubby.', costs: [3, 8, 18], effect: 'cargo', values: [25, 60, 110], fmt: (v) => `+${v} cargo` },
];

// ---------------------------------------------------------------- inheritance cards
export interface InheritanceDef {
  id: string; name: string; icon: string; desc: string;
  coins?: number; res?: Cost; blueprints?: string[]; randomBlueprints?: number;
  /** parts installed into empty cells, if there's room */
  install?: string[]; revealTowns?: number;
  buff?: { id: string; name: string; icon: string; stat: 'speed' | 'yield' | 'regen' | 'luck' | 'damage'; mult: number; duration: number };
}
export const INHERITANCES: InheritanceDef[] = [
  { id: 'savings', name: 'Family Savings', icon: '🫙', desc: 'A jar of coins hidden under the floorboards.', coins: 350 },
  { id: 'toolbox', name: "Grandma's Toolbox", icon: '🧰', desc: 'Her trusty buzzsaw design and a bag of ore.', blueprints: ['saw'], res: { iron: 20 } },
  { id: 'seedtin', name: 'Seed Tin', icon: '🪴', desc: 'Two potted plants and a sack of fiber.', install: ['plant', 'plant'], res: { fiber: 30 } },
  { id: 'map', name: 'Dog-eared Map', icon: '🗺️', desc: 'Marks four nearby towns in your journal.', revealTowns: 4 },
  { id: 'larder', name: 'Full Larder', icon: '🥫', desc: 'Shelves stacked with building basics.', res: { wood: 60, stone: 60, fiber: 40 } },
  { id: 'hamster', name: 'Hamster Dynasty', icon: '🐹', desc: 'A descendant of the original hamster joins the crew.', install: ['hamster'] },
  { id: 'locket', name: 'Lucky Locket', icon: '📿', desc: 'Lucky finds ×2 for the first 30 minutes.', buff: { id: 'locket', name: 'Lucky Locket', icon: '📿', stat: 'luck', mult: 2, duration: 1800 } },
  { id: 'boiler', name: "Uncle's Old Boiler", icon: '♨️', desc: 'A rusty steam boiler, installed, plus firewood.', install: ['steam'], res: { wood: 40 } },
  { id: 'sailkit', name: "Sailor's Kit", icon: '⛵', desc: 'A sail design and a coil of rope.', blueprints: ['sail'], res: { rope: 10 } },
  { id: 'folder', name: 'Mystery Folder', icon: '📁', desc: 'Two random blueprints from a forgotten workshop.', randomBlueprints: 2 },
];

// ---------------------------------------------------------------- cosmetics
export type CosmeticKind = 'paint' | 'flag' | 'trinket';
export interface CosmeticDef { id: string; kind: CosmeticKind; name: string; color: string; color2?: string; hint: string }
export const COSMETICS: CosmeticDef[] = [
  { id: 'paint_none', kind: 'paint', name: 'Bare Wood', color: '', hint: 'Default' },
  { id: 'paint_mint', kind: 'paint', name: 'Mint Trim', color: '#7fe0b8', hint: 'Milestone: Rolling Along' },
  { id: 'paint_rose', kind: 'paint', name: 'Rose Trim', color: '#ff8fab', hint: 'Milestone: Cozy Corner' },
  { id: 'paint_midnight', kind: 'paint', name: 'Midnight Trim', color: '#4a5aa8', hint: 'Scrapbook: Critters 75%' },
  { id: 'paint_gold', kind: 'paint', name: 'Gilded Trim', color: '#f5c542', hint: 'Milestone: Passing the Keys (gold)' },
  { id: 'flag_none', kind: 'flag', name: 'No Flag', color: '', hint: 'Default' },
  { id: 'flag_red', kind: 'flag', name: 'Red Pennant', color: '#e74c3c', hint: 'Milestone: Neighbourly' },
  { id: 'flag_sky', kind: 'flag', name: 'Sky Banner', color: '#7fd1e8', color2: '#ffffff', hint: 'Scrapbook: Biomes 50%' },
  { id: 'flag_rainbow', kind: 'flag', name: 'Rainbow Streamer', color: 'rainbow', hint: 'Milestone: Wayfarer (gold)' },
  { id: 'flag_family', kind: 'flag', name: 'Family Crest', color: '#8e44ad', color2: '#ffd166', hint: 'Milestone: Passing the Keys' },
  { id: 'trinket_none', kind: 'trinket', name: 'Nothing', color: '', hint: 'Default' },
  { id: 'trinket_gnome', kind: 'trinket', name: 'Garden Gnome', color: '#e74c3c', hint: 'Scrapbook: Landmarks 25%' },
  { id: 'trinket_bobble', kind: 'trinket', name: 'Dashboard Bobblehead', color: '#ffd166', hint: 'Milestone: Cozy Corner (silver)' },
  { id: 'trinket_pinwheel', kind: 'trinket', name: 'Pinwheel', color: '#7fd1e8', hint: 'Milestone: Open Door' },
  { id: 'trinket_cactus', kind: 'trinket', name: 'Tiny Cactus', color: '#2e8b57', hint: 'Scrapbook: Resources 50%' },
];
export const DEFAULT_COSMETICS = ['paint_none', 'flag_none', 'trinket_none'];

// ---------------------------------------------------------------- scrapbook
export type BookCat = 'biomes' | 'resources' | 'critters' | 'landmarks' | 'towns' | 'blueprints';
export const BOOK_CATS: { id: BookCat; name: string; icon: string }[] = [
  { id: 'biomes', name: 'Biomes', icon: '🗺️' },
  { id: 'resources', name: 'Resources', icon: '🪵' },
  { id: 'critters', name: 'Critters', icon: '🐾' },
  { id: 'landmarks', name: 'Landmarks', icon: '🗿' },
  { id: 'towns', name: 'Towns', icon: '🏘️' },
  { id: 'blueprints', name: 'Blueprints', icon: '📐' },
];
/** towns are endless, so the Towns page is "complete" at this many */
export const TOWN_BOOK_TARGET = 30;
export interface BookReward { coins?: number; sparks?: number; cosmetic?: string }
/** rewards at 25 / 50 / 75 / 100 % completion, per category */
export const BOOK_REWARDS: Record<BookCat, [BookReward, BookReward, BookReward, BookReward]> = {
  biomes: [{ coins: 150 }, { sparks: 3, cosmetic: 'flag_sky' }, { coins: 800 }, { sparks: 15 }],
  resources: [{ coins: 120 }, { sparks: 3, cosmetic: 'trinket_cactus' }, { coins: 700 }, { sparks: 12 }],
  critters: [{ coins: 120 }, { sparks: 3 }, { coins: 600, cosmetic: 'paint_midnight' }, { sparks: 12 }],
  landmarks: [{ coins: 150, cosmetic: 'trinket_gnome' }, { sparks: 3 }, { coins: 800 }, { sparks: 15 }],
  towns: [{ coins: 150 }, { sparks: 3 }, { coins: 800 }, { sparks: 12 }],
  blueprints: [{ coins: 200 }, { sparks: 4 }, { coins: 1000 }, { sparks: 18 }],
};

/** What it takes before "Retire this house" unlocks (tuned for ~30–60 min first run).
 *  Uses coins EARNED this run (not net worth), so spending on your house never sets you back. */
export const RETIRE_REQ = { earned: 1200, biomes: 3 };
