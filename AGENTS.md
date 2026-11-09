# Wanderhome — Agent Guide

Wanderhome is a cozy idle browser game: a tiny house on wheels drives itself around a
procedurally generated world, harvests, trades, fights the odd critter, and starts a new
generation when retired. React 19 + TypeScript + Vite, Canvas 2D, and no game assets — all
art is drawn in code.

This file is the entry point. Keep it short; details live in [`docs/`](docs/).

## At a glance

- `src/game/` — simulation: `engine.ts` owns `Game`; behaviour in `sim/`, drawing in
  `render/` and `art/`, worldgen in `world/`, persistent meta in `family/`.
- `src/content/` — all game data as typed lists; add content here, not in the engine.
- `src/components/` — React UI. `src/app/` — boot, game loop, session keeper, hotkeys.
- `docs/` — architecture, conventions, testing, saves, and gameplay.

## Commands

```bash
npm install
npm run dev              # Vite dev server
npm run build            # self-contained dist/index.html
npx tsc --noEmit         # type gate (there is no npm script)

node ../webgame-tools/bin/webgame-harness.mjs check
node ../webgame-tools/bin/webgame-harness.mjs smoke   # build first
node ../webgame-tools/bin/webgame-harness.mjs run --scenario test/firsts.mjs
```

## Read the right doc

| Topic | Document |
| --- | --- |
| Codebase map, runtime lifecycle, invariants | [docs/architecture.md](docs/architecture.md) |
| Code style, patterns, adding features | [docs/conventions.md](docs/conventions.md) |
| Type-check, build, browser smoke tests | [docs/testing.md](docs/testing.md) |
| Save keys, versions, migrations, offline time | [docs/saves.md](docs/saves.md) |
| Game systems and design rules | [docs/gameplay.md](docs/gameplay.md) |
| Adding or editing game content | [src/content/MODDING.md](src/content/MODDING.md) |

## Non-negotiables

- **Saves outlive the code.** Keep the `wanderhaus-*` localStorage keys, the
  `format: "wanderhaus"` export format, and existing content ids working. Add a migration
  instead of breaking an old save. See [docs/saves.md](docs/saves.md).
- **The build stays self-contained.** `dist/index.html` must not load anything over the
  network: no CDNs, external fonts, images, or runtime assets. Avoid new dependencies.
- **Idle-safe by design.** Every system must resolve while the player is away. No hard fail
  state, no daily streaks, no FOMO. Autopilot, offline credit, visitors, and milestones all
  finish on their own.
- **One offline path.** Away time is credited only through
  `game/sim/offline.ts → applyOfflineProgress`, guarded by `game.offlineClock`.
- **The preview has no side effects.** Family events (discoveries, postcards, milestones,
  visitors) only run after `game.beginPlay()` (`game.legacyOn`). The title-screen world is a
  preview.
- **One-shot guards stay.** A run folds into lifetime totals once (`game.folded`);
  retirement happens once (`game.retired`).
- **Generated files are not source.** Don't hand-edit `dist/` or `.artifacts/`.

## Before you finish

1. `npx tsc --noEmit` and `npm run build` pass.
2. For gameplay or UI changes, build and run the harness `smoke` (or `run` with a scenario).
3. For save or content-id changes, add a migration and verify an old save still loads.
4. Update the relevant doc when you change behaviour, commands, or invariants.
