# St. Knihor talent trees

The hero starts at level 1 with a normal melee attack, 60 HP and 4 damage. He has
no healing, armour aura or thrown hammer until their respective root talents are
learned. Basic HP and damage still grow by 5% of their starting value per level.
Hero XP rewards are reduced by 15% before whole-point rounding; saved XP and level
thresholds remain unchanged. The level cap is still 20, and gold rewards are unchanged.

## Points and paths

- One point per level starting at level 2: 19 points at level 20.
- Three independent trees: Light, Protection and Judgement. Players can mix them.
- Six nodes per tree in four rows: one root, two upgrades, two effects, one final.
- Node ranks are 1 / (3 + 3) / (2 + 2) / 1: 12 points per full tree, 36 overall.
- The second row requires its root. The third row requires its linked second-row
  talent and five points in the same branch, excluding the queried talent itself.
- A final talent requires level 20, both linked third-row talents and ten other
  points in that branch. Two finals cannot fit in the 19-point budget.
- A tap selects a node; Learn/Upgrade spends a point. Descriptions explain gates.
  Talents can be learned while fighting, but only the next battle uses the change.
  Reset is free between waves.

## Effects

All skills are automatic. HP amounts and damage below are level-1 values;
flat HP and damage scale with the hero's existing level multiplier. Percentages,
range and cooldowns do not gain that multiplier.

| Branch | Root skill | Second row | Third row | Final |
| --- | --- | --- | --- | --- |
| Light | Healing Light: 4 HP every 8 seconds, range 95 | Radiant Light: +10% healing/rank; faster healing: -0.75 s cooldown/rank | Overflow: excess healing becomes a shield, cap 2/4 HP for 6 s; Shared Light: a second wounded ally receives 30/60% healing | Miracle: once per wave, a nearby ally below 30% HP triggers healing for 15% max HP in radius 110 |
| Protection | Protective Aura: 4% damage reduction, radius 80 | +2 percentage points reduction/rank; +10 radius/rank | Last Stand: hero gains 15/25% reduction below 30% HP; Guardian Ward: after surviving a hit dealing at least 10% max HP, hero gets an 8/12% max-HP shield for 4 s, 12 s cooldown | Bastion: +12 percentage points aura protection for 3 s every 18 s |
| Judgement | Holy Hammer: 6 damage every 12 seconds, range 150 | +15% hammer damage/rank; -1 s cooldown/rank | Holy Impact: nearby enemies receive 25/50% hammer damage; Holy Strike: a landed hammer empowers the next normal melee hit by 25/50% for up to 6 s | Heavenly Hammer: hammer hits also stun for 0.8 s |

Combined damage reduction remains capped at 40%. Guardian Ward has its own
non-stacking shield and timer so it cannot extend or shorten an overheal shield.
Holy Strike consumes its charge on a successful ordinary melee hit, not on an
aborted wind-up. The hero closes to melee range against ranged enemies when he
has not learned Holy Hammer.

When allies block the hero, he searches for a free attack position around them.
The route stays on land, survives a spell cast and is discarded if the enemy
moves away. A fully sealed frontline makes him wait and retry instead of running
in place. With Holy Hammer against ranged-only enemies, he holds a clear casting
position between throws. Ordinary unit movement and all combat stats are unchanged.

## Saves and presentation

Hero saves carry `talentVersion: 2`. Loading an older talent layout preserves XP
and highest cleared wave, clears its old ranks and returns all earned points.
The normalized state is saved through the existing protected campaign storage.
New allocations survive reloads and later XP rewards; the migration does not
change gold, army, buildings or campaign progress.

The menu uses three simultaneously visible columns, compact icon nodes, rank
badges and connected paths. Gold denotes learned nodes, green availability, and
a separate selection outline identifies the displayed detail. Locked talents
remain inspectable. Short screens scroll the tree while keeping the detail and
action accessible. Talent icons use a shared illustrated atlas; battle skills
reuse the existing hero animation atlases.

## Verification scope

Model tests cover roots, mixed builds, progression gates, point limits and save
migration. Combat tests cover learned-only casts and auras, melee pursuit without
the hammer, shielding and charged-hit lifetimes, death cancellation and immutable
battle snapshots. Crowd regressions cover 15 allies, both shores, blocked/reopened
paths, moving targets, casting pauses and equal results across FPS/speed settings.
Browser tests exercise the real menu, legacy refund, persistence,
mobile dimensions and next-wave application. Local desktop and simulated mobile
checks do not replace playtesting in Telegram on physical Android/iOS devices.
