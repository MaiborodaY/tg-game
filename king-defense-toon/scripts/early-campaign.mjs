import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCombatEngine, makeFormation } from './combat-balance.mjs';
import { loadRuntimeModule } from './runtime-module.mjs';

const GAME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CELLS = ['2:0', '2:1', '2:2', '1:0', '3:0', '1:1', '3:1', '1:2', '3:2',
  '0:0', '4:0', '0:1', '4:1', '0:2', '4:2'];
export const DEFAULT_SEEDS = Object.freeze([1, 2, 3, 4, 5, 17, 42, 101]);

export const EARLY_CAMPAIGN_ASSUMPTIONS = Object.freeze([
  'Uses actual combat, capture, recruitment, slot purchase, merge, and first-clear APIs.',
  'Fresh profile; selected speed through the actual battleFrameDelta helper (including base slowdown); one-second foreground economy ticks; two seconds between completed attempts.',
  'No offline income, idle farming, optional building purchases, treasury upgrades, unit sales, or starter rerolls; the starting level-one treasury accrues normally.',
  'Converts available slaves between attempts, buys needed affordable cells, fills slots before merging surplus into the weakest deployed fighter of the same type.',
  'Conversion input and reveal time are omitted; this is an explicit automated management policy, not a prediction of player decisions or typical progress.',
  'Places melee in front, archers behind, healers centrally within owned cells; every new battle restores saved fighters, the hero and castle through createBattle.',
  'The hero earns actual outcome XP and levels between attempts; talent points stay unspent, so this scenario does not assume a player-selected talent build.',
  'Seeds are reproducible examples, not a population sample. Timeout stops a run without inventing a defeat or retreat.',
]);

export async function loadCampaignApis(sourceRoot = GAME_ROOT) {
  const root = path.resolve(sourceRoot);
  const load = name => loadRuntimeModule(root, name);
  const [engine, economy, progression, recruitment, merging, barracks, speed, hero] = await Promise.all([
    loadCombatEngine(root), ...['economy', 'progression', 'recruitment', 'unit-merging', 'barracks', 'battle-speed', 'hero'].map(load),
  ]);
  return { engine, economy, progression, recruitment, merging, barracks, speed, hero };
}

function randomSequence(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

export function runEarlyCampaign(apis, { seed = 1, speed: battleSpeed = 1, maxAttempts = 20, lastWave = 10, maxBattleSeconds = 240 } = {}) {
  if (!Number.isSafeInteger(seed) || !Number.isInteger(maxAttempts) || maxAttempts <= 0
    || !Number.isInteger(lastWave) || lastWave < 1 || lastWave > 30
    || !apis.speed.BATTLE_SPEEDS.includes(battleSpeed)
    || !Number.isFinite(maxBattleSeconds) || maxBattleSeconds <= 0) throw new RangeError('Invalid campaign scenario');
  const { engine, economy: econ, progression: prog, recruitment: rec, merging, barracks, speed: speedRules, hero: heroRules } = apis;
  const battleRate = speedRules.battleFrameDelta(1 / 60, battleSpeed) / (1 / 60);
  const random = randomSequence(seed);
  const economy = econ.createEconomy({ slaves: barracks.STARTING_SLAVES });
  const progression = prog.createProgression();
  const recruitment = rec.createRecruitment();
  const hero = heroRules.createHero();
  let gold = prog.STARTING_GOLD, units = [], reserve = [], nextId = 1;
  let cleared = 0, elapsed = 0, nextEconomyTick = 1, conversions = 0;
  const mass = () => [...units, ...reserve].reduce((sum, unit) => sum + unit.level, 0);
  const tick = seconds => {
    elapsed += seconds;
    // main.ts accrues foreground resources on a one-second timer independently of
    // combat speed. This scenario does not simulate hidden time.
    while (elapsed + 1e-8 >= nextEconomyTick) {
      gold += econ.accrueTreasury(economy, 1);
      econ.advanceCaptureClock(economy, 1);
      nextEconomyTick += 1;
    }
  };
  const manageArmy = () => {
    while (economy.slaves >= rec.RECRUIT_COST) {
      const received = rec.receiveRecruit(recruitment, random);
      economy.slaves -= rec.RECRUIT_COST;
      reserve.push({ id: nextId++, type: received.type, level: received.level });
      conversions += 1;
    }
    while (reserve.length) {
      if (units.length === progression.unlockedCells.length) {
        const key = CELLS.find(cell => !progression.unlockedCells.includes(cell));
        const result = prog.unlockCell(progression, gold, key);
        if (result.unlocked) gold = result.gold;
      }
      if (units.length < progression.unlockedCells.length) {
        units.push(reserve.shift());
        continue;
      }
      const source = reserve[0];
      const target = units.filter(unit => unit.type === source.type).sort((a, b) => a.level - b.level)[0];
      if (!target) break;
      const result = merging.getMergeResult(units, reserve, { location: 'reserve', id: source.id }, target.id);
      if (!result.ok) break;
      units = result.units;
      reserve = result.reserve;
    }
    const counts = Object.fromEntries(['swordsman', 'archer', 'healer'].map(type => [type, units.filter(unit => unit.type === type).length]));
    const layout = makeFormation(counts);
    for (const type of ['swordsman', 'archer', 'healer']) {
      const fighters = units.filter(unit => unit.type === type).sort((a, b) => b.level - a.level);
      const places = layout.filter(unit => unit.type === type);
      fighters.forEach((unit, index) => Object.assign(unit, { col: places[index].col, row: places[index].row }));
    }
    units.sort((a, b) => a.row - b.row || a.col - b.col);
    if (units.some(unit => !progression.unlockedCells.includes(`${unit.col}:${unit.row}`))) {
      throw new Error('Scenario placed a fighter outside purchased cells');
    }
  };
  manageArmy();
  const attempts = [];
  let timedOut = false;
  for (let attempt = 1; attempt <= maxAttempts && cleared < lastWave; attempt += 1) {
    const wave = cleared + 1;
    const start = { gold, slaves: economy.slaves, captures: economy.captures, conversions,
      ownedLevelMass: mass(), slots: progression.unlockedCells.length,
      unlockedCells: [...progression.unlockedCells], army: structuredClone(units), hero: structuredClone(hero) };
    const battle = engine.createBattle(units, wave, hero);
    while (battle.phase === 'running' && battle.elapsed < maxBattleSeconds - 1e-7) {
      const battleStep = Math.min(1 / 60, maxBattleSeconds - battle.elapsed);
      // Preserve the combat engine's small step, but charge resources for actual
      // foreground time: every speed also contains the game's base 0.85 slowdown.
      const realStep = battleStep / battleRate;
      tick(realStep);
      for (const event of engine.updateBattle(battle, speedRules.battleFrameDelta(realStep, battleSpeed))) if (event.type === 'gold') {
        gold += event.amount;
        econ.rollSlaveDrop(economy, random);
      }
    }
    timedOut = battle.phase === 'running';
    const won = battle.phase === 'victory';
    const heroXp = timedOut ? null : heroRules.awardHeroXp(hero, { waveNumber: wave, kills: battle.kills, total: battle.total, won });
    if (won) gold += prog.claimFirstClear(progression, wave);
    if (!timedOut) cleared = econ.progressionAfterBattle(wave, won, engine.WAVE_DEFINITIONS.length);
    attempts.push({ attempt, wave, start, outcome: timedOut ? 'timeout' : battle.phase,
      battleSeconds: Math.round(battle.elapsed * 100) / 100, kills: battle.kills, totalEnemies: battle.total,
      survivors: battle.allies.filter(unit => unit.hp > 0).length, castleHp: battle.castle.hp, kingHp: battle.king.hp, heroXp,
      captures: economy.captures - start.captures });
    if (timedOut) break;
    tick(2);
    manageArmy();
  }
  return {
    seed, speed: battleSpeed, cleared, termination: timedOut ? 'timeout' : cleared >= lastWave ? 'complete' : 'attempt-limit',
    wallSeconds: Math.round(elapsed * 100) / 100, captures: economy.captures, conversions,
    slots: progression.unlockedCells.length, gold, ownedLevelMass: mass(), army: units, reserve,
    received: recruitment.received, firstClears: progression.firstClears, hero, attempts,
  };
}

export function directClearGoldBounds(apis, lastWave = 10) {
  if (!Number.isInteger(lastWave) || lastWave < 1 || lastWave > 30) throw new RangeError('Expected one to thirty opening waves');
  let kills = 0, killGold = 0, bonuses = 0;
  const progression = apis.progression.createProgression();
  return Array.from({ length: lastWave }, (_, index) => {
    const wave = apis.engine.getWaveDefinition(index + 1);
    kills += wave.total;
    killGold += wave.reward;
    bonuses += apis.progression.claimFirstClear(progression, wave.number);
    const totalGoldBeforeExpenses = apis.progression.STARTING_GOLD + killGold + bonuses;
    let remaining = totalGoldBeforeExpenses, slots = apis.progression.STARTING_CELLS.length;
    for (const cost of apis.progression.CELL_UNLOCK_COSTS) {
      if (cost > remaining) break;
      remaining -= cost;
      slots += 1;
    }
    return { afterWave: index + 1, kills, killGold, bonuses, totalGoldBeforeExpenses,
      maxSlotsWithoutTreasuryOrSales: slots };
  });
}

async function cli() {
  const args = process.argv.slice(2);
  const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  const apis = await loadCampaignApis(option('--source-root'));
  const seeds = option('--seeds') ? option('--seeds').split(',').map(Number) : DEFAULT_SEEDS;
  const lastWave = Number(option('--last-wave') ?? 10);
  const reports = seeds.map(seed => runEarlyCampaign(apis, { seed,
    speed: Number(option('--speed') ?? 1),
    maxAttempts: Number(option('--max-attempts') ?? 20), lastWave }));
  const report = { sourceRoot: apis.engine.sourceRoot, lastWave, assumptions: EARLY_CAMPAIGN_ASSUMPTIONS,
    waves: Array.from({ length: lastWave }, (_, index) => apis.engine.getWaveDefinition(index + 1)),
    goldBound: directClearGoldBounds(apis, lastWave), reports };
  const output = option('--output');
  if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output: output ?? null, reports: reports.map(run => ({
    seed: run.seed, speed: run.speed, cleared: run.cleared, termination: run.termination, seconds: run.wallSeconds,
    captures: run.captures, conversions: run.conversions, slots: run.slots, mass: run.ownedLevelMass,
    attempts: run.attempts.map(attempt => `${attempt.wave}:${attempt.outcome}`),
  })) }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await cli();
