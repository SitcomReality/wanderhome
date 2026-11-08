# Wanderhome content & modding guide

All game content is plain, typed data in this folder. Each file is a list you can add to
without touching the engine. Your editor autocompletes every field (see `types.ts`), and the
registry (`index.ts`) prints a console warning for any id that doesn't resolve.

| File | What it holds |
|---|---|
| `resources.ts` | Everything you can carry/trade (`id, name, icon, color, base value, tier, found`) |
| `grounds.ts` | Ground types (sand, mud, snow…). Locomotion speeds are set per ground |
| `biomes.ts` | Biomes: band, climate point or patch rule, ground, texture, node spawns, trade goods, weather |
| `nodes.ts` | Harvestable world objects: a drawing `shape` + `colors` palette + resource |
| `mobs.ts` | Critters: shape, stats, biomes, drops, night-only/swimming/flying |
| `landmarks.ts` | Points of interest: rewards, buffs, rumours, map reveals |
| `locomotion.ts` | Wheels, legs, fins… speed per ground |
| `frames.ts` | Chassis floors |
| `parts/*.ts` | Vehicle modules, one file per category |
| `legacy.ts` | Family upgrades (Legacy Sparks), inheritance cards, cosmetics, Scrapbook rewards, retirement requirement |
| `milestones.ts` | Achievements: group, tiers, rewards. `stat` keys are computed in `game/family/milestones.ts → statValue` |
| `visitors.ts` | Cozy visitor event types, weights and how long they linger |
| `flavor.ts` | Scrapbook descriptions, postcard lines, cat names, crew, letters, welcome-back lines |

## Recipes

**A new resource:** add a line to `resources.ts`. It appears automatically in Stores, markets,
journals and auto-sell. To make it findable, give some node `res: 'yourId'` or a `find`, or
make a mob `drop` it.

**A new tree/rock/mushroom:** add a node reusing a shape with a new palette:
```ts
{ id: 'cherry_tree', shape: 'tree', colors: ['#5a3a2a', '#d46a9a', '#f29ac0', '#ffd0e4', ''], res: 'wood', hp: 6 }
```
Then reference it in a biome's `nodes`: `['cherry_tree', 0.1]`.

**A new biome:**
```ts
{ id: 'cherry', name: 'Cherry Hills', band: 'land', climate: { temp: 0.2, moist: 0.2 },
  color: [130, 170, 100], jitter: 12, ground: 'firm', tags: ['fertile', 'wooded'],
  texture: { style: 'grass', specks: [['#ffb3d1', 0.03]] },
  nodes: [['cherry_tree', 0.15], ['flower', 0.02]],
  goods: { cheap: ['wood'], dear: ['iron'] }, ambient: { kind: 'petals', rate: 5, color: '#ffc0d8' } }
```
Climate biomes compete by nearest `climate` within their band. For rare splotches, use
`patch: { seed, scale, threshold, temp?: [min,max], moist?: [min,max] }`. Because every
locomotion is defined per *ground*, a new biome works with all vehicles right away. Its tags
also make it pick up any shop or landmark that targets `'#fertile'` etc.

**A new vehicle part:** add an object to the right `parts/*.ts` file. Give it a `shop` to make
it a blueprint sold in matching towns (`where: ['desert', '#cold']`, tier 1–3), or leave `shop`
off to make it a starter part. Set `art: 'steam'` to borrow an existing part's drawing.
Without that, it gets a generic coloured drawing for its category. Supported behaviours are
the optional fields on `ModuleDef` (power, burns, cargo, harvest, weapon, process, comfort…).

**A new landmark:** add to `landmarks.ts` with an existing `shape`, `where`, `weight` and some
`reward`/`buff`/`rumor`/`reveal`.

## Content packs
You can also add or override content from a separate file without editing the base lists.
Items with an existing `id` replace the original:
```ts
// src/content/packs/myPack.ts
import { registerContent } from '..';
registerContent({ resources: [...], nodes: [...], biomes: [...], modules: [...] });
```
Then import the pack once at the top of `src/main.tsx` (before the game starts).

## Where the behaviour lives (for new mechanics)
- New node **shapes**: `game/art/nodeArt.ts`. New landmark shapes: `game/art/landmarkArt.ts`.
- New mob shapes: `game/art/mobArt.ts`. Locomotion art: `game/art/locoArt.ts`. New part art: add an entry to `game/art/parts/<category>.ts` (keyed by part id). Parts without one get a generic drawing.
- New texture styles: `game/world/textures.ts`. New weapon kinds: `game/sim/weapons.ts` → `updateWeapons`.
- Placement synergies (hot/cold/noisy/edge): `game/vehicleStats.ts`.

## Family systems (Legacy, Scrapbook, Milestones, Visitors)
- Persistent family data lives in `game/family/meta.ts` under its own localStorage key, so it survives retirement.
- A new milestone is one entry in `milestones.ts`. A new stat needs one `case` in `statValue()` (game/family/milestones.ts).
- A new legacy upgrade with an existing bonus kind works with no code changes. New cosmetics need a few lines in `drawHouseExtras` (game/art/houseArt.ts).
- Scrapbook pages are generated from the existing content lists, so new biomes, critters, landmarks and parts appear automatically.
- New visitor kinds need a `case` in `spawnVisitor`/`resolveVisitor` (game/family/visitors.ts) and buttons in `components/family/VisitorCard.tsx`.
- Save versions: `game/saveTransfer.ts → migrateRunSave` upgrades older run saves. Add a step there when the save format changes.
