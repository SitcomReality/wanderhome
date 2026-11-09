# Saves, compatibility, and offline time

Wanderhome has two localStorage records and one export format. They are a compatibility
contract: existing players' saves must keep loading.

## Keys (never rename)

| Key | Contents | Defined in |
| --- | --- | --- |
| `wanderhaus-save-v1` | the current run | `game/core/constants.ts` (`SAVE_KEY`) |
| `wanderhaus-meta-v1` | the family, across runs | `game/family/meta.ts` (`META_KEY`) |

The user-facing name is Wanderhome; the `wanderhaus` namespace is deliberate and must stay.
Export bundles also keep `format: "wanderhaus"` so old export files still import.

Backup keys are written before destructive operations:

| Key | Written when |
| --- | --- |
| `wanderhaus-save-unreadable-backup` | the run save exists but cannot be parsed at boot |
| `wanderhaus-meta-v1-backup` | the meta record cannot be parsed |
| `wanderhaus-backup-before-import` | before a save import overwrites data |
| `wanderhaus-backup-before-reset` | before **Reset save** erases both records |

Follow this pattern for any new destructive action: copy the old value first, never silently
discard player data.

## Run save (version 4)

- Written by `game/sim/persistence.ts → save()` every 10 s, on tab hide/unload, and at key
  transitions (start, new game, retirement).
- Shape: `v`, `gen`, `seedStr`, coins/resources/`keep`, `collectCap`, `goal`, `seenRes`, grid
  dimensions and cells, locomotion/frame and owned ones, `known`, `pins`, `rumours`, vehicle
  position/HP, settings, stats, towns, rates, `time`, `lastSave`, `visited`, buffs, run
  biomes/time, crew, and any waiting visitor. `save()` is the authoritative list.
- `collectCap` is a per-resource upper collection limit (`-1` = no limit). `goal` is a
  content-id reference (`kind` + `id`) to the active build plan; its cost is derived from
  content, not stored. Parking (`parked`/`parkUntil`) and town-watch cooldowns are temporary
  and deliberately not saved; loading a save resumes normal autopilot.
- Loaded by `bootGame()` → `migrateRunSave()` → `new Game(seed, save)` → `applySave()`.
- `applySave()` filters unknown content ids, repairs the cockpit, fills missing resources,
  clamps invalid values, and recomputes derived stats. Keep that defensive behaviour: old or
  damaged saves must degrade, not crash.
- `game.save()` also calls `saveMeta()`.

### Changing the run format

1. Add the field with a safe default in `applySave()`.
2. Write it in `sim/persistence.ts → save()`.
3. Increment `SAVE_VERSION` in `game/saveTransfer.ts`.
4. Add a `v < N` step to `migrateRunSave()`; it spreads the input, so unknown fields survive.
5. Test a previous-version save, the current save, and an export/import round trip.

If a content id is renamed or removed, map old → new in `migrateRunSave()`/`applySave()`.
This includes grid module ids, locomotion, frames, known parts, pins, and rumour part ids.
A save must never point at a missing id.

## Family meta (`Meta`)

- `game/family/meta.ts` loads the record once into the exported `meta` singleton. Mutate it
  directly, then call `saveMeta()`.
- `normalizeMeta()` fills missing fields, clamps numbers, drops unknown perks and clamps
  book-reward ranks, and guarantees `generation >= 1`. It is the migration mechanism.
- `META_VERSION` is 1 and is stamped by `normalizeMeta()`; there is no separate step ladder
  for meta. Add new fields to both `freshMeta()` and `normalizeMeta()`.
- Family data survives retirement. `Game.wipe()` removes only the run; `wipeMeta()` is
  reserved for **Reset save**, which also requires typing the family name and writes a
  backup.
- Lifetime totals and past generations are written only through the retirement/fold rules
  below.

## Offline and away time

All credit goes through:

```ts
game/sim/offline.ts → applyOfflineProgress(g, fromMs, opts)
```

Never add a second path.

- `g.offlineClock` is the wall-clock millisecond up to which time has been credited. It is
  claimed immediately when the function runs, so a second call for the same span credits 0.
- `lastSave` supplies `fromMs` when loading; `useSessionKeeper` supplies the hidden-at
  timestamp when the tab returns.
- The minimum is 30 s (60 s when loading a save). The span is capped by
  `offlineCapSec()` and multiplied by `offlineMult()` (comfort plus Legacy perks).
- Earnings use the sampled `g.rates`, capped by free cargo for resources.
- It resnapshots the income sampler (`rateSnap`/`rateT`) so offline gains cannot compound
  into the next estimate.
- An unseen report is extended, not stacked, while `!g.offlineSeen`.
- `advanceWorld: true` (used on load) also moves `g.time` forward, by at most one in-game
  day (`DAY = 480` s).

## One-shot guards

| Flag | Guard |
| --- | --- |
| `game.folded` | `foldRunIntoLifetime` adds a run's stats exactly once |
| `game.retired` | `doRetire` can only run once per house |
| `game.played` | a preview world that was never played does not count |
| `game.offlineSeen` | a closed offline report is not reopened for the same span |
| `game.legacyOn` | family systems do not tick behind the title screen |

Don't add code that mutates lifetime totals, sparks, or generation outside these paths.

## Export / import

`game/saveTransfer.ts` handles both. An export bundle is
`{ format: "wanderhaus", version, exported, save, meta }`; exports are offered as base64 or
JSON. Import accepts base64, a bundle, or a bare run save, rejects newer versions, applies
`migrateRunSave()` and `normalizeMeta()`, and backs up the current records first. After an
import the caller reloads the page.

## Compatibility checklist

- [ ] An old run save still loads.
- [ ] An old meta record still normalizes (or is backed up if unreadable).
- [ ] Export → import round-trips.
- [ ] No `wanderhaus-*` key or `format: "wanderhaus"` rename.
- [ ] Removed/renamed content ids are mapped for saved grids, pins, and known parts.
- [ ] Offline time is credited once, with a single report.
- [ ] Retirement counts lifetime totals once and preserves the family.
