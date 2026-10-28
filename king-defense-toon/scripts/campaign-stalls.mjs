import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WAVES_PER_ROUND = 10;
export const LONG_STALL_ATTEMPTS = 5;
const positionOf = wave => (wave - 1) % WAVES_PER_ROUND + 1;
const roundOf = wave => Math.ceil(wave / WAVES_PER_ROUND);
const isLateWave = wave => positionOf(wave) >= 9;
const share = (part, total) => total ? part / total : null;

function findStalls(attempts) {
  const stalls = [];
  let highestCleared = 0;
  let active = null;
  for (let index = 0; index < attempts.length; index += 1) {
    const entry = attempts[index];
    const attemptNumber = entry.attempt ?? index + 1;
    if (!active && entry.outcome === 'defeat' && entry.wave > highestCleared) {
      active = {
        frontierWave: entry.wave, round: roundOf(entry.wave), position: positionOf(entry.wave),
        startAttempt: attemptNumber, endAttempt: attemptNumber,
        attempts: 0, defeats: 0, completed: false, long: false,
      };
    }
    if (active) {
      // Retreat wins and further retreats belong to the same blocked frontier.
      // Count observed attempts, not the difference between optional journal IDs.
      active.attempts += 1;
      active.defeats += Number(entry.outcome === 'defeat');
      active.endAttempt = attemptNumber;
      active.long = active.attempts >= LONG_STALL_ATTEMPTS;
      if (entry.outcome === 'victory' && entry.wave >= active.frontierWave) {
        active.completed = true;
        stalls.push(active);
        active = null;
      }
    }
    if (entry.outcome === 'victory') highestCleared = Math.max(highestCleared, entry.wave);
  }
  if (active) stalls.push(active);
  return stalls;
}

function summarize(attempts, stalls) {
  const rounds = new Map();
  const defeatsByPosition = Array.from({ length: WAVES_PER_ROUND }, (_, index) => ({ position: index + 1, defeats: 0 }));
  let defeats = 0;
  let lateWaveDefeats = 0;
  for (const entry of attempts) {
    const round = roundOf(entry.wave);
    if (!rounds.has(round)) rounds.set(round, { round, defeats: 0, lateWaveDefeats: 0 });
    if (entry.outcome !== 'defeat') continue;
    defeats += 1;
    const late = Number(isLateWave(entry.wave));
    lateWaveDefeats += late;
    rounds.get(round).defeats += 1;
    rounds.get(round).lateWaveDefeats += late;
    defeatsByPosition[positionOf(entry.wave) - 1].defeats += 1;
  }
  const completedStalls = stalls.filter(stall => stall.completed).length;
  const longStalls = stalls.filter(stall => stall.long);
  const longCompletedStalls = longStalls.filter(stall => stall.completed).length;
  const lateWaveLongStalls = longStalls.filter(stall => isLateWave(stall.frontierWave)).length;
  return {
    summary: {
      attempts: attempts.length,
      victories: attempts.filter(entry => entry.outcome === 'victory').length,
      defeats, timeouts: attempts.filter(entry => entry.outcome === 'timeout').length,
      lateWaveDefeats, lateWaveDefeatShare: share(lateWaveDefeats, defeats),
      stalls: stalls.length, completedStalls, incompleteStalls: stalls.length - completedStalls,
      longStalls: longStalls.length, longCompletedStalls,
      longIncompleteStalls: longStalls.length - longCompletedStalls,
      lateWaveLongStalls, lateWaveLongStallShare: share(lateWaveLongStalls, longStalls.length),
    },
    // Round numbers are global: waves 1–10 are round 1, waves 11–20 round 2, etc.
    defeatsByRound: [...rounds.values()].sort((a, b) => a.round - b.round)
      .map(round => ({ ...round, lateWaveDefeatShare: share(round.lateWaveDefeats, round.defeats) })),
    defeatsByPosition,
    stalls,
  };
}

/** Analyze recorded attempts only. Null shares mean their denominator is zero. */
export function analyzeCampaignStalls(reports) {
  if (!Array.isArray(reports)) throw new TypeError('Expected an array of campaign reports');
  const allAttempts = [];
  const allStalls = [];
  const runs = reports.map((report, runIndex) => {
    if (!Array.isArray(report?.attempts)) throw new TypeError(`Report ${runIndex + 1} has no attempts array`);
    for (const entry of report.attempts) {
      if (!Number.isSafeInteger(entry?.wave) || entry.wave < 1
        || !['victory', 'defeat', 'timeout'].includes(entry.outcome)
        || (entry.attempt !== undefined && (!Number.isSafeInteger(entry.attempt) || entry.attempt < 1))) {
        throw new TypeError(`Report ${runIndex + 1} contains an invalid attempt`);
      }
    }
    const identity = { run: runIndex + 1, seed: report.seed ?? null, speed: report.speed ?? null };
    if (report.sourceFile) identity.sourceFile = report.sourceFile;
    const stalls = findStalls(report.attempts);
    allAttempts.push(...report.attempts);
    allStalls.push(...stalls.map(stall => ({ ...identity, ...stall })));
    return { ...identity, ...summarize(report.attempts, stalls) };
  });
  return {
    longStallMinAttempts: LONG_STALL_ATTEMPTS,
    ...summarize(allAttempts, allStalls), runs,
  };
}

function cli() {
  const files = process.argv.slice(2);
  if (!files.length || files.includes('--help')) {
    console.log('Usage: node scripts/campaign-stalls.mjs report1.json [report2.json ...]');
    if (!files.length) process.exitCode = 1;
    return;
  }
  const reports = files.flatMap(file => {
    const input = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    const entries = Array.isArray(input) ? input : input.reports ?? (input.attempts ? [input] : null);
    if (!Array.isArray(entries)) throw new TypeError(`No campaign reports found in ${file}`);
    return entries.map(report => ({ ...report, sourceFile: path.resolve(file) }));
  });
  console.log(JSON.stringify(analyzeCampaignStalls(reports), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(); } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
