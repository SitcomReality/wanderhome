# Wanderhome

A cozy idle game about a tiny home on wheels. It drives itself, harvests, trades, fights the occasional critter, and keeps rolling while you live your life. You can nudge it, rebuild it, repaint it, retire it, and start the next generation of the family.

This is the canonical build. The earlier `wanderhaus` monolith and the alternate LMArena `wanderhome` branch are archived under [`_archive/idle-lineage/`](../_archive/idle-lineage/) and should not be resumed.

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
- **Click** — set a waypoint; **wheel** zooms; **T** toggles driving.
- **G** workshop · **B** town/journal · **I** stores · **J** memories · **L** family · **H** hide UI.

## What is in here

- `src/game/` — simulation: driving, navigation, harvest, weapons, critters, towns, exploration, workshop, offline, persistence.
- `src/game/family/` — the persistent layer: generations, Legacy Sparks, Scrapbook, postcards, milestones, visitors, coffee, family shelf.
- `src/content/` — all game data (27 biomes, 15 critters, 16 landmarks, 41 nodes, 75 modules, 9 locomotion types, 6 frames). See `src/content/MODDING.md`.
- `src/components/` — React UI: HUD, workshop, town, family, settings, title/offline screens.
- `src/ARCHITECTURE.md` — code map and invariants.

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

The browser harness uses system Firefox over WebDriver BiDi and writes artifacts to `.artifacts/webgame/`.

## Design rules

- No hard fail state. The house can break down, lose cargo and limp home, but it always recovers.
- Every system must survive being ignored. Offline earnings, autopilot, visitors and milestones all resolve themselves.
- No daily streaks or FOMO. The morning coffee is a gift, not a chore.
- The idle game and the immersive game are separate. This is the one you leave running; *The Last Messenger* is the one you sit down for.
