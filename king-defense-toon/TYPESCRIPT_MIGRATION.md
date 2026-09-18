# BroTD Infinity: staged TypeScript migration

**Status: gameplay migration complete**, including `main.ts`, direct runtime
imports, Node/CLI validation and desktop browser checks. The stage history below
records earlier boundaries; references to remaining JavaScript in those sections
describe their checkpoints. Final integration is based on freshly fetched
`origin/main`; see the completion section below.

## Working branch and concurrent game development

Migration work lives in `codex/brotd-typescript`, in the separate
`.worktrees/brotd-typescript` worktree. Gameplay development can continue in its
own checkout. The incremental stages remained isolated until the completion
checks and the user's request to integrate the result with `main`.

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

## Stage 6 scope

The renderer and its complete runtime dependency chain are now TypeScript:

- `scene.ts` and `scene-types.ts`: Canvas rendering, scene state/updates, asset
  notifications, hit testing, event callbacks, retry and lifecycle cleanup.
- `scene-assets.ts`, `tiny-map.ts`, `graveyard-map.ts` and `asset-web.ts`: resource
  planning, map composition and the generated portrait manifest.
- Eleven animation helper implementations (`ally-animation` and the `tiny-*`
  pose helpers), with minimal pose contracts in `animation-types.ts`.
- Ten root art catalogues plus generated `assets/goblin-healer/geometry.ts`,
  with shared sprite/animation contracts in `art-types.ts`.

This adds 26 root runtime implementations, bringing that count to **44**,
plus the generated healer geometry module (**45 runtime TS modules** including
that nested module). Type-only files are not included in those counts.

The four generators that write runtime catalogues now write checked `.ts`
sources and retain the compatibility `.mjs` bridges. A small pure code-generation
helper permits output checks without rewriting source images. Existing asset
URLs, dimensions, crops, palette selection, freeze boundaries, animation clocks,
Canvas transforms and gameplay formulas remain unchanged.

Enemy animation metadata must cover the complete `EnemyType` catalogue. Resource
lookup assertions are limited to the internal plan's image keys and map key;
their producers remain separate within the same shared cache. The scene accepts
partial state updates as before. Cross-field army/merge-preview invariants still
belong to the UI/main boundary: the current JS caller supplies personal levels
and merge levels together, but partial scene updates alone do not enforce that
relationship. That caller has not yet been type-checked.

The stage starts from `086aba0`. A fresh fetch found `origin/main` at `c999295`
and the requested gameplay branch at `7a9a335`, both already included. `main.mjs`
and UI/audio/Telegram implementations remain JavaScript for subsequent stages.

## Stage 6 validation

- Strict type checking passes, including **190 negative API contracts** (54 new)
  for frame/geometry types, asset plans, nullable lookups, scene state and callbacks.
- The Node suite now has **246 tests**, including 16 new animation, catalogue,
  resource-plan and scene lifecycle scenarios. Canvas mocks check finite numeric
  drawing commands and balanced save/restore, shared resource ownership, image
  failure/retry, coordinate conversion, stale requests and late completion after
  destruction. They do not render real pixels.
- Independent helper comparison matched **1,048,812 calls** over 9,117 pose
  fixtures and preserved 14 exported constant/freeze structures. Catalogue
  comparison matched 367 objects and 1,453 scalar values across 11 modules.
- **919 resource plans** matched the baseline, including all 400 waves in both
  battlefield and formation modes. Both maps matched **3,822 Canvas commands**
  over six cases, including the existing unavailable-context failure behavior.
- An isolated old/new renderer comparison matched **37,790 Canvas commands**
  across 39 renders, 15 actor types and eight effect types. Both renderers used
  the current dependencies (checked separately) and injected image dimensions;
  this is command parity, not a browser or screenshot comparison.
- Catalogue generation round trips match their TS sources/bridges without
  regenerating images. Independent review confirmed generator coverage and
  equivalent runtime changes. A legacy helper can return an absent frame for
  invalid numeric clocks; its return type is now honest, with positive/negative
  contracts and a runtime regression test. Its old runtime behavior is retained.
- Production Vite build passes. Browser and physical-device checks remain
  deferred until after the main-module migration, as requested.

## Stage 7 scope

Three more runtime implementations move to TypeScript: `audio.ts`, `music.ts`
and `telegram.ts`. There are now **47 root runtime TS modules**, plus the nested
healer geometry module (**48 total**). Existing `.mjs` imports remain thin bridges
until their callers migrate.

Audio controllers expose read-only state, boolean activity/mute inputs, numeric
music volume/level inputs and asynchronous unlock results. Their Web Audio graph
references are nullable until construction succeeds. The optional WebKit
constructor is described locally without adding ambient globals or dependencies.
Existing gesture authorization, pending-playback generation guards, preference
keys, track URLs, gain values and cleanup behavior remain unchanged. Bow effects
remain deliberately disabled; moving their implementation does not enable them.

The Telegram adapter describes only the host, document, root and SDK operations
it uses. Optional methods keep version gates and error handling; external inset
and viewport values still pass runtime validation. Its returned controller stays
frozen. Telegram presence is UI detection, not authentication.

The stage starts from `f19acd5`. A fresh fetch found `origin/main` at `c999295`
and the requested gameplay branch at `7a9a335`, both already included. There is
no gameplay integration, balance change, main-branch publication or SDK upgrade.
Army/UI adapters and `main.mjs` remain JavaScript and are not yet type-checked.

## Stage 7 validation

- `brotd:check` passes: strict type checking, all **270 Node tests** and the
  production Vite build. There are **222 negative API contracts**, including
  32 new checks for audio state/setters, asynchronous unlock, SDK arguments,
  event names, host/root shapes and the frozen Telegram controller.
- Twenty-four new Node tests cover disabled bow effects, saved music preference
  precedence/normalization, lazy graph creation, native/WebKit capability checks,
  blocked storage, unavailable devices, autoplay retry, late playback completion,
  destruction, Telegram UI detection, version gates, visibility, closing
  confirmation, viewport/inset fallbacks, partial clients and listener cleanup.
- All eight music tests also pass against the original `f19acd5` implementation.
  A separate comparison of temporarily enabled bow-audio copies matches
  **16 lifecycle/error scenarios and 243 trace operations**, including stale
  resume/fetch/decode, voice limits, throttling and cleanup. Only ignored test
  copies enable that flag; the shipped feature remains disabled.
- Telegram matches the old implementation across **162 scenarios and 8,262
  snapshots** of state and ordered calls, including nine client versions,
  detection/visibility combinations, partial or failing SDK methods, invalid
  viewport/inset values and repeated suspend/resume/destroy operations.
- Independent code review found no migration regressions. Comparing JavaScript
  emitted after removing types preserves Telegram's complete runtime and the
  music/audio logic, apart from equivalent local aliases and split declarations.
  SDK method calls retain their receiver; nullable graph assertions are limited
  to references initialized by successful construction.
- These checks use injected SDK, storage, media and Web Audio implementations.
  They do not verify real sound output, device autoplay policies or live Telegram.
  Browser checks remain deferred until after migrating `main.mjs`, as requested.

## Stage 8: completion

The final six original gameplay implementations (`army-plan`, `unit-merging`,
`unit-drag-gesture`, `unit-drag`, `hero-ui` and `main`) are TypeScript. Three small
boundaries now have their own modules: `main-dom.ts` maps static template IDs to
their actual HTML element types; `campaign-roster.ts` validates saved fighter
fields; `campaign-save.ts` validates campaign decoding before writes are allowed.
This brings the total to **57 runtime TS modules**, including generated healer
geometry. CSS declarations and type-only modules are excluded from that count.

All runtime `.mjs` bridges are removed. HTML, tests, balance tools, asset generators
and the separate hero asset viewer use the direct `.ts` modules. Generators no
longer recreate bridges. Historical balance comparisons may explicitly select
an old checkout through a TS-first/JS-fallback tool loader. Tooling, tests, Vite
configuration, the asset viewer's own entry and archived designs may remain JS;
they are not unchecked production gameplay modules.

`main.ts` now checks its save snapshot, deployed versus reserve units, nullable
selections, drag ownership, DOM controls, scene callbacks and battle-result fields.
Personal levels are required on saved fighters. Controller state and combat state
stay separate; rewards/XP retain their once-per-result guard. Runtime code has no
`any`, `@ts-ignore` or `@ts-nocheck` escape. The HTML/type contract test detects
missing IDs and changed element tags.

Independent review found two existing malformed-save problems at the newly typed
boundary. Invalid unit identifiers (including inherited names and coerced arrays)
are rejected, and nonnumeric coordinate objects are skipped before interpolation.
An uncoercible `clearedWaves` value is now rejected by the protected decoder,
before storage enables writes; the original bytes cannot be replaced by a
partially restored campaign. These are deliberate invalid-input fixes, covered
by Node and browser regressions. Valid saves, save keys, personal levels, balance,
rewards, input gestures and the original loading/audio lifecycle are preserved.

The stage starts from `d9aae20`. Fetched `origin/main` is still `c999295`; requested
gameplay commit `7a9a335` is already included. Work remains on the isolated
`codex/brotd-typescript` branch.

## Final validation

- `brotd:check` passes: **295 Node tests**, **254 negative type contracts**, strict
  compilation of the complete gameplay entry graph and the production build.
  Direct early-campaign CLI execution also completes its first-wave fixture.
- Independent comparisons match 346 merge cases, 483 army commits and 276 hero
  UI scenarios / 3,312 DOM snapshots. All 18 gesture/drag tests pass against both
  the old and new implementations. Roster restoration matches 1,976 ordinary /
  legacy fixtures; malformed identifier/coordinate cases are the explicit fixes
  described above. Main lifecycle/reward and emitted-runtime review passes.
- All **nine browser suites** pass: asset loading, storage recovery, drag/merge,
  hero, Barracks, Lancer, goblin palettes, goblin healer and St. Knihor rendering.
  Storage has nine scenarios, including malformed current-version progress that
  preserves its original bytes with zero write attempts. Touch/mouse flows run
  at 320/390px; Barracks also covers 320x568. Art checks include 44 Lancer, 30
  palette/world, 60 healer and 24 hero action/direction combinations.
- The final production build runs in the Codex in-app browser on a fresh local
  origin. Using only the visible controls, three recruits were obtained and
  deployed (two swordsmen and one healer). Wave 1 was won at x3: **3/3 enemies,
  castle 100 HP, +13 gold, +16 hero XP**. Reload restores three deployed fighters,
  cleared wave 1 and preparation for wave 2. Console warnings/errors are absent.
- The production bundle contains no browser-test hooks. All disposable test
  browsers/servers are closed; the manually opened game tab is explicitly closed
  and its preview server stopped after verification.

These are desktop browser and simulated-mobile checks, not physical Android/iOS
Telegram WebView validation or a fresh balance/performance audit of all 400 waves.

## Completion and integration with main

The finalization pass fetched `origin/main` at `c999295` on 2026-09-18. That
commit and the requested gameplay revision `7a9a335` are ancestors of this
branch; there are no newer main-only commits or integration conflicts. The
combined result can therefore advance `main` by a normal fast-forward, without
replacing any independent gameplay history.

The storage browser suite now includes literal fixtures for campaign versions
1, 2 and an unversioned save. Each loads through `main.ts` and survives two
reloads. Checks preserve gold, slaves, army/reserve positions and personal
levels, unlocked cells, first-clear claims, recruitment credits, hero talents
and buildings. Missing legacy defaults are applied once. Old completed wave 10
maps to 200; old completed wave 20 maps to 210, retaining the expected biome.
A real replay of an already claimed first wave grants only 3 kill gold and
4 replay XP; reload cannot grant another reward or a first-clear bonus.

All nine storage/recovery scenarios pass at 320x700. The finalization pass also
reruns the hero, drag/merge and Barracks browser suites, plus `brotd:check`
(295 tests, strict types and production build), successfully. Runtime code and
the production bundle remain unchanged from `047afe7`; this final commit adds
legacy browser regressions and completion documentation. Disposable browsers
and servers are closed after the checks. The earlier manual in-app first-wave
verification remains applicable to the identical production bundle.

## Maintenance and release boundary

For every slice: type checking, relevant behavior tests and production build
must pass. Retain invalid-input handling at runtime. Preserve saved formats,
asset URLs, rewards and gameplay behavior; fix integration problems explicitly
rather than bypassing them with type assertions.

The requested migration is complete. Keep major architecture changes separate.
Final integration uses a normal fast-forward of the freshly fetched `main`,
preserving both the gameplay and migration histories. A Git push is not proof
that a hosting deployment or physical-device verification has finished.

The full migration is complete only when all active gameplay modules are
strictly checked, old bridges are removed, Node/CLI and browser checks still run,
old saves reload correctly, and the production build has no test-only hooks.
Physical Android/iOS Telegram checks remain distinct from desktop emulation.
