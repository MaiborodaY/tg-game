# BroTD Infinity: staged TypeScript migration

## Working branch and concurrent game development

Migration work lives in `codex/brotd-typescript`, in the separate
`.worktrees/brotd-typescript` worktree. Gameplay development can continue in its
own checkout. This stage does not publish or merge the migration into `main`.

The initial base was `d8bab9c`. During this stage the requested gameplay commit
`7a9a335` was found in `origin/codex/pixel-chronicle`, while fetched `origin/main`
was `3b1606d`. The integration checkpoint `c999295` combines both histories.
It preserves the hero, Lancer, goblin healer and the updated campaign alongside
fixed-step simulation, demand-loaded assets and protected storage from main.
The latest hero and Barracks fields use the protected save snapshot; renderer
resource plans include the new sprites and effects.

Before each later stage, fetch the agreed gameplay branch and merge its new
commits into this migration branch. Keep integration and migration changes in
separate commits, and rerun the affected checks. Do not reset either developer's
checkout or copy entire older files over newer gameplay changes.

## Stage 1 scope

The implementations of four independent runtime modules are now TypeScript:

- `battle-speed.ts`: supported speed values, selection and frame-time scaling.
- `fps.ts`: nullable FPS readings and meter configuration.
- `frame-pacer.ts`: nullable rendered-frame intervals and a paired clock state.
- `field.ts`: field/view geometry, walkable bounds and the hero entry point.

The corresponding `.mjs` files are temporary re-export bridges. They retain
current browser imports, test imports and dynamically constructed CLI paths,
reducing overlap with parallel edits to `main.mjs` and `combat.mjs`. There is only
one implementation of each module. New TypeScript callers should import the
`.ts` module explicitly and use `import type` for types. Remove bridges when all
their callers, including dynamic imports and browser harnesses, have migrated.

The compiler inherits `strict: true` and checks every root `.ts` module plus
`tests/types/**/*.ts`. The remaining JavaScript modules and their call sites
are **not type-checked yet**. A passing migration check does not mean the whole
game is typed. Runtime code has no `any`, `@ts-ignore` or `@ts-nocheck` escapes.
The intentional `@ts-expect-error` lines in compile-only tests verify that
invalid API usage is rejected, including nullable readings and immutable data.

## Commands

Run from the worktree root (use `npm.cmd` on Windows PowerShell):

```text
npm run brotd:dev
npm run brotd:typecheck
npm run brotd:test
npm run brotd:build
npm run brotd:check
```

`brotd:check` runs type checking, Node tests, then the production build. The
repository-wide `npm run typecheck` also includes BroTD. Vite's build alone does
not check types. TypeScript is already a development dependency; no additional
runtime dependency is introduced.

The verified local runtime is Node 22.13.0. Its direct TypeScript execution
requires `--experimental-strip-types`; `brotd:test` supplies it. Direct Node
commands that import game modules need the flag too, for example:

```text
node --experimental-strip-types --test king-defense-toon/tests/combat-timestep.test.mjs
node --experimental-strip-types king-defense-toon/scripts/combat-balance.mjs --cases path/to/cases.json --output path/to/results.json
```

The compiler restricts TypeScript to erasable syntax. Node runs the same modules
used by Vite, without a custom resolution loader or generated test build.
Browser suites use Vite to serve the game and remain separate commands; see
`STABILITY.md` and the feature browser tests. They are not implicitly included
in `brotd:check`. GitHub workflow installation remains a separate step because
the previously used credential lacked permission to update workflow files.

## Stage 1 validation

- `brotd:check` passed: strict type checks (including 12 negative API contracts),
  all 191 Node tests and the production Vite build.
- The direct Node CLI loaded the mixed JS/TS graph and completed a first-wave
  fixture without a timeout.
- Browser checks passed for asset demand/sharing/retry/release, 30 goblin palette
  cases, hero save/reload/XP/skills, drag/merge at 320/390px, and Barracks upgrade,
  timer, guarantee and recruitment flows at 320/390px.
- Before the TS conversion, the combined gameplay/stability checkpoint also
  passed five storage-recovery browser scenarios (including hero/Barracks
  persistence), 44 Lancer rendering cases and 60 goblin-healer rendering cases.
- The production output ran in Edge at 390x844: wave 9 advanced, the hero moved,
  hero/Lancer resources returned HTTP 200, and no JavaScript exceptions or
  development test hooks were present. The only missing local resource was the
  optional `/favicon.ico`. The external Telegram SDK was blocked by the test
  environment, so this was a standalone browser check.

These are local desktop Node/Edge checks, not physical Telegram-device results.

## Stage 2 scope

Seven more runtime implementations are TypeScript, bringing the total to eleven:

- `units.ts`: allied unit identifiers and immutable unit definitions.
- `recruitment.ts`: recruitment state, weighted chances, training progress,
  legacy training credit and derived personal-level stats.
- `unit-ranks.ts`: personal levels mapped to the four immutable palette ranks.
- `waves.ts`: the enemy catalogue and all 400 immutable wave definitions.
- `opening-curve.ts` and `campaign-curve.ts`: typed spawn builders and health /
  damage curves, with mutable builder output distinguished from frozen waves.
- `progression.ts`: formation cells, unlock spending, first-clear claims and
  legacy campaign-number migration.

`wave-types.ts` shares type-only definitions between the catalogue and builders
without introducing a runtime cycle. Existing `.mjs` paths remain thin bridges.
There is no second implementation and no new runtime dependency.

Save input stays `unknown` until its fields are validated. Campaign-number
migration returns an unvalidated record, not a falsely complete player-save
type: the existing loader still validates independent fields. Old campaign
claims, hero/Barracks data, unknown fields, malformed JSON handling and the save
key/version keep their previous behavior. Runtime guards continue protecting
JavaScript callers. No balance, reward or recruitment-probability change is
part of this stage.

The stage started from `4aed796`. A final fetch found `origin/main` at `c999295`
and `origin/codex/pixel-chronicle` at the requested `7a9a335`; both are already
ancestors of this migration branch, so no additional integration was needed.

## Stage 2 validation

- `brotd:check` passed: strict type checks, all **203 Node tests** and the
  production Vite build. Type tests now include **49 negative API contracts**,
  including 37 new cases for unknown save fields, identifiers, optional fields,
  nullable results and frozen data.
- Twelve new runtime tests cover migration/idempotence, malformed saves,
  first-clear reward protection, grid purchases, training credit, recruitment
  guards/guarantees, integer saturation and immutable catalogues.
- A snapshot taken before conversion matches after conversion: all 400 waves,
  all enemy and unit definitions, representative level/rank/stat inputs,
  recruitment/campaign-save normalization and wave freeze boundaries.
- An independent review compared runtime code with the previous checkpoint and
  ran 20,000 differential malformed/partial JSON cases against the old
  progression, campaign migration and recruitment implementations. No result
  or error mismatches were found.
- Five storage-recovery browser scenarios passed at 320x700, including reload,
  corruption recovery, combat rewards and offline-receipt acknowledgement.
- Barracks/recruitment browser checks passed at 320x568, 320x700 and 390x700:
  upgrade gating, timers/reload/offline completion, spending once, first-Lancer
  guarantee, equal unlocked chances and placement.
- The compiled production build passed a standalone Edge smoke at 390x844:
  wave 9 advanced, hero and army moved, hero/Lancer assets returned HTTP 200,
  and there were no JavaScript exceptions or development test hooks. The
  optional favicon was absent and the test environment blocked the external
  Telegram SDK; this does not replace a physical Telegram-device check.

## Stage 3 scope

Four more runtime implementations are TypeScript, bringing the total to fifteen:

- `economy.ts`: validated economy state, treasury income/upgrades, offline
  receipts, capture counters/guarantees and post-battle progress.
- `market.ts`: market state, purchase/production, offline claims and checkpoints.
  Its minimal producer type requires a slave balance without a runtime import
  back into the economy module.
- `barracks.ts`: nullable construction clocks, recruitment eligibility,
  completion/acceleration, first-Lancer guarantee and typed action results.
- `hero.ts`: hero state, talent/branch identifiers, definitions, prerequisites,
  point budget, combat-stat snapshots and XP outcome/reward contracts.

Factories accept `unknown` saved input and retain runtime validation. Internal
TypeScript callers use complete state and numeric/boolean inputs. The existing
JavaScript callers remain protected by the same runtime guards. Catalogues
remain immutable; live model state and derived combat snapshots remain mutable.
The four `.mjs` entry points remain thin bridges to the single TS implementation.

This stage starts from `d7780db`. Fetched `origin/main` remains `c999295`, and
`origin/codex/pixel-chronicle` remains `7a9a335`; both are included already.
No gameplay integration, balance adjustment, save-format change or new runtime
dependency is part of this stage. Combat, rendering and main/UI callers are
still JavaScript and are not yet covered by TypeScript checking.

## Stage 3 validation

- `brotd:check` passed: strict type checks, all **221 Node tests** and the
  production Vite build. Type tests now include **87 negative API contracts**,
  with 38 new checks for state/identifier types, nullable clocks, valid action
  results, numeric inputs and immutable definitions.
- Eighteen new runtime tests cover economic normalization, fractional income,
  four-hour offline caps, consumed absence, clock rollback, capture guarantee /
  random-call order, malformed construction state, safe-integer timer boundaries,
  hero mutation boundaries and catalogue/reward behavior.
- Independent review and **103,536 old/new differential comparisons** passed:
  constants/freeze behavior, malformed saves, return values, errors and complete
  state after economy, Barracks and hero operation sequences. Verification uses
  a fixed clock and random seed, and was repeated after source edits finished.
- Five storage-recovery browser scenarios passed, including offline receipts
  and combat-reward retry/reload protection.
- Barracks/recruitment browser checks passed at 320x568, 320x700 and 390x700,
  including timers, offline completion, spending once and first-Lancer guarantee.
- Hero browser checks passed at 320/390px: save/reload, battle snapshots, XP
  once, talent reset, and actual level-1/20 healing/hammer behavior at speed x3.
- The compiled production build passed a standalone Edge smoke at 390x844:
  wave 9 advanced, hero and army moved, required hero/Lancer assets returned
  HTTP 200, and no JavaScript exceptions or development hooks were present.
  The environment still blocks Telegram's external SDK, so this is not a
  physical Telegram-device result.

## Stage 4 scope

`combat.ts` moves the full combat simulation under strict checking, bringing the
total to sixteen runtime implementations. `combat-types.ts` adds type-only
contracts for formation input, actors, hero ability queues, battle state, events
and effects. The hero has its own required stats/ability fields; ordinary actors
do not pretend to carry them. Event/effect kinds retain their own payloads rather
than one bag of optional properties.

The simulation retains the fixed 1/60-second step, frame catch-up cap, targeting,
movement, damage/healing formulas, projectiles, enrage, rewards and mutable
castle/king alias. Fields added only when needed (such as attack counts, detours
and an arrow's landed flag) remain optional instead of changing runtime objects.
The frozen hero-stat snapshot and shared wave definitions remain distinct from
mutable combat actors and effects.

Two existing API signatures are clarified without changing their runtime:
`getHeroStats` accepts the absent hero state already used by fresh battles, and
`getEnemyCombatType` types the identity fallback for allied/hero/castle IDs while
mapping enemy IDs to combat roles. Raw saved heroes still enter through
`createHero`; this is not a blanket relaxation of the internal state contracts.

`combat.mjs` remains a compatibility bridge for main, rendering, Node tests and
the dynamic balance CLI. Hero and drag/merge browser harnesses now wrap exports
at that bridge, keeping test instrumentation independent of Vite's TypeScript
output format. Production source receives no test hooks.

The stage starts from `36f6453`, with fetched `origin/main` at `c999295` and the
requested gameplay commit `7a9a335` already included. No gameplay/balance change
is part of this stage; rendering, storage/cache and main/UI remain JavaScript.

## Stage 4 validation

- `brotd:check` passed: strict type checks, all **223 Node tests** and the
  production Vite build. Type tests now include **106 negative API contracts**,
  with 19 new checks covering actor kinds, hero-only state, nullable queues,
  event/effect payloads, frozen snapshots and supported input types.
- Two new runtime tests cover simultaneous lethal projectiles awarding one
  reward, missing projectile targets, and hero death during effect processing:
  a queued hammer is cancelled while an ordinary arrow outlives its archer.
- Independent old/new comparison matched all **400 initial wave states**,
  **40 completed battles** (23 victories / 17 defeats) and **24 edge fixtures**.
  It compared **40,644 complete frame states** and **2,082 ordered events**,
  including effects, visual timers, actor aliases and unchanged saved input.
  All 17 actor kinds, 8 effects and 3 hero abilities were observed. Complete
  battles were sampled across campaign/boss/undead encounters, FPS, jitter and
  speeds x1/x2/x3; all 400 waves were not simulated to completion.
- Runtime-code review found only equivalent hero-construction/local-alias
  changes after types were removed. A review finding in the generic `EffectOf`
  alias was fixed so unions cannot mismatch effect kind and payload; a negative
  type contract protects it. Rule completeness and required enemy alias
  mappings are checked at their catalogue definitions.
- Hero browser integration passed at 320/390px, including save/reload, battle
  snapshots, XP once, reset and actual level-1/20 healing/hammer at speed x3.
- Drag/merge browser integration passed at 320/390px with touch, mouse, cancel,
  native scrolling and reload checks. Five storage-recovery scenarios passed,
  including retrying combat-reward saves without awarding twice.
- The compiled production build passed a standalone Edge smoke at 390x844:
  wave 9 advanced, hero and army moved, hero/Lancer assets returned HTTP 200,
  and there were no JavaScript exceptions or development test hooks. The
  environment still blocks the external Telegram SDK; real Telegram devices
  remain a separate verification step.

## Stage 5 scope

Two more runtime implementations are TypeScript, bringing the total to eighteen:

- `save-storage.ts`: the lazy storage backend, read/write failures, protected
  retries, explicit reset confirmations and the public result protocol.
- `asset-cache.ts`: shared pending loads, scene retention/release, eviction,
  failed-load retries and image loading with bounded attempts/timeouts.

The save adapter's optional generic constrains outgoing snapshots only. Loaded
JSON and decoder output remain untrusted fields (`Record<string, unknown>`), or
`null` for an absent slot. Gameplay factories still validate individual fields.
The result types require callers to distinguish failure, a completed write and
a successful read retry that still needs restoration. A successful retry does
not imply a ready status or permission for background saves to replace the slot.
Thrown values remain `unknown`; confirmation tokens remain instance-local
symbols. No save keys, formats, reward rules or reset behavior are changed.

A cache's value type is fixed for its lifetime rather than re-invented on each
lookup. Its default is `unknown`; the scene can choose its actual resource union
when rendering migrates. `loadImage` returns `HTMLImageElement` by default and
the supplied constructor's instance type for injected loaders. The loader keeps
the original async timing, promise identity, cleanup and retry behavior.

Both `.mjs` modules remain compatibility bridges. The scene resource planner
and generated graphic catalogues stay with the rendering stage: their URLs are
currently coupled to still-JavaScript animation metadata and callbacks. This
stage adds no unchecked declarations or `any` escapes to conceal those imports.

The stage starts from `116aec0`. A fresh fetch found `origin/main` at `c999295`
and `origin/codex/pixel-chronicle` at the requested `7a9a335`; both are already
included. No integration or publication to `main` was needed.

## Stage 5 validation

- `brotd:check` passed: strict type checks, all **230 Node tests** and the
  production Vite build. Compile-only tests now include **136 negative API
  contracts**, with 30 new checks for saved-field validation, nullable loads,
  restoration/reset results, write contracts, cache value/key types and image
  constructor inference.
- Seven new runtime tests cover retry before initial restoration, reset tokens
  across slots/reloads, absent-slot decoding, non-Error failures, malformed
  serialized snapshots, retained-key snapshots, pending-load reuse across scene
  replacement and cleanup of timed-out image attempts.
- Independent old/new comparison matched 96 save scenarios (**11,808 operations**),
  60 cache scenarios (**5,700 operations**) and 24 image-load scenarios. Results,
  statuses, writes, thrown values, confirmation tokens, shared promises and
  cleanup matched. This uses injected Storage/Image implementations and controlled
  timers, not real browser quota/network behavior or exhaustive interleavings.
- Independent review confirmed equivalent runtime changes. Write methods use
  function-property contracts so assigning an adapter to a broader snapshot type
  cannot bypass its required fields; a negative type test protects that boundary.
- Per the user's updated testing sequence, browser checks are deferred until
  `main.mjs` has migrated. Earlier browser results are historical evidence, not
  browser validation of this stage. Physical Telegram-device checks remain a
  separate final step.

## Completion criteria and next stages

For every slice: type checking, relevant behavior tests and production build
must pass. Retain invalid-input handling at runtime. Preserve saved formats,
asset URLs, rewards and gameplay behavior; fix integration problems explicitly
rather than bypassing them with type assertions.

Next: migrate rendering and its resource/animation catalogues, followed by
Telegram/audio, DOM adapters and finally the main module.
Keep major architecture changes separate from mechanical migration steps.

The full migration is complete only when all active gameplay modules are
strictly checked, old bridges are removed, Node/CLI and browser checks still run,
old saves reload correctly, and the production build has no test-only hooks.
Physical Android/iOS Telegram checks remain distinct from desktop emulation.
