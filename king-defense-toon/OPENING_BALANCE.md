# First thirty waves: balance verification — 2026-09-17

Published on 2026-09-17 from commit `48543e4` to the existing BroTD Infinity URL
through Pages Preview deployment `224eac10`. The scope is waves 1–30
(rounds 1-1, 1-2 and 1-3).
Every definition from 31 through 400 remains identical to the original snapshot,
including all of Level 2. The remaining campaign requires a later rebalance.

**Latest user-requested change:** wave 10 now omits the melee goblin from its
second arrival. It has five enemies (chief + two goblins + two archers), entering
4 + 1 at the original times. The chief remains 450 HP / 18 damage; no stats were
increased to compensate. Waves 1–9 and 11–400 are unchanged by this last edit,
including wave 11. Kill gold for wave 10 is now 24, down from 25.
The broad progression reports below predate this removal; only the focused combat
checks explicitly marked current were rerun. Their old completion and repeat
statistics must not be presented as measurements of the latest configuration.

| Wave | Enemies | Total HP | Arrivals |
| --- | ---: | ---: | --- |
| 1 | 3 | 180 | 2 + 1 |
| 2 | 4 | 184 | 4 |
| 3 | 5 | 264 | 3 + 2 |
| 4 | 5 | 306 | 3 + 2 |
| 5 | 6 | 366 | 3 + 3 |
| 6 | 6 | 426 | 3 + 3 |
| 7 | 7 | 506 | 4 + 3 |
| 8 | 8 | 620 | 4 + 4 |
| 9 | 9 | 790 | 3 + 3 + 3 |
| 10 | 5 | 750 | 4 + 1 |

Waves 1–3 and 9 retain their previous composition, stats and timing. Intermediate
waves 4–6 and 8 are gentler. The first chief has 450 HP / 18 damage, with two
94 HP / 11 damage fighters and two 56 HP / 7 damage archers. This is a deliberate
reduction from 650 HP: actual combat showed that the previous version required
too much early army growth. The subsequent requested escort removal changes
total HP from 844 to 750, below wave 9's 790. This is an explicit exception to
the numeric HP-growth rule; the boss was not strengthened to hide the reduction.
Total HP then rises from 750 to 866 on wave 11, whose configuration is unchanged.

## Continuation through wave 30

| Wave in round | Round 1-2: total HP | Round 1-3: total HP |
| --- | ---: | ---: |
| 1 | 866 | 1265 |
| 2 | 878 | 1277 |
| 3 | 890 | 1289 |
| 4 | 902 | 1301 |
| 5 | 914 | 1313 |
| 6 | 926 | 1325 |
| 7 | 938 | 1337 |
| 8 | 950 | 1349 |
| 9 | 1120 | 1500 |
| 10 | 1250 | 1680 |

Ordinary waves have eight enemies: four melee, two archers and two boars, arriving
4 + 4 at 0.8 / 14.8 battle seconds. Waves 20 and 30 each contain six enemies,
arriving 4 + 2: one chief, three melee fighters and two archers. The chiefs have
688 HP / 24 damage and 924 HP / 31 damage respectively. Ordinary melee damage is
10 on waves 11–18, 12 on 19–28, and 14 on 29; boss escorts use 12 on wave 20 and
14 on wave 30. The lead fighter in each
ordinary wave has one extra damage point; this closes a measured 10→11 healer-army
dip without sharply increasing the damage of all eight enemies.

Every encounter in 1–30 except the explicitly reduced wave 10 increases total HP.
Each ordinary spawn position in 11–30 also has nondecreasing HP and damage.
The current 9/10/11 comparisons are recorded below. Further retained controlled
cases for the unchanged later encounters use eight fighters,
including two archers and the specified number of healers; the remaining places
are swordsmen, all at the listed level:

| Healers | Personal level | Wave 19 | Wave 20 | Wave 21 |
| --- | ---: | --- | --- | --- |
| 0 | 12 | Win | Loss | Loss |
| 0 | 13 | — | Win | Win |
| 1 | 11 | Win | Loss | Loss |
| 1 | 12 | — | Win | Loss |
| 1 | 13 | — | — | Win |
| 2 | 13 | Win | Loss | Loss |
| 2 | 14 | — | Win | Win |

For both the zero-healer and one-healer compositions, Lv19 beats wave 29 but loses
wave 30; Lv20 beats wave 30. A dash means that this row makes no assertion about
that comparison, not a timeout or defeat.

These are controlled comparisons, not a promise that every composition's outcome,
survivor count, remaining HP and duration all move monotonically. Target selection,
healing and attack timing can improve one result despite higher enemy stats.

**Deferred boundary:** wave 31 remains at its previous 1054 total HP, below wave
30's 1680. The requested limited scope deliberately stops at 30; the 30→31 boundary
and the later campaign are not presented as complete or ready for a full campaign release.

## Current focused combat checks

The harness runs `createBattle` / `updateBattle` with 1/60-second battle steps.
Every scenario starts with full HP, as the game does. No combat formulas are
reimplemented in the harness.

- Four Lv2 fighters with zero or one healer beat wave 4 with the king untouched.
- A fixed 5 swordsmen / 2 archers / 1 healer, all Lv3, beats waves 1–10. The reduced
  wave 10 leaves three allies alive and king HP 100; previously it defeated them.
- Eight Lv5 fighters with zero, one or two healers beat wave 10 with survivors
  and king HP 100.
- These equal-level armies are controlled comparisons, not claims about what
  players naturally own on their first attempt.

The latest removal was checked in **27 real battles**: waves 9, 10 and 11 for
eight-fighter armies with zero, one or two healers, each at Lv3, Lv4 and Lv5.
Every army has two archers, with swordsmen filling the remaining places.
Results are in `%TEMP%/brotd-wave10-escort-controls.json`.

| Healers | Personal level | Wave 9 | Wave 10 | Wave 11 |
| --- | --- | --- | --- | --- |
| 0 | 3–4 | Win | Win | Loss |
| 0 | 5 | Win | Win | Win |
| 1 | 3–4 | Win | Win | Loss |
| 1 | 5 | Win | Win | Win |
| 2 | 3–4 | Win | Win | Loss |
| 2 | 5 | Win | Win | Loss |

All 27 finish without a timeout or enrage. The two-healer Lv3 army loses all its
fighters on wave 10, but the king completes the fight with 37 HP. Every other
tested wave-10 victory retains allies and the king's full health. The first-chief
win threshold has therefore fallen in these controls after the requested escort
removal; there is no compensating difficulty increase elsewhere. The unchanged
wave 11 remains harder for these lower-level controls, rather than a relief wave.
This does not establish strict difficulty ordering for all possible armies.

## Historical first-ten progression using real resource rules

These runs used the six-enemy wave 10 before its latest escort removal. They have
not been repeated on the five-enemy configuration.

`scripts/early-campaign.mjs` also calls the actual capture, recruitment, cell
purchase, merge, Treasury and first-clear APIs. It starts with 125 gold, three
slaves and three cells, uses the real speed helper and 30-real-second capture
cooldown, and never grants extra resources.

Eight fixed seeds (1, 2, 3, 4, 5, 17, 42, 101) were checked at each speed:

| Speed | Cleared wave 10 | Attempts including repeats | Modelled foreground time |
| --- | --- | --- | --- |
| ×1 | 8 / 8 | 16–28 | 11.0–23.7 min |
| ×3 | 8 / 8 | 24–43 | 6.6–13.7 min |

No run timed out. ×3 earns fewer captures per attempt because capture cooldown
uses real time. Repeated attempts and retreat to the previous wave therefore
matter; combat speed does not multiply the economy.

The management policy converts slaves between battles, buys affordable needed
cells, fills cells before merging surplus fighters into the weakest deployed
fighter of the same type, and places melee forward / healers centrally / archers
behind. It includes the starting Treasury, two seconds between attempts, and no
offline income, optional buildings, sales, manual input or conversion animation
time. These eight deterministic examples are not a population success rate or a
promise about player completion time. The earlier uncorrected wall-clock report
is superseded by these results.

## Historical thirty-wave progression checks

The 452-battle reports in this section predate the latest wave-10 escort removal.
They remain evidence for that earlier snapshot, not current end-to-end validation.

The earlier candidate's 392 battles did **not** satisfy the intended concentration
of setbacks on local waves 9–10: only **45 of 108 defeats (41.7%)** occurred there.
By round, the shares were 34/56, 9/20 and 2/32. Those results are superseded as
evidence for the continuation that replaced it. Middle waves gain HP more gently, with
larger increases on waves 19–20 and 29–30; later chiefs also deal more damage.

The revised candidate was checked with the same real resource rules and seeds
1, 3 and 4 at each speed. Reports are
`%TEMP%/brotd-opening-30-x1-gates-final.json` and
`%TEMP%/brotd-opening-30-x3-gates-final.json`.

| Speed | Seed | Attempts | Defeats | Defeats on local 9–10 | Result | Modelled foreground time |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| ×1 | 1 | 52 | 11 | 8 | Cleared 30 | 45.02 min |
| ×1 | 3 | 62 | 17 | 11 | Cleared 30 | 56.40 min |
| ×1 | 4 | 52 | 11 | 8 | Cleared 30 | 43.83 min |
| ×3 | 1 | 102 | 36 | 25 | Cleared 30 after extending attempt budget | 34.95 min |
| ×3 | 3 | 94 | 33 | 17 | Cleared 30 | 32.99 min |
| ×3 | 4 | 90 | 30 | 21 | Cleared 30 | 28.71 min |

The six runs contain **452 battles: 314 victories, 138 defeats and no combat
timeouts**. All six complete wave 30. The ×3 seed-1 run initially stopped at the
100-attempt budget with saved progress 28 after previously reaching wave 30.
Only that case was rerun with a 120-attempt budget; its first 100 attempt records
were byte-for-byte identical, and attempts 101–102 completed the run. The other
five runs were not repeated. An attempt limit is distinct from a combat timeout.
All cells, recruits and merged levels come from the actual game APIs; none of the
controlled armies above is injected into these progression runs.

Counting only recorded `outcome: defeat` attempts, **90 of 138 defeats (65.2%)**
occur on local waves 9–10. Each attempt belongs to round
`floor((wave - 1) / 10) + 1`, including replays after a retreat:

| Round | Defeats on local 9–10 | All defeats | Share |
| --- | ---: | ---: | ---: |
| 1-1 | 34 | 56 | 60.7% |
| 1-2 | 27 | 33 | 81.8% |
| 1-3 | 29 | 49 | 59.2% |
| Combined | 90 | 138 | 65.2% |

This historical set met the **majority of defeats on waves 9–10** criterion both
overall and within each round. Defeat counts are a measurable proxy for setbacks,
not a measure of all time spent waiting or proof of typical player experience.
There are still defeats outside those waves, including 11 on wave 21 and six on
wave 25. One of the six runs needed more than 100 attempts. This small fixed
sample does not establish a general completion bound or show that every army
experiences strictly increasing combat difficulty.
No economy rules were changed to obtain these results.

### Historical long repeat sequences

`scripts/campaign-stalls.mjs` attributes a sequence to the first uncleared wave
that blocked progress, not to the easier retreat wave. A sequence starts at that
defeat and includes every retreat, replay and the final first-clear victory.
Here, "long" means at least five recorded attempts. This threshold is an explicit
diagnostic convention, not a measured player patience limit.

| Round | Long sequences on 9–10 / all | Share | Extra attempts on 9–10 / all long sequences |
| --- | ---: | ---: | ---: |
| 1-1 | 9 / 16 | 56.3% | 64 / 98 |
| 1-2 | 5 / 6 | 83.3% | 42 / 46 |
| 1-3 | 6 / 13 | 46.2% | 50 / 90 |
| Combined | 20 / 35 | 57.1% | 156 / 234 |

Extra attempts exclude the final successful first clear. All 35 long sequences
completed. The previous candidate had only 10 of 27 long sequences (37.0%) on
9–10. The revised curve shifts more repeat burden to the intended closing waves,
but the third round still has **more separate long sequences outside 9–10**.
Its late-wave sequences account for 55.6% of extra attempts; that different metric
must not be substituted for the 46.2% count. One wave-21 sequence lasts 11 attempts;
the longest wave-29 sequences last 13. The longest overall is 19 attempts on wave
19, followed by 17 on wave 10.

**Verdict for the pre-removal snapshot:** concentration improved substantially and held overall. A strict
majority of long sequences in every individual round is **not yet demonstrated**.
The limited adjustment stops here; no design conflict or need to change the
economy has been established. The remaining discrepancy is recorded rather than
hidden behind the six successful completions. This previous snapshot passed 66
automated tests and a Vite production build. Those results are not a fresh check
of the subsequent escort removal; the new focused results are documented above.

Harness commands from the worktree root (running them now would evaluate current
code, not recreate the historical wave-10 roster):

```powershell
node king-defense-toon/scripts/early-campaign.mjs --speed 1 --max-attempts 30 --output "$env:TEMP/brotd-opening-x1.json"
node king-defense-toon/scripts/early-campaign.mjs --speed 3 --max-attempts 50 --output "$env:TEMP/brotd-opening-x3.json"
node king-defense-toon/scripts/early-campaign.mjs --seeds 1,3,4 --last-wave 30 --max-attempts 100 --speed 1 --output "$env:TEMP/brotd-opening-30-x1-gates-final.json"
node king-defense-toon/scripts/early-campaign.mjs --seeds 1,3,4 --last-wave 30 --max-attempts 120 --speed 3 --output "$env:TEMP/brotd-opening-30-x3-gates-final.json"
node king-defense-toon/scripts/campaign-stalls.mjs "$env:TEMP/brotd-opening-30-x1-gates-final.json" "$env:TEMP/brotd-opening-30-x3-gates-final.json"
node --test king-defense-toon/tests/*.test.mjs
```

## Movement

An actual enemy deadlock at the royal neck was reproduced: two goblins remained
outside the entrance after the entire army died, leaving the battle running at
600 seconds. Their 21px soft spacing could not fit the 16px walkable neck. Local
spacing is now 12px there; normal spacing and land-path constraints are unchanged.
The reproduction now ends in defeat after 37.95 battle seconds. Crossing tests
verify that fighters stay on land.

Nine diagnostic battles also checked allied swordsmen. They advance when enemies
spawn, reach and slash ranged enemies, and retarget after a kill. No permanent
stall was reproduced. Mixed eight-fighter armies waited at most about 1.6 seconds
for attack space; a deliberately crowded fifteen-swordsman army had waits up to
9.3 seconds. Movement resumed after the front line changed. Four rear swordsmen
in that case never attacked before the other fighters won. This is a remaining
crowding limitation, not a claim that all formations have been exhaustively tested.

Hero stat growth remains 5% per level. Recruitment, merging, resource rates and
the king's combat stats are unchanged. The release also includes the rendered-frame
FPS counter. All 73 Node tests and the Vite build passed before publication;
the stable alias's HTML, JavaScript and CSS match the local build byte for byte.
King upgrades and skills remain design proposals and are not part of this release.
