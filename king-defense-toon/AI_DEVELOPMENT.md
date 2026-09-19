# BroTD Infinity: development rules for AI agents

Read this file before editing the game. `AGENTS.md` is the entry point for future
tasks; it also defines the publication workflow. Read `UNIT_INTEGRATION.md` for
unit work and `BOMBARDIER_INTEGRATION.md` when changing that boss. The staged
architecture and its limitations are documented in `SERVER_PREPARATION.md`.

## Scope and current architecture

- Implement only work the user authorized. An analysis/question is not an order
  to change code. Assess proposals independently; explain concrete problems and
  tradeoffs instead of automatically agreeing. Report unresolved failures.
- Runtime code is strict TypeScript, built with Vite and rendered with Canvas 2D.
  Keep direct `.ts` imports and the existing shared rules. Do not add a game
  engine, framework, workers, pooling or spatial indexes without a demonstrated
  need and an authorized scope. Do not suppress type errors with `any` or ignore
  directives to make a merge pass.
- Verify the checkout, branch, HEAD, working tree and applicable instructions at
  the start. The monorepo has other games and concurrent worktrees. Preserve
  unrelated dirty files; use the task's isolated checkout for integration.
- Before publishing, fetch the current `origin/main` and integrate its commits.
  Resolve behavioral conflicts as well as conflict markers. New unit definitions
  must reach campaign commands, save restoration, footprints, UI, combat,
  renderer, assets and tests. Do not replace a whole file with one merge side
  merely to make conflicts disappear. Never force-push over concurrent work.

## Campaign commands and identities

- `campaign-state.ts` owns campaign creation, restoration, reset and snapshots.
  `main.ts` coordinates UI, browser lifecycle, storage and the active battle.
  Keep durable gameplay mutations in `campaign-commands.ts` and battle reward
  settlement in `campaign-rewards.ts`; UI callbacks request those operations.
- Commands validate before committing changes. A rejected operation must leave
  the campaign unchanged. Cost and benefit form one operation: recruitment,
  upgrades, Connect, planting/harvest and talent spending must not partially apply.
- Pass time and randomness explicitly into commands. Domain code must not reach
  into DOM, localStorage or Telegram. Reuse existing price, unlock and balance
  helpers rather than duplicating rules in the UI.
- Use persisted, monotonically allocated unit IDs from `campaign-roster.ts`.
  Never derive identity from array position or renumber on reload, sale or Connect.
  IDs are campaign-local. Respect shared footprint helpers for every two-cell unit;
  use capabilities such as `isHealingUnit`, not special cases for one old unit.
- A running battle owns its initial army/building/hero snapshots. Campaign edits
  apply to the next battle. Preserve first-clear and one-time reward protections;
  re-rendering/retrying must not award gold, captures or XP twice.
- Army details show matching Connect donors from Barracks directly, without
  Army/Barracks source tabs. Select all only selects matching reserve fighters;
  deployed Army fighters cannot be consumed through this card. Confirming
  consumes the whole validated selection once. The separate reserve-recipient
  Connect screen retains its Army/Barracks source tabs.
  The small Barracks Connect button instead selects a donor for an Army target.
- Recruit feedback stays in the existing Market-to-Barracks animation with a
  compact level label; do not repeat it in a toast. Other short notices use the
  battlefield's right water gutter below FPS, clear of Start and the Army controls.
- Human recruitment follows the Elven unlock pattern: Swordsman initially, Archer
  at Swordsman recruitment level 3, Healer at Archer recruitment level 3, and
  Lancer with completed Barracks II. Available types split the random pool equally;
  the existing first-Lancer guarantee still applies. Personal Connect levels do
  not unlock recruitment roles. Legacy training credit and existing fighters stay.

## Saves and lifecycle

- `save-storage.ts` and `save-session.ts` own browser storage access, schema checks,
  conflict detection and the exclusive writer lock. Do not bypass their recovery
  gate with direct localStorage writes in gameplay/UI code.
- Current saves use schema 2 and persist `nextUnitId`. When changing the format,
  define an explicit migration and its compatibility behavior. Keep the original
  bytes before replacement, preserve prior migration backups, reject unsupported
  newer versions, and never overwrite malformed data with a fresh empty campaign.
- Save failures and ownership conflicts must remain visible and recoverable.
  Preserve the pending state where supported; retrying a save must not rerun the
  purchase/reward command. Keep multi-tab, quota, pagehide and return checks.
- The additive `onboardingCompleted` flag belongs to campaign state and snapshots.
  New/reset campaigns start false; saves without it are treated as completed so
  existing players are not forced through onboarding. An unfinished fresh save
  resumes Market / placement / Start guidance from its current roster and supply.
- Supported Web Locks and a secure context are required by the current save
  design. Do not silently introduce a localStorage lock approximation. Physical
  Telegram client compatibility remains separate from desktop browser tests.
- Crops and passive production use timestamps, not animation frames. Preserve
  offline caps, consumed checkpoints and already-paid receipt acknowledgement.
  A changed browser origin requires an explicit save-transfer plan.
- Market income is active from campaign creation: level 1 earns 1 slave/hour.
  Each upgrade adds 1/hour and costs current level × 100 gold. Its additive
  `marketLevel` save field is normalized by `createMarketState`: legacy paid
  markets become level 2, retaining their 2/hour rate, fraction and checkpoint;
  legacy unbuilt markets become level 1 starting at restoration, with no backpay.
  Keep `marketBuilt: true` in snapshots for the old field's compatibility. New
  readers prefer a valid explicit level. Upgrades settle elapsed production at
  the old rate and preserve the fractional output; offline storage stays 4 hours.

## Combat, effects and drawing

- `combat.ts` advances the existing persistent fixed-step simulation. Keep its
  step remainder and ordering. Gameplay must not depend on rendered FPS, cosmetic
  retention or how often the UI refreshes. Test affected outcomes across FPS and
  battle speeds when timing changes.
- `Battle.projectiles` contains objects that can deliver gameplay effects;
  `Battle.effects` contains disposable visual feedback. Use independent IDs.
  Projectile arrival, damage, healing, poison, shield and stun belong to combat,
  never to scene drawing or visual-effect expiry.
- Use `combat-visuals.ts` for cosmetic creation/limits. Zero, saturated or cleared
  cosmetic storage must preserve authoritative state and ordered battle events.
  Observe real damage/healing through events, not visible numbers or flashes.
- Hero XP feedback is one cosmetic label above the castle after successful wave
  reward settlement. It uses the shared visual budget and lifetime, adds no new
  asset or timer, and never grants XP itself. Zero XP creates no label.
- Preserve each unit's actual rules. For example, the current rider glaive hits
  one target, and the Bombardier explosion is visual with no area damage. Artwork
  is not evidence that a new mechanic was approved. Document rule changes.
- `scene.ts` reads gameplay state and renders it; it must not mutate combat.
  Keep shared asset caching, rank-aware loading, authored frame/anchor data and
  disposal. Do not create/load images on each cast or start a loop per actor.
- Hidden application handling already stops the shared frame loop. Internal
  menus currently leave battle and both canvases running. Covering-screen render
  throttling is **not implemented**. Do not claim that `hidden`, `inert`, or a
  menu overlay automatically stops our JavaScript work.
- If screen throttling is authorized later, separate drawing visibility from
  battle simulation and passive production. Stopping the shared RAF currently
  also stops combat/auto-wave progression. Fully covered scenes can skip drawing;
  translucent menus require an explicit visual policy. Preserve the intended
  game behavior when adding independent farm/mine/dungeon screens.

## Verification and performance

- Cover new behavior and failure paths with meaningful tests; add comments where
  intent, ordering or invariants are not obvious. Do not add tests that merely
  duplicate implementation details. Preserve existing assertions during merges.
- Run focused checks while developing; before release run `npm.cmd run brotd:check`
  (strict types, Node tests and production build) and relevant browser suites.
  Batch related unit changes into one final verification. Repeat only after new
  changes/failures justify it. Deferred checks must be completed before release.
- For persistence/command changes, cover literal legacy saves, stable identities,
  rejected operations, duplicate settlement and reloads. For projectile changes,
  cover zero cosmetics, caster/target death, battle end and read-only rendering.
- Browser tests use disposable contexts, loopback servers with available ports
  and cleanup in `finally`. Never alter a player's real save. Close games,
  browser contexts and test servers afterward; preserve unrelated running servers.
- The optional `?profile=1` panel and isolated `profile.html` lab measure CPU work,
  not GPU completion. Ordinary play does not collect these profile samples.
  Keep bounded samples, explicit scenario metadata and save isolation.
- Use the following command from the repo root for repeatable simulation checks:

  ```powershell
  node --experimental-strip-types king-defense-toon/scripts/profile-combat.mjs --scenario all --seconds 30
  ```

  Add representative new abilities to coverage; label synthetic workloads clearly.
  Desktop timings do not prove Telegram Android/iOS performance. Measure real
  devices and identify a specific bottleneck before adding complex optimizations.

## Server boundary and publication

- This code is currently a local client. Save locks, typed commands, battle
  receipts and diagnostic checksums are not anti-cheat or server authority.
  Future purchases/competitive results require server authentication, validated
  commands, trusted balances/results and durable duplicate-request protection.
  Uploading an arbitrary client snapshot to D1 does not provide that protection.
- Follow `AGENTS.md` and `TELEGRAM.md`: an authorized "commit and push" also
  publishes the exact committed build to the existing `bro-infinity` Pages alias.
  Commit source and `public/king-defense-toon` together after building. Deploy
  from this game directory without rebuilding or including unrelated functions.
- Preserve the existing URL/origin. Verify remote SHA, non-force publication and
  deployment/alias identity. Do not invent Telegram links. User tests production
  gameplay personally; local browser checks do not authorize production play.
- Report the actual commit, checks, publication result and remaining limitations.
  Keep historical measurements/releases labelled by version instead of presenting
  them as evidence for an untested new build.
