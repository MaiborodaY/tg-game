# Forgotten Graveyard map and bosses

Runtime art is copied from the approved catalog in `main`, integrated at
`5135f34dcf956aceb03cf693c522fa20b1f78981`. Only the lite WebPs ship to players.

| Runtime file | Catalog source under `art/brotd-infinity/level-02/` | Bytes |
| --- | --- | ---: |
| `web/forgotten-graveyard.webp` | `maps/forgotten-graveyard/forgotten-graveyard-780x1080-lite.webp` | 159,242 |
| `web/crypt-spider.webp` | `mini-bosses/crypt-spider/crypt-spider-768-lite.webp` | 205,530 |
| `web/crypt-king.webp` | `bosses/crypt-king/crypt-king-768-lite.webp` | 127,576 |

Total additional image payload: **492,348 bytes**. Each file is byte-identical to
its approved export. The PNG originals, alternate resolutions, concepts and review
previews remain outside the runtime bundle. No runtime image conversion is used.

## Map

The 780 × 1080 opaque map is drawn whole at logical 390 × 540, preserving the
authored approach, deployment area and king lane. Both canvases select the same
level, including preparation, results and return to an earlier level. The Army
view keeps its existing crop at (42, 256), 306 × 188. Dark swamp water continues
into spare viewport space. Two quiet glints follow the crypt's violet flames.
Both maps and all sprites are decoded once and shared by the canvases.

## Bosses

Local wave 5 uses **Crypt Spider** instead of Goblin Chief; local wave 10 uses
**Crypt King** instead of Ogre. Escorts, spawn times, HP, damage, range, movement,
attack timing and kill rewards are unchanged. They keep the old chief/ogre combat
roles through `getEnemyCombatType`, while using distinct art and names.

`graveyard-boss-art.mjs` embeds all 32 crop rectangles exactly as supplied in the
catalog's frame JSON. Anchors are relative to the nominal 192px cells; their
ground positions exclude extended legs and the bell. Spider body height is 54
logical pixels; Crypt King is 72. Four idle, four walk, four side attack and four
down attack poses use the existing selector, with contact at local pose 2.
The ordinary health bar sits above each body. Missing images retain their old
Level 1 fallback art. There are no death or upward-attack frames in the supplied
set, so the existing fade and side-attack fallback remain.

Source-art note: Crypt King frame 14 contains a tiny white square near the
shoulder. It is baked into the approved sprite and is retained here; cropping it
would also remove part of the hand.

## Validation

All Level 1 wave definitions match the pre-change snapshot exactly. Every Level 2
spawn retains its prior HP, damage, reward, coordinates and timing; only the two
boss types/names change. Source files and runtime copies match, and every explicit
frame rectangle matches the catalog. Static sprite sheets and frozen scene
renders were inspected without running combat. Isolated browser previews fit at
390 × 844, 390 × 700 and 320 × 568; both canvases share one request per new image.
Level selection was checked at global waves 1, 10, 11, 15 and 20, including the
campaign-complete screen. Combat updates were replaced by a throwing stub for
these checks and were never invoked. No persistent test suite was added.
