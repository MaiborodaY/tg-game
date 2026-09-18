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

## Completion criteria and next stages

For every slice: type checking, relevant behavior tests and production build
must pass. Retain invalid-input handling at runtime. Preserve saved formats,
asset URLs, rewards and gameplay behavior; fix integration problems explicitly
rather than bypassing them with type assertions.

Next: migrate combat state/events using the typed unit, wave, economy and hero
contracts, then storage/cache APIs,
followed by rendering, Telegram/audio, DOM adapters and finally the main module.
Keep major architecture changes separate from mechanical migration steps.

The full migration is complete only when all active gameplay modules are
strictly checked, old bridges are removed, Node/CLI and browser checks still run,
old saves reload correctly, and the production build has no test-only hooks.
Physical Android/iOS Telegram checks remain distinct from desktop emulation.
