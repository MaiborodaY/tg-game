# Biomes and creatures

The existing 200 global levels form ten biomes of twenty levels each. The HUD
shows biome–local level, so global level 21 is **2–1**. Every level still has ten
waves. Scenery stays the same for the whole biome. Equipment epochs and their
forge probabilities remain independent of location.

| Biome | Global levels | Environment | Ruler on level 20 |
| --- | --- | --- | --- |
| Whispering Woods | 1–20 | Green forest, original trees | Goblin King |
| Spore Marsh | 21–40 | Teal pools, giant mushrooms, hollow stumps | Mire Monarch |
| Bone Canyon | 41–60 | Red sandstone, rib arches, skulls | Ribmaw |
| Frozen Kingdom | 61–80 | Snow, ice towers, crystals | Rime Regent |
| Sunset City | 81–100 | Coral masonry, clock towers, lamps | Clockwork Magistrate |
| Living Foundry | 101–120 | Pipes, gears, reactor tanks | Furnace Heart |
| Alien Moon Garden | 121–140 | Alien pods, toothy flowers, coral plants | Moonbloom Devourer |
| Time Rift | 141–160 | Broken arches, floating stairs, hourglasses | Broken Colossus |
| Ashen Underworld | 161–180 | Basalt, ember cracks, chains | Cinder Maw |
| Sky Archipelago | 181–200 | Floating islands, temples, cloud trees | Eclipse Archon |

Each biome has a melee fighter, a ranged fighter and a healer. On the tenth
wave, levels 1–19 use the biome boss sprite at size 88; level 20 uses the same
ruler at size 128. Every tenth wave has two melee guards, the commander/ruler, one ranged
fighter and one healer, ordered from front to back. Three melee enemies can
attack together, including the boss; a fourth waits and fills a vacancy.

Ordinary packs grow within each biome: local levels 1–5 have 2–3 enemies, 6–10
have 3–4, 11–15 have 4–5, and 16–20 have 5–7. The first global level keeps its
nine short, single-enemy teaching waves and then uses the full boss escort.
Waves 1–3 start small, 4–6 alternate pressure and a breather, and 7–9 finish
strong. The last wave before the boss reaches the stage's maximum pack size.
There are at most four regular melee, two ranged enemies and one healer.

`WAVES` holds five fixed ten-wave presets: the tutorial and four density bands.
The opening and middle trios rotate deterministically with level and biome;
the final waves keep their order. Retrying a level reproduces the same packs.
Individual HP, damage, attack intervals and drops still use the balance table;
larger groups increase the total incoming damage, fight length and rewards.

The forest keeps its original four goblin strips. Nine generated sheets add
36 creature designs. `enemies-prompt.txt` records each brief; `enemies-source.png`
is the selected original. Rejected versions are not runtime assets.

## Preparing a sheet

Generate a transparent sheet with four rows (melee, ranged, healer, ruler) and
eight columns: idle, four walk poses, windup, attack/cast, defeated. All creatures
face left. Request simple flat cel shading, thick dark outlines, distinct
silhouettes, a fixed design and scale per row, and generous transparent gutters.
Fit extended weapons inside their own cells. Never draw a checkerboard as the
background. The final spacing pass uses the central 65–75% of each cell.

From the repository root:

```
node forest-forge/design/prepare-enemies.cjs --biomes
node forest-forge/design/prepare-enemies.cjs --biomes spore-marsh
npm --prefix forest-forge run build
```

The existing preparer extracts connected, complete silhouettes rather than
cutting weapons at grid boundaries. It rejects opaque backgrounds and missing
characters, ignores stray fragments, uses one scale per creature, aligns feet
at y=180 and writes 192×192 cells in a 1536×768 atlas. `enemies.json` records the
idle body heights so health bars clear heads. Inspect every prepared sheet:
validation cannot detect all generator defects or incorrect anatomy.

Each `scenery.svg` has six 128×128 cells. These simple vector props extend the
original tree style and are drawn into the cached background on load or resize.
Rendering uses the current biome's enemy atlas and scenery only; the previous
biome images are released from scene references. Shipping converts PNG to
lossless WebP and verifies every visible pixel. No source sheets ship.

## Local preview

Open `/?biome=1` through `/?biome=10` for a seven-enemy pack on local level 18;
add `&boss=1` for the ruler with four followers on level 20. The selector lists
all twenty previews. They use disposable state and never save progress.
These controls are available only on localhost or a private LAN address.

At a boundary, the upper scene fades to black, loads the next biome while
combat pauses, then reveals it with a two-second level title. The portrait,
currency and biome HUD stay bright. Death retries the same level and biome;
Replay after 10–20 returns to the forest. Loading an outdated active formation
starts the new pack on the same level and wave. Level, inventory, currencies,
hero health and forge progress remain; old enemy formations are not continued.
