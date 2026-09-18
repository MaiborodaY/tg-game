# Campaign balance — 2026-09-18

The current curve covers all **400 waves** across two levels. To account for the
playable hero, every encounter now has **10% more total HP and 5% more enemy
damage** than the underlying campaign curve, starting at wave 1. From **1-6**,
each forest wave adds one Goblin healer to its opening group while retaining all
archers. There are no healers in rounds 1-1 through 1-5. Movement, attack cadence
and per-enemy rewards are unchanged; each added healer is worth one kill gold.

[opening-curve.ts](opening-curve.ts) and
[campaign-curve.ts](campaign-curve.ts) supply the underlying budgets;
`withHeroPressure` in [waves.ts](waves.ts) applies the current adjustment.
Each encounter resolves to `round(previousTotalHP × 1.10)`. Individual HP values
are rounded, with the first spawn absorbing the rounding correction. Damage is
multiplied by 1.05 and retained to two decimal places, so a 4-damage archer becomes
4.2 rather than jumping to 5. Healing follows its separate support curve below.

The historical opening battle evidence in
[OPENING_BALANCE.md](OPENING_BALANCE.md) predates both this adjustment and the
earlier healer introduction. It does not validate the current difficulty.

## Growth after 1-3

The unadjusted wave-30 budget is 1,680 HP, and subsequent rounds add 430 HP.
Their within-round offsets are 15, 27, 39, 51, 63, 75, 87, 99, 250 and 430 HP.
The current 10% adjustment makes the wave-30 endpoint **1,848 HP** and the
round-end increment **473 HP**. Intermediate offsets are rounded after applying
the multiplier. This retains smaller intermediate steps and larger ninth/tenth
steps, with no new HP reset after bosses or at the Level 1→2 boundary. Growth is
linear rather than compounded each round.

| Encounter | Global wave | Enemies | Current total HP |
| --- | ---: | ---: | ---: |
| 1-1 / 1 | 1 | 3 | 198 |
| 1-1 / 6 | 6 | 6 | 469 |
| 1-1 / 9 | 9 | 9 | 869 |
| 1-1 / 10 | 10 | 5 | 825 |
| 1-2 / 1 | 11 | 8 | 953 |
| 1-3 / 10 | 30 | 6 | 1,848 |
| 1-4 / 1 | 31 | 8 | 1,865 |
| 1-4 / 9 | 39 | 8 | 2,123 |
| 1-4 / 10 | 40 | 6 | 2,321 |
| 1-5 / 7 | 47 | 8 | 2,417 |
| 1-6 / 1 | 51 | 10 | 2,811 |
| 1-10 / 10 | 100 | 8 | 5,159 |
| 1-11 / 1 | 101 | 11 | 5,176 |
| 1-20 / 10 | 200 | 9 | 9,889 |
| 2-1 / 1 | 201 | 13 | 11,392 |
| 2-10 / 10 | 300 | 9 | 16,812 |
| 2-20 / 10 | 400 | 10 | 22,251 |

The prior requested wave-10 escort removal remains in place. Its explicit HP
exception is now **869 → 825** at waves 9→10, followed by **953** on wave 11.
The chief itself shares the modest global buff: **495 HP / 18.9 damage**. The
late support slot again contains the remaining archer, with no early healer.

Ordinary continuation encounters start at eight enemies. One is added at each
global round **6, 9, 13, 17, 21, 26, 31 and 36**, reaching sixteen. Boss encounters
contain `6 + floor((ordinaryCount - 8) / 2)` enemies including the boss, reaching
ten, before the extra healer in forest rounds 6–20. Reinforcements contain **at most four
per arrival**, at **0.8 + 14 × groupIndex** simulation seconds. The first round
retains its authored group sizes; wave 1 remains two goblins followed by one at
6.8 seconds.

Underlying normal HP allocation uses role weights: melee **94**, archer **56**,
boar/ghoul **104**, and healer **70**. The additional healer shares the existing
ordinary/escort HP budget; the boss retains its existing HP share. More enemies share a
wave's budget; count growth therefore does not multiply total HP again, and
individual HP need not rise at those steps.

The unadjusted melee damage tier carries 14 from wave 29 into round 1-4. Its
shared step occurs on wave 9: **+2 per round through global round 10**, **+1
through round 20**, then **+1 every two rounds through round 40**. Archers use
64% and boars/ghouls 91% of that tier, rounded; the first ordinary fighter retains
its extra damage point. The final **×1.05 damage adjustment** applies after these
existing role rules, including bosses and the healer's weak melee attack.

Mini-bosses receive 55% of the underlying HP budget and base damage
`round(meleeTier × 31/14)`; main bosses receive 65% and
`round(meleeTier × 2.5)`. Escorts share the remainder. Every tenth wave is still a
boss encounter, with main bosses only in local rounds 10 and 20. Concentrated
damage, healing, reinforcements and formation can change actual difficulty even
when total HP rises.

Level 2 continues the same curve with skeletons, skeleton archers, ghouls,
Crypt Spider and Crypt King. After the shared hero adjustment, all Level 2 enemies receive a further
**15% HP and 15% damage**, once. Counts, arrivals, rewards, boss HP shares and
the original growth formulas remain unchanged. Healing is unchanged.
Waves 1-200 are unchanged by this additional multiplier. Level 2 retains doubled
per-kill payouts by role. Its final Crypt King has **14,464 HP / 144.9 damage**
within the **22,251-HP** encounter. These stat increases do not promise an exact
difficulty percentage against every possible army.

## Goblin healer

One additional healer appears in **every forest wave from 1-6 wave 1 through
1-20 wave 10** (global waves **51–200**). All previous archers remain. The healer
enters at **0.8 seconds** in the opening group, behind two fighters and a boar or
the boss. Remaining archers and escorts follow in groups of at most four. This
applies to both mini-bosses and main bosses. Rounds 1-1 through 1-5 and Level 2
have no healer. The first ordinary wave of round 1-6 grows from eight to ten
enemies: one previously scheduled ordinary reinforcement plus the new healer.

| Global wave | Encounter | Heal per cast |
| --- | --- | ---: |
| 51 | 1-6 / 1 | 17 HP |
| 60 | 1-6 / 10 | 21 HP |
| 100–101 | 1-10 / 10 → 1-11 / 1 | 35 HP |
| 200 | 1-20 / 10 | 48 HP |

For waves 51–100, healing is
`round(10 + (wave − 30) × 25 / 71)`. Waves 101–200 retain their previous
damage-tier-based **35–48 HP** healing. The first healer has **229 HP**, heals
**17 HP** per cast and deals **4.2 melee damage**.

- Heals the most wounded eligible enemy, including a boss, capped by missing HP.
- Heal range **95px**, base interval **2.6 seconds**, cast duration **0.8 seconds**;
  the shared combat pace applies normally.
- Cannot heal itself, another healer or the player's side.
- Follows behind its healthy frontline. If only healers remain, it advances and
  uses weak melee at **34px**, avoiding a support-only idle stalemate.
- Reuses the supplied red sprite and native healing ring. No extra UI or effect
  system is introduced; capture rules are unchanged.

## Economy and verification limits

All 400 resolved wave definitions contain **4,847 enemies** and **10,489
kill gold**: Level 1 contributes **2,057 / 2,859**, Level 2 **2,790 / 7,630**.
First-clear gold remains **22,000** across both levels, for **32,489 total gold**
if each wave is cleared once. These sums exclude repeats, income and sales and do
not predict completion time or player army strength. Recruitment, Connect,
personal stat growth, hero stats, capture rules, cell prices and income rates
are unchanged by this balance adjustment.

The first-group healer revision was checked in real, unmodified encounters with
7 swordsmen, 4 archers and 2 healers: wave 60 at personal Lv20 healed its boss
for 21 HP at 13.75 seconds, wave 100 at Lv40 for 35 HP at 10.68 seconds, and
wave 200 at Lv70 for 48 HP at 10.68 seconds. All three heals occurred before
the second arrival at 14.8 seconds. These verify support timing, not guaranteed
healing against an army that instantly kills the boss.

Returning the early archers makes the first chief costlier for the existing
eight-unit references: 5 swordsmen / 2 archers / 1 healer at Lv3 still win with
2 survivors and a full-health castle. With 4 swordsmen / 2 archers / 2 healers,
Lv3 loses both waves 10 and 11, while Lv4 wins both; the following wave does not
drop below the chief's measured upgrade threshold.

The following historical simulations predate the restored archers and first-group
healers; they are not current win thresholds. After the talent-tree redesign,
before the hero crowd-route fix, four local resource-linked opening runs used `scripts/early-campaign.mjs`, seeds
**1, 4, 17 and 42**, speed **×1**, a **40-attempt** limit and target **wave 10**.
All completed, in **20 / 12 / 12 / 20 attempts**, without a combat timeout.
Talents were left unspent, actual capture/economy APIs supplied resources, and
all four heroes finished at level 3. Recorded defeats were on waves **8–9**.
These are four deterministic management scenarios, not a player-population
forecast or proof of the later campaign's difficulty.

At the earlier enemy-balance revision, the local Node suite passed **154 checks**, and the Vite build passed.
Longer encounters exposed a rear melee fighter whose forward movement was being
canceled by friendly separation. Swordsmen and lancers now take a short lateral
detour after sustained blocking, at their existing speed and within the existing
land constraints. Detours expire or replan; attack range and target choice are
unchanged. Movement regressions cover the crowded eighth wave at personal levels
3 and 4, and check that actors remain on land throughout the trace. The four
resource-linked runs above also include the later talent-tree change: a level-1
hero now has melee only. Fixed-army win/loss reference levels in the opening
regressions were remeasured accordingly; no enemy definitions were changed.
After the later 15% XP reduction, the wave-four check uses the actual level-one
hero earned from three clears; separate replay fixtures verify all three root
skills after the fourth clear earns a talent point.

The later hero crowd-route fix makes him join melee sooner without changing stats
or enemy definitions. Remeasuring waves 19/20/21 with the same eight-unit reference
armies gives minimum winning personal levels of 11/11/13 with no healer,
11/12/13 with one healer and 13/13/13 with two healers (levels 8–16 checked).
The FPS defeat fixture now uses level 3: its previous level-4 army wins after the
hero starts participating earlier. These are movement-sensitive reference cases,
not new enemy balance values or replacements for the historical campaign runs above.

These checks do not establish that every later encounter is beatable by every
formation. Before the movement correction, two exploratory wave-400 formations
(9 swordsmen / 4 archers / 2 healers and 6 / 7 / 2, all personal level 100, with a
level-20 hero and 19 Protection/Light talent points) lost both with the previous
wave definitions and with this stat adjustment. This is a pre-existing late-game
balance concern, not evidence of an impossible campaign; other formations and
the final movement correction were not part of that comparison.

Full campaign difficulty, natural recruitment and repeat frequency still require
playtesting. This validation was local; no deployment or published-game check
was performed as part of it.
