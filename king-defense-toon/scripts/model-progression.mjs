// Economy-only estimate. This does not run combat or assert that a formation wins a wave.
import { createEconomy, advanceCaptureClock, rollSlaveDrop, accrueTreasury, upgradeTreasury, treasuryUpgradeCost, SLAVE_DROP_CHANCE, CAPTURE_PITY_KILLS, CAPTURE_COOLDOWN } from '../economy.ts';
import { createProgression, unlockCell, nextCellCost, STARTING_GOLD, UNIT_UPGRADE_COSTS, unitUpgradeCost, CELL_UNLOCK_COSTS } from '../progression.ts';
import { ENEMY_TYPES, getLevelWaves } from '../waves.ts';

const MODEL_LEVEL = 1;
const HORIZON_HOURS = 72;
const SAMPLES_PER_SCENARIO = 200;
// Keep this Level 1 farming assumption separate from the stronger second level.
const levelWaves = getLevelWaves(MODEL_LEVEL);
const regular = levelWaves.filter(wave => !wave.spawns.some(spawn =>
  (spawn.isFinalBoss ?? ENEMY_TYPES[spawn.type].isFinalBoss)));
const sampledKillGold = regular.reduce((sum, wave) => sum + wave.reward, 0);
const sampledEnemies = regular.reduce((sum, wave) => sum + wave.total, 0);
const goldPerKill = sampledKillGold / sampledEnemies;
const expectedSearchKills = (1 - (1 - SLAVE_DROP_CHANCE) ** CAPTURE_PITY_KILLS) / SLAVE_DROP_CHANCE;
const formationCost = 5 * (25 + 35 + 40) + 15 * UNIT_UPGRADE_COSTS.reduce((a, b) => a + b, 0);
const treasuryCost = [75, 150, 300, 600].reduce((a, b) => a + b, 0);

function randomSequence(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function estimate(killsPerMinute, seed) {
  const economy = createEconomy(), progression = createProgression(), random = randomSequence(seed);
  const army = [1,1,1];
  let gold = STARTING_GOLD - 100, slotsAt = null, minutes = 0;
  const stepSeconds = 60 / killsPerMinute;
  for (let tick = 1; tick <= killsPerMinute * 60 * HORIZON_HOURS; tick++) {
    advanceCaptureClock(economy, stepSeconds);
    gold += accrueTreasury(economy, stepSeconds) + goldPerKill;
    rollSlaveDrop(economy, random);
    minutes = tick / killsPerMinute;
    // Illustrative optional building milestones, leaving gold for a recruit/first upgrade.
    // First-clear bonuses are excluded: this model makes no claims about victories.
    const price = treasuryUpgradeCost(economy);
    if (price !== null && minutes >= [10,45,100,200][economy.treasuryLevel - 1] && gold >= price + 50) gold = upgradeTreasury(economy, gold).gold;
    while (nextCellCost(progression) !== null && economy.slaves >= nextCellCost(progression)) {
      const key = Array.from({ length: 15 }, (_, i) => `${i % 5}:${Math.floor(i / 5)}`).find(key => !progression.unlockedCells.includes(key));
      unlockCell(progression, economy, key);
    }
    if (progression.unlockedCells.length === 15 && slotsAt === null) slotsAt = minutes;
    while (army.length < progression.unlockedCells.length && gold >= [25,35,40][army.length % 3]) {
      gold -= [25,35,40][army.length % 3]; army.push(1);
    }
    // Buy the cheapest available rank first; stats and enemy outcomes are not simulated.
    for (let level = 1; level <= 3; level++) {
      for (let index = 0; index < army.length; index++) {
        if (army[index] === level && gold >= unitUpgradeCost(level)) {
          gold -= unitUpgradeCost(level); army[index]++;
        }
      }
    }
    if (army.length === 15 && army.every(level => level === 4) && gold >= 2000) return { slotsHours: slotsAt / 60, targetHours: minutes / 60 };
  }
  // A slow scenario can exceed the horizon without invalidating the other scenarios.
  return { slotsHours: slotsAt === null ? null : slotsAt / 60, targetHours: null };
}

const percentile = (values, p) => values.some(value => value === null) ? null
  : +[...values].sort((a,b) => a-b)[Math.floor((values.length - 1) * p)].toFixed(2);
console.log(JSON.stringify({ assumptions: {
  levelNumber: MODEL_LEVEL, levelName: levelWaves[0].levelName,
  sampledRounds: regular.map(wave => wave.roundNumber), sampledKillGold, sampledEnemies,
  regularGoldPerKill: goldPerKill, expectedSearchKills, horizonHours: HORIZON_HOURS,
  samplesPerScenario: SAMPLES_PER_SCENARIO,
  captureCooldownMinutes: CAPTURE_COOLDOWN / 60, formationCost, treasuryCost,
  cellCosts: CELL_UNLOCK_COSTS, totalSlaves: CELL_UNLOCK_COSTS.reduce((sum, cost) => sum + cost, 0),
  target: '15 open tiles + 15 level-4 units + 2000 gold',
  caveat: 'Level 1 non-final-wave enemy mix at a fixed real foreground kill rate. Includes its chief; excludes final-boss waves, Level 2 and first-clear bonuses. No battle simulation or win-rate prediction. Null times mean at least one sample did not reach that milestone within the horizon.' },
  scenarios: [5,7,8,10,12].map(rate => {
    const runs = Array.from({length:SAMPLES_PER_SCENARIO},(_,i) => estimate(rate, (i+1)*7919));
    return { killsPerMinute:rate,
      slotsCompletedSamples: runs.filter(run => run.slotsHours !== null).length,
      targetCompletedSamples: runs.filter(run => run.targetHours !== null).length,
      meanSlotsHours: runs.some(run => run.slotsHours === null) ? null
        : +(runs.reduce((sum,run)=>sum+run.slotsHours,0)/runs.length).toFixed(2),
      targetP10Hours:percentile(runs.map(run=>run.targetHours),.1),
      targetMedianHours:percentile(runs.map(run=>run.targetHours),.5),
      targetP90Hours:percentile(runs.map(run=>run.targetHours),.9) };
  }) }, null, 2));
