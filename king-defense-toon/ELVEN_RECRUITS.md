# Elven recruits — playable roster

Barracks III unlocks the Elves selector in Recruitment. Panther Rider, Elven
Archer, Elven Healer and Unicorn are playable. Existing source artwork names the mount a panther, so the game uses
Panther Rider rather than mislabelling it a tiger.

## Level-one baseline

All values exclude Forge and hero buffs. Intervals are the configured values
before the shared combat-pace and selected battle-speed multipliers.

| Fighter | HP | Damage / healing | Base interval | Movement | Range | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Human Swordsman | 60 | 6 damage | 1.10 s | 57 | 38 | Existing comparison |
| Panther Rider | 90 | 9 damage | 1.05 s | 68 | 75 | Implemented |
| Elven Archer | 45 | 11 damage | 1.30 s | 52 | 185 | Implemented |
| Elven Healer | 50 | 6 healing | 1.45 s | 50 | 90 | Implemented |
| Unicorn | 120 | 10 damage | 1.30 s | 60 | 42 | Implemented |

The Rider has 50% more HP and about 57% more sustained nominal single-target DPS
than a Swordsman of the same level. It is a mounted short-range thrower with 75 reach, compared with a sword's 38
and a bow's 185. Each glaive damages one target once when it arrives; no ricochet,
splash, stun or charge damage is added. HP, damage, attack cadence and movement
remain unchanged by the weapon update.
The Elven Archer has about 41% more HP and 48% more nominal single-target DPS than
the Human Archer (32 HP, 8 damage, 1.4 s base interval). It uses one cell, keeps
the same 185 range and fires one ordinary arrow. It has no splash, poison or
multi-shot. The Elven Healer uses one cell and improves the Human Healer's 36 HP
and 4 healing to 50 HP and 6 healing. It treats one living wounded ally or hero,
including itself, without attacks, area healing, resurrection, castle repair or
poison removal. It shares the existing healer crowd navigation, with 90 healing
range versus the Human Healer's 77.5 (about 16% farther).
Unicorn trades attack speed for the highest durability: a single-target horn strike,
with 42 reach and no charge, splash, stun or passive magic.

## Live recruitment and progression

- Elves initially award Riders only. Rider recruitment level 3 (15 receipts)
  automatically unlocks Elven Archer; subsequent conversions award a Rider or
  Archer with 50% chance each, for one slave. The receipt that reaches the
  threshold is still a Rider. Total recruitment levels of already-open Elves
  unlock Healer at 5 and Unicorn at 10; closed types contribute nothing.
  For example, Rider 3 + Archer 2 opens Healer. Rider 5 + Archer 3 + Healer 2
  opens Unicorn, already at building III. Chances are equal among eligible
  classes: exact thirds with Healer, 25% each with all four. A threshold receipt
  uses the old pool; the expanded odds apply to subsequent conversions.
  Humans retain their current odds.
- Each elven type's receipts start at zero and follow the existing increasing thresholds:
  five matching receipts to level 2, then ten more to level 3, and so on.
- Each new recruit keeps its awarded personal level. Connect works only between
  identical types, sums their levels, and does not increase recruitment progress.
  Human and Elven Archers/Healers are distinct types and cannot Connect across factions.
- HP, damage and healing use the same additive 5% of level-one base per personal level.
  Levels do not increase movement, range or attack speed. All three shared Forge
  upgrades apply equally to the Rider and the other regular fighters.
- A fresh level-one Rider is stronger than a level-one Swordsman, not an old
  highly connected Swordsman. No free level catch-up or old-unit reset is added.
- Human receipts and pending first-Lancer guarantees survive pool changes.
  Mixed Human/Elven formations are allowed; changing the pool does not replace
  fighters already owned or change a running battle.
- A Rider occupies two vertical purchased cells, anchored at the upper cell.
  Unicorn occupies two horizontal cells, anchored at the left cell.
  Their model and battle starting position are centered across both cells.
  Selection and Connect work from either cell. Moves and swaps require both
  complete footprints to fit; recruiting never silently removes a second guard.
  Old Riders that no longer fit return to reserve with their level intact.
- Existing saves gain missing Elven Archer/Healer/Unicorn recruitment counters at zero; existing
  fighters, Human progress and Rider progress are preserved.

## Recruitment unlock chain

| Recruit | Requirement | Current availability |
| --- | --- | --- |
| Panther Rider | Barracks III completed | Playable |
| Elven Archer | Panther Rider recruitment level 3 | Playable |
| Elven Healer | Sum of already-open Elven recruitment levels ≥ 5 | Playable |
| Unicorn | Sum of already-open Elven recruitment levels ≥ 10 | Playable; two cells |

Connect raises personal levels only and never satisfies these requirements.
Barracks IV becomes purchasable at Rider recruitment level 5 (50 receipts),
costs 5,000 gold and takes six real hours including offline time. Acceleration
costs `ceil(600 × remainingTime / 6 hours)` gold. Completion permits one additional
side cell to be purchased: 11 total cells, with the usual price ladder (750 gold
for the eleventh). It does not grant the cell or a recruit for free.
Building IV is independent of Unicorn. Construction controls use the separate
upgrade view in the shared Mercenaries menu, accessible from either faction.

## Art and remaining work

The live Rider and all menu portraits now use the approved glaive-v2 model.
Its 512px, sixteen-pose atlas retains authored crops and foot anchors. Side/down
throws release a separate 128px spinning glaive on pose 2, from the authored hand
anchor (mirrored for west). The shared projectile lifecycle applies damage on
arrival. The source ricochet showcase is artwork, not an enabled combat ability.
Idle/walk, static formation and death fade use the normal rules. Body height stays
54.05 world units (the existing 15% increase); the two-cell footprint is unchanged.
Clothing palettes switch at 50 / 100 / 250 / 500; mount, skin and weapon are intact.

The Elven Archer uses its supplied sixteen-pose atlas with authored rectangles
and foot anchors: idle, walk, side shot and downward shot. The arrow is released
at pose 2 of the four-frame shot; west mirrors the side art. Its body scale matches
the Human Archer. Five clothing palettes follow the same 50 / 100 / 250 / 500
level thresholds; the currently needed atlas loads on demand. Formation previews
stay still, and combat uses the shared single-arrow effect.

The Healer uses its approved hooded model and crystal staff, with the exact
sixteen-pose 512px atlas and foot anchors. Its 35-unit body height matches the
Human Healer. Idle/walk and side/down healing are animated; formation stays still.
Healing lands on pose 2 and creates a short, four-frame 128px ring on the patient.
The effect is loaded only when needed and reused for each cast. Clothing follows
the five existing palette bands; hood, skin and staff retain their original colors.

Unicorn uses the approved 512px sixteen-pose sheet and existing menu portrait.
Exact foot anchors keep it grounded at a 47-unit body height; horn impact lands
once on pose 2. Formation stays still, death uses the shared fade. Saddle cloth
changes at the five rank bands; coat, mane, armor and horn keep their colors.
Only the visible palette loads; there is no additional spell or projectile asset.

New regular units follow [UNIT_INTEGRATION.md](UNIT_INTEGRATION.md).
