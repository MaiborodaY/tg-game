# BroTD Infinity stability pass

This records the original stability pass before the hero/Lancer/healer integration.
Its image-budget and test-count figures are historical. See
[TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md) for the current branch and checks.

Work branch: `codex/brotd-stability`, created from `origin/main` at
`073fdb48794febab49058664e36472b18eb8951a`. Main did not yet contain Infinity.
The three game commits `48543e4`, `6384fc7`, `749537b` were cherry-picked as
the baseline; existing working copies and their uncommitted work were preserved.

Publication uses `codex/brotd-stability-release`. The new standalone Infinity
GitHub Actions workflow remains in local `codex/brotd-stability` at `92224ac`:
GitHub rejected adding it because the current OAuth credential lacks the
`workflow` scope. The release keeps all game fixes, tests and build scripts;
only this additional workflow and its documentation claims are excluded.

## Changes

- Combat advances in fixed 1/60-second steps, carrying the partial step between
  frames. The existing 0.3-second per-call safety cap remains. Render FPS and
  the speed control no longer alter the tested battle outcomes or reward order.
- The 30-FPS renderer preserves its scheduled cadence rather than discarding
  fractional frame intervals. Pauses and resume reset the rendering clock;
  simulation never catches up hidden time.
- Scenes request only the current map, army ranks and current wave's enemy
  sheets, including enemies that have not spawned yet. The two canvases share
  pending loads and cached images. Resources no longer used by either scene
  are released from the application cache. This allows browser reclamation;
  it does not guarantee immediate GPU/browser memory release.
- Image requests have two attempts with an eight-second timeout per attempt.
  Failures produce a persistent Retry screen and pause combat/countdowns.
  A failed second-level map no longer prevents first-level startup. Retrying
  reuses the scenes and their event handlers; stale loads cannot replace a
  newer scene's resources.
- Campaign storage reports errors instead of silently failing. Unread or
  damaged saved progress cannot be overwritten by the new in-memory game.
  Retry after a read failure reloads the recovered save; write retry saves
  the latest pending snapshot. Replacing an unread/damaged slot requires two
  explicit Reset presses. Storage remains local to the browser.
- Recovery takes priority over offline-reward receipts, preserving focus and
  inert states in both directions. The normal game layout is unchanged when
  no recovery is needed.

## Image budget

Same scope in each row: unique source images retained by both game canvases,
including the forest map's seven source images. UI/DOM portraits, audio,
generated canvas layers and GPU copies are excluded.

| Scenario | Images | File size, MiB | Estimated full RGBA decode, MiB |
| --- | ---: | ---: | ---: |
| Previous eager loading | 42 | 5.15 | 132.71 |
| Empty forest preparation | 8 | 0.76 | 8.69 |
| First wave, three level-one swordsmen | 10 | 0.86 | 20.36 |

RGBA figures are sums of `width * height * 4`, not measured browser RAM.
No source artwork was resized or replaced.

## Reproducing validation

From the worktree root:

```text
npm run brotd:check
```

The original pass ran 108 Node tests and the production Vite build. The current
command also checks migrated TypeScript modules and includes newer game tests. The additional Infinity
workflow is not published; run this command locally to reproduce the gate.
Existing unrelated deployment workflows also watch root `package.json` on main;
publishing changes to main remains a separate operation.

Browser checks require an installed Playwright and Edge; set `PLAYWRIGHT_MODULE`
to its `index.mjs` if the package is not installed in this repository:

```text
node king-defense-toon/tests/asset-loading.browser.mjs
node king-defense-toon/tests/storage-recovery.browser.mjs
node king-defense-toon/tests/goblin-round-art.browser.mjs
node king-defense-toon/tests/drag-merge.browser.mjs
```

Each runner uses disposable browser contexts. Diagnostic hooks exist only in
the test Vite server and are absent from the production build.

- Combat regressions compare actual state and event order at 20/30/60 FPS,
  speeds 1/2/3 and jitter, including the audited ninth-wave win/loss discrepancy.
- Frame tests cover display rates 30/59.94/60/90/120/144 Hz, jitter, stalls,
  invalid timestamps and resets.
- Asset browser tests cover initial-load isolation, shared requests, both
  maps, bounded failure, retry, obsolete loads and cache release.
- Storage browser tests cover unread/corrupt slots, failed writes caused by
  real combat rewards, retry without duplicate rewards, reload, explicit
  reset and the interaction with offline receipts at 320px width.
- Existing renderer checks cover 30 palette/world/action combinations;
  touch/mouse drag checks cover 320px and 390px.

## Remaining validation

Physical Android/iOS Telegram WebView testing, sustained frame-time/thermal
measurements and browser-process memory measurements have not been performed.
The fixed timestep changes some outcomes compared with the buggy variable
steps; existing regression tests pass, but this is not a fresh balance review
of all 400 waves. No cloud save, engine migration or production deployment is
part of this change.
