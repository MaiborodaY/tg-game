# Elven recruits — playable fighters and proposed roster

Barracks III unlocks the Elves selector in Recruitment. Panther Rider and Elven
Archer are playable. The remaining rows below are balance proposals, not hidden
live units. Existing source artwork names the mount a panther, so the game uses
Panther Rider rather than mislabelling it a tiger.

## Level-one baseline

All values exclude Forge and hero buffs. Intervals are the configured values
before the shared combat-pace and selected battle-speed multipliers.

| Fighter | HP | Damage / healing | Base interval | Movement | Range | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Human Swordsman | 60 | 6 damage | 1.10 s | 57 | 38 | Existing comparison |
| Panther Rider | 90 | 9 damage | 1.05 s | 68 | 38 | Implemented |
| Elven Archer | 45 | 11 damage | 1.30 s | 52 | 185 | Implemented |
| Elven Healer | 50 | 6 healing | 1.45 s | 50 | 77.5 | Proposed |
| Unicorn | 120 | 10 damage | 1.30 s | 60 | 42 | Proposed; later unlock |

The Rider has 50% more HP and about 57% more sustained nominal single-target DPS
than a Swordsman of the same level. It is a mounted front-line fighter, without
charge damage, splash, stun or another visual effect in this MVP. Its faster
movement gets it into melee but does not let it pass through enemy bodies.
The Elven Archer has about 41% more HP and 48% more nominal single-target DPS than
the Human Archer (32 HP, 8 damage, 1.4 s base interval). It uses one cell, keeps
the same 185 range and fires one ordinary arrow. It has no splash, poison or
multi-shot. The support proposals improve their corresponding Human role rather
than all becoming equally durable melee fighters. Unicorn trades some attack
speed for the highest durability; its future gate and special ability are not set.

## Live recruitment and progression

- Elves initially award Riders only. Rider recruitment level 3 (15 receipts)
  automatically unlocks Elven Archer; subsequent conversions award a Rider or
  Archer with 50% chance each, for one slave. The receipt that reaches the
  threshold is still a Rider. Unimplemented classes never enter the roll.
  Humans retain their current odds.
- Each elven type's receipts start at zero and follow the existing increasing thresholds:
  five matching receipts to level 2, then ten more to level 3, and so on.
- Each new recruit keeps its awarded personal level. Connect works only between
  identical types, sums their levels, and does not increase recruitment progress.
  Human and Elven Archers are distinct types and cannot Connect to each other.
- HP and damage use the same additive 5% of level-one base per personal level.
  Levels do not increase movement, range or attack speed. All three shared Forge
  upgrades apply equally to the Rider and the other regular fighters.
- A fresh level-one Rider is stronger than a level-one Swordsman, not an old
  highly connected Swordsman. No free level catch-up or old-unit reset is added.
- Human receipts and pending first-Lancer guarantees survive pool changes.
  Mixed Human/Elven formations are allowed; changing the pool does not replace
  fighters already owned or change a running battle.
- A Rider occupies two adjacent horizontal, purchased cells. Its anchor is the
  left cell; its model and battle starting position are centered across both.
  Selection and Connect work from either cell. Moves and swaps require both
  complete footprints to fit; recruiting never silently removes a second guard.
  Old Riders that no longer fit return to reserve with their level intact.
- Existing saves gain Elven Archer recruitment counters at zero; existing
  fighters, Human progress and Rider progress are preserved.

## Recruitment unlock chain

| Recruit | Requirement | Current availability |
| --- | --- | --- |
| Panther Rider | Barracks III completed | Playable |
| Elven Archer | Panther Rider recruitment level 3 | Playable |
| Elven Healer | Elven Archer recruitment level 3 | Preview; combat implementation follows later |
| Unicorn | Panther Rider recruitment level 5 and Barracks IV completed | Preview; two cells when implemented |

Connect raises personal levels only and never satisfies these requirements.
Barracks IV becomes purchasable at Rider recruitment level 5 (50 receipts),
costs 5,000 gold and takes six real hours including offline time. Acceleration
costs `ceil(600 × remainingTime / 6 hours)` gold. Completion permits one additional
side cell to be purchased: 11 total cells, with the usual price ladder (750 gold
for the eleventh). It does not grant the cell or a recruit for free.
The IV controls appear beside Unicorn in Elven Recruitment; the current Human
upgrade controls remain available when the Human pool is selected.

## Art and remaining work

The live Rider uses the supplied 768-pixel, sixteen-pose atlas with its authored
rectangles and foot anchors. Idle, walk, side attack and downward attack use these
poses. West mirrors the side art; death uses the existing static fade. Clothing
palettes switch at 50 / 100 / 250 / 500, while the mount and skin stay unchanged.
The Rider's model is 15% larger in battle and formation (47 to 54.05 world units
high); this visual change does not increase its HP, damage, reach or movement speed.

Barracks, unit details, Connect, Market reveals and Recruitment use the newer
glaive-v2 Rider portrait, with the same five level-color bands. The 96-pixel
portrait changes only menu artwork: the live combat atlas and melee rules above
remain unchanged. Its thrown-glaive animation/projectile source is not wired into
combat by this update.

The Elven Archer uses its supplied sixteen-pose atlas with authored rectangles
and foot anchors: idle, walk, side shot and downward shot. The arrow is released
at pose 2 of the four-frame shot; west mirrors the side art. Its body scale matches
the Human Archer. Five clothing palettes follow the same 50 / 100 / 250 / 500
level thresholds; the currently needed atlas loads on demand. Formation previews
stay still, and combat uses the shared single-arrow effect.

The Healer portrait shows its approved hooded model with a crystal staff,
replacing the role-symbol placeholder. Healer and Unicorn show their requirements;
neither enters recruitment rolls or combat yet. Once
their requirements are met, these two preview rows say Coming soon.

For a later full roster, consider equal thirds for the first three classes, then
25% each once Unicorn unlocks. These future odds are not implemented here.
Unicorn's recruitment/Barracks requirements are fixed above.
