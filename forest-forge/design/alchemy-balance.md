# Alchemy — initial economy

Implemented locally in game.mjs and app.mjs. Reagents cannot be sold. One reagent plus coins makes one chosen potion instantly. Reagents and potions persist. Existing saves receive empty alchemy inventory.

## Rarities

| Rarity | Brew coins | Brew XP | Mob chance, biome 1 | Boss chance, biome 1 |
|---|---:|---:|---:|---:|
| Common | 50 | 1 | 0.8% | 4% |
| Uncommon | 150 | 3 | 0.2% | 1% |
| Rare | 500 | 10 | 0.04% | 0.2% |
| Epic | 1500 | 30 | 0.004% | 0.02% |
| Legendary | 5000 | 100 | 0.0004% | 0.002% |

All drop probabilities reduced fivefold, including biome growth and offline rewards. Per biome above the first add 0 / 0.03 / 0.01 / 0.002 / 0.0002 percentage points. Boss chances remain five times normal. One categorical roll, at most one reagent per kill. Existing inventory and already banked rewards are preserved.

Offline: one boss-table roll per five credited minutes, highest unlocked biome, same 4–12 hour storage cap and stable seeded previews. First-biome expected total: 0.62664 reagents/hour (about 7.52 over 12 hours). Normal mobs: 1.0444% total, about one reagent per 96 kills. These are averages, not guaranteed drops.

## Potions

| Type | Common | Uncommon | Rare | Epic | Legendary |
|---|---:|---:|---:|---:|---:|
| Damage | 5% | 8% | 12% | 18% | 25% |
| Max HP | 10% | 15% | 20% | 30% | 50% |
| Ore production | 10% | 20% | 30% | 40% | 50% |
| Passive coins | 15% | 25% | 40% | 60% | 75% |
| Passive hammers | 10% | 15% | 25% | 35% | 50% |

Alchemy level 1–100. Next level costs 10 + 5*(level-1) XP, total 25,245 XP. Strength scales linearly from x1 to x2. Combat duration scales from 600 to 3,600 seconds; passive duration from 1,800 to 10,800 seconds. Potency and duration are fixed when consumed, so stored bottles benefit from later skill upgrades.

Combat timers advance only while a battle runs (including approach), pause on death/victory transitions, hidden app, mine, workshop, dungeon selection and alchemy dialog. Shared with dungeon battles. HP changes preserve current HP percentage, avoiding free healing or death on expiry.

Passive timers use wall time, work online/offline, and multiply only production during their actual overlap with a credited minute. Old buffers are settled before activation; expired fractional-minute tails are retained when renewed. No bonus to existing resources or enemy coin drops. Dungeon permanent production bonuses remain applied through their existing path.

Initial consumption rule: one active potion per effect; five different effects may coexist. An active effect cannot be overwritten. Potion consumption during a dungeon run is disabled; consume before entering. These choices keep first-version behaviour predictable and may be revisited.

All numbers are initial balancing values, not production-income guarantees. No new database schema or migration.
