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
4. **Profiling and budgets — next.** Add an opt-in lightweight profiler for simulation,
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
  Current schema 2 requires a valid ID counter. A schema-1 client with stage-1
  protections refuses to overwrite a schema-2 save.
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

At the user's request, remaining browser/game acceptance is deferred until all
four stages are implemented. Stage 2 had already run focused domain/type checks;
stage 3 adds regression coverage without running gameplay tests or browser suites.
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
  These runtime tests are added but intentionally unexecuted until final checks.
- A small stage-2 follow-up closes four omitted-clock paths in Barracks/farm
  commands: missing or invalid time rejects before lower-level helpers could
  fall back to the wall clock. Normal typed callers already pass explicit time.

Stage 3 compilation: strict TypeScript and the production build passed. No Node
runtime tests, gameplay simulations or browser suites were run during this stage;
all new and migrated test cases await the combined final validation.

## Final validation commands

```powershell
npm.cmd run brotd:check
# PLAYWRIGHT_MODULE may point to an installed Playwright entry file.
node --experimental-strip-types king-defense-toon/tests/save-protection.browser.mjs
node --experimental-strip-types king-defense-toon/tests/storage-recovery.browser.mjs
node --experimental-strip-types king-defense-toon/tests/campaign-commands.browser.mjs
```

The browser suites use disposable contexts and close their browser/server in
`finally`. They cover real shared-origin locks/storage events and literal legacy
saves. Persisted pagehide/pageshow checks are synthetic lifecycle tests, not proof
of native BFCache eligibility or physical Telegram/WebView acceptance.

Stage 1 validation after updating to `1312dac`: strict typecheck and production
build passed; 550 Node tests, 12 save-protection browser scenarios, and 9 legacy/recovery browser
scenarios passed. The latter includes a real first-wave victory and checks that
reloading cannot award its first-clear reward twice.
