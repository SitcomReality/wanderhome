# Wanderhome

A cozy idle game about a tiny home on wheels. It drives itself, harvests, trades, fights the occasional critter, and keeps rolling while you live your life. You can nudge it, rebuild it, repaint it, retire it, and start the next generation of the family.

This is the canonical build. The earlier `wanderhaus` monolith and the alternate LMArena `wanderhome` branch are archived under [`_archive/idle-lineage/`](../_archive/idle-lineage/) and should not be resumed. The full decision record is in [`IDLE-CONSOLIDATION.md`](../_game-audit/IDLE-CONSOLIDATION.md).

## Run it

```bash
npm install
npm run dev
```

Build the single-file production version:

```bash
npm run build
```

`dist/index.html` is self-contained (no CDN, no external fonts, no runtime assets).

## Controls

- **Do nothing** — the home drives, harvests, fights and trades on its own.
- **WASD** — walk around inside; walk off the edge or press **E** to step outside.
- **Right-click** — set a waypoint; the house parks on arrival. **Wheel** zooms; **T** toggles driving; **P** parks/resumes.
- **G** workshop · **B** town/journal · **I** supplies & plans · **J** memories · **L** family · **H** hide UI.

## What is in here

- `src/game/` — simulation: driving, navigation, harvest, weapons, critters, towns, exploration, workshop, offline, persistence.
- `src/game/family/` — the persistent layer: generations, Legacy Sparks, Scrapbook, postcards, milestones, visitors, coffee, family shelf.
- `src/content/` — all game data (27 biomes, 15 critters, 16 landmarks, 41 nodes, 75 modules, 9 locomotion types, 6 frames, Homeport's first residents). See `src/content/MODDING.md`.
- `src/components/` — React UI: HUD, workshop, town, family, settings, title/offline screens.
- `docs/architecture.md` — code map, runtime lifecycle and invariants.

## Compatibility note

The user-facing name is **Wanderhome**, but the localStorage keys and exported save format still say `wanderhaus`:

- `wanderhaus-save-v1`
- `wanderhaus-meta-v1`
- export bundle `format: "wanderhaus"`

That is deliberate. Changing them would strand every existing save. The comments in `src/game/core/constants.ts`, `src/game/family/meta.ts` and `src/game/saveTransfer.ts` explain the compatibility boundary. A clean namespace can be introduced later with a one-time migration.

## Tests

```bash
# static syntax/import/asset checks, no browser
node ../webgame-tools/bin/webgame-harness.mjs check

# title → start → canvas smoke test
node ../webgame-tools/bin/webgame-harness.mjs smoke

# waits for the first-postcard milestone toast
node ../webgame-tools/bin/webgame-harness.mjs run --scenario test/firsts.mjs
```

The browser harness uses system Firefox over WebDriver BiDi and writes artifacts to `.artifacts/webgame/`. Build first (`npm run build`); the harness serves `dist/`.

## Documentation

Detailed docs live in [`docs/`](docs/):

- [`docs/architecture.md`](docs/architecture.md) — code map, lifecycle, invariants
- [`docs/conventions.md`](docs/conventions.md) — style, patterns, adding features
- [`docs/testing.md`](docs/testing.md) — build, harness, scenario tests
- [`docs/saves.md`](docs/saves.md) — save keys, migrations, offline time
- [`docs/gameplay.md`](docs/gameplay.md) — systems and design rules

Coding agents should start at [`AGENTS.md`](AGENTS.md).

## Design rules

- No hard fail state. The house can break down, lose cargo and limp home, but it always recovers.
- Every system must survive being ignored. Offline earnings, autopilot, visitors and milestones all resolve themselves.
- No daily streaks or FOMO. The morning coffee is a gift, not a chore.
- The idle game and the immersive game are separate. This is the one you leave running; *The Last Messenger* is the one you sit down for.
