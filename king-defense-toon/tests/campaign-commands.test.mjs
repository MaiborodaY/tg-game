import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignState, campaignSnapshot, restoreCampaignState } from '../campaign-state.ts';
import * as commands from '../campaign-commands.ts';
import { createBattle } from '../combat.ts';
import { WAVE_DEFINITIONS } from '../waves.ts';
import { BARRACKS_UPGRADES } from '../barracks.ts';

const NOW = 100_000;
const fresh = () => createCampaignState(NOW);
const clone = value => structuredClone(value);
function unchanged(state, action, reason) {
  const before = clone(state), result = action();
  assert.equal(result.ok, false);
  if (reason) assert.equal(result.reason, reason);
  assert.deepEqual(state, before);
  return result;
}
function roster() {
  const state = fresh();
  state.units = [{ id: 7, type: 'swordsman', level: 2, col: 2, row: 0 }];
  state.reserve = [{ id: 12, type: 'swordsman', level: 3 }, { id: 20, type: 'archer', level: 1 }];
  state.nextUnitId = 31;
  return state;
}

test('timed building and farm commands reject absent or invalid clocks without implicit wall time', () => {
  for (const now of [undefined, null, NaN, Infinity, -1, 0.5, '100000']) {
    const state = fresh();
    unchanged(state, () => commands.startCampaignBarracksUpgrade(state, now), 'invalid-time');
    unchanged(state, () => commands.finishCampaignBarracksUpgrade(state, now), 'invalid-time');
    unchanged(state, () => commands.upgradeCampaignFarm(state, now), 'invalid-time');
    unchanged(state, () => commands.harvestCampaignCrop(state, 'carrot', now), 'invalid-time');
  }
});

test('recruit commits training, cost, personal level and monotonic identity together', () => {
  const state = fresh();
  state.nextUnitId = 50;
  const result = commands.recruitFighter(state, { now: NOW, random: () => 0 });
  assert.equal(result.ok, true);
  assert.deepEqual(result.fighter, { id: 50, type: 'swordsman', level: 1 });
  assert.equal(state.economy.slaves, 2);
  assert.equal(state.recruitment.received.swordsman, 1);
  assert.equal(state.marketHintCompleted, true);
  assert.equal(state.nextUnitId, 51);
  const restored = restoreCampaignState(campaignSnapshot(state), NOW);
  const next = commands.recruitFighter(restored, { now: NOW, random: () => 0.7 });
  assert.equal(next.fighter.id, 51);
});

test('recruit rejection never consumes identity, currency, guarantee or training', () => {
  for (const random of [() => NaN, () => 1, () => { throw new Error('rng failed'); }]) {
    const state = fresh();
    unchanged(state, () => commands.recruitFighter(state, { now: NOW, random }), 'invalid-random');
  }
  const state = fresh();
  state.economy.slaves = 0;
  unchanged(state, () => commands.recruitFighter(state, { now: NOW, random: () => 0 }), 'insufficient-slaves');
  state.economy.slaves = 1; state.nextUnitId = Number.MAX_SAFE_INTEGER + 1;
  unchanged(state, () => commands.recruitFighter(state, { now: NOW, random: () => 0 }), 'ids-exhausted');
  state.nextUnitId = 1; state.recruitmentPool = 'elves';
  unchanged(state, () => commands.recruitFighter(state, { now: NOW, random: () => 0 }), 'pool-locked');
});

test('naturally completed barracks unlocks guaranteed lancer exactly once during recruitment', () => {
  const state = fresh();
  state.barracks.upgradeStartedAt = NOW; state.barracks.upgradeReadyAt = NOW + 3_600_000;
  const result = commands.recruitFighter(state, { now: NOW + 3_600_000, random: () => { throw new Error('guarantee must not roll'); } });
  assert.equal(result.ok, true);
  assert.equal(result.type, 'lancer');
  assert.equal(state.barracks.level, 2);
  assert.equal(state.barracks.firstLancerPending, false);
  assert.equal(commands.recruitFighter(state, { now: NOW + 3_600_000, random: () => 0 }).type, 'swordsman');
});

test('pool command rejects unavailable factions and commits an unlocked selection', () => {
  const state = fresh();
  unchanged(state, () => commands.selectRecruitmentPool(state, 'elves'), 'pool-locked');
  unchanged(state, () => commands.selectRecruitmentPool(state, 'orcs'), 'invalid-pool');
  state.barracks.level = 3;
  assert.equal(commands.selectRecruitmentPool(state, 'elves').ok, true);
  assert.equal(commands.recruitFighter(state, { now: NOW, random: () => 0.8 }).type, 'pantherRider');
});

test('campaign recruitment passes the actual Barracks tier through new elven unlocks', () => {
  for (const [tier, expected] of [[3, 'elfHealer'], [4, 'unicorn']]) {
    const state = fresh();
    state.barracks.level = tier;
    state.recruitmentPool = 'elves';
    state.recruitment.received.pantherRider = 50;
    state.recruitment.received.elfArcher = 15;
    const result = commands.recruitFighter(state, { now: NOW, random: () => .99 });
    assert.equal(result.ok, true);
    assert.equal(result.type, expected);
    assert.equal(state.economy.slaves, 2);
    assert.equal(state.recruitment.received[expected], 1);
    const restored = restoreCampaignState(campaignSnapshot(state), NOW);
    assert.deepEqual(restored.reserve, state.reserve);
    assert.equal(restored.recruitment.received[expected], 1);
    assert.equal(restored.nextUnitId, state.nextUnitId);
  }
});

test('recruitment uses the completed Barracks IV tier when an upgrade finishes at the command boundary', () => {
  const state = fresh();
  const readyAt = NOW + BARRACKS_UPGRADES[4].durationMs;
  state.barracks.level = 3;
  state.barracks.upgradeStartedAt = NOW;
  state.barracks.upgradeReadyAt = readyAt;
  state.recruitmentPool = 'elves';
  state.recruitment.received.pantherRider = 50;
  state.recruitment.received.elfArcher = 15;
  const result = commands.recruitFighter(state, { now: readyAt, random: () => .99 });
  assert.equal(result.ok, true);
  assert.equal(result.type, 'unicorn');
  assert.equal(state.barracks.level, 4);
});

test('unicorn deployment keeps its two-cell footprint and stable identity across save restoration', () => {
  const state = roster();
  state.reserve[0].type = 'unicorn';
  unchanged(state, () => commands.deployReserveFighter(state, 12, '2:0'), 'no-room');
  state.progression.unlockedCells.push('3:0');
  const deployed = commands.deployReserveFighter(state, 12, '2:0');
  assert.equal(deployed.ok, true);
  assert.equal(deployed.replaced.id, 7);
  const restored = restoreCampaignState(campaignSnapshot(state), NOW);
  assert.deepEqual(restored.units, state.units);
  assert.deepEqual(restored.reserve, state.reserve);
  assert.equal(restored.nextUnitId, 31);
  // Choosing the right half identifies the same two-cell occupant for replacement.
  const replacement = commands.deployReserveFighter(restored, 20, '3:0');
  assert.equal(replacement.ok, true);
  assert.equal(replacement.replaced.id, 12);
  assert.equal(restored.reserve.find(unit => unit.id === 12).type, 'unicorn');
});

test('selling validates the whole batch and retains the last owned fighter', () => {
  const state = roster(), received = clone(state.recruitment);
  unchanged(state, () => commands.sellReserveFighters(state, new Set([12, 999])), 'fighter-missing');
  unchanged(state, () => commands.sellReserveFighters(state, new Set([NaN])), 'invalid-ids');
  const beforeGold = state.gold;
  assert.equal(commands.sellReserveFighters(state, new Set([12, 20])).gold, 2);
  assert.equal(state.gold, beforeGold + 2);
  assert.deepEqual(state.recruitment, received);
  assert.equal(commands.withdrawFormationFighter(state, 7, { minArmyUnits: 0 }).ok, true);
  unchanged(state, () => commands.sellReserveFighters(state, new Set([7])), 'last-fighter');
});

test('replacing a deployed fighter preserves both identities and ownership', () => {
  const state = roster();
  const result = commands.deployReserveFighter(state, 12, '2:0');
  assert.equal(result.ok, true);
  assert.deepEqual(state.units, [{ id: 12, type: 'swordsman', level: 3, col: 2, row: 0 }]);
  assert.deepEqual(state.reserve.map(unit => unit.id), [7, 20]);
  assert.equal(state.nextUnitId, 31);
  unchanged(state, () => commands.deployReserveFighter(state, 20, '4:2'), 'locked-cell');
});

test('mounted deployment requires both cells and replacement anchors at occupied left cell', () => {
  const state = roster();
  state.reserve.push({ id: 22, type: 'pantherRider', level: 1 });
  state.progression.unlockedCells.push('1:0');
  unchanged(state, () => commands.deployReserveFighter(state, 22, '1:0'), 'no-room');
  state.units[0].col = 1;
  assert.equal(commands.deployReserveFighter(state, 22, '1:0').ok, true);
  assert.equal(commands.deployReserveFighter(state, 20, '2:0').ok, true);
  assert.equal(state.units[0].col, 1);
  assert.equal(state.reserve.some(unit => unit.id === 22), true);
});

test('formation movement and withdrawal protect unlocked footprints and live army minimum', () => {
  const state = roster();
  unchanged(state, () => commands.moveFormationFighter(state, 7, 4, 2), 'no-room');
  assert.equal(commands.moveFormationFighter(state, 7, 2, 1).ok, true);
  assert.equal(state.units[0].row, 1);
  unchanged(state, () => commands.withdrawFormationFighter(state, 7, { minArmyUnits: 1 }), 'army-minimum');
  assert.equal(commands.withdrawFormationFighter(state, 7, { minArmyUnits: 0 }).ok, true);
  assert.deepEqual(state.reserve.at(-1), { id: 7, type: 'swordsman', level: 2 });
});

test('connect is atomic and cannot consume the final deployed fighter during battle', () => {
  const state = roster();
  unchanged(state, () => commands.connectCampaignFighters(state, { location: 'reserve', id: 12 },
    [{ location: 'army', id: 7 }], { minArmyUnits: 1 }), 'army-minimum');
  unchanged(state, () => commands.connectCampaignFighters(state, { location: 'army', id: 7 },
    [{ location: 'reserve', id: 12 }, { location: 'reserve', id: 20 }], { minArmyUnits: 1 }), 'different-type');
  assert.equal(commands.connectCampaignFighters(state, { location: 'army', id: 7 },
    [{ location: 'reserve', id: 12 }], { minArmyUnits: 1 }).ok, true);
  assert.equal(state.units[0].id, 7);
  assert.equal(state.units[0].level, 5);
  assert.deepEqual(state.reserve.map(unit => unit.id), [20]);
});

test('formation, forge, capitol and hero commands do not rewrite an existing battle snapshot', () => {
  const state = roster(); state.gold = 10_000; state.hero.xp = 50;
  const battle = createBattle(state.units, 1, state.hero, state.forge, state.capitol), before = clone(battle);
  assert.equal(commands.mergeCampaignFighters(state, { location: 'reserve', id: 12 }, 7).ok, true);
  assert.equal(commands.moveFormationFighter(state, 7, 2, 2).ok, true);
  assert.equal(commands.purchaseForgeUpgrade(state, 'health').ok, true);
  assert.equal(commands.purchaseCapitolUpgrade(state, 'tower').ok, true);
  assert.equal(commands.learnCampaignHeroTalent(state, 'heal_unlock').ok, true);
  assert.deepEqual(battle, before);
  assert.equal(createBattle(state.units, 1, state.hero, state.forge, state.capitol).allies[0].level, 5);
});

test('purchases reject without wallet or building changes and debit exact successful costs', () => {
  const purchases = [
    state => commands.purchaseCampaignCell(state, '1:0'),
    state => commands.purchaseForgeUpgrade(state, 'attack'),
    state => commands.purchaseCapitolUpgrade(state, 'health'),
    state => commands.purchaseTreasuryUpgrade(state),
    state => commands.purchaseMarket(state, NOW),
  ];
  for (const purchase of purchases) {
    const state = fresh(); state.gold = 0;
    unchanged(state, () => purchase(state));
    state.gold = 10_000;
    const result = purchase(state);
    assert.equal(result.ok, true);
    assert.equal(state.gold, 10_000 - result.cost);
  }
  const state = fresh();
  unchanged(state, () => commands.purchaseCampaignCell(state, '0:0'));
  unchanged(state, () => commands.purchaseForgeUpgrade(state, 'bogus'));
  unchanged(state, () => commands.purchaseCapitolUpgrade(state, 'bogus'));
  unchanged(state, () => commands.purchaseMarket(state, NaN), 'invalid-time');
});

test('barracks purchase, natural completion and paid finish are separate atomic commands', () => {
  const state = fresh(); state.gold = 1_000;
  unchanged(state, () => commands.startCampaignBarracksUpgrade(state, NOW), 'locked');
  state.recruitment.received.swordsman = 50;
  assert.equal(commands.startCampaignBarracksUpgrade(state, NOW).cost, 200);
  assert.equal(state.gold, 800);
  unchanged(state, () => commands.startCampaignBarracksUpgrade(state, NOW + 3_600_000), 'upgrading');
  assert.equal(commands.completeCampaignBarracksUpgrade(state, NOW + 3_600_000).completed, true);
  assert.equal(state.gold, 800);
  assert.equal(state.barracks.level, 2);
  const paid = fresh(); paid.gold = 1_000; paid.recruitment.received.swordsman = 50;
  commands.startCampaignBarracksUpgrade(paid, NOW);
  const finish = commands.finishCampaignBarracksUpgrade(paid, NOW + 1_800_000);
  assert.equal(finish.cost, 50); assert.equal(paid.gold, 750);
  unchanged(paid, () => commands.finishCampaignBarracksUpgrade(paid, NOW + 1_800_000), 'not-upgrading');
});

test('Barracks III command uses the human level total and persists one atomic purchase', () => {
  const state = fresh(); state.gold = 2000; state.barracks.level = 2;
  state.units = [{ id: 1, type: 'swordsman', level: 100, col: 2, row: 0 }];
  Object.assign(state.recruitment.received, { swordsman: 225, archer: 14 });
  unchanged(state, () => commands.startCampaignBarracksUpgrade(state, NOW), 'locked');
  state.recruitment.received.archer = 15;
  const before = clone(state);
  assert.equal(commands.startCampaignBarracksUpgrade(state, NOW).cost, 2000);
  assert.equal(state.gold, 0);
  assert.equal(state.barracks.upgradeReadyAt, NOW + 10800000);
  assert.deepEqual(state.units, before.units);
  assert.deepEqual(state.recruitment, before.recruitment);
  const restored = restoreCampaignState(campaignSnapshot(state), NOW + 1);
  assert.equal(restored.barracks.upgradeReadyAt, state.barracks.upgradeReadyAt);
  unchanged(restored, () => commands.startCampaignBarracksUpgrade(restored, NOW + 1), 'upgrading');
});

test('farm harvesting preserves automatic growth on early collection or numeric overflow', () => {
  const state = fresh();
  assert.equal(state.farm.level, 1);
  unchanged(state, () => commands.harvestCampaignCrop(state, 'potato', NOW + 900_000));
  unchanged(state, () => commands.harvestCampaignCrop(state, 'carrot', NOW + 299_999));
  const harvested = commands.harvestCampaignCrop(state, 'carrot', NOW + 300_000);
  assert.equal(harvested.amount, 1); assert.equal(state.farm.stock.carrot, 1);
  unchanged(state, () => commands.harvestCampaignCrop(state, 'carrot', NOW + 300_000));
  assert.equal(state.farm.plots.carrot.readyAt, NOW + 600_000);
  state.farm.stock.carrot = Number.MAX_SAFE_INTEGER;
  unchanged(state, () => commands.harvestCampaignCrop(state, 'carrot', NOW + 600_000));
});

test('hero learning validates prerequisites and reset is rejected during combat', () => {
  const state = fresh();
  unchanged(state, () => commands.learnCampaignHeroTalent(state, 'heal_unlock'), 'level');
  state.hero.xp = 50;
  unchanged(state, () => commands.learnCampaignHeroTalent(state, 'heal_power'), 'prerequisite');
  assert.equal(commands.learnCampaignHeroTalent(state, 'heal_unlock').ok, true);
  unchanged(state, () => commands.resetCampaignHeroTalents(state, { battleRunning: true }), 'battle-running');
  assert.equal(commands.resetCampaignHeroTalents(state, { battleRunning: false }).refunded, 1);
  assert.equal(state.hero.talents.heal_unlock, 0);
});

test('foreground economy credits balances and checkpoints independently of game speed', () => {
  const state = fresh();
  commands.purchaseMarket(state, NOW);
  state.economy.captureCooldown = 30; state.economy.captures = 4;
  const gold = state.gold, slaves = state.economy.slaves;
  const result = commands.accrueCampaignEconomy(state, { elapsedSeconds: 1800, now: NOW + 1_800_000 });
  assert.equal(result.gold, 30); assert.equal(result.slaves, 1);
  assert.equal(state.gold, gold + 30); assert.equal(state.economy.slaves, slaves + 1);
  assert.equal(state.economy.captureCooldown, 0);
  assert.equal(state.economy.treasuryUpdatedAt, NOW + 1_800_000);
  unchanged(state, () => commands.accrueCampaignEconomy(state, { elapsedSeconds: -1, now: NOW }), 'invalid-time');
});

test('offline claim is capped and retry-safe; acknowledging the receipt never pays twice', () => {
  const state = fresh(); commands.purchaseMarket(state, NOW);
  state.economy.captureCooldown = 30; state.economy.captures = 4;
  const gold = state.gold, slaves = state.economy.slaves, later = NOW + 24 * 3_600_000;
  const result = commands.claimCampaignOfflineIncome(state, later);
  assert.equal(result.gold, 240); assert.equal(result.slaves, 8);
  assert.equal(state.gold, gold + 240); assert.equal(state.economy.slaves, slaves + 8);
  assert.equal(state.economy.captureCooldown, 30);
  assert.equal(commands.claimCampaignOfflineIncome(state, later).gold, 0);
  assert.equal(state.offlineRewards.gold, 240);
  const receipt = commands.acknowledgeOfflineRewards(state);
  assert.equal(receipt.rewards.slaves, 8);
  assert.equal(state.gold, gold + 240);
  assert.equal(commands.acknowledgeOfflineRewards(state).rewards.gold, 0);
});

test('currency overflow rejects economy and sale without consuming accrued time or ownership', () => {
  const state = roster(); state.gold = Number.MAX_SAFE_INTEGER;
  unchanged(state, () => commands.sellReserveFighters(state, new Set([12])), 'gold-overflow');
  unchanged(state, () => commands.accrueCampaignEconomy(state, { elapsedSeconds: 60, now: NOW + 60_000 }), 'resource-overflow');
  unchanged(state, () => commands.claimCampaignOfflineIncome(state, NOW + 60_000), 'resource-overflow');
});

test('cycle restart retains first-clear ledger and only accepts a completed campaign', () => {
  const state = fresh();
  unchanged(state, () => commands.resetCampaignCycle(state), 'incomplete-campaign');
  state.clearedWaves = WAVE_DEFINITIONS.length; state.progression.firstClears = [1, 2];
  assert.equal(commands.resetCampaignCycle(state).ok, true);
  assert.equal(state.clearedWaves, 0); assert.deepEqual(state.progression.firstClears, [1, 2]);
  unchanged(state, () => commands.setCampaignAutoWaves(state, 'false'), 'invalid-option');
  assert.equal(commands.setCampaignAutoWaves(state, false).ok, true);
  assert.equal(state.autoWaves, false);
});

test('missing command context cannot bypass formation limits or partially change state', () => {
  const state = roster();
  unchanged(state, () => commands.recruitFighter(state, null), 'invalid-options');
  unchanged(state, () => commands.withdrawFormationFighter(state, 7, null), 'invalid-options');
  unchanged(state, () => commands.connectCampaignFighters(state, { location: 'reserve', id: 12 },
    [{ location: 'army', id: 7 }], undefined), 'invalid-options');
  unchanged(state, () => commands.connectCampaignFighters(state, { location: 'reserve', id: 12 },
    [{ location: 'army', id: 7 }], {}), 'invalid-options');
  unchanged(state, () => commands.resetCampaignHeroTalents(state, null), 'invalid-options');
  unchanged(state, () => commands.accrueCampaignEconomy(state, null), 'invalid-options');
});

test('farm upgrades atomically debit gold and persist crop unlocks through a JSON reload', () => {
  const state = fresh();
  state.gold = 499;
  unchanged(state, () => commands.upgradeCampaignFarm(state, NOW), 'insufficient-gold');
  state.gold = 2000;
  const before = clone(state);
  assert.deepEqual(commands.upgradeCampaignFarm(state, NOW), { ok: true, cost: 500, level: 2 });
  assert.equal(state.gold, 1500);
  assert.deepEqual(state.units, before.units);
  assert.deepEqual(state.economy, before.economy);
  const restored = restoreCampaignState(JSON.parse(JSON.stringify(campaignSnapshot(state))), NOW);
  assert.deepEqual(restored.farm, state.farm);
  assert.deepEqual(commands.upgradeCampaignFarm(restored, NOW), { ok: true, cost: 1500, level: 3 });
  assert.equal(restored.gold, 0);
  unchanged(restored, () => commands.upgradeCampaignFarm(restored, NOW), 'max-level');
});
