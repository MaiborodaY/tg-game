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
are **not type-checked yet**. A passing stage-1 check does not mean the whole
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

## Completion criteria and next stages

For every slice: type checking, relevant behavior tests and production build
must pass. Retain invalid-input handling at runtime. Preserve saved formats,
asset URLs, rewards and gameplay behavior; fix integration problems explicitly
rather than bypassing them with type assertions.

Next: type shared unit/wave definitions and the interfaces used by recruitment,
progression and economy. Then migrate combat/events and storage/cache APIs,
followed by rendering, Telegram/audio, DOM adapters and finally the main module.
Keep major architecture changes separate from mechanical migration steps.

The full migration is complete only when all active gameplay modules are
strictly checked, old bridges are removed, Node/CLI and browser checks still run,
old saves reload correctly, and the production build has no test-only hooks.
Physical Android/iOS Telegram checks remain distinct from desktop emulation.
