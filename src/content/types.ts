/**
 * Content type definitions.
 * Every list in /src/content is typed against these interfaces, so your editor will
 * autocomplete fields and flag typos. Ids are plain strings: add a new id in one file
 * and reference it from any other. The registry (index.ts) warns in the console about
 * any reference that doesn't resolve.
 */

export type ResId = string;
export type BiomeId = string;
export type GroundId = string;
export type NodeId = string;
export type Tier = 'common' | 'uncommon' | 'rare' | 'epic' | 'refined';

/** A thing you can carry, trade and build with. */
export interface ResourceDef {
  id: ResId; name: string; icon: string; color: string;
  /** base trade value in coins (before biome/town modifiers) */
  base: number; tier: Tier;
  /** shown in the Stores panel as a hint */
  found: string;
}

/** Ground types decide how fast each locomotion moves. Biomes pick one ground. */
export interface GroundDef { id: GroundId; name: string; color: string }

// ---------------------------------------------------------------- biomes
/** Elevation band. The world picks a band from height, then the closest biome in that band by climate. */
export type Band = 'deep' | 'shallow' | 'shore' | 'land' | 'high' | 'summit';
export type TextureStyle = 'plain' | 'water' | 'grass' | 'sand' | 'rock' | 'peak' | 'snow' | 'swamp' | 'crystal' | 'cracked' | 'ash' | 'stripes';
export type AmbientKind = 'snow' | 'leaves' | 'petals' | 'ash' | 'sand' | 'fireflies' | 'spores' | 'bubbles' | 'mist';
export interface AmbientDef { kind: AmbientKind; /** particles per second */ rate: number; color?: string; /** only after dusk */ night?: boolean }
/** [nodeId, chance per tile, options]. `rich` scales the chance up the farther you are from home. */
export type NodeSpawn = [node: NodeId, chance: number, opts?: { rich?: boolean; minDist?: number }];

export interface BiomeDef {
  id: BiomeId; name: string; band: Band;
  /** temperature & moisture, each roughly -1..1. The biome nearest to the local climate wins within its band. */
  climate?: { temp: number; moist: number };
  /** Patch biomes override 'land' wherever their own noise exceeds `threshold` (and the climate fits the ranges). */
  patch?: { seed: number; scale: number; threshold: number; temp?: [number, number]; moist?: [number, number] };
  color: [number, number, number]; jitter: number;
  ground: GroundId;
  /** free-form tags. Shops and landmarks can target '#tag' instead of listing biome ids. */
  tags?: string[];
  texture: { style: TextureStyle; /** [hex color, chance per pixel] */ specks?: [string, number][] };
  nodes: NodeSpawn[];
  /** resources this biome's towns buy cheaply / pay a premium for */
  goods?: { cheap: ResId[]; dear: ResId[] };
  /** wind exposure for sails (1 = open) */ wind?: number;
  /** walking speed multiplier for your avatar */ walk?: number;
  noWalk?: boolean; noTowns?: boolean;
  /** extra mob ids that spawn here (mobs can also list biomes themselves) */
  mobs?: string[];
  ambient?: AmbientDef;
}

// ---------------------------------------------------------------- world nodes
export type NodeShape =
  | 'tree' | 'bigtree' | 'pine' | 'palm' | 'dead' | 'bush' | 'flower' | 'grass' | 'cactus' | 'drift'
  | 'rock' | 'crystal' | 'pool' | 'ruin' | 'dune' | 'vent' | 'clam' | 'meteor' | 'hive' | 'mushroom'
  | 'bones' | 'skull' | 'coral' | 'web';
export interface NodeDef {
  id: NodeId; shape: NodeShape;
  /** colour palette; the meaning of each slot depends on the shape (see game/nodeArt.ts) */
  colors: string[];
  res: ResId; hp: number;
  /** bonus drop rolled on every hit */
  find?: { res: ResId; chance: number };
  /** night glow colour, e.g. 'rgba(180,120,255,1)' */
  glow?: string;
  scale?: number;
  /** spawns rarely in ANY land biome beyond minDist tiles from home */
  global?: { chance: number; minDist: number };
}

// ---------------------------------------------------------------- mobs
export type MobShape = 'blob' | 'bug' | 'scorp' | 'yeti' | 'wisp' | 'drone' | 'croc' | 'bat' | 'crab' | 'golem' | 'spider' | 'skeleton';
export interface MobDef {
  id: string; name: string; shape: MobShape; color: string;
  hp: number; speed: number; dmg: number; r: number; coins: number;
  biomes: BiomeId[];
  drop?: ResId; flying?: boolean; swims?: boolean; night?: boolean;
  /** won't appear closer than this to home (tiles) */ minDist?: number;
  /** chance per spawn to appear in ANY biome (beyond minDist) */ roam?: number;
}

// ---------------------------------------------------------------- landmarks
export type LandmarkShape =
  | 'stones' | 'statue' | 'skeleton' | 'airship' | 'lighthouse' | 'windmill' | 'hut' | 'shrine' | 'spring'
  | 'ring' | 'obelisk' | 'chest' | 'crater' | 'totem' | 'wreck' | 'camp';
export type BuffStat = 'speed' | 'yield' | 'regen' | 'luck' | 'damage';
export interface BuffDef { id: string; name: string; icon: string; stat: BuffStat; mult: number; /** seconds */ duration: number }
/** Where something appears: 'any', or a list of biome ids and/or '#tags'. */
export type Where = (BiomeId | `#${string}`)[] | 'any';
export interface LandmarkDef {
  id: string; name: string; shape: LandmarkShape; where: Where;
  /** relative pick weight among landmarks that fit the spot */ weight: number;
  minDist?: number; radius: number; colors?: string[];
  /** a random line is logged on each visit */ lines: string[];
  /** given on the first visit only */ reward?: { coins?: [number, number]; res?: Record<ResId, [number, number]> };
  buff?: BuffDef;
  /** whisper a blueprint rumour */ rumor?: boolean;
  /** add towns within this many px to your journal */ reveal?: number;
  /** can be revisited for its buff/rumour after N seconds */ repeat?: number;
}

// ---------------------------------------------------------------- vehicle parts
export type ModCat = 'core' | 'power' | 'cargo' | 'harvest' | 'weapon' | 'defense' | 'process' | 'comfort';
export type Tag = 'noisy' | 'hot' | 'cold' | 'edge' | 'quiet';
export type WeaponKind = 'pea' | 'mg' | 'flame' | 'rocket' | 'tesla' | 'bubble' | 'lob' | 'harpoon' | 'frost';
export type WeaponEffect = 'burn' | 'slow' | 'poison';
export type Cost = Partial<Record<ResId | 'coins', number>>;
/** Parts with a `shop` are learned as blueprints in matching towns. Parts without one are starters. */
export interface Shop { where: Where; /** 1: anywhere, 2: 60+ tiles out, 3: 200+ */ tier: 1 | 2 | 3; price: number }
export const shop = (where: Where, tier: 1 | 2 | 3, price: number): Shop => ({ where, tier, price });

export interface ModuleDef {
  id: string; name: string; cat: ModCat; desc: string; cost: Cost; weight: number; color: string;
  /** reuse another part's artwork (id), handy for mods */ art?: string;
  tags?: Tag[]; shop?: Shop;
  power?: number; burns?: { res: ResId; rate: number }; solar?: boolean; sail?: boolean;
  cargo?: number; hp?: number; regen?: number; comfort?: number; spikes?: number; shield?: number; scare?: number; preserve?: boolean; light?: number;
  harvest?: { range: number; rate: number; power: number; bonus?: ResId[]; bonusMul?: number; magnet?: number; find?: { res: ResId; chance: number }[] };
  weapon?: { kind: WeaponKind; range: number; rate: number; dmg: number; ammo?: { res: ResId; per: number }; splash?: number; effect?: WeaponEffect; color?: string };
  process?: { input: Partial<Record<ResId, number>>; output: Partial<Record<ResId, number>>; every: number; heatLoving?: boolean };
}

export interface LocoDef {
  id: string; name: string; desc: string; cost: Cost; speed: number; weight: number; hp: number;
  /** speed multiplier per ground id; missing = impassable */
  ground: Partial<Record<GroundId, number>>;
  shop?: Shop; art?: string;
}

export type FramePattern = 'planks' | 'weave' | 'rivets' | 'glass' | 'bone' | 'leaf';
export interface FrameDef {
  id: string; name: string; desc: string; cost: Cost;
  /** weight per cell */ wpc: number; /** hull per cell */ hpc: number; /** regen per cell */ rpc?: number;
  comfort?: number; solarMul?: number;
  floor: string; floor2: string; rim: string; pattern: FramePattern; shop?: Shop;
}
