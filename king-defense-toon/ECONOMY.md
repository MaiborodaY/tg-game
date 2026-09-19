# Campaign economy v3 — two levels, 20 rounds each

Progression combines **individual fighters in the Barracks, per-type recruitment levels, same-type merging and gold-funded army slots**. Fighters come only from slave conversion; gold cannot buy a fighter or upgrade an existing fighter's personal level. Slaves fund recruits, while gold funds deployment cells and buildings. Merging adds one owned fighter's level to another of the same type and consumes the source. Personal levels can continue beyond 100; the separate recruitment level remains capped at 100. Barracks I/II/III/IV permit up to 8/9/10/11 army cells. The old milestone of 15 maximum-rank guards plus 2,000 gold and its eight-hour target no longer describe this system. No new completion-time estimate is claimed. The campaign has two levels of 20 rounds × 10 waves each (400 waves total), with three starting allied classes, an unlockable Lancer and the paladin hero St. Knihor. Rounds run from 1-1 through 1-20, then 2-1 through 2-20.

## Starting position and spending

| Item | Current balance |
| --- | --- |
| Starting gold | 125 |
| Starting slaves | Three, granted once to fresh or legacy empty accounts with zero slaves |
| Starting formation | Three open tiles in the central column; empty army |
| Additional tiles | Barracks I: up to eight cells in the central three columns; II unlocks the ninth central cell; III additionally permits one chosen outer-column cell; IV permits a second, up to eleven total. Successive prices: 25, 50, 100, 175, 275, 400, 550, 750 gold |
| Total expansion cost | 625 / 1,025 / 1,575 gold for eight/nine/ten total cells, excluding Barracks construction |
| Gold recruitment | Removed; all newly obtained fighters come from slave conversion |
| Slave conversion | One slave becomes one reserve fighter. Only unlocked types share equal odds. Humans open Archer / Healer / Lancer at open-type level totals 3 / 5 / 10. Elves require building III: Archer at Rider level 3, Healer / Unicorn at open-Elf totals 5 / 10 |
| Recruitment level | 5 x current recruitment level additional matching conversions per increase; cap 100; affects only newly converted fighters |
| Personal level / Connect | Open the recipient in Army or Barracks, select same-type donors from either location, then add their levels in one action; continues beyond 100; no currency cost |
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

Cell purchases use the gold prices above; old gold recruitment and paid level-up actions are removed. Treasury and the 125-gold start are unchanged. Barracks II permits the ninth central cell and Barracks III permits one chosen outer-column cell, with a second at IV; upgrades do not purchase cells automatically. At tier III the player can buy its side cell before finishing central expansion; its price follows the total number of purchased cells. All other outer cells remain gated. Moving guards, swapping deployed positions and transferring fighters between formation and reserve are free. Older saves reconcile excess side cells with a refund and return their fighters to reserve, as described under Storage and migration.

The **5 × 3 Army grid stays below the battlefield** during preparation and combat, with Market and its slave count above Barracks in the left gutter. Recruitment info or Cancel is at the upper right and Buildings at the lower right; there is no separate bottom toolbar. An empty cell opens the compact picker for reserve placement; an occupied cell offers reserve replacement, Connect, movement and removal. A locked cell shows its gold price when permitted by the current Barracks tier, otherwise the Barracks requirement or capacity limit. Conversions, merges, Barracks sales, reserve transfers and cell unlocks **save immediately**, without draft reservations or a Save army step. Currency transactions use live balances. Closing the picker does not reverse a completed transaction. Income earned during editing remains available. An empty starting army is allowed, but the first manual Start requires at least one guard. Once a battle or its result exists, removal cannot leave the saved army empty.

The current battle retains its own fighter snapshot. The next wave uses the latest saved formation, including changes made during combat or its automatic countdown. Automatic waves and building income continue under the unit picker and other menus. The recruitment update does not alter combat rewards, capture rules, building rates or offline caps.

## Barracks II, III and IV: timed upgrades

| Upgrade | Recruitment requirement | Construction | Real duration | Full acceleration price | Result |
| --- | --- | ---: | --- | ---: | --- |
| I → II | Swordsman recruitment level 5 | 200 gold | One hour | 100 gold | Ninth central cell becomes purchasable; pending guaranteed Lancer, usable at human total 10 |
| II → III | Sum of all four human recruitment levels ≥ 15 | 2,000 gold | Three hours | 300 gold | Up to ten cells including one chosen outer cell; Elven roster selection |
| III → IV | Panther Rider recruitment level 5 | 5,000 gold | Six hours | 600 gold | Up to eleven cells including two chosen outer cells |

Recruitment level 5 requires **50 received fighters of the matching type** without legacy training credit. Existing credit counts; a level-5 merged fighter or a boss clear does not satisfy an upgrade requirement. Construction spends its gold once, progresses offline, and is unaffected by battle speed. Barracks IV is the maximum tier.

For II → III, sum Swordsman + Archer + Healer + Lancer recruitment levels, including each type's initial level 1. For example, **10 + 3 + 1 + 1 = 15** qualifies even with Lancer level 1. Elven and personal/Connect levels do not contribute. Upgrades already paid for under the earlier Lancer-5 rule retain their timer and can finish normally.

Open **Mercenaries** to see both factions, current recruitment levels and locked-role requirements. The separate upgrade view shows the next building requirement, purchase, countdown and optional acceleration. Lancer opens at human total 10, independently of building II.

Optional instant completion costs `ceil(fullAccelerationPrice × remainingMs / durationMs)`: at most 100 gold for II, 300 for III or 600 for IV. All three rates cost 50 gold for thirty minutes remaining and one gold for the last 36 seconds; natural completion is free. The live price is recalculated at purchase; reloads and repeated clicks cannot repeat the payment.

After II completes, a pending one-time **one-slave Lancer** bonus is saved. It becomes usable when open human types reach total level 10; earlier conversions use normal odds and keep the bonus pending. Its level follows current Lancer training. The slave debit, fighter receipt and guarantee consumption save together. Humans otherwise start with Swordsman only, open Archer at total 3, Healer at 5 and Lancer at 10. Only open types contribute, including their base level 1; other factions and Connect do not count. All available types share equal odds. III and IV preserve a pending bonus without granting another.

The Lancer has **48 HP / 7 damage / 75 range / 1.3-second base attack interval**, one target per attack and the shared five-percent personal-level growth. Placement is free, sale returns one gold, and only matching Lancers merge. Waiting avoids the optional acceleration cost. No new completion-time estimate, king upgrade or other economy change is implied.

## Recruitment army selection — first playable elf

The Recruitment menu has a saved **Human recruits / Elven recruits** dropdown.
Humans remain the default for old saves. Elves become selectable only after
Barracks III construction finishes, including offline completion. Merely starting
the upgrade does not unlock the selection. Invalid or no-longer-eligible saved
selections fall back to Humans; Reset also returns to Humans.

The Elven roster starts with Panther Rider. Rider recruitment level 3 opens Elven Archer. Total levels of already-open Elves unlock Healer at 5 and Unicorn at 10, without requiring building IV. Closed types contribute nothing, even if older saves contain their receipts. All open types share equal odds: 100%, 50%, exact thirds, then 25% each. Threshold receipts use the old pool; the following conversion uses the new odds.

Selecting a pool is free and preserves both factions' training and owned fighters. Elven hires do not consume a pending Human Lancer bonus.

The Rider starts its own received count and recruitment level at zero / one; no
Human training credit transfers. The fighter has **90 HP / 9 damage / 75 range /
1.05-second base attack interval / 68 movement speed**, versus the Swordsman's
60 / 6 / 38 / 1.1 / 57 at the same level. Personal growth remains +5% of base per
level, and matching Riders can Connect beyond level 100. Placement is free and
selling returns one gold. All three Forge tracks apply equally to the Rider and
the other regular fighters. Existing battle snapshots remain unchanged until the next wave.

The approved glaive-v2 atlas now supplies both the live Rider and menu portraits.
Its short throw releases one spinning glaive and damages one enemy on arrival;
no ricochet or extra damage is added. Rank clothing
changes at levels 50 / 100 / 250 / 500: green / purple / red / gold / black, with
no runtime recolouring. Sheets load only for ranks needed by the current scene.
The Elven Archer uses one purchased cell and has **45 HP / 11 damage / 185 range /
1.30-second base attack interval / 52 movement speed**. Its separate recruitment
progress starts at zero; it cannot Connect with Human Archers. Personal levels,
all three Forge upgrades, one-gold selling and palette thresholds follow the same
rules as other regular fighters. It fires one arrow and gains no area attack.

Elven Healer requires an open-Elf level total of 5 and occupies one cell.
It has **50 HP / 6 healing / 77.5 range / 1.45-second base interval / 50 movement**.
It heals one living wounded ally or hero (including itself), without attacks,
resurrection, castle healing or poison removal. Personal growth, all three Forge
tracks, same-type Connect, one-gold selling and palette bands apply normally.
Old saves initialize its missing recruitment counter at zero; existing training
and fighters are preserved. Healing and Forge stats are fixed for the current wave.

Unicorn is playable at an open-Elf total of 10 and occupies two cells. Building IV independently permits an extra paid army cell. Current units and their stats are documented in [ELVEN_RECRUITS.md](ELVEN_RECRUITS.md).

## Individual recruits and personal levels

Tap the always-visible market to spend **one slave** and receive one reserve fighter. The spend and result save immediately before the **1,200 ms** visual sequence: a captive enters the workshop, the workshop lights up, and the new fighter travels down to Barracks. Reloading during the animation retains the completed transaction without repeating it. Available types have equal odds according to the faction totals above. A ready one-time Lancer bonus overrides the next Human roll. There is no automatic merge; each result is a separate owned fighter. Counts accumulate by the rolled type, regardless of where earlier fighters are deployed or stored. Gold cannot buy an alternative recruit.

The compact **Recruits** portrait icon opens **Mercenaries**, showing the selected faction, recruitment levels, next-level receipt counters, equal odds and unlock-total requirements. Help explains that only open types contribute and Connect does not count. Opening costs nothing and works with zero slaves. Building upgrades have their own detail view; they charge only on purchase. Recruitment levels remain capped at 100.

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

The level-100 recruitment limit applies only to fighters obtained directly from Market, and is not a target for campaign completion. Without legacy credit, the expected total slave conversions for a first level-4 fighter **obtained directly from Market** are 50 swordsman / 120 archer / 200 healer, using the Barracks I probabilities throughout; these are averages, not guarantees or elapsed-time estimates. Merging can produce a level-4 fighter earlier and continue beyond personal level 100. Each class tracks its own recruitment count independently of merges.

Barracks shows compact fighter icons with personal levels. Tapping an icon opens its detail view with HP, Attack, Healing when applicable, and **Recruit**, **Connect** and **Sell** actions. Tapping Recruit closes the menu and selects the fighter for placement without removing it from reserve or changing any balance. Choosing an empty unlocked tile deploys it for free; choosing an occupied tile swaps that guard into reserve. A locked tile permitted by the current Barracks tier offers a gold unlock first and deploys the selected fighter after purchase. Both fighters keep their identities and personal levels. Canceling placement leaves ownership and resources unchanged; reloading also leaves an unplaced selection safely in reserve. Completed placements save immediately and affect the next wave, leaving the active battle's snapshot untouched.

**Sell** in the detail view sells one reserve fighter for **one gold**, unless it is the last owned fighter. Deployed fighters are never sold from Barracks. Selling does not alter combat snapshots, received counts, unlocked cells or other fighters' levels.

The green **+ Connect** action opens selection inside a reserve or deployed fighter's detail view. The open fighter is the **recipient**. Choose one or more matching donors from the compact **Barracks / Army** tabs; switching tabs retains the selection. The preview shows the summed personal level and forged HP and attack/healing. Press **Connect** once to consume all selected donors and upgrade the recipient, keeping its identity, location and formation cells. The card stays open for another selection. Cancel, Escape, Back or closing the menu consumes nothing. Deployed donors free their purchased cells; two-cell Riders free both cells without moving other fighters. A reserve recipient cannot consume the last saved Army fighter while a battle exists. The recipient and other unit types are excluded from donor lists. Level 100 plus level 150 produces level 250: there is no gameplay cap at 100 or 500. Levels use positive JavaScript safe integers; overflow rejects the whole selection without discarding levels. Long-press drag remains a quick single-donor alternative: the dragged source is consumed into the same-type Army fighter it is dropped on.

Merging costs **no gold or slaves**, awards no sale gold and does not change per-type received counts or future recruitment levels. It saves the upgraded target and removed source together immediately. The active battle keeps its existing snapshot: the next wave receives the merged formation. Completed merges survive reload; an unfinished target selection consumes nothing. Summing levels creates a faster personal-level path than recruiting alone, so all three stats now grow by **5% of level-one base per level**, down from 10%, without compounding:

| Stat | Formula at personal level `L` |
| --- | --- |
| HP | `round(baseHP × (1 + (L − 1) × 0.05))` |
| Damage | `round(baseDamage × (1 + (L − 1) × 0.05))` |
| Healing | `round(baseHealing × (1 + (L − 1) × 0.05))` |

A swordsman has **60 HP / 6 damage at level 1**, **69 / 7 at level 4**, **72 / 7 at level 5** and **87 / 9 at level 10**. Integer rounding means some small damage or healing values remain unchanged on a single level increase: healer healing at levels 1–4 is **4 / 4 / 4 / 5**. Existing fighters retain their personal levels but use the new formula; merging does not alter attack speed, movement speed or range.

Sprite colors change at personal levels **50, 100, 250 and 500**: **1–49 blue, 50–99 purple, 100–249 red, 250–499 gold, 500+ black**. The same mapping applies to battlefield animations, formation and reserve portraits without changing owned levels, stats or recruitment progress. Black Monk and Lancer use the native palette; Warrior and Archer retain their current animation sheets with only three clothing colors replaced during asset preparation. No per-frame recoloring is needed. The formulas remain unchanged at ordinary levels; numeric stats saturate at `Number.MAX_SAFE_INTEGER` only at the representation boundary. These formulas describe configuration; they are not verified victory or time-to-progress estimates.

## Forge: permanent army bonuses

Buildings now contains Treasury, Market, Forge and Farm. Army cells are purchased directly
on the formation map; the redundant Army space tab has been removed. Capture odds
and the current search progress remain visible in the Market tab.

The Forge is available immediately. Three independent upgrades start at rank zero,
each purchase adds one percentage point, and each track currently has 100 ranks:

| Upgrade | Applies to | Next price at rank `r` |
| --- | --- | --- |
| Health | All regular fighters | `50 + 25r` gold |
| Attack / Healing | All regular fighters, including monk healing | `50 + 25r` gold |
| Attack speed | All regular fighters, including monk healing speed | `50 + 25r` gold |

Bonuses apply to owned and future fighters, independently of personal levels and
Connect. The hero, castle and enemies are excluded. All regular types receive the
same percentage bonus; there are no separate melee or ranged tracks. HP and
damage multiply the existing personal-level stats by `1 + ranks/100`;
combat retains the fractional result, so the first +1% is effective immediately.
Speed divides both the action duration and the attack/heal interval by the same
multiplier. Movement and projectile travel speed are unchanged.

Purchases cost gold immediately and save together with the bonus. New battles take
a snapshot, so changes made during combat apply on the next wave. Unit details show
the next-wave stats with up to two decimal places. Old saves start with zero Forge
ranks, and Reset clears these upgrades along with the other buildings.

Older saves with retired `rangedAttack` / `rangedAttackSpeed` ranks receive their
full original gold cost back: `25n + 15n(n-1)/2` per track at rank `n`. Valid ranks
are whole numbers from 0 through 100. The three shared ranks remain unchanged.
The refund and removal of the retired fields save together, so reloading cannot
pay again. A persistent Forge refund receipt uses the rewards window until
acknowledged; Continue closes it without another credit. Removed ranks provide
no hidden combat bonuses, and Reset clears any unacknowledged receipt.

These initial prices make the Forge a gradual gold investment alongside army cells
and Barracks upgrades; they are not a claim of full-campaign balance validation.

## Farm: three crops and a vegetable stock

The Farm is available from Buildings immediately. This first version has three
fixed beds, one per crop. Planting is free and each harvested crop adds one item
to its own saved vegetable stock:

| Crop | Real growing time | Harvest |
| --- | --- | --- |
| Carrot | 5 minutes | 1 carrot |
| Potato | 15 minutes | 1 potato |
| Pumpkin | 30 minutes | 1 pumpkin |

All beds can grow independently at the same time. Each planting stores its start
and ready timestamps immediately. Growth continues with the app closed and is
independent of combat speed, pause and wave results. A ready crop waits until the
player taps Harvest: there is no auto-harvest, repeated offline production,
spoilage or automatic replanting. Only one crop can occupy each bed.

Harvest credits stock and clears its bed in the same save. Repeated clicks,
closing a menu or reloading cannot harvest the same planting again. Once empty,
the bed can be planted again. Old saves receive empty beds and zero stock;
valid planted crops and harvested stock survive reload. Reset clears both.

Vegetables currently have no sale, recipe, combat bonus or gold cost. Cooking and
temporary army buffs are planned for a later stage; they are not active now.
Farm actions never change gold, slaves, owned fighters or a running battle.

## Capitol: the defended castle

The existing castle is available in Buildings as Capitol. It starts at 100 HP
and has no weapon. An Arrow tower costs **100 gold** and deals **10 damage every
2 simulation seconds** to the nearest living enemy within 144 world units of its
turret. It stays on the castle and uses ordinary arrows and kill rewards.

Health upgrades add **20 HP** each. Tower upgrades add **2 damage** each, keeping
the same range and cadence. Each track independently costs **50, 75, 100, ...**
gold for successive upgrades. The tower must be built before it can be upgraded.
There is no gameplay rank cap, and the Forge and hero talents do not improve it.

Purchases and their gold costs are saved together. A battle snapshots Capitol
stats when it starts: purchases never heal the active objective, add a weapon or
increase its damage mid-battle. All upgrades apply from the next battle. Old
saves get the original 100-HP unarmed castle; resetting clears Capitol upgrades.

## Kill rewards and wave progression

Both levels contain **20 rounds of ten waves**. Each round ends with a mini-boss, replaced by the main boss in rounds 10 and 20; wave 5 is ordinary. The shared hero adjustment applies **+10% total HP and +5% enemy damage** to the underlying wave definitions. After round 1-3, round-end HP grows by **473** per round before the new Level 2 multiplier. Level 2 continues the existing curve and now adds **15% HP and 15% damage**, once, to all its enemies. Enemy counts, arrival schedules, boss HP shares and rewards remain unchanged. [CAMPAIGN_BALANCE.md](CAMPAIGN_BALANCE.md) records the current rules and checks.

Wave 1 remains **two goblins, then one**; wave 2 remains **two goblins and two archers together**. The first-round counts remain **3 / 4 / 5 / 5 / 6 / 6 / 7 / 8 / 9 / 5**. Starting goblins now have **66 HP / 7.35 damage**. The shared damage adjustment preserves fractions so low-damage enemies do not gain a disproportionately large rounded bonus.

| Wave in round | 1-1 enemies / total HP | 1-2 enemies / total HP | 1-3 enemies / total HP |
| --- | --- | --- | --- |
| 1 | 3 / 198 | 8 / 953 | 8 / 1,392 |
| 2 | 4 / 202 | 8 / 966 | 8 / 1,405 |
| 3 | 5 / 290 | 8 / 979 | 8 / 1,418 |
| 4 | 5 / 337 | 8 / 992 | 8 / 1,431 |
| 5 | 6 / 403 | 8 / 1,005 | 8 / 1,444 |
| 6 | 6 / 469 | 8 / 1,019 | 8 / 1,458 |
| 7 | 7 / 557 | 8 / 1,032 | 8 / 1,471 |
| 8 | 8 / 682 | 8 / 1,045 | 8 / 1,484 |
| 9 | 9 / 869 | 8 / 1,232 | 8 / 1,650 |
| 10 | 5 / 825 | 6 / 1,375 | 6 / 1,848 |

From **1-6 wave 1 through 1-20 wave 10** (global waves **51–200**), one additional **Goblin healer** joins the opening group at **0.8 simulation seconds**, behind the frontline or boss. All previous archers remain; later reinforcements still arrive in groups of at most four. Rounds 1-1 through 1-5 and Level 2 have no healer. The first healer has **229 HP / 17 healing per cast / 4.2 weak melee damage**. Healing reaches **21 at wave 60**, **35 around waves 100–101**, and **48 at wave 200**. It heals the most wounded eligible enemy, including bosses, up to missing HP, and cannot heal itself or another healer. Each additional healer awards one kill gold and shares the existing wave HP budget; it does not raise that budget.

The wave-10 roster is a chief, two goblins and two archers, arriving **4+1 at 0.8 / 14.8 simulation seconds**. Global waves **11–19 and 21–29** contain four goblins, two archers and two boars (**4+4**); waves 20 and 30 contain a chief, three goblins and two archers (**4+2**). Every simultaneous arrival stays at four or fewer enemies.

The opening chiefs have **495 / 757 / 1,016 HP** and **18.9 / 25.2 / 32.55 damage** at waves 10 / 20 / 30. The earlier requested escort removal is retained; its explicit HP exception is now **wave 9→10: 869 → 825**, with no special boss compensation beyond the shared adjustment. The next round begins at **953 HP**. Waves **20→21** rise **1,375 → 1,392**, **30→31** rise **1,848 → 1,865**, and **200→201** rise **9,889 → 12,076**. Ordinary continuation counts grow from eight to sixteen and boss encounters from six to ten before adding the extra healer in forest rounds 6–20 or one alchemist in every Level 2 wave. The alchemist joins the opening squad, adds 6% of the existing encounter HP, and awards two gold; old fighter stats and archers remain intact. The final Crypt King has **14,464 HP / 144.9 damage** within a **23,586-HP** encounter. These are configured totals, not a guaranteed difficulty order for every army.

[OPENING_BALANCE.md](OPENING_BALANCE.md) retains historical opening combat and economy reports. After the talent-tree redesign, four ×1 resource-linked runs (seeds **1, 4, 17, 42**, target wave 10, limit 40 attempts, hero talents unspent) completed in **20 / 12 / 12 / 20 attempts**, without timeouts; defeats occurred on waves 8–9. Those runs predate the restored early archers, first-group healers and Barracks capacity limits. They do not validate current difficulty or progress with eight-cell Barracks I. They are fixed management scenarios rather than a player-population forecast or full campaign validation. See [CAMPAIGN_BALANCE.md](CAMPAIGN_BALANCE.md) for current balance rules and the limits of existing checks.

Current per-enemy kill rewards stay fixed within each level:

| Enemy role | Level 1 gold | Level 2 gold |
| --- | --- | --- |
| Ordinary melee / archer | 1 | 2 |
| Goblin healer | 1 | Not present |
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
| All Level 1 definitions | 2,057 | 2,859 | 11,000 |
| All Level 2 definitions | 2,990 | 8,030 | 11,000 |
| Entire campaign definitions | 5,047 | 10,889 | 22,000 |

The first clear of each wave awards **10 × wave-in-round number**: 10, 20, …, 100, totaling **550 per round, 11,000 per level and 22,000 across the campaign**. Level 2's doubled kill rewards do not multiply first-clear bonuses. First-clear history stores global IDs **1–400** independently from current progress, so retreat and replay cannot repeat a bonus. Global waves 11 and 201 each grant 10 first-clear gold; wave 200 grants 100.

Clearing the first 30 waves once awards **1,965 kill/first-clear gold** before other income. Arithmetic over all current definitions gives **32,489 gold** for the whole campaign: **13,859 in Level 1** and **18,630 in Level 2**. These sums exclude retries, Barracks sales and building income, and do not demonstrate that an account can complete the campaign or predict its completion time. Migrated accounts retain previously claimed first-clear rewards and cannot claim them again. Per-enemy payouts and first-clear bonuses are unchanged; changes to wave composition change the total kill income.

Defeat retreats one global wave, with **1-1 Wave 1** as the minimum. Losing **1-2 Wave 1** prepares **1-1 Wave 10**; losing **2-1 Wave 1** prepares **1-20 Wave 10**. Deployed and reserve fighters, personal levels, recruitment counts, unlocked cells, resources and buildings are kept, and the army and king recover between attempts. Kills remain rewarded on failed attempts; losing without kills grants no reward. Clearing a round's tenth wave advances to the next round. Victory at **1-20 Wave 10** advances to **2-1 Wave 1**. Only victory at **2-20 Wave 10** completes the campaign and permits replay from **1-1 Wave 1**.

To accommodate longer reinforcement schedules, enrage starts at **max(75, last scheduled spawn + 45) simulation seconds**, with its warning 15 seconds earlier. Speed settings scale this combat clock; income and capture cooldowns still use real foreground time.

## Capture rules

The first **four total captures** have **50% chance per kill**, without a cooldown between them. The first is guaranteed by the **second kill**; captures 2–4 are each guaranteed within **three further kills**. Thus a fresh campaign receives four combat captures by **11 kills at the latest**, in addition to its three starter slaves. Those four captured slaves can become four reserve recruits. Starter supply and spending slaves do not advance or restart the introductory capture rules.

The fourth capture, and every capture afterward, starts a **30-second foreground cooldown**. Once it expires, kills have **30% chance**, with a capture guaranteed by the **fifth eligible kill**. Kills during the cooldown do not accumulate toward another capture. Extra elapsed time does not bank multiple capture charges. The current chance, guarantee, countdown and saved kill progress appear in Buildings.

Capture odds were raised after recruitment became slave-only: regular chance 15% to 30%, regular guarantee seven to five eligible kills, cooldown 60 to 30 seconds; starter chance 35% to 50% and guarantees for captures 2–4 five to three kills. The first guarantee remains two kills. **Market production adds spendable slaves without incrementing lifetime combat captures or changing the capture chance, guarantee, search progress or cooldown.** A fixed number of captures per level is not guaranteed: waves differ in duration, kills and outcomes.

Existing v2 campaigns retain their army, currencies, unlocked cells, lifetime capture count and accumulated search kills. Starter cooldowns are cleared on load when fewer than four total captures have been earned. Saved later cooldowns are clamped to 30 seconds; shorter remaining waits are preserved. Saved search progress beyond a newly lowered guarantee is retained and produces a capture on the next eligible kill. There is no save reset or retroactive capture reward; the one-time empty-account starter supply is described below.

Capture cooldown uses **real foreground time**, including army editing, the unit picker, Settings and Buildings, and stops while the app is hidden or closed. Treasury and a built Slave Market produce during foreground play and also accrue capped offline income as described below. Combat speed choices are **×1 / ×2 / ×3**, defaulting to ×1. The new ×1 retains the previous ×1.5 pace; ×2 and ×3 are exact multiples of that new base (equivalent to the original ×3 and ×4.5). Speed choices affect combat and kill earnings, but do not accelerate building production, construction or the capture cooldown. Gold, search progress and captures save after each rewarded kill; fractional building progress and cooldown also checkpoint and survive reloads. Reopening a battle does not reset the search history or bypass its cooldown.

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

Current storage key remains `brotd-infinity:campaign:v2`, with `campaignVersion: 3` inside the saved record. Recruitment adds individual reserve fighters and per-type received counts to the existing record. **Existing fighters keep their type and personal level, including levels above 100; older saves get an empty reserve and zero received counts**, with no invented conversion history or retroactive level-up. Slaves, campaign progress, building ownership/production and capture/first-clear history remain intact. Previously spent fighter-upgrade gold is not refunded or charged again.

**Mounted fighters:** a Panther Rider occupies two purchased vertical cells, anchored at the upper one. Unicorn stays horizontal, anchored at the left cell. Both occupied cells select the same fighter. The sprite and combat starting point sit midway between them. Placement and swaps validate the entire footprint before changing ownership; an occupied neighbour is never silently displaced. During restoration, ordinary fighters keep their positions; a Rider with a locked, occupied or out-of-grid lower cell returns to reserve with its ID and level intact. This roster normalization is saved with the capacity refund and cannot return the same fighter twice.

**Dungeon rewards:** the first tracked full clear of Cave I gives 150 gold + 3 slaves;
Cave II gives 300 gold + 5 slaves. Each repeat gives one third, rounded down per
resource: 50 gold + 1 slave / 100 gold + 1 slave. Clear IDs and balances save together.
Saves before schema 5 have no dungeon history; their next clear gets the full prize.
Cave III remains an opening preview without rewards. There is no daily entry limit.

**Army-capacity migration:** restore the roster against its previously owned cells before reconciling the current Barracks tier. Keep the three starter cells and the earliest purchased central cells, up to eight central cells at I or nine at II/III/IV. III retains one saved outer cell and IV retains two, in purchase order; I/II retain none. Close excess cells and move their occupants into reserve without selling them or changing their type or personal level. Refund the difference between the old and retained cumulative cell-purchase costs; no per-cell purchase ledger exists. For an old fully opened 15-cell grid, I/II/III/IV retain 8/9/10/11 cells and refund **7,750 / 7,350 / 6,800 / 6,050 gold** respectively. Partial expansions use the same cumulative-price rule. The reduced cell list, returned fighters and refund save together; the closed-cell state makes later reloads idempotent, so the refund cannot repeat. The return summary records the refund and returned-fighter count. No campaign reset or recruitment-history change is required.

The new **`starterSupplyGranted`** marker is recorded once for both fresh and existing accounts. Before that marker exists, an account receives **three starter slaves only if it has no deployed fighters, no reserve fighters and exactly zero slaves**. This supplies an empty account after gold recruitment is removed. Accounts that already own fighters or slaves receive no grant and keep all existing balances. Recording the marker even when no grant is needed prevents later sales or spending from triggering it. Starter supply leaves capture totals, search progress, cooldown and recruitment counts unchanged; subsequent conversions advance only their normal type counts.

`clearedWaves` now counts global progress from 0 through 400, and first-clear claims use global IDs 1–400; bonus amounts use wave-in-round 1–10. Migration runs once when the saved campaign marker is older than 3. Old cleared counts 0–9 stay unchanged; 10–19 map to 200–209; a completed old campaign at 20 maps to 210 and resumes at 2-2 Wave 1. Seven old clears therefore resume at 1-1 Wave 8, and ten at 2-1 Wave 1. Old claim IDs 1–10 are retained, and 11–20 map to 201–210. No claims are invented for the skipped new rounds, and this campaign-index migration grants no currency or retroactive bonus. It preserves fighters, personal levels, received counts, resources, cells and building data; the independent army-capacity migration above then reconciles excess side cells and issues its refund. Reloading a version-3 save does not remap progress or claims again. Older saves without a Treasury timestamp establish one without retroactive income. Saves without a market production unlock start with passive production disabled; the visible market can still convert existing slaves. Enabling income establishes its own production baseline. Offline credits, fractional production and settlement timestamps save immediately.

Clearing global wave 400 permits replay from 1-1 Wave 1, with progress reset only when replay starts; fighters, reserve, recruitment totals and buildings persist. The older `kings-guard:toon:formation:v1` save remains untouched. Reset in Settings affects only the current campaign record, clears owned fighters and conversion counts, disables market passive production, restores three starter slaves and records the starter marker. There is no server/database integration.
