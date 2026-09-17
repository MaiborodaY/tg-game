# Campaign continuation — 2026-09-18

The curve in [campaign-curve.mjs](campaign-curve.mjs) extends the opening through
global wave 400. Waves **1–30 remain exactly as before**. The historical opening
battle evidence is retained in [OPENING_BALANCE.md](OPENING_BALANCE.md); it does not
validate the later campaign. The user will playtest the new difficulty.

## Growth after 1-3

The endpoint at wave 30 is **1,680 total HP**. Every later round adds **430 HP**
to the preceding round's final budget. Within each round, the ten budgets are
the prior final plus **15, 27, 39, 51, 63, 75, 87, 99, 250 and 430 HP**.
This preserves small intermediate steps and larger ninth/tenth-wave steps,
without an HP reset after bosses or at the Level 1→2 boundary. Growth is linear,
not compounded against the player's personal-level-100 cap.

| Encounter | Global wave | Enemies | Total HP |
| --- | ---: | ---: | ---: |
| 1-3 / 10 | 30 | 6 | 1,680 |
| 1-4 / 1 | 31 | 8 | 1,695 |
| 1-4 / 9 | 39 | 8 | 1,930 |
| 1-4 / 10 | 40 | 6 | 2,110 |
| 1-5 / 7 | 47 | 8 | 2,197 |
| 1-10 / 10 | 100 | 7 | 4,690 |
| 1-11 / 1 | 101 | 10 | 4,705 |
| 1-20 / 10 | 200 | 8 | 8,990 |
| 2-1 / 1 | 201 | 13 | 9,005 |
| 2-10 / 10 | 300 | 9 | 13,290 |
| 2-20 / 10 | 400 | 10 | 17,590 |

Ordinary encounters start at eight enemies. One is added at each global round
**6, 9, 13, 17, 21, 26, 31 and 36**, reaching sixteen. Boss encounters contain
`6 + floor((ordinaryCount - 8) / 2)` enemies, including their boss, reaching ten.
Reinforcements contain **at most four per arrival**, at **0.8 + 14 × groupIndex**
simulation seconds. Normal HP is allocated by role weights: melee **94**,
archer **56**, boar/ghoul **104**, healer **70**; integer rounding is corrected to
the exact budget. More enemies share that budget, so a count increase does not
also multiply total health, and individual HP need not increase at that step.

Ordinary melee damage carries the wave-29 tier of **14** into round 1-4.
The common damage tier advances on wave 9: **+2 per round through global round
10**, **+1 through round 20**, then **+1 every two rounds through round 40**.
Archers use 64% and boars/ghouls 91% of that tier, rounded. The first fighter of
an ordinary wave retains one extra damage point, as in the opening continuation.
Attack rates and movement speed are unchanged.

Mini-bosses receive **55% of encounter HP** and damage `round(meleeTier × 31/14)`;
main bosses receive **65%** and `round(meleeTier × 2.5)`. Escorts share the remainder.
Every tenth wave is still a boss encounter, with main bosses only in local rounds
10 and 20. There is no subsequent HP-budget reduction. Encounter difficulty can
still differ by composition, concentrated boss damage and formation, so these
numeric invariants do not prove that every army finds every next wave harder.

Level 2 uses the same continuing curve with skeletons, skeleton archers, ghouls,
Crypt Spider and Crypt King. It no longer restarts from three times an early
forest template. Per-kill payouts remain doubled by corresponding role there.

## Goblin healer

**1-11 wave 1** introduces one healer per forest wave through **1-20 wave 10**.
It replaces the archer in the second arrival, including boss escorts, rather
than adding another enemy or group. Level 2 has no healer variant yet.

- Heals the most wounded eligible enemy, including a boss, for a **flat 35–48 HP**
  depending on the current damage tier. It cannot exceed missing HP.
- Heal range **95px**, base interval **2.6 seconds**, cast duration **0.8 seconds**;
  the shared combat pace applies normally.
- Cannot heal itself, another healer, an allied fighter or the king.
- Follows behind its healthy frontline. If only healers remain, it advances and
  uses weak melee at **34px**, avoiding a support-only idle stalemate. The king's
  existing ranged counter can target it.
- Uses the supplied red sprite and native healing ring. Its one-gold kill reward
  matches the replaced archer; capture rules are unchanged.

## Economy and verification limits

All 400 resolved wave definitions contain **4,697 enemies** and **10,339 kill
gold**: Level 1 contributes **1,907 / 2,709**, Level 2 **2,790 / 7,630**. First-clear
gold remains **22,000** across both levels, for **32,339 total gold** if each wave
is cleared once. These sums exclude repeats, income and sales. They do not predict
completion time or the army a player will have. Cell prices, recruitment, merging,
personal stat growth, buildings and king stats are unchanged.

For this revision, **25 focused Node checks**, **60 static Canvas render cases**
and the **Vite build** passed. They cover campaign definitions and boundaries,
opening preservation, legal squad sizes, boss/healer placement, bounded healer
mechanics and supplied art rendering. **No complete battles, full campaign or
resource-linked progression simulations were run.** Natural recruitment, merges,
repeat frequency and the late-game win curve therefore require player feedback.
Passing these checks does not establish publication; deployment verification is
a separate release step.
