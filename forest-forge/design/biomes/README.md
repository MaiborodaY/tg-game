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
wave, levels 1–19 use a larger melee commander; level 20 uses the biome's unique
ruler. Later encounters vary the existing roles, with at most five enemies and
one healer. The first ten global levels keep their original introductory waves.
HP, damage, attack intervals, drops and all other balance values are unchanged.

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

Open `/?biome=1` through `/?biome=10`; add `&boss=1` for the ruler. The selector
lists all twenty previews. They use disposable state and never save progress.
These controls are available only on localhost or a private LAN address.

At a boundary, the upper scene fades to black, loads the next biome while
combat pauses, then reveals it with a two-second level title. The portrait,
currency and biome HUD stay bright. Death retries the same level and biome;
Replay after 10–20 returns to the forest. Existing saves retain their global
level, inventory and current encounter, including pre-biome enemy formations.
