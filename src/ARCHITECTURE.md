# Wanderhome code map

Entrypoints have generic names; everything else is named for what it does.

```
main.tsx                 React root
App.tsx                  which Game is live, which overlay is open; composes screens
app/                     session plumbing: bootGame (load/migrate), useGameLoop, useSessionKeeper
                         (autosave, tab-return offline credit), useHotkeys
content/                 ALL game data (see content/MODDING.md); index.ts is the barrel,
                         registry.ts builds lookup tables, helpers.ts has small queries
game/engine.ts           Game class: run state + update() tick; thin delegators into ↓
game/core/               shared types, constants, math, number formatting
game/sim/                one file per behaviour: driving, navigation, avatar, harvest, weapons,
                         critters, towns, exploration, effects, input, workshop, persistence, offline
game/render/             worldRender (one frame), vehicleRender (the house), minimap
game/art/                procedural drawings: primitives, nodes, landmarks, mobs, towns, avatar,
                         locomotion, frames, turrets, postcards, house cosmetics;
                         art/parts/<category>.ts holds per-part artwork (registry in art/parts/index.ts)
game/world/              world generation (biomes, chunks, towns, landmarks), noise, ground textures
game/family/             persistent family systems: meta (own save key), scrapbook, milestones,
                         retirement, bonuses, visitors, coffee, toasts, familyTick; index.ts is the barrel
game/vehicleStats.ts     part placement synergies → derived vehicle stats
game/saveTransfer.ts     export / import / save-version migration
game/sfx.ts              WebAudio blips
components/              common/ (ui kit, part traits), hud/, workshop/, town/, family/,
                         settings/ (incl. ResetSave), screens/ (title, welcome-back)
```

Invariants worth knowing:
- Away time is only ever credited through `game/sim/offline.ts → applyOfflineProgress`, which tracks
  `game.offlineClock` so the same span can't be credited twice and re-snapshots the income sampler.
- Family memories (Scrapbook, postcards, milestones, visitors) only run after `game.beginPlay()`;
  the preview world behind the title screen never writes them.
- A run is folded into lifetime totals once (`foldRunIntoLifetime`, guarded by `game.folded`);
  `doRetire` is guarded by `game.retired`.
