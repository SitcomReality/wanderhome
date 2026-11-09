# Architecture

Wanderhome is a React shell around a mutable simulation. `Game` owns all run state; focused
modules mutate it once per tick; React reads it and draws HUD/modals over a single Canvas 2D
world. All game data lives in typed lists under `src/content/`.

## The two state layers

| Layer | Owner | Lifetime | Storage |
| --- | --- | --- | --- |
| **Run** | one `Game` instance | one house, until retirement or abandonment | `wanderhaus-save-v1` |
| **Family** | the `meta` singleton in `game/family/meta.ts` | forever, across generations | `wanderhaus-meta-v1` |

The run holds the seed, vehicle, grid, cargo, coins, towns, and run stats. The family holds
generation, Legacy Sparks, perks, Scrapbook, postcards, milestones, cosmetics, and lifetime
totals. Retiring folds the run into the family and creates a new `Game`; the family survives.

## Runtime lifecycle

```
main.tsx
  └ App.tsx
      ├ bootGame()             load + migrate the run save, or build a fresh preview world
      ├ TitleScreen            preview renders; legacyOn = false; nothing is written
      ├ start / continue ────► game.beginPlay()    legacyOn = true; offline clock resets
      ├ useGameLoop()          rAF: game.update(dt) → game.render(ctx)
      └ useSessionKeeper()     200 ms HUD tick, 10 s autosave, tab-away offline credit
```

- `bootGame()` is memoised so React StrictMode's double-invoked initialiser cannot build two
  games (and credit offline time twice).
- `beginPlay()` is the switch between preview and real play.
- `useSessionKeeper` saves on hide/unload and routes tab-away time through
  `applyOfflineProgress`.
- Hotkeys and canvas clicks are forwarded to `Game` methods; React never runs simulation.
- `useGameLoop` sets `window.__APP_READY__` after the first rendered frame. The browser
  harness and screenshots depend on it.

## Tick order

`Game.update(dt)` clamps `dt` to 0.1 s, advances `game.time`, then runs:

1. once-per-second upkeep: expire buffs, relax town saturation
2. 10 s income-rate sampling
3. refresh nearby-town and nearby-node caches
4. `Driving` → `Avatar` → `Harvest` → `Weapons` → `Critters` → projectiles → pickups →
   processing → `Exploration` → docking → effects → camera
5. `legacyTick` (only when `legacyOn`): biome discovery, lifetime records, crew, milestones,
   visitors

`useGameLoop` then calls `Game.render()`, which draws the world, the house, and effects;
`Minimap.tsx` maintains and paints the minimap separately. React UI updates on the 200 ms
session tick, not per frame.

## File map

Root files: `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`,
`webgame.config.json`, plus `AGENTS.md`, `README.md`, and `docs/`.

```
src/
  main.tsx                  React root
  App.tsx                   owns the live Game, title state, open modal; composes screens
  index.css                 Tailwind import + global keyframes
  app/                      session plumbing
    bootGame.ts               load/migrate save or create a preview world
    useGameLoop.ts            rAF loop, canvas resize, __APP_READY__ hook
    useSessionKeeper.ts       200 ms UI tick, autosave, visibility/offline handling
    useHotkeys.ts             menu keys + movement/action forwarding
  content/                  ALL game data; plain typed lists (see content/MODDING.md)
    types.ts                  content interfaces
    registry.ts               lookup tables, validation, registerContent()
    helpers.ts                queries: biome matching, prices, cost expansion
    resources.ts              carryable/tradeable resources
    grounds.ts                ground types
    biomes.ts                 biomes, bands, climate/patch rules, tags
    nodes.ts                  harvestable world objects
    mobs.ts                   critters
    landmarks.ts              points of interest and rewards
    locomotion.ts             wheels/legs/fins per-ground speed
    frames.ts                 chassis floors
    parts/                    vehicle modules, one file per category
                              (cargo, comfort, defense, harvest, power, processing, weapons)
    legacy.ts                 Legacy upgrades, inheritance, cosmetics, retire requirement
    milestones.ts             achievement definitions
    visitors.ts               visitor events
    flavor.ts                 scrapbook/postcard/letter text
    index.ts                  barrel re-export
    MODDING.md                content recipes
  game/
    engine.ts                 Game class: run state, update order, thin delegators
    core/                     shared types, constants, math, formatting
      constants.ts              SAVE_KEY, DAY, CELL, zeroRes, nominalSpeed
      types.ts                  simulation types (Mob, Town, Settings, …)
      math.ts                   angle helpers
      format.ts                 number formatting
    sim/                      one behaviour per file
      driving.ts                engine power, throttle, autopilot, stuck recovery
      navigation.ts             pathing, reachability, trade runs
      plan.ts                   build goals, collection limits, plan-aware sell floor
      avatar.ts                 walking inside/outside the house
      harvest.ts                hitting nodes, pickups, processing
      weapons.ts                firing, damage, explosions
      critters.ts               mob spawning and AI
      towns.ts                  docking, prices, stock, blueprints, rumours
      exploration.ts            landmark visits and buffs
      effects.ts                particles, popups, camera shake
      input.ts                  keys, clicks, waypoints, zoom
      workshop.ts               place/remove parts, build locomotion/frames, expand
      persistence.ts            save/applySave
      offline.ts                the single away-time credit path
    render/                   per-frame drawing
      worldRender.ts            world, nodes, towns, effects
      vehicleRender.ts          the house and parts
      minimap.ts                minimap canvas
    art/                      procedural drawings, no assets
      primitives.ts             low-level shapes
      nodeArt.ts / landmarkArt.ts / mobArt.ts / townArt.ts
      houseArt.ts / locoArt.ts / frameArt.ts / turretArt.ts / avatarArt.ts
      postcardArt.ts / moduleArt.ts / partIcon.ts
      parts/<category>.ts       per-part artwork, keyed by part id (cargo, comfort, core,
                                defense, harvest, power, processing, weapons) + types.ts
    world/                    procedural world
      world.ts                  World: chunks, terrain, towns, landmarks, spawning
      noise.ts                  seeded hash/noise helpers
      textures.ts               ground texture painting
    family/                   persistent family systems
      meta.ts                   meta singleton, save/load/normalize, perks
      bonuses.ts                derived permanent multipliers and rewards
      scrapbook.ts              discovery book + rewards
      milestones.ts             stat values and achievement checks
      retirement.ts             retire, fold, inheritance, new-run perks
      familyTick.ts             once-a-second family bookkeeping
      visitors.ts               spawn/resolve visitor events
      coffee.ts                 morning coffee gift
      toasts.ts                 toast queue
      util.ts                   family helpers
      index.ts                  barrel
    vehicleStats.ts           grid placement synergies → derived Stats
    saveTransfer.ts           export/import + run-save version migration
    sfx.ts                    WebAudio blips
  components/               React UI (Tailwind classes, no CSS modules)
    common/                   ui.tsx (kit), PartInfo.tsx (part traits)
    hud/                      HUD.tsx, Minimap.tsx, Toggle.tsx, VehiclePanel.tsx
    workshop/                 Workshop.tsx, Workbench.tsx, ChassisTab.tsx, PartsTab.tsx,
                              LeadsTab.tsx, Inspector.tsx, SpecSheet.tsx, StatRow.tsx,
                              PinCard.tsx, util.ts
    town/                     TownPanel.tsx, Stores.tsx (Supplies & Plans)
    family/                   FamilyPanel.tsx, FamilyShelf.tsx, FamilyUpgrades.tsx,
                              HouseStyle.tsx, InheritancePick.tsx, Memories.tsx,
                              RunSummary.tsx, Toasts.tsx, VisitorCard.tsx
    settings/                 Settings.tsx, SaveTransfer.tsx, ResetSave.tsx
    screens/                  TitleScreen.tsx, OfflineReport.tsx
  utils/cn.ts               className merge helper
test/
  firsts.mjs                harness scenario: first-postcard toast
```

Generated or local-only: `dist/` (single-file build), `.artifacts/` (browser runs),
`node_modules/`. All are gitignored.

## Data flow

1. **Content** lists are imported once; `content/registry.ts` rebuilds lookup tables
   (`RES_INFO`, `BIOME`, `MOD`, …) and validates cross-references with console warnings.
2. **Construction**: `new Game(seed[, save])` builds a `World`, applies a save or the starter
   grid, computes derived `Stats`, and syncs the Scrapbook.
3. **Simulation**: `Game.update()` calls systems that mutate `Game`. UI and other systems call
   the thin delegators on `Game` (`game.sell()`, `game.placeModule()`, `game.render()`).
4. **UI**: `App` owns the live `Game`; panels receive `game` plus the 200 ms `tick` and call
   `game.*` from event handlers.
5. **Persistence**: `game.save()` writes the run and calls `saveMeta()`; `bootGame()` restores
   both. See [saves.md](saves.md).

## Invariants

- **Content ids are save data.** Saved grids, locomotion/frame ids, pins, rumours, and known
  blueprints reference content ids. Renaming or removing one requires a mapping in
  `migrateRunSave()`/`applySave()`.
- **One offline path.** Away time is credited only by `applyOfflineProgress`, which tracks
  `game.offlineClock` so a span cannot be credited twice. See [saves.md](saves.md).
- **Preview is inert.** Family events (discoveries, postcards, milestones, visitors) only run
  after `game.beginPlay()`. The title-screen world never records them.
- **One-shot guards.** `foldRunIntoLifetime` is guarded by `game.folded`; `doRetire` by
  `game.retired`; runs that were never played don't count (`game.played`).
- **Frame time is bounded.** `update()` clamps `dt` to 0.1 s so a background tab cannot
  teleport the simulation.
- **The build is self-contained.** No network requests, external fonts, or image assets at
  runtime; the static check and smoke test fail if they find one.
- **Derived stats are recomputed, not trusted.** `applySave()` filters invalid ids and
  recomputes `Stats`; old or damaged saves must degrade, never crash.

## Where to add a feature

| Change | Start here |
| --- | --- |
| New resource/biome/node/mob/landmark/part/milestone | The matching list in `src/content/`; see `MODDING.md` |
| New content shape or weapon kind | `game/art/` or `game/sim/weapons.ts`; data alone cannot add behaviour |
| New simulation behaviour | New file in `game/sim/`, call it from `Game.update()`, add a delegator if UI needs it |
| New part statistic or placement synergy | `game/vehicleStats.ts` (and the `ModuleDef` field in `content/types.ts`) |
| New family/persistent system | New module in `game/family/`, hook `legacyTick`, extend `Meta` + `normalizeMeta` |
| New saved field | `sim/persistence.ts`, `saveTransfer.ts` (bump version + migration) |
| New screen or panel | `components/`, `ModalKind` in `hud/HUD.tsx`, render it in `App.tsx` |
| New visual effect/art | `game/art/` or `game/render/`; draw it, don't ship an asset |
