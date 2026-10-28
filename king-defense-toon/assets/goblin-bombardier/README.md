# Goblin Bombardier — runtime visual kit

Ready for the game's Canvas 2D renderer. This pack does not register an enemy,
change waves, choose combat statistics or implement bomb damage.

The game now connects this visual kit through its enemy catalogue and shared scene
cache. See [BOMBARDIER_INTEGRATION.md](../../BOMBARDIER_INTEGRATION.md) for the live
1-11 to 1-19 mini-boss rules; the adapter examples below remain useful for previews.

| File | Dimensions | Bytes |
| --- | --- | --- |
| `body.webp` | 512 × 512 | 76,538 |
| `bomb.webp` | 128 × 128 | 3,242 |
| `explosion.webp` | 128 × 128 | 3,660 |
| **Total images** | | **83,440 (81.5 KiB)** |

The files are byte-identical copies of the approved compact exports in
`art/brotd-infinity/level-01/mini-bosses/goblin-bombardier/`. No PNGs, concepts,
GIFs or larger atlas variants are loaded. Geometry is bundled as TypeScript;
there are no separate JSON requests. Loading is explicit, so ordinary waves
do not download this pack before the enemy is introduced.

## Visual contract

- `goblin-bombardier-art.ts`: URLs, exact crops, anchors and `AnimationMetadata`
  compatible with `scene.ts`; nominal body height 59.8 world pixels (52 × 1.15).
- `tiny-goblin-bombardier.ts`: `idle`, `walk`, `shoot`, frozen `dead`/`death`,
  release-boundary detection, looping bomb and non-looping 0.4s explosion.
- `goblin-bombardier-visual.ts`: explicit loader, body/effect drawing and world
  muzzle position. It uses the same `sprite-animation.ts` renderer as current units.

The 16 body frames are idle 0–3, rolling 4–7, side shot 8–11 and downward shot
12–15. Upward shots use the side row, like the current goblin archer. Left-facing
shots mirror both the body and muzzle. There is no rear-view or destruction
atlas. Death freezes pose 0 and uses the existing fade (0.22s hold + 0.7s fade).

The muzzle flash and recovery smoke are already drawn into the body atlas.
Do not also put the impact explosion at the muzzle. The bomb uses its sphere
center; every explosion pose stays fixed at the same contact point.

## Connecting to combat later

```ts
import { loadGoblinBombardierVisual, drawGoblinBombardier,
  goblinBombardierMuzzle, drawCannonBomb, drawCannonExplosion }
  from './goblin-bombardier-visual.ts';
import { goblinBombardierReleased } from './tiny-goblin-bombardier.ts';

// Once when the owning scene needs this enemy; reuse its retained asset cache if present.
const art = await loadGoblinBombardierVisual();

// During rendering, using the same action clock and impactFraction as combat:
drawGoblinBombardier(ctx, art, enemy, enemy.x, enemy.y, battle.time);

// During simulation, once per step of this same shot (reset previousTime for each new shot):
if (goblinBombardierReleased(enemy, previousTime)) {
  const muzzle = goblinBombardierMuzzle(enemy, enemy.x, enemy.y);
  // Create the combat projectile here at muzzle.x / muzzle.y.
}

// Only while a projectile is alive:
drawCannonBomb(ctx, art, projectile.age, projectile.x, projectile.y);
// On contact, remove the projectile and start an impact effect with age 0.
const visible = drawCannonExplosion(ctx, art, impact.age, impact.x, impact.y);
// Remove that effect when visible === false.
```

Use action `shoot` and supply `actionDuration`, `actionTime`, `impactFraction`,
`facingX`, `facingY`, `walkTime`, `deathTime`, and optionally `visualScale` from
the simulation. `impactFraction` is projectile release, not arrival/damage.
Release detection crosses the boundary once even if an update skips pose 2;
never spawn projectiles merely because a render frame is 10 or 14.

If using the central scene catalogue instead of the standalone visual adapter,
register `GOBLIN_BOMBARDIER_ASSETS.body` and `GOBLIN_BOMBARDIER_METADATA`, retain
the two effect images only for scenes that need them, and use the same muzzle
and effect helpers. The caller owns positions, trajectory, collision, effect
lifetimes and resource retention. Enemy registration, wave selection, health,
damage, reload, range and any blast radius remain a separate gameplay change.

## Local preview and verification

Run `npm run brotd:dev` and open `/bombardier-preview.html`. The page exercises
the shared renderer, both shot rows, mirroring, bomb and explosion, with an
original swordsman for scale. Pause/scrub the timeline to inspect every pose.
The demonstration arc/flight time are confined to the preview, not combat.
This page is not included in the normal production build.

Tests: `node --experimental-strip-types --test king-defense-toon/tests/goblin-bombardier.test.mjs`.
They verify atlas identity/size, authored rectangles, grounded pivots, mirrored
muzzles, release across variable time steps, stable effect centers, one-shot
expiry, death fade and explicit loading/retry. Run `brotd:typecheck`, `brotd:test`
and `brotd:build` for the surrounding game checks.
