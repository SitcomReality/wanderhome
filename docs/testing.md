# Testing and verification

There is no unit-test framework. Verification is: type-check, production build, static
harness check, then a real-browser smoke test. Run all commands from the repo root.

## 1. Type-check

```bash
npx tsc --noEmit
```

There is no npm script for this. The config is strict and enables `noUnusedLocals` /
`noUnusedParameters`, so it must be clean.

## 2. Build

```bash
npm run build
```

Vite plus `vite-plugin-singlefile` writes the self-contained `dist/index.html` (roughly
570 kB, no external references). The browser harness serves `dist/`, so **build before any
browser test**. `dist/` is generated and gitignored.

## 3. Static harness check

```bash
node ../webgame-tools/bin/webgame-harness.mjs check
```

Checks JavaScript syntax, local imports and assets, JSON validity, external loading URLs,
and the readiness hook, without launching a browser. The report is written to
`.artifacts/webgame/check.json`. Keep external URLs at the default `error`.

## 4. Browser smoke test

```bash
node ../webgame-tools/bin/webgame-harness.mjs smoke
```

The harness defaults to system Firefox over WebDriver BiDi (`engine: auto`; Playwright is
used if installed and Firefox is unavailable). It serves `dist/`, waits for
`window.__APP_READY__`, and runs the steps in `webgame.config.json`:

1. title screen has an `h1`
2. click the **Begin** button
3. settle for 2 seconds
4. the canvas is painted (at least 10,000 pixels)

It also fails on page errors and unexpected external requests, warns on console errors, and
writes screenshots plus `report.json` under `.artifacts/webgame/<timestamp>-wanderhome/`.
Confirm the summary says all checks passed.

`window.__APP_READY__` is set in `app/useGameLoop.ts` after the first rendered frame (and
`app-ready` is dispatched). The harness and screenshots depend on it; don't remove it.

If the browser engine is missing or the config looks wrong, run:

```bash
node ../webgame-tools/bin/webgame-harness.mjs doctor
```

## Scenario tests

`run --scenario FILE` executes a default-exported async function with
`{ page, assert, screenshot, log }`:

```js
export default async function ({ page, assert, screenshot, log }) {
  await page.waitFor("!!document.querySelector('h1')");
  await page.evaluate(
    "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Begin'))?.click()",
  );
  await page.waitFor("document.body.innerText.includes('Wish You Were Here')");
  assert.ok((await page.text('body')).includes('Wish You Were Here'), 'missing first-postcard toast');
  log('firsts toast found');
  await screenshot('firsts.png');
}
```

See `test/firsts.mjs` and `test/planner.mjs` for working versions:

```bash
node ../webgame-tools/bin/webgame-harness.mjs run --scenario test/firsts.mjs
node ../webgame-tools/bin/webgame-harness.mjs run --scenario test/planner.mjs
```

Useful harness commands:

| Command | Purpose |
| --- | --- |
| `shot [--out PATH] [--wait MS]` | one screenshot |
| `visual [--update]` | baseline comparison; `--update` accepts a new baseline |
| `runs` | dashboard of recent runs under `.artifacts/webgame/index.html` |

Set `(globalThis as any).__wanderhausNoSave = true` in a scenario (before starting play) to
stop autosave and unload handlers from writing the test run to the browser profile.

## What to check manually

- **Old saves:** load a save from the previous version; no crash, sensible defaults.
- **Offline:** hide the tab or reload after a wait; the report appears once and time is not
  credited twice.
- **Retirement:** retire when eligible; family data persists, lifetime totals count once,
  inheritance appears, a new run starts clean.
- **Idle safety:** leave the game alone for a while; the house recovers from breakdowns and
  keeps earning.
- **UI:** the HUD, workshop, town, Supplies & Plans, memories, and family panels all open and
  close; the game still works with the UI hidden (`H`) and at a narrow width.
- **Plans:** plan a chassis expansion or known part from the Workshop, confirm the HUD goal bar
  appears away from town, set a collection limit, and confirm it survives a close/reopen. Build
  the planned item and confirm the plan clears.

See [saves.md](saves.md) for the save-specific cases.
