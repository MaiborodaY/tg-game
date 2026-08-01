# Tower Defense architecture

This document records the boundaries that must stay intact while the PvE game
grows. PvP remains outside this architecture; the first PvE heroes are included.

## Runtime flow

```text
content catalog + saved RunState
              |
              v
       GameSimulation  <--- player commands
              |
       read-only view + domain events
              |
              v
    TowerDefenseScene (Phaser rendering, input and effects only)
              |
              v
       main.ts (DOM UI, Telegram and reward adapter)
```

- `game/content.ts` owns stable level and mode IDs, routes, build pads, hero
  anchors and wave factories. New PvE content is registered here instead of
  branching in the scene.
- `game/heroes.ts` owns immutable hero definitions, ranks, upgrade gates and
  combat parameters. Hero attacks, auras and abilities are resolved only by
  `game/simulation.ts`.
- `game/simulation.ts` is the canonical, Phaser-free battle. It advances at a
  fixed 60 Hz step, accepts commands and emits domain events. Tests can run it
  headlessly and replay the same command trace deterministically.
- `rendering/TowerDefenseScene.ts` converts simulation views into Phaser
  objects. It must not become the source of truth for health, economy, wave
  completion or scoring.
- `game/lazyRuntime.ts` keeps the Phaser renderer behind one retry-safe dynamic
  import and one shared mount. Launch errors and pending reward submissions do
  not load Phaser; a fresh intro waits for the player's start action, while a
  restored live run mounts it before the field becomes interactive.
- `main.ts` owns DOM presentation and adapters to Telegram/reward APIs. A server
  reward launch uses the validated content binding returned by `/start`;
  practice choices cannot alter that run. The backend currently binds rewarded
  runs to the released `forest-gate/campaign` and `forest-gate/endless` modes.

## State ownership

`RunState` is a disposable checkpoint for one match: selected content IDs,
gold, lives, wave progress, time, the selected hero and tower placements. Save
keys are isolated by run, level and mode, and old saves are migrated into schema
v5 with a deterministic Eira fallback for pre-hero checkpoints. Awakening is
derived from rank and completed-wave progress; ability charges, marks, barriers
and gate shields are transient wave state owned by the simulation. Rewarded
checkpoints live in browser `localStorage`; they resume on the same device but
are not a cross-device cloud save.

`PlayerProfileSnapshot` is the browser transport for a D1-backed cross-run model
of level unlocks and best finite-campaign results. Cosmetic fields are reserved
in the transport for a later phase; the backend does not persist cosmetics or
loadouts yet. The profile must never contain run tokens, gold, lives, active
timers or placements. Its mutation helpers are domain primitives, not
authorization: only trusted server code may decide that an unlock, result or
cosmetic grant is legitimate.

Reward credentials and the full `/start` bootstrap are kept in
`sessionStorage`, never `localStorage`. When the Mini App is reopened without
that session cache, the authenticated backend returns the same unexpired
`run_id` and a rotated token. That identity selects the existing local
checkpoint. Finishing the run settles the reward ledger first and then projects
the result into the D1 profile idempotently; a duplicate finish may retry a
pending projection. If another WebView rotates the token, a rejected finish
refreshes authorization through `/start` and resubmits only when the backend
returns the same `run_id`.

DOM/Phaser UI state is derived from the simulation and is never persisted as
gameplay truth.

## Trust boundary

The browser is untrusted. Validation of local saves protects compatibility and
crash safety; it is not anti-cheat. A run token and idempotent finish endpoint
protect run identity and duplicate settlement, but a score supplied by the
browser still cannot prove that the battle was played honestly.

Before competitive ratings, valuable progression rewards or any economy tied
to new PvE modes are enabled, the server must verify an authoritative result
(for example, by replaying a bounded command log against the exact content
version). Client-side signatures or localStorage metadata do not solve this.

The current server profile is therefore a PvE foundation, not proof of fair
play. `northern-pass` remains preview content: the production client exposes
only `forest-gate`, while the full catalog is available only to a local Vite
development practice launch. PvP remains outside this phase.
Eira and Toren are available without profile unlocks. Grak is derived from a
trusted profile result: a full `forest-gate` campaign victory. Hero rank and
anchor remain run-local and are deliberately absent from the permanent profile.
Production requires that profile proof for a new Grak selection. An existing
Grak checkpoint remains resumable when bootstrap profile transport is
temporarily unavailable, so a reload cannot destroy valid progress. Local Vite
development can opt into `?preview_hero=grak` for visual QA; the branch is
removed from production builds through `import.meta.env.DEV`.

The public `/start` binding still uses content version 2, so hero releases keep
that value for backend compatibility and distinguish deterministic replays with
the internal `heroes-v3` rules suffix. A future authoritative
rating rollout must coordinate a new content version with the backend; changing
only the client would make old and new balance rules indistinguishable to the
server.

## Adding content safely

For a new level:

1. Add a stable ID and immutable `LevelDefinition` in `game/content.ts`.
2. Add localized display names and expose it through an unlock policy.
3. Add catalog validation, save-boundary and headless simulation tests.
4. Verify the field at compact Telegram viewport sizes.

For a new enemy or tower:

1. Add its typed definition and pure combat behavior under `game/`.
2. Extend the exhaustive visual mapping under `rendering/`.
3. Add focused behavior tests and include it in the endless soak test.

For a new hero:

1. Add the typed immutable definition under `game/heroes.ts`.
2. Add explicit simulation commands, state and deterministic behavior under
   `game/`; keep Phaser limited to input and effects.
3. Extend the exhaustive code-native visual mapping under `rendering/`.
4. Cover upgrades, abilities, save migration and replay determinism with
   headless tests.

## Performance rules for Telegram WebViews

- Simulation work uses fixed steps and remains independent of render FPS.
- Path sampling and other hot loops reuse scratch objects.
- Enemy art, projectile objects and hero combat effects are pooled by the
  Phaser adapter.
- Visual depth is updated in buckets rather than sorted on every pixel.
- Phaser is emitted as a stable lazy vendor chunk. Fingerprinted files under
  `/td/assets/` use a one-year immutable browser cache, while `/td/` HTML must
  remain revalidated so it can point at new hashes.
- The headless 36-wave `forest-gate` endless soak guards against stalled progression and
  unbounded enemy growth. Device profiling is still required before raising
  simultaneous enemy counts or adding expensive shaders/particles.
