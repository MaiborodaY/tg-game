# Campaign economy v3 — two levels, 20 rounds each

Progression combines **individual fighters in the Barracks, per-type recruitment levels, same-type merging and gold-funded army slots**. Fighters come only from slave conversion; gold cannot buy a fighter or upgrade an existing fighter's personal level. Slaves fund recruits, while gold funds deployment cells and buildings. Merging adds one owned fighter's level to another of the same type and consumes the source. Personal levels reach 100; the old milestone of 15 maximum-rank guards plus 2,000 gold and its eight-hour target no longer describe this system. No new completion-time estimate is claimed. The campaign has two levels of 20 rounds × 10 waves each (400 waves total), with three starting allied classes, an unlockable Lancer and the king. Rounds run from 1-1 through 1-20, then 2-1 through 2-20.

## Starting position and spending

| Item | Current balance |
| --- | --- |
| Starting gold | 125 |
| Starting slaves | Three, granted once to fresh or legacy empty accounts with zero slaves |
| Starting formation | Three open tiles in the central column; empty army |
| Additional tiles | Any locked location; successive prices 25, 50, 100, 175, 275, 400, 550, 750, 1,000, 1,300, 1,650, 2,100 gold |
| Total expansion cost | 8,375 gold for all 12 additional tiles |
| Gold recruitment | Removed; all newly obtained fighters come from slave conversion |
| Slave conversion | One slave becomes one individual reserve fighter: 60% swordsman, 25% archer, 15% healer before Barracks II; then 40% / 25% / 15% / 20% Lancer |
| Recruitment level | 5 x current recruitment level additional matching conversions per increase; cap 100; affects only newly converted fighters |
| Personal level / Merge | Same-type owned fighters can merge into a deployed fighter, adding their levels and consuming the source; cap 100; no currency cost |
| Gold personal-level upgrades | Removed; existing fighters retain their personal levels |
| Barracks Recruit | Select a reserve fighter, then choose an army tile; free deployment or replacement; selection alone changes no ownership |
| Individual Sell | In a reserve fighter's detail view; one gold, with the last owned fighter protected |
| Reserve placement / replacement | Free; each fighter retains identity and level; the replaced fighter returns to reserve |
| Removing a guard | Returns the fighter to reserve, no gold refund; tile remains unlocked; last guard cannot be removed while a battle or its result exists |
| Treasury | Starts at level 1, earning 1 gold per real minute, including up to four hours per absence |
| Treasury upgrades | 75 → 150 → 300 → 600 gold; max level 5, earning 5 gold/minute |
| Treasury offline storage | Four hours per absence at every Treasury level; 240–1,200 gold, credited automatically on return |
| Slave Market conversion | Always visible and available, including before passive production is purchased |
| Slave Market passive income purchase | Optional, initially inactive; 100 gold once |
| Slave Market income | One slave per 30 real minutes after the income purchase, online or offline; no production upgrades yet |
| Market offline storage | Four hours per absence, up to eight slaves, credited automatically on return |

Cell purchases now use the gold prices above; old gold recruitment and paid level-up actions are removed. Treasury and the 125-gold start are unchanged. Previously opened tiles remain open, and old purchases are neither charged again nor refunded. Moving guards, swapping deployed positions and transferring fighters between formation and reserve are free.

The **5 × 3 Army grid stays below the battlefield** during preparation and combat, with Market and its slave count above Barracks in the left gutter. Recruitment info or Cancel is at the upper right and Buildings at the lower right; there is no separate bottom toolbar. An empty cell opens the compact picker for reserve placement; an occupied cell offers reserve replacement, Merge, movement and removal; a locked cell offers its next gold unlock price and then the reserve picker. Conversions, merges, Barracks sales, reserve transfers and cell unlocks **save immediately**, without draft reservations or a Save army step. Currency transactions use live balances. Closing the picker does not reverse a completed transaction. Income earned during editing remains available. An empty starting army is allowed, but the first manual Start requires at least one guard. Once a battle or its result exists, removal cannot leave the saved army empty.

The current battle retains its own fighter snapshot. The next wave uses the latest saved formation, including changes made during combat or its automatic countdown. Automatic waves and building income continue under the unit picker and other menus. The recruitment update does not alter combat rewards, capture rules, building rates or offline caps.

## Barracks II: timed Lancer unlock

The upgrade requires **Swordsman recruitment level 5**: **50 received swordsmen** without legacy training credit. Existing credit counts; a level-5 merged fighter or a boss clear does not satisfy the requirement. Construction spends **200 gold** once and takes **one real hour**, including offline time. Battle speed does not affect it.

Optional instant completion costs `ceil(100 × remainingMs / 3,600,000)`, capped at 100 gold: thirty minutes cost 50, the last 36 seconds cost one, and natural completion is free. The live price is recalculated at purchase; reloads and repeated clicks cannot repeat the payment.

After completion, the next **one-slave** conversion guarantees the first **level-1 Lancer**. The slave debit, fighter, type receipt and consumed guarantee save together. Subsequent odds are **40% swordsman / 25% archer / 15% healer / 20% Lancer**. Before completion, the existing 60/25/15 odds remain. The new type starts with zero receipts; older receipts, training credits, personal levels and resources remain intact.

The Lancer has **48 HP / 7 damage / 75 range / 1.3-second base attack interval**, one target per attack and the shared five-percent personal-level growth. Placement is free, sale returns one gold, and only matching Lancers merge. Waiting avoids the optional acceleration cost. No new completion-time estimate, king upgrade or other economy change is implied.

## Individual recruits and personal levels

Tap the always-visible market to spend **one slave** and receive one reserve fighter. The spend and result save immediately before the **1,200 ms** visual sequence: a captive enters the workshop, the workshop lights up, and the new fighter travels down to Barracks. Reloading during the animation retains the completed transaction without repeating it. Before Barracks II completes, rolls are **60% swordsman / 25% archer / 15% healer**. Completion grants one guaranteed Lancer conversion, then changes the odds as described below. There is no automatic merge; each result is a separate owned fighter. Counts accumulate by the rolled type, regardless of where earlier fighters are deployed or stored. Gold cannot buy an alternative recruit.

The small **i** at the upper right of the Army dock opens **Recruitment**, showing the currently unlocked class chances (60% / 25% / 15% before Barracks II; 40% / 25% / 15% / 20% after completion), each current recruitment level and how many more fighters of that type are needed for the next level. This panel is available even with zero slaves and spends nothing. It uses saved per-type counts, updates after conversions and shows the level-100 cap. The persistent last-recruit caption is removed; conversion has its transfer animation and a short result notice in the right gutter.

The result's level is calculated **after incrementing that type's count**. Advancing from recruitment level L to L+1 needs **5 x L** more matching fighters. Cumulative cost at level L is **5 x L x (L-1) / 2** for a fresh account.

| Total matching conversions | Level of the new fighter | Progress toward next recruitment level |
| --- | --- | --- |
| 1-4 | 1 | 1-4 / 5 |
| 5 | 2 | 0 / 10 |
| 14 | 2 | 9 / 10 |
| 15 | 3 | 0 / 15 |
| 30 | 4 | 0 / 20 |
| 50 | 5 | 0 / 25 |
| 225 | 10 | 0 / 50 |
| 24,750 and above | 100 | At cap |

**Existing fighters are not leveled up retroactively.** A level-1 swordsman stays level 1 when the fifth matching conversion produces a level-2 recruit. Move, reserve, replacement, death in a wave and reload preserve personal levels. Selling a reserve fighter does not decrement conversion counts or lower future recruits' levels.

**Migration:** version-1 recruitment data moves to version 2 without resetting the campaign or changing received totals. A fixed per-type legacyTrainingCredit preserves the prior recruitment level and its proportional partial progress (rounded down by less than one matching recruit). At the cap, partial progress is zero. Version-2 loads reuse saved credit rather than recomputing it. For example, an old count of nine swordsmen stays nine with 21 training credit: recruitment remains level 4 and requires 20 further swordsmen for level 5. Existing personal levels remain, but all fighters use the gentler stats below. Newly started accounts have no legacy credit.

The level-100 limit is a long-term technical cap, not a target for campaign completion. Without legacy credit, the expected total slave conversions for a first level-4 fighter **obtained directly from Market** are 50 swordsman / 120 archer / 200 healer, using the Barracks I probabilities throughout; these are averages, not guarantees or elapsed-time estimates. Merging can produce a level-4 fighter earlier. Each class tracks its own recruitment count independently of merges.

Barracks shows compact fighter icons with personal levels. Tapping an icon opens its detail view with HP, Attack, Healing when applicable, and **Recruit**, **Merge** and **Sell** actions. Tapping Recruit closes the menu and selects the fighter for placement without removing it from reserve or changing any balance. Choosing an empty unlocked tile deploys it for free; choosing an occupied tile swaps that guard into reserve. A locked tile offers a gold unlock first and deploys the selected fighter after purchase. Both fighters keep their identities and personal levels. Canceling placement leaves ownership and resources unchanged; reloading also leaves an unplaced selection safely in reserve. Completed placements save immediately and affect the next wave, leaving the active battle's snapshot untouched.

**Sell** in the detail view sells one reserve fighter for **one gold**, unless it is the last owned fighter. Deployed fighters are never sold from Barracks. Selling does not alter combat snapshots, received counts, unlocked cells or other fighters' levels.

The green **+ Merge** action is available in a reserve or deployed fighter's detail view. Select it, then tap **another deployed fighter of the same type** on the Army grid. The target keeps its identity and cell and receives the sum of both personal levels; the source disappears only after a valid target is chosen. A deployed source leaves its original cell empty and unlocked. For example, a level-2 swordsman merged into a level-3 swordsman produces one level-5 swordsman. A different class, the source itself, or an empty/locked cell cannot receive a merge. A total above **100 is rejected without consuming either fighter or discarding levels**; an exact total of 100 is allowed. Cancel or Escape before completion keeps both fighters unchanged.

Merging costs **no gold or slaves**, awards no sale gold and does not change per-type received counts or future recruitment levels. It saves the upgraded target and removed source together immediately. The active battle keeps its existing snapshot: the next wave receives the merged formation. Completed merges survive reload; an unfinished target selection consumes nothing. Summing levels creates a faster personal-level path than recruiting alone, so all three stats now grow by **5% of level-one base per level**, down from 10%, without compounding:

| Stat | Formula at personal level `L` |
| --- | --- |
| HP | `round(baseHP × (1 + (L − 1) × 0.05))` |
| Damage | `round(baseDamage × (1 + (L − 1) × 0.05))` |
| Healing | `round(baseHealing × (1 + (L − 1) × 0.05))` |

A swordsman has **60 HP / 6 damage at level 1**, **69 / 7 at level 4**, **72 / 7 at level 5** and **87 / 9 at level 10**. Integer rounding means some small damage or healing values remain unchanged on a single level increase: healer healing at levels 1–4 is **4 / 4 / 4 / 5**. Existing fighters retain their personal levels but use the new formula; merging does not alter attack speed, movement speed or range.

Native sprite colors change every 25 personal levels: **1–25 blue, 26–50 purple, 51–75 red, 76–100 gold**. The same mapping applies to battlefield animations, formation and reserve portraits without changing owned levels, stats or recruitment progress. These formulas describe configuration; they are not verified victory or time-to-progress estimates.

## Kill rewards and wave progression

Both **Level 1: Whispering Woods** and **Level 2: Forgotten Graveyard** contain **20 rounds of ten waves**. Each round ends with a mini-boss, replaced by the main boss in rounds 10 and 20. Wave 5 is an ordinary encounter. This rebalance covers **global waves 1–30 only: Level 1 rounds 1–3**. **Waves 31–400 retain their previous definitions**, including all of Level 2; the distant campaign has not been calibrated as part of this opening update.

The first three waves retain their existing stats, composition and schedules. The first round has **3 / 4 / 5 / 5 / 6 / 6 / 7 / 8 / 9 / 5 enemies** and total HP **180 / 184 / 264 / 306 / 366 / 426 / 506 / 620 / 790 / 750**. Wave 10 has a chief, two goblins and two archers, arriving **4 + 1 at 0.8 and 14.8 simulation seconds**: the second arrival is now one archer. Global waves **11–19 and 21–29** each have **four goblins, two archers and two boars**, arriving **4 + 4** on that schedule. Waves 20 and 30 retain a chief, three goblins and two archers, arriving **4 + 2**. Every simultaneous arrival stays at four enemies or fewer.

| Wave in round | Round 1 total HP | Round 2 total HP | Round 3 total HP |
| --- | --- | --- | --- |
| 1 | 180 | 866 | 1,265 |
| 2 | 184 | 878 | 1,277 |
| 3 | 264 | 890 | 1,289 |
| 4 | 306 | 902 | 1,301 |
| 5 | 366 | 914 | 1,313 |
| 6 | 426 | 926 | 1,325 |
| 7 | 506 | 938 | 1,337 |
| 8 | 620 | 950 | 1,349 |
| 9 | 790 | 1,120 | 1,500 |
| 10 | 750 | 1,250 | 1,680 |

The opening chiefs have **450 / 688 / 924 HP** at global waves 10 / 20 / 30, respectively. Their encounters bypass the old 1.25× total-HP floor. The user's removal of the second-arrival goblin on wave 10 leaves its chief unchanged at **450 HP / 18 damage**, without a compensating buff, and creates the explicit total-HP exception **wave 9→10: 790 → 750**. All other steps through 30 rise, including transitions **750 → 866** and **1,250 → 1,265** between rounds; no post-boss relief was added. Larger HP and shared damage increases close rounds 2–3. Composition, damage, timing and available allied roles also affect difficulty; total HP alone does not prove a harder fight for every army. See [README.md](README.md) for opening roles and schedules and [opening-curve.mjs](opening-curve.mjs) for the round 2–3 allocation.

Combat checks use the actual engine through [scripts/combat-balance.mjs](scripts/combat-balance.mjs); [OPENING_BALANCE.md](OPENING_BALANCE.md) records the scenarios, results and limitations. Explicit test armies and levels are not a natural first-clear simulation or an income/recruitment forecast. Recruitment probabilities, **5% personal-level stat growth**, merging, capture rules, prices and income rates are unchanged.

A separate resource-linked harness, [scripts/early-campaign.mjs](scripts/early-campaign.mjs), earns its cells and fighters using the actual APIs. **Historical snapshot before the wave-10 goblin removal:** six thirty-wave scenarios completed at ×1/×3 in **452 battles without timeouts**, with one requiring 102 attempts. Ninth/tenth waves accounted for **90 of 138 defeats (65.2%)**, and a majority within each round. These runs have not been repeated for the five-enemy wave 10 and do not validate the current revision. The documented management policy and fixed seeds are not a population sample or a promised completion time.

**Deferred boundary:** the old wave 31 has ten enemies and **1,054 total HP**, below wave 30's **1,680**. This round transition, the remaining forest rounds and the level boundary have not been rebalanced. Level 2 still uses skeletons, skeleton archers and ghouls, with three times the **earlier forest baseline** stats and twice the per-kill reward by role. It does not inherit the new first-30-wave overlay; for example, its first chief remains **1,950 HP / 54 damage**, rather than three times the new first chief. The final Crypt King retains **13,248 HP / 156 damage**. These unchanged definitions are not presented as a verified 400-wave difficulty curve.

Current per-enemy kill rewards stay fixed within each level:

| Enemy role | Level 1 gold | Level 2 gold |
| --- | --- | --- |
| Ordinary melee / archer | 1 | 2 |
| Boar / ghoul | 2 | 4 |
| Chief / Crypt Spider | 20 | 40 |
| Ogre / Crypt King | 20 | 40 |

| Wave in round | 1-1 kill gold | 1-2 kill gold | 1-3 kill gold |
| --- | --- | --- | --- |
| 1 | 3 | 10 | 10 |
| 2 | 4 | 10 | 10 |
| 3 | 5 | 10 | 10 |
| 4 | 6 | 10 | 10 |
| 5 | 7 | 10 | 10 |
| 6 | 8 | 10 | 10 |
| 7 | 7 | 10 | 10 |
| 8 | 10 | 10 | 10 |
| 9 | 11 | 10 | 10 |
| 10 | 24 | 25 | 25 |
| Total | 85 | 115 | 115 |

| Scope | Enemies | Kill gold | First-clear gold |
| --- | --- | --- | --- |
| 1-1 | 58 | 85 | 550 |
| 1-2 | 78 | 115 | 550 |
| 1-3 | 78 | 115 | 550 |
| First 30 waves | 214 | 315 | 1,650 |
| All Level 1 definitions | 2,734 | 3,668 | 11,000 |
| All Level 2 definitions, unchanged | 2,761 | 7,390 | 11,000 |
| Entire campaign definitions | 5,495 | 11,058 | 22,000 |

The first clear of each wave awards **10 × wave-in-round number**: 10, 20, …, 100, totaling **550 per round, 11,000 per level and 22,000 across the campaign**. Level 2's doubled kill rewards do not multiply first-clear bonuses. First-clear history stores global IDs **1–400** independently from current progress, so retreat and replay cannot repeat a bonus. Global waves 11 and 201 each grant 10 first-clear gold; wave 200 grants 100.

Clearing the first 30 waves once awards **1,965 kill/first-clear gold** before other income. Arithmetic over all current definitions gives **33,058 gold** for the whole campaign: **14,668 in Level 1** and **18,390 in Level 2**. These sums exclude retries, Barracks sales and building income, and do not demonstrate that an account can complete the campaign or predict its completion time. Migrated accounts retain previously claimed first-clear rewards and cannot claim them again. Per-enemy payouts and first-clear bonuses are unchanged; changes to wave composition change the total kill income.

Defeat retreats one global wave, with **1-1 Wave 1** as the minimum. Losing **1-2 Wave 1** prepares **1-1 Wave 10**; losing **2-1 Wave 1** prepares **1-20 Wave 10**. Deployed and reserve fighters, personal levels, recruitment counts, unlocked cells, resources and buildings are kept, and the army and king recover between attempts. Kills remain rewarded on failed attempts; losing without kills grants no reward. Clearing a round's tenth wave advances to the next round. Victory at **1-20 Wave 10** advances to **2-1 Wave 1**. Only victory at **2-20 Wave 10** completes the campaign and permits replay from **1-1 Wave 1**.

To accommodate longer reinforcement schedules, enrage starts at **max(75, last scheduled spawn + 45) simulation seconds**, with its warning 15 seconds earlier. Speed settings scale this combat clock; income and capture cooldowns still use real foreground time.

## Capture rules

The first **four total captures** have **50% chance per kill**, without a cooldown between them. The first is guaranteed by the **second kill**; captures 2–4 are each guaranteed within **three further kills**. Thus a fresh campaign receives four combat captures by **11 kills at the latest**, in addition to its three starter slaves. Those four captured slaves can become four reserve recruits. Starter supply and spending slaves do not advance or restart the introductory capture rules.

The fourth capture, and every capture afterward, starts a **30-second foreground cooldown**. Once it expires, kills have **30% chance**, with a capture guaranteed by the **fifth eligible kill**. Kills during the cooldown do not accumulate toward another capture. Extra elapsed time does not bank multiple capture charges. The current chance, guarantee, countdown and saved kill progress appear in Buildings.

Capture odds were raised after recruitment became slave-only: regular chance 15% to 30%, regular guarantee seven to five eligible kills, cooldown 60 to 30 seconds; starter chance 35% to 50% and guarantees for captures 2–4 five to three kills. The first guarantee remains two kills. **Market production adds spendable slaves without incrementing lifetime combat captures or changing the capture chance, guarantee, search progress or cooldown.** A fixed number of captures per level is not guaranteed: waves differ in duration, kills and outcomes.

Existing v2 campaigns retain their army, currencies, unlocked cells, lifetime capture count and accumulated search kills. Starter cooldowns are cleared on load when fewer than four total captures have been earned. Saved later cooldowns are clamped to 30 seconds; shorter remaining waits are preserved. Saved search progress beyond a newly lowered guarantee is retained and produces a capture on the next eligible kill. There is no save reset or retroactive capture reward; the one-time empty-account starter supply is described below.

Capture cooldown uses **real foreground time**, including army editing, the unit picker, Settings and Buildings, and stops while the app is hidden or closed. Treasury and a built Slave Market produce during foreground play and also accrue capped offline income as described below. ×2 and ×3 speed combat and kill earnings, but do not accelerate building production or the capture cooldown. Gold, search progress and captures save after each rewarded kill; fractional building progress and cooldown also checkpoint and survive reloads. Reopening a battle does not reset the search history or bypass its cooldown.

## Offline Treasury income

When the player returns after closing the game, hiding its tab or minimizing Telegram, Treasury income is credited automatically and shown in a persistent **Welcome back!** reward window. The player presses **Collect** to close it. Each absence earns at the saved Treasury rate for **at most four real hours**. Time beyond that cap is discarded when the absence is settled; it does not roll into a later claim. Fractional gold is retained toward the next whole coin.

| Treasury level | Gold per minute | Maximum for one absence |
| --- | --- | --- |
| 1 | 1 | 240 |
| 2 | 2 | 480 |
| 3 | 3 | 720 |
| 4 | 4 | 960 |
| 5 | 5 | 1,200 |

For example, a level-1 Treasury earns 30 gold after 30 minutes away and 240 after either four or eight hours away. Current upgrades raise income only; the four-hour limit is the same at every level. Upgrades to storage duration are planned for later and are not implemented.

The reward window lists only nonzero gold/slave rewards and stays open until **Collect**; tapping the backdrop or Escape does not dismiss it. The saved `offlineRewards` receipt is written with already-credited balances and consumed income timestamps. Collect clears this receipt without paying again. Reloading before Collect reopens the same unacknowledged rewards without duplication; reopening after Collect does not repeat them. Further offline income merges into any unacknowledged receipt. Menus underneath are preserved and restored after acknowledgement; ordinary foreground building income continues independently.

The economy stores an income timestamp in the existing v2 save. Returning or loading settles the elapsed interval and immediately saves both its income and the new timestamp, preventing repeated resume events or reloads from collecting the same absence again. Older saves without a timestamp establish one on their first load without a retroactive award. Combat, automatic-wave countdowns and capture cooldowns remain paused offline; Treasury and a built Slave Market produce resources. The feature uses the device clock and local save, with no server/database addition.

## Slave Market

The **Slave Market is always visible to the left of the Army grid, above Barracks**, with the current shared slave balance. Its larger stock badge and highlighted workshop identify the primary recruitment action. Counters abbreviate values of 1,000 or more; accessible labels and menus retain exact counts. Conversion is available in both fresh runs and existing saves without a building purchase. The optional **100-gold purchase in Buildings enables passive production**; the existing `built` save flag records this income unlock. Enabling production starts its timer immediately, and being offline before that purchase never awards market income.

Once passive income is enabled, the market produces **one slave per 30 real minutes**: **two per hour**, online or offline. It preserves partial production across saves and absences. Income is credited automatically as whole slaves. Offline gold and slaves share the persistent reward window, closed with **Collect**. A single absence counts for **at most four hours**, so it contributes at most **eight slaves**; excess time is discarded after settlement. The cap limits each absence, not total stored slaves or ongoing foreground production.

For example, leaving a freshly built market for one hour awards two slaves; leaving it for either four or eight hours awards eight. If 20 minutes of production were already saved, returning after another ten minutes completes one slave. Repeated load or resume events cannot claim that same interval again: settlement checkpoints the updated currency, partial progress and timestamp together in the existing v2 save.

Combat captures and passive production trigger a **+N captive-icon badge over Market for 2.8 seconds** and a stock-counter pulse. Feedback earned under menus waits until they close; an offline reward receipt is acknowledged with **Collect** before its arrival feedback is shown, after any restored menu is closed. Reduced-motion preferences show static feedback. These notifications do not award resources: balances and receipts keep their existing immediate-save and idempotency behavior. The vertical layout and new artwork change no prices, conversion chances, production rates, capture rules or offline caps.

Produced slaves use the same balance as combat captures and starter supply, and convert into reserve fighters. Deployment cells spend gold instead. Produced slaves do not consume or advance the combat-capture guarantee, lifetime capture count, search counter or cooldown. Market production continues while editing the army or using menus and is unaffected by battle speed. Conversions spend from the current slave balance immediately; market income earned while editing is retained and can fund subsequent conversions.

The passive-income unlock persists through defeats, campaign replay and reloads. Reset run disables passive production and clears its progress; the visible market's conversion function remains available, with three fresh starter slaves. There are currently **no market production upgrades or storage-duration upgrades**. Treasury rates, Treasury upgrades and combat rewards are unchanged; cell prices now follow the gold schedule above.

## Historical economy-only estimate — superseded

The archived `scripts/model-progression.mjs` model predates conversion and individual reserve fighters. It modeled **15 unlocked cells, 15 rank-4 guards and approximately 2,000 spare gold**, using slave-funded cells and gold-funded rank upgrades that are now removed. The results below are retained only as historical context and must not be used as current economy targets, acceptance criteria or time estimates. The model was not updated or rerun for this system.

That model sampled **Level 1 local waves 1–9**, with 200 seeded samples per scenario and a 72-hour horizon. Each sample started with three purchased rank-1 guards, recruited into newly opened cells, bought the cheapest available ranks first, and purchased Treasury upgrades at illustrative optional milestones when affordable. It calculated economy only, not combat. Its old 16,700-gold cost for five guards of each type at rank 4 has no direct equivalent in the new personal-recruit system.

The historical Level 1 sample had weighted income of **77 / 51 ≈ 1.5098 gold per kill**, including its chief encounter. Its expected search length after a cooldown was `(1 - 0.85^7) / 0.15 ≈ 4.5295 eligible kills`. It excluded Level 1's ogre wave and escorts, all of Level 2, one-time first-clear bonuses, offline Treasury income, and **both the market's 100-gold purchase and all online/offline slave production**. It assumed the sampled enemy mix could be encountered repeatedly at a fixed average kill rate over real foreground time, including preparation and menus. It did not model victories, wave access, low-kill stretches, changing army strength or absences. It also had no slave spending on recruits, random class distribution, personal levels or reserves. Level 2's stronger enemies cannot be assigned the same real kill rate from these calculations.

| Average kills per real active minute | Mean hours to all 15 cells | Median hours to full mixed army + 2,000 gold | 10th–90th percentile of target hours |
| --- | --- | --- | --- |
| 5 | 8.93 | 27.67 | 27.67–27.67 |
| 7 | 7.87 | 21.99 | 21.99–22.00 |
| 8 | 7.54 | 19.94 | 19.94–19.94 |
| 10 | 7.07 | 16.85 | 16.84–16.85 |
| 12 | 6.76 | 14.57 | 14.57–14.57 |

All 200 historical samples in each listed scenario reached both old milestones within 72 hours. At eight kills per foreground minute, that model reached all cells in a mean **7.54 hours**, and the old full-army-plus-gold target in a median **19.94 hours**. Gold was the limiting resource under those assumptions, explaining the narrow target-time ranges. Percentiles described only modeled capture randomness, not real player variation. These figures do not apply to the current conversion system.

**Historical comparison:** the earlier 4-gold ordinary enemies produced an 8.15-hour estimate at the same hypothetical eight kills per minute and a 230 / 51 gold-per-kill mix. That estimate describes the superseded rewards; it is not the current campaign target or evidence of measured playtime.

**Actual player sustained kills per minute have not been measured.** Enemy strength, defeats, group spacing, positioning, preparation time and ×1 versus ×2 or ×3 can change it. The new system also depends on gold spending between cells and buildings, conversion frequency, rolled classes, Barracks sales, reserve choices and passive income. No fixed eight-hour or other progression-time promise is made. The historical model above did not run combat. The current opening now has a separate real-combat and resource-API harness, with explicit assumptions and measured scenarios in [OPENING_BALANCE.md](OPENING_BALANCE.md).

## Save separation

Current storage key remains `brotd-infinity:campaign:v2`, with `campaignVersion: 3` inside the saved record. Recruitment adds individual reserve fighters and per-type received counts to the existing record. **Existing deployed fighters keep their identity and personal level; older saves get an empty reserve and zero received counts**, with no invented conversion history or retroactive level-up. Gold, slaves, cells, campaign progress, building ownership/production and capture/first-clear history remain intact. Previously spent upgrade gold is not refunded or charged again.

The new **`starterSupplyGranted`** marker is recorded once for both fresh and existing accounts. Before that marker exists, an account receives **three starter slaves only if it has no deployed fighters, no reserve fighters and exactly zero slaves**. This supplies an empty account after gold recruitment is removed. Accounts that already own fighters or slaves receive no grant and keep all existing balances. Recording the marker even when no grant is needed prevents later sales or spending from triggering it. Starter supply leaves capture totals, search progress, cooldown and recruitment counts unchanged; subsequent conversions advance only their normal type counts.

`clearedWaves` now counts global progress from 0 through 400, and first-clear claims use global IDs 1–400; bonus amounts use wave-in-round 1–10. Migration runs once when the saved campaign marker is older than 3. Old cleared counts 0–9 stay unchanged; 10–19 map to 200–209; a completed old campaign at 20 maps to 210 and resumes at 2-2 Wave 1. Seven old clears therefore resume at 1-1 Wave 8, and ten at 2-1 Wave 1. Old claim IDs 1–10 are retained, and 11–20 map to 201–210. No claims are invented for the skipped new rounds, and the migration grants no currency or retroactive bonus. Owned fighters, personal levels, received counts, resources, unlocked cells and building data are preserved. Reloading a version-3 save does not remap progress or claims again. Older saves without a Treasury timestamp establish one without retroactive income. Saves without a market production unlock start with passive production disabled; the visible market can still convert existing slaves. Enabling income establishes its own production baseline. Offline credits, fractional production and settlement timestamps save immediately.

Clearing global wave 400 permits replay from 1-1 Wave 1, with progress reset only when replay starts; fighters, reserve, recruitment totals and buildings persist. The older `kings-guard:toon:formation:v1` save remains untouched. Reset in Settings affects only the current campaign record, clears owned fighters and conversion counts, disables market passive production, restores three starter slaves and records the starter marker. There is no server/database integration.
