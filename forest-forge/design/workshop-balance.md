# Workshop and mine strata

The workshop is a separate activity. Combat and forge animation are suspended while it is open. Upgrade dialogs show the next effect, fixed resource cost and purchase button; slot cards show only the bonus.

- Each equipment slot has 100 additive upgrades of +1%. This multiplies its equipped item base value; equipment affix values and companion stats are unchanged. Current health fraction is preserved when buying a slot upgrade.
- Hammers: 80 upgrades, +0.05/min each, 1 to 5/min.
- Coins: 40 upgrades of +0.1, 30 of +0.5, 30 of +1 and 25 of +2, 1 to 100/min. First prices remain 15 stone, 25 stone and 20 coal. The v3 price curve is multiplied linearly between rate anchors (1.3,1), (5,2.5), (20,5), (50,8), (100,12), then rounded upward.
- Storage: 16 upgrades of 30 minutes, 4 to 12 hours. Price is round(5000 * 1.7 ** purchasedLevels). Applies to coin/hammer storage; mine storage remains four hours.
- Fixed recipes live in WORKSHOP_PRICES in balance.mjs. No price depends on the player's current mine rate.
- Workshop slot/production prices consume collected ore only. No build timer. A failed purchase changes nothing. Existing idle production settles at the old rate/capacity before a successful purchase. Rates change for future minute production ticks. Twentieths of a reward survive collection and reload.
- Existing saves initialize workshop upgrades and idle bank to zero without resetting hero or mine progress. Profile reset resets the workshop too.
- Mine stratum null follows the deepest unlocked stratum. Stone yields only stone. A selected older stratum uses its final mastered distribution (mine level 5 * resource index), or current progress if still developing. It always uses the current mine's production rate. Rare future resource chances in the existing distribution are retained. A rare ore drop alone does not unlock its stratum.
- Stratum selection settles the existing buffer before changing future production. The existing mining buffer is not cleared or claimed.
- Affixes on newly forged items remain deferred and unchanged.

Validation: focused unit tests cover prices/caps, save compatibility, health preservation, fractional rewards, old-rate settlement, overflow, stratum switching and unavailable purchases. Local isolated browser checks cover purchases, reload, mine/workshop navigation, image loads and 480x850 / 360x640 layouts. No production writes or deployment performed.
