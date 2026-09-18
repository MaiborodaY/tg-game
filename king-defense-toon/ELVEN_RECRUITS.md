# Elven recruits — first playable unit and proposed roster

Barracks III unlocks the Elves selector in Recruitment. Only Panther Rider is
playable in this update. The other rows below are balance proposals, not hidden
live units. Existing source artwork names the mount a panther, so the game uses
Panther Rider rather than mislabelling it a tiger.

## Level-one baseline

All values exclude Forge and hero buffs. Intervals are the configured values
before the shared combat-pace and selected battle-speed multipliers.

| Fighter | HP | Damage / healing | Base interval | Movement | Range | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Human Swordsman | 60 | 6 damage | 1.10 s | 57 | 38 | Existing comparison |
| Panther Rider | 90 | 9 damage | 1.05 s | 68 | 38 | Implemented |
| Elven Archer | 45 | 11 damage | 1.30 s | 52 | 185 | Proposed |
| Elven Healer | 50 | 6 healing | 1.45 s | 50 | 77.5 | Proposed |
| Unicorn | 120 | 10 damage | 1.30 s | 60 | 42 | Proposed; later unlock |

The Rider has 50% more HP and about 57% more sustained nominal single-target DPS
than a Swordsman of the same level. It is a mounted front-line fighter, without
charge damage, splash, stun or another visual effect in this MVP. Its faster
movement gets it into melee but does not let it pass through enemy bodies.
Proposed ranged and support elves improve their corresponding Human role rather
than all becoming equally durable melee fighters. Unicorn trades some attack
speed for the highest durability; its future gate and special ability are not set.

## Live recruitment and progression

- Elves currently award a Rider with 100% chance, for one slave. Unimplemented
  classes never enter the roll. Humans retain their current odds.
- Rider receipts start at zero and follow the existing increasing thresholds:
  five matching receipts to level 2, then ten more to level 3, and so on.
- Each new recruit keeps its awarded personal level. Connect works only between
  Riders, sums their levels, and does not increase recruitment progress.
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

Elven Archer, Elven Healer and Unicorn have source sheets and 96-pixel Recruitment
portraits. The Healer now shows its approved hooded model with a crystal staff,
replacing the role-symbol placeholder. Healer and Archer remain Coming soon,
Unicorn remains Locked, and only the Rider can be received or placed in battle.

For a later full roster, consider equal thirds for the first three classes, then
25% each once Unicorn unlocks. This is a proposal only; neither these future odds
nor a Unicorn unlock price, timer or Barracks tier are implemented here.
