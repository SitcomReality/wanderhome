# Conventions

Follow the surrounding code. There is no ESLint or Prettier config; `npx tsc --noEmit` is the
hard gate, and the codebase is deliberately compact.

## Language and style

- TypeScript strict, with `noUnusedLocals` and `noUnusedParameters`. `any` is reserved for
  save blobs, migrations, and narrow DOM edges.
- Most code uses single quotes, semicolons, two-space indent, and trailing commas in
  multiline lists. Match the file you are editing rather than reformatting it.
- Keep functions small and files focused. Dense one-liners are normal in `sim/` and UI code.
- Comments explain *why* (compatibility, invariants, a non-obvious tradeoff), not *what*.
  Files usually start with a one-line `//` summary; sections use `// ---- name ----`.
- Name for behaviour (`updateHarvest`, `applyOfflineProgress`), not generic roles.
- Use `import type` for type-only imports. Barrels (`index.ts`) are the public surface.
- Relative imports are the convention (`../../content/index`). The `@/` alias exists in
  `tsconfig.json`/`vite.config.ts` but is unused; don't introduce a second style.

## Simulation patterns

- `Game` is a mutable state bag. Systems are `export function updateX(g: Game, dt: number)`
  functions that mutate it. Return values are for UI or callers, not for rebuilding state.
- Add public entry points to `Game` as thin delegators, grouped by module, so UI and other
  systems share one stable surface:

  ```ts
  // ---- sim/towns ----
  sell(t: Town, r: Res, n: number) { return Towns.sell(this, t, r, n); }
  ```

- Per-game transient state that must not be saved belongs in a module-level `WeakMap`, as in
  `family/familyTick.ts` (`TR` / `tr(g)`). Never add it to the save by accident.
- Times are simulation seconds (`g.time`), except offline/save logic, which uses wall-clock
  milliseconds. Don't mix them.
- Give feedback through `g.addLog`, `g.popup`, `g.part`, `g.burst`, and `sfx`, not
  `console.log` (the content registry is the exception: it warns about bad data).
- Guard one-shot effects with explicit flags (`folded`, `retired`, `offlineSeen`) and keep
  the guards visible at the call site.
- Reuse the existing math/format helpers (`core/math.ts`, `core/format.ts`) instead of
  re-deriving angles or number formatting.
- Avoid obvious per-frame garbage in hot loops. The codebase already caches chunks, reuses
  `nearNodes`, and caps particles; don't add unbounded arrays or canvases per tick.

## Content patterns

- Content is data, not code. Add to the typed list; the engine discovers it through the
  registry. See [src/content/MODDING.md](../src/content/MODDING.md).
- **Ids are permanent API/save surface.** Saved grids, pins, known parts, locomotion/frame
  ids, and module ids all reference them. Renaming or removing an id requires a mapping in
  `migrateRunSave()`/`applySave()`.
- Every cross-reference must resolve. `content/registry.ts → validate()` prints console
  warnings for unknown resources, biomes, grounds, parts, and `where` targets. Fix warnings
  instead of ignoring them.
- Balance through data fields (`cost`, `rate`, `power`, `weight`, `tags`), not one-off
  branches in the simulation. A new behaviour exposed by `ModuleDef` belongs in
  `vehicleStats.ts` or the relevant `sim/` system.
- Reuse art with `art: 'existing_part_id'` when a new part should look like an existing one.
  Otherwise add an entry in `game/art/parts/<category>.ts`.
- Content packs call `registerContent()` once, before any `Game` is created (see
  `MODDING.md`). Packs override by id.
- `src/content/flavor.ts` is writing, not filler: keep lines cozy, specific, and in the
  game's voice.

## React and UI

- Function components with named exports; `App` is the only default export.
- Props are explicit. Panels receive `game` and, when they need to repaint, `tick` (the
  200 ms signal from `useSessionKeeper`). Do not add a second animation loop for UI.
- Simulation is read during render and mutated in event handlers or effects. Don't call
  `game.save()`, grant rewards, or mutate `meta` during render.
- Tailwind v4 utility classes inline; shared primitives live in `components/common/ui.tsx`;
  merge conditional classes with `cn` from `utils/cn.ts`.
- Canvas components scale by `devicePixelRatio` (capped at 2), size the backing store, and
  cancel any `requestAnimationFrame` in the effect cleanup.
- Keep the game playable with the UI hidden (`H`) and at narrow widths; avoid fixed pixel
  widths that only work at 1280×720.

## Persistence

- Mutate the `meta` singleton, then call `saveMeta()`. The run is saved by `game.save()`.
- Every new `Meta` field needs a default in `freshMeta()` and handling in `normalizeMeta()`.
- Every new saved run field needs a default in `applySave()`, a write in
  `sim/persistence.ts`, and a migration step if its meaning changes. See
  [saves.md](saves.md).
- Never silently discard unreadable data: back it up first, following the existing backup
  keys.

## Dependencies and assets

- Runtime dependencies are intentionally minimal (`react`, `react-dom`, `clsx`,
  `tailwind-merge`). Don't add a library for something a small local helper can do.
- No CDN scripts, external fonts, image files, audio files, or fetch calls. The production
  build is one HTML file and must stay that way; the browser harness treats external
  requests as failures.
- Prefer procedural canvas art and WebAudio blips over bundled assets.

## Performance

- Keep the 60 fps frame budget in mind: chunk rendering and the render pipeline are the hot
  paths, and `update()` runs every frame.
- React repaints at 5 Hz by design. Expensive derived values can be computed in the render
  pass, but don't make them worse than linear in content size.
- The single-file bundle is already large; check `npm run build` output and avoid pulling in
  large modules casually.
