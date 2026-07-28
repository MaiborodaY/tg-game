# Tower Defense architecture

This document records the boundaries that must stay intact while the PvE game
grows. It deliberately excludes PvP and heroes.

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

- `game/content.ts` owns stable level and mode IDs, routes, build pads and wave
  factories. New PvE content is registered here instead of branching in the
  scene.
- `game/simulation.ts` is the canonical, Phaser-free battle. It advances at a
  fixed 60 Hz step, accepts commands and emits domain events. Tests can run it
  headlessly and replay the same command trace deterministically.
- `rendering/TowerDefenseScene.ts` converts simulation views into Phaser
  objects. It must not become the source of truth for health, economy, wave
  completion or scoring.
- `main.ts` owns DOM presentation and adapters to Telegram/reward APIs. A server
  reward launch uses the validated content binding returned by `/start`;
  practice choices cannot alter that run. The backend currently binds rewarded
  runs to `forest-gate/campaign`.

## State ownership

`RunState` is a disposable checkpoint for one match: selected content IDs,
gold, lives, wave progress, time and tower placements. Save keys are isolated by
run, level and mode, and old saves are migrated into schema v4. Rewarded
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
play. `northern-pass` is a non-economic unlock; heroes and PvP remain outside
this phase.

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

Heroes should later enter as their own content definitions plus explicit
simulation commands/components. They should not be implemented as special
branches inside the Phaser scene.

## Performance rules for Telegram WebViews

- Simulation work uses fixed steps and remains independent of render FPS.
- Path sampling and other hot loops reuse scratch objects.
- Enemy art and projectile objects are pooled by the Phaser adapter.
- Visual depth is updated in buckets rather than sorted on every pixel.
- The headless 36-wave endless soak guards against stalled progression and
  unbounded enemy growth. Device profiling is still required before raising
  simultaneous enemy counts or adding expensive shaders/particles.
