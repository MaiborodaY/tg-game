# BroTD Infinity: staged preparation for server-backed progression

Branch: `codex/brotd-server-prep`. Started from `main` at `691ab9d`, then updated
to `1312dac` (elven archer / Barracks IV) before completing stage 1.
This work keeps TypeScript, Vite and Canvas 2D. Each stage is reviewed separately.
Purchases and competitive features are planned, so future server endpoints must
validate commands and own valuable balances/results; uploading a client snapshot
to D1 is not sufficient authority.

## Stages

1. **Local save protection — implemented here.** Version the save format, keep
   original migration bytes, enforce one writer, detect external changes, and
   recover safely after storage/lifecycle failures.
2. **Campaign commands — implemented.** Extract typed campaign state and explicit
   operations from `main.ts`, preserve stable unit IDs, return domain results,
   and test invariants for spending, recruitment, movement, merging and rewards.
   Keep browser/DOM/storage dependencies outside the command layer. This creates
   a useful future API boundary without pretending local commands are trusted.
3. **Combat and visual effects — implemented.** Separate damaging projectiles, statuses and
   combat events from decorative effects. Cosmetic limits must not drop damage,
   healing, control effects or rewards. Preserve fixed-step/cross-FPS outcomes.
4. **Profiling and budgets — implemented.** Add an opt-in lightweight profiler for simulation,
   rendering and UI, plus entity/effect counters and repeatable stress scenarios.
   Set device budgets from actual Telegram Android/iOS measurements. Introduce
   pooling/spatial indexing/workers only when measurements justify them.

## Stage 1 contract

The initial stage introduced schema 1; stage 2 advances it to schema 2 below.

- `saveSchemaVersion = 1` is independent of campaign wave numbering. Unversioned
  and schema-0 saves migrate through the existing gameplay restorers. A newer
  schema or campaign version blocks play/write/reset until a compatible client
  loads it. Malformed explicit schema versions use corrupt-save recovery.
- Before the first replacement of a legacy save, its exact bytes are saved to
  `brotd-infinity:campaign:v2:backup:before-schema-1`. The backup is retained and
  never replaced automatically. Failure to store it leaves the campaign intact
  and exposes Retry. This is a migration rollback copy, not a rotating backup or
  a player-facing restore UI. Future schema targets need their own backup key.
- The browser holds an exclusive Web Lock named
  `brotd-save:brotd-infinity:campaign:v2` throughout its writable session. A second
  window cannot load into a writable game; it can retry after the owner closes.
  Ordinary visibility/Telegram pauses retain ownership and the in-memory battle.
- Navigation flushes while still owning the lock, then releases it. A cached
  page reacquires ownership and compares stored bytes before resuming or claiming
  offline income. A changed save requires reload, never a stale snapshot write.
- Each campaign write checks the last-read/written bytes. Relevant `storage`
  events, including `clear()`, freeze a conflicting session. Reset confirmations
  cannot bypass changed/unsupported saves, lost ownership, or an unread slot.
- Unexpected failure during gameplay restoration also closes the write gate;
  partial defaults cannot replace the original save. A quota failure keeps the
  pending in-memory progress and allows retry without replaying its reward.

## Boundaries and acceptance

Web Locks require a supported browser and secure context (localhost is supported
for development). If unavailable or denied, the game pauses with a browser-update
message. There is no unsafe localStorage lease fallback. Test target Telegram
clients before publishing this branch.

Only cooperating clients obey the lock. An already-open older build or manual
storage edit can still write; byte checks detect a conflict but localStorage has
no atomic compare-and-swap against those writers. This is neither anti-cheat nor
cross-device coordination. A new repository/origin also has separate localStorage;
the later move must explicitly handle save transfer rather than assume continuity.

No server, D1 migration, payment handling, or publication is part of these stages.

## Stage 2 contract

- `campaign-state.ts` owns typed campaign creation, complete restoration, reset
  and independent snapshot copies. `main.ts` keeps one `campaign` object; UI
  selection, overlays, audio, frame scheduling and the current battle stay local.
- `campaign-commands.ts` owns recruitment, spending, sale, placement/replacement,
  movement, withdrawal, Merge/Connect, buildings, crops, hero talents, income,
  receipt acknowledgement and campaign options. Rejected operations leave the
  campaign unchanged. Commands accept time/randomness explicitly and do not
  access DOM, browser storage or Telegram. Existing rule helpers still determine
  prices, unlocks, footprints, odds and battle-independent bonuses.
- Hero UI now requests a command through callbacks. It cannot spend/reset talent
  points itself. Successful mutations and their costs are persisted together by
  the application; a save failure retains pending state behind the recovery gate.
- Schema 2 persists `nextUnitId` alongside stable roster IDs. Migration preserves
  valid IDs, repairs missing/duplicate IDs deterministically, and reserves IDs
  seen in rejected old entries. The counter survives sale, merging, reload and
  reset; it cannot reuse consumed IDs. Old saves cannot reveal IDs that were sold
  before any persistent counter existed. IDs are campaign-local, not global
  account identifiers. Exhaustion blocks allocation rather than losing precision.
- The original schema-0/1 bytes are retained under
  `brotd-infinity:campaign:v2:backup:before-schema-2`; any schema-1 backup is kept.
  Schema 2 and later require a valid ID counter. A schema-1 client with stage-1
  protections refuses to overwrite a schema-2 save.
- The later automatic-farm update advances saves to schema 3 and retains original
  schema-0/1/2 bytes under `brotd-infinity:campaign:v2:backup:before-schema-3`,
  preserving earlier backups. Schema-2 clients reject it instead of rewriting
  automatic production as manual planting. See `AI_DEVELOPMENT.md` for farm
  progression, caps and the one-time legacy planting migration.
- `campaign-rewards.ts` records cumulative paid kills/gold and one outcome per
  running battle. Repeated updates cannot reroll captures or pay XP/first-clear
  gold twice. First-clear markers stay durable; ordinary replay rewards remain
  unchanged. An unexpected automatic-command rejection freezes play and requires
  restoration of the last durable save. Battle receipts are in memory because
  battles themselves are not resumed from disk; this is not a durable server
  request ledger or proof that a client-reported victory is trustworthy.
- Reset preserves Auto Waves and the learned market hint, matching the existing
  UI behavior, while clearing the army/economy/buildings/hero and granting the
  initial supplies. Its ID counter remains above previously allocated IDs.

At the user's request, browser/game acceptance was deferred until all four
stages were implemented. Stage 2 had already run focused domain/type checks;
stage 3 added regression coverage without running gameplay tests or browser suites.
Before that request, the new command browser suite passed its two real-UI
scenarios, storage recovery passed 9, and save protection passed 13. These are
interim results, not final acceptance of the combined four-stage change.

Stage 2 local validation: strict typecheck, 66 focused domain/UI unit tests and
the production build passed. The complete combined test suite remains part of
final acceptance after all four stages.

Final acceptance must also rerun the updated recruitment, Barracks, formation,
drag/Connect, farm, Forge, Capitol and hero browser suites. The recruitment suite
attempt was blocked by an occupied development port before the deferral; no
unrelated server was stopped. Close all test browser contexts and servers after
the final checks.

## Stage 3 contract

- `Battle.projectiles` exclusively owns arrows, poison bottles and hero hammers,
  with independent `nextProjectileId`. Damage, flight times, target validation,
  poison, healing, shields and stuns remain in the fixed-step simulation. Actor
  action timers still determine windup impacts; they are not decorative clocks.
- `Battle.effects` contains only disposable hit/gold/heal indicators, slashes
  and impact art. `combat-visuals.ts` can access only this visual state; neither
  dropping entries nor setting its limit to zero can cancel gameplay work.
  The default 256-entry limit bounds cosmetic bursts, not projectiles/events.
  It is a memory guard, not a claim of adequate FPS on any measured device.
- Preserve simulation ordering: existing poison ticks, projectile arrivals,
  actor statuses/windups, then movement/target selection. Hero death cancels
  its hammer even in an already captured projectile snapshot. Ordinary arrows
  and bottles survive their caster; a destroyed Capitol cannot finish its shot.
  A battle result retires all projectiles and poison before later visual aging.
- `BattleEvent` now carries actual HP damage and healing/shield observations in
  addition to gold and bow shots. These events have no cosmetic cap. The balance
  harness reads this event stream; historical source-root comparisons retain
  their legacy visual-counter fallback. Rewards still use battle totals and the
  campaign receipt, never visual objects.
- Scene drawing reads projectiles first, then cosmetic overlays. This makes the
  overlay order explicit; final browser acceptance must inspect arrows, bottles,
  hammer flight, impact art and health/poison indicators on the combined build.
- New regression cases cover normal/zero/saturated/cleared visual retention,
  authoritative state and event equality, mixed poison/heal/hammer encounters,
  independent IDs, battle result cleanup, timing, and read-only scene drawing.
  Existing combat, render and browser fixtures use the separated collections.
  These runtime tests were intentionally deferred until the combined final checks
  recorded below.
- A small stage-2 follow-up closes four omitted-clock paths in Barracks/farm
  commands: missing or invalid time rejects before lower-level helpers could
  fall back to the wall clock. Normal typed callers already pass explicit time.

Stage 3 compilation: strict TypeScript and the production build passed. No Node
runtime tests, gameplay simulations or browser suites were run during this stage;
the new and migrated test cases were deferred to the combined final validation.

## Final validation commands

```powershell
npm.cmd run brotd:check
# PLAYWRIGHT_MODULE may point to an installed Playwright entry file.
node --experimental-strip-types king-defense-toon/tests/save-protection.browser.mjs
node --experimental-strip-types king-defense-toon/tests/storage-recovery.browser.mjs
node --experimental-strip-types king-defense-toon/tests/campaign-commands.browser.mjs
node --experimental-strip-types king-defense-toon/tests/combat-profiler.browser.mjs
node --experimental-strip-types king-defense-toon/scripts/profile-combat.mjs --scenario all --seconds 30
```

The browser suites use disposable contexts and close their browser/server in
`finally`. They cover real shared-origin locks/storage events and literal legacy
saves. Persisted pagehide/pageshow checks are synthetic lifecycle tests, not proof
of native BFCache eligibility or physical Telegram/WebView acceptance.

Stage 1 validation after updating to `1312dac`: strict typecheck and production
build passed; 550 Node tests, 12 save-protection browser scenarios, and 9 legacy/recovery browser
scenarios passed. The latter includes a real first-wave victory and checks that
reloading cannot award its first-clear reward twice.

## Stage 4 contract and measurement guide

- `combat-profiler.ts` is a bounded, DOM-free sampler. The ordinary game creates
  no sampler or diagnostic panel unless the URL contains `?profile=1`. The core
  also supports a disabled path that reads no clock and retains no history.
  Profiling does not change frame pacing, battle delta, random draws or saves.
- Five independent rolling windows retain at most 300 samples each by default:
  accepted frame intervals, frame JavaScript work, simulation calls, Canvas
  submission calls, and instrumented UI refresh calls. Mean/p95/max describe
  these windows, not the whole session; p95 uses nearest rank. UI includes the
  main refresh, economy and battle HUD, not every event handler or browser layout.
  Nested calls in the same section are recorded once. Canvas is outside the
  main UI refresh measurement, so that refresh does not double-count drawing.
- The current game deliberately targets 30 rendered FPS. Frame work above
  33.33 ms is counted as an overrun; frame intervals beyond 1.5 budgets + 1 ms
  are counted separately to tolerate RAF scheduling quantization. The latter
  cannot identify whether a delay came from CPU, GPU, browser or another task.
  Pausing resets timing baselines, so time spent in a hidden tab is not a slow
  frame. Reset clears samples; no unbounded event or actor history is retained.
- Counters are detached numbers: wave, speed, retained allied/enemy actors,
  projectiles, cosmetic effects and actors with active poison. Dead retained
  actors count because rendering still visits them; the hero counts as an ally,
  and the castle is excluded from that actor count. Snapshot consumers cannot
  mutate gameplay or the sampler's internal storage.
- The small panel refreshes at most twice a second. Export JSON includes build
  ID, viewport/DPR, user agent, scenario context and samples; it contains no
  campaign snapshot and sends nothing to a server. Panel refresh/export overhead
  is outside measured frame work. Measurements include instrumentation overhead
  inside the measured sections and are CPU timings, not GPU completion timings.
- `profile.html` is a separate, explicitly started performance lab using the real
  simulation and Canvas renderer. It never imports campaign commands/storage or
  modifies the saved game. Choose a scenario, speed, cosmetic retention and
  5–60 simulated seconds; Stop, pagehide and visibility changes cancel its loop.
  An asset-loading run can also be stopped safely. Reload/restart always uses a
  fresh scenario; no diagnostic control is placed in the normal player menus.
- The fixed scenarios are an opening wave, catalogue wave 39 with an expanded
  army, an explicitly synthetic mixed-skills encounter, and wave 110 with the
  current Elven Healers, Glaive Rider, Unicorn and Bombardier. The CLI compares the
  complete ordered events and authoritative outcome with/without cosmetics and
  reports updateBattle CPU timing and peak counters. It excludes Canvas, DOM,
  assets and GPU work; sequential JIT/GC noise prevents treating its timing
  differences as proof of an optimization. Its checksum is a diagnostic label,
  never anti-cheat or server verification.

For a device baseline, open the same build's `profile.html` in the target Telegram
Android/iOS WebView, choose the same scenario/speed/duration, and run once to warm
assets/JIT before recording another run. Export the report, note device model,
OS/WebView, power mode and thermal state, then compare the repeated p95/max and
frame-work overruns. Also profile the ordinary game with `?profile=1` to include
its two canvases, saves, economy and menus. The lab does not reproduce that whole
UI workload. New skills should add to the deterministic mixed scenario first.

No phone budget is certified by desktop results. The 30-FPS deadline is the
existing rendering target, not evidence that every supported device meets it.
Before release, select representative Android/iOS devices and record these
baselines. Optimize measured CPU/Canvas/UI hot spots; introduce spatial indexes,
pools or workers only if those measurements justify their complexity.

## Combined final validation — 2026-09-18

Completed on `codex/brotd-server-prep`. Initial production acceptance used build
`260918-213012`; final lab-only corrections were rebuilt as `260918-213928` and
the profiler browser suite was rerun against that build. The main game and shared
runtime JavaScript hashes are unchanged between those two builds.

- Strict TypeScript, all **625 Node tests**, and the production multi-page build
  passed. This includes the previously deferred campaign, save, fixed-step and
  visual-isolation regression cases, plus the sampler and stress fixtures.
- All **14 browser suites** passed: save protection (13 cases), storage recovery
  (9), campaign commands (2), recruitment pools (20), Barracks (5 contexts),
  Connect (12), drag/merge (2 viewport flows), Forge (8), Capitol (9), Farm (9),
  hero integration, plague alchemist (4), profile version (2 viewport flows), and
  the new profiler (2 checks). Granularity differs, so these are not summed as
  equivalent test cases. The hero suite covers mobile talent trees, legacy
  refund, reload, battle snapshots, one-time XP, healing and hammer at speed 3.
- The profiler browser suite completed the real first wave with diagnostics on
  and off and compared durable rewards/progression. It verified no profiler in
  the ordinary game, populated/reset metrics, mobile panel bounds, and a stopped
  lab run that left literal campaign-save bytes untouched. The final rerun also
  checked exact five-second lab duration at speeds 1 and 3 and a downloaded JSON
  report whose scenario metadata remains tied to its samples after controls change.
- Existing browser harnesses now use dynamically assigned loopback ports to
  avoid collisions. Stale expectations were updated for the current Connect UI,
  offline gold settlement and stable unit IDs across reload; the latter now has
  an explicit whole-roster ID equality assertion.
- Manual in-app-browser play recruited and placed three level-1 swordsmen. The
  automatic sequence cleared waves 1–3, then displayed the expected defeat flow
  at wave 4. The profiler displayed live simulation/Canvas/UI measurements and
  the browser reported no console errors. The game tab and preview server were
  closed after inspection. Automated browser contexts/servers also exited.

The CLI ran each of the three fixtures for up to 30 simulated seconds, both with
cosmetics and with zero cosmetic retention. Complete authoritative state and
ordered events matched in every pair. The mixed fixture exercised arrows,
hammer, poison bottles, poison, stuns, allied/enemy healing and hero healing; it
peaked at 53 retained actors (including castle), 11 projectiles and 35 cosmetics.

One local Node 22.13.0 sample, with cosmetics enabled, recorded these CPU times
per `updateBattle(1/60)` call. These numbers exclude rendering and are not frame
budgets or device acceptance:

| Fixture | Mean ms | p95 ms | Max ms |
| --- | ---: | ---: | ---: |
| Opening | 0.034 | 0.096 | 1.954 |
| Expanded army | 0.119 | 0.322 | 9.000 |
| Synthetic mixed skills | 0.210 | 0.484 | 3.311 |

Local logs/reports are under ignored `.tmp/stage4-*`; the commands and scenarios
above reproduce the checks. Physical Telegram Android/iOS validation, including
Web Locks support and representative-device performance, remains a release
acceptance step. This branch does not implement server authority, D1, purchases
or competitive verification. At that validation point it had not been merged,
pushed or deployed; the subsequent release integration is recorded below.

## Release integration — 2026-09-19

Integrated remote `main` at `65e6d52` into the four-stage branch. Preserved the
Elven Healer, ranged Glaive Rider, Unicorn, Bombardier, shared sprite animation,
their balance/unlock rules and all incoming art. Recruitment commands and UI now
pass the actual Barracks tier, including a just-completed tier IV upgrade.
The new units keep stable IDs and shared two-cell placement after restoration.

Glaives and bombs use gameplay projectiles; healing rings and cannon impact art
remain disposable visuals. New regression cases compare normal, disabled,
saturated and repeatedly cleared cosmetics. The lab has a fourth repeatable
scenario, `forest-reinforcements`, using catalogue wave 110 and current units.

Final combined checks passed:

- `npm.cmd run brotd:check`: strict TypeScript, **681/681 Node tests**, production
  build **260918-221215**. The sole initial failure was a new test fixture with a
  one-hour timer instead of the existing six-hour tier IV duration; the fixture
  was corrected, and the complete check then passed.
- **14/14 browser suites**, including 26 recruitment scenarios for current elves
  and the Bombardier, legacy saves, schema-2 identities, first-wave/reward replay,
  campaign commands, buildings/farm, Connect/drag, hero, poison and the two built
  version/profiler suites. Temporary browsers and servers closed successfully.
- All four CLI scenarios preserved exact gameplay state and ordered events with
  and without cosmetics for up to 30 simulated seconds. This was a correctness
  run alongside browser checks, not a new isolated device performance baseline.
- An independent comparison used original combat code from `65e6d52` and the
  merged code with cosmetics disabled. Six completed encounters (waves 1, 20,
  110, 190, 400, plus a weak army on 110) matched 224 sampled gameplay states,
  normalized active flights and original gold/bow events, covering both outcomes.

`AI_DEVELOPMENT.md`, required by `AGENTS.md`, records the architecture, save,
combat/visual, testing, integration and publication contracts for future AI tasks.
It explicitly identifies covering-screen render throttling and server authority
as future work. Desktop/headless results do not certify physical Telegram clients.

The release uses the source and built artifacts in this integration commit.
Publish it to remote `main`, then deploy those unchanged artifacts to the existing
`bro-infinity` Pages alias under `AGENTS.md`/`TELEGRAM.md`; do not rebuild between
the commit and deployment. Local evidence is under ignored `.tmp/merge-*`.
