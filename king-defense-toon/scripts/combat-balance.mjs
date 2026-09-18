import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuntimeModule } from './runtime-module.mjs';

const GAME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CELL_ORDER = [[2, 0], [2, 1], [2, 2], [1, 0], [3, 0], [1, 1], [3, 1],
  [1, 2], [3, 2], [0, 0], [4, 0], [0, 1], [4, 1], [0, 2], [4, 2]];

export async function loadCombatEngine(sourceRoot = GAME_ROOT) {
  const root = path.resolve(sourceRoot);
  const [combat, waves] = await Promise.all([
    loadRuntimeModule(root, 'combat'),
    loadRuntimeModule(root, 'waves'),
  ]);
  return { ...combat, ...waves, sourceRoot: root };
}

export function makeFormation({ swordsman = 0, archer = 0, healer = 0, level = 1 } = {}) {
  const counts = { swordsman, archer, healer };
  if (Object.values(counts).some(count => !Number.isSafeInteger(count) || count < 0)
    || swordsman + archer + healer > 15 || !Number.isSafeInteger(level) || level < 1) {
    throw new RangeError('Formation requires 0–15 fighters at a valid personal level');
  }
  const cells = CELL_ORDER.slice(0, swordsman + archer + healer).map(([col, row]) => ({ col, row }));
  const result = [];
  // Three-slot armies use the actual initial centre column. Expanded armies keep melee
  // in front, ranged fighters behind, and healers near the middle of available cells.
  const score = (type, cell) => type === 'healer'
    ? Math.abs(cell.row - 1) * 10 + Math.abs(cell.col - 2)
    : (type === 'archer' ? 2 - cell.row : cell.row) * 10 + Math.abs(cell.col - 2);
  for (const type of ['healer', 'archer', 'swordsman']) {
    for (let index = 0; index < counts[type]; index += 1) {
      cells.sort((a, b) => score(type, a) - score(type, b));
      result.push({ id: result.length + 1, type, level, ...cells.shift() });
    }
  }
  // Combat updates allies in saved roster order; use one stable order for comparisons.
  return result.sort((a, b) => a.row - b.row || a.col - b.col);
}

export function simulateCombat(engine, { id = 'custom', wave = 1, formation = [], heroState, maxSeconds = 240, dt = 1 / 60 }) {
  if (!Number.isFinite(maxSeconds) || maxSeconds <= 0 || !Number.isFinite(dt) || dt <= 0 || dt > 1 / 60) {
    throw new RangeError('Use a positive time limit and a time step no larger than 1/60 second');
  }
  const saved = JSON.stringify(formation);
  const battle = engine.createBattle(formation, wave, heroState);
  const totals = { damageToEnemies: 0, damageToAllies: 0, damageToCastle: 0, healing: 0 };
  let lastEffectId = 0;
  let updates = 0;
  while (battle.phase === 'running' && battle.elapsed < maxSeconds - 1e-7) {
    engine.updateBattle(battle, Math.min(dt, maxSeconds - battle.elapsed));
    updates += 1;
    // Read the engine's emitted hit/heal effects without modifying damage, timing,
    // targeting, enrage, or random state. Each effect has a monotonic battle-local ID.
    for (const effect of battle.effects) {
      if (effect.id <= lastEffectId) continue;
      if (effect.type === 'heal' || effect.type === 'hero-heal') totals.healing += effect.amount;
      if (effect.type === 'hit') {
        const key = ['castle', 'king'].includes(effect.sourceId) ? 'damageToCastle'
          : effect.side === 'enemy' ? 'damageToEnemies' : 'damageToAllies';
        totals[key] += effect.amount;
      }
    }
    lastEffectId = battle.nextEffectId - 1;
  }
  if (JSON.stringify(formation) !== saved) throw new Error('Combat modified the saved formation');
  const alive = battle.allies.filter(unit => unit.hp > 0);
  const initialEnemyHp = battle.wave.spawns.reduce((sum, spawn) => sum
    + (spawn.hp ?? engine.ENEMY_TYPES[spawn.type].hp), 0);
  return {
    id, wave, stage: `${battle.wave.levelNumber}-${battle.wave.roundNumber}.${battle.wave.waveInRound}`,
    outcome: battle.phase === 'running' ? 'timeout' : battle.phase,
    battleSeconds: Math.round(battle.elapsed * 1000) / 1000, updates,
    army: formation, survivors: alive.length, casualties: battle.allies.length - alive.length,
    survivingTypes: Object.fromEntries(['swordsman', 'archer', 'healer'].map(type => [type, alive.filter(unit => unit.type === type).length])),
    castleHp: (battle.castle ?? battle.king).hp,
    // Historical reports/tests retain their objective key while new reports name the castle.
    kingHp: (battle.castle ?? battle.king).hp, alliedHp: alive.reduce((sum, unit) => sum + unit.hp, 0),
    hero: battle.hero ? { level: battle.hero.level, hp: battle.hero.hp, maxHp: battle.hero.maxHp } : null,
    initialEnemyHp, enemyRemaining: battle.total - battle.kills,
    spawned: battle.spawned, totalEnemies: battle.total, kills: battle.kills,
    enemyHpRemaining: battle.enemies.reduce((sum, unit) => sum + unit.hp, 0),
    reward: battle.reward, enraged: battle.enraged, enrageAt: battle.enrageAt,
    enrageSeconds: Math.max(0, Math.round((battle.elapsed - battle.enrageAt) * 1000) / 1000),
    ...totals, damageToKing: totals.damageToCastle,
  };
}

export function balanceCases() {
  const cases = [];
  const sizes = [3, 3, 4, 4, 5, 5, 6, 6, 7, 8];
  const levels = [1, 1, 1, 2, 2, 2, 3, 3, 4, 5];
  for (let wave = 1; wave <= 10; wave += 1) {
    for (const healer of [0, 1, 2]) {
      const count = sizes[wave - 1];
      const archer = count === 3 && healer === 2 ? 0 : Math.max(1, Math.floor((count - healer) / 3));
      cases.push({ id: `early-${healer}H-w${wave}`, wave, formation: makeFormation({
        swordsman: count - healer - archer, archer, healer, level: levels[wave - 1],
      }) });
    }
    cases.push({ id: `reference8-L3-w${wave}`, wave,
      formation: makeFormation({ swordsman: 5, archer: 2, healer: 1, level: 3 }) });
  }
  for (const wave of [10, 11, 19, 20, 21]) {
    for (const healer of [0, 1, 2]) cases.push({ id: `boundary-${healer}H-w${wave}`, wave,
      formation: makeFormation({ swordsman: 6 - healer, archer: 2, healer, level: 5 }) });
  }
  for (const wave of [199, 200, 201]) {
    for (const level of [25, 50, 75, 100]) cases.push({ id: `world-boundary-L${level}-w${wave}`, wave,
      formation: makeFormation({ swordsman: 9, archer: 4, healer: 2, level }), maxSeconds: 600 });
  }
  for (const level of [25, 50, 75, 100]) {
    for (const counts of [{ swordsman: 9, archer: 4, healer: 2 }, { swordsman: 6, archer: 7, healer: 2 },
      { swordsman: 7, archer: 8, healer: 0 }]) {
      cases.push({ id: `final-L${level}-${counts.swordsman}S${counts.archer}A${counts.healer}H`, wave: 400,
        formation: makeFormation({ ...counts, level }), maxSeconds: 600 });
    }
  }
  return cases;
}

async function cli() {
  const args = process.argv.slice(2);
  const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  const engine = await loadCombatEngine(option('--source-root'));
  const cases = option('--cases') ? JSON.parse(fs.readFileSync(option('--cases'), 'utf8')) : balanceCases();
  const report = {
    sourceRoot: engine.sourceRoot,
    assumptions: [
      'Real createBattle/updateBattle with a fresh full-HP army, hero and castle for every case.',
      'Hero defaults to level one without talents; each case may explicitly supply heroState.',
      'Deterministic 1/60-second battle-clock steps; UI x1.5/x2/x3 only changes wall-clock speed.',
      'Army sizes and personal levels are explicit scenario assumptions, not an economy or recruitment forecast.',
      'One legal formation and roster order per case; unlocked-cell purchases, random drops, offline income, and player decisions are not simulated.',
      'A timeout is unfinished combat, never a predicted victory or defeat.',
    ],
    results: cases.map(spec => simulateCombat(engine, spec)),
  };
  const output = option('--output');
  if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output: output ?? null, cases: report.results.length,
    outcomes: Object.fromEntries(['victory', 'defeat', 'timeout'].map(outcome => [outcome, report.results.filter(result => result.outcome === outcome).length])),
    results: report.results.map(({ id, outcome, battleSeconds, survivors, kingHp, enemyRemaining, enraged }) =>
      ({ id, outcome, battleSeconds, survivors, kingHp, enemyRemaining, enraged })),
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await cli();
