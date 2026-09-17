import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeCampaignStalls } from '../scripts/campaign-stalls.mjs';

const report = entries => ({ seed: 1, speed: 3,
  attempts: entries.map(([wave, outcome], index) => ({ attempt: index + 1, wave, outcome })) });

test('a frontier-ten stall includes retreat victories and its final victory', () => {
  const result = analyzeCampaignStalls([report([
    [10, 'defeat'], [9, 'victory'], [10, 'defeat'], [9, 'victory'], [10, 'victory'],
  ])]);
  assert.deepEqual(result.runs[0].stalls, [{
    frontierWave: 10, round: 1, position: 10,
    startAttempt: 1, endAttempt: 5, attempts: 5, defeats: 2, completed: true, long: true,
  }]);
  assert.equal(result.summary.longCompletedStalls, 1);
  assert.equal(result.summary.lateWaveLongStallShare, 1);
  assert.equal(result.summary.defeats, 2);
  assert.equal(result.summary.lateWaveDefeatShare, 1);
});

test('a double retreat remains attributed to the original new frontier', () => {
  const result = analyzeCampaignStalls([report([
    [8, 'victory'], [9, 'defeat'], [8, 'defeat'], [7, 'victory'], [8, 'victory'], [9, 'victory'],
  ])]);
  assert.equal(result.stalls.length, 1);
  assert.equal(result.stalls[0].frontierWave, 9);
  assert.equal(result.stalls[0].attempts, 5);
  assert.equal(result.stalls[0].defeats, 2);
  assert.equal(result.summary.lateWaveDefeatShare, .5);
  assert.equal(result.summary.lateWaveLongStallShare, 1);
  assert.equal(result.defeatsByPosition[7].defeats, 1);
  assert.equal(result.defeatsByPosition[8].defeats, 1);
});

test('an unfinished long stall is retained and separated from completed stalls', () => {
  const result = analyzeCampaignStalls([report([
    [21, 'defeat'], [20, 'victory'], [21, 'defeat'], [20, 'victory'], [21, 'defeat'],
  ])]);
  assert.equal(result.stalls[0].frontierWave, 21);
  assert.equal(result.stalls[0].completed, false);
  assert.equal(result.stalls[0].attempts, 5);
  assert.equal(result.stalls[0].endAttempt, 5);
  assert.equal(result.summary.completedStalls, 0);
  assert.equal(result.summary.incompleteStalls, 1);
  assert.equal(result.summary.longCompletedStalls, 0);
  assert.equal(result.summary.longIncompleteStalls, 1);
  assert.equal(result.summary.lateWaveLongStallShare, 0);
  assert.equal(result.defeatsByRound.find(row => row.round === 3).defeats, 3);
});

test('first victories without defeats are never classified as stalls', () => {
  const result = analyzeCampaignStalls([report([[1, 'victory'], [2, 'victory'], [3, 'victory']])]);
  assert.deepEqual(result.stalls, []);
  assert.equal(result.summary.stalls, 0);
  assert.equal(result.summary.defeats, 0);
  assert.equal(result.summary.lateWaveDefeatShare, null);
  assert.equal(result.summary.lateWaveLongStallShare, null);
});

test('timeouts do not become defeats or create a stall without a real defeat', () => {
  const result = analyzeCampaignStalls([
    report([[10, 'timeout']]),
    report([[10, 'defeat'], [9, 'victory'], [10, 'timeout']]),
  ]);
  assert.equal(result.summary.defeats, 1);
  assert.equal(result.summary.timeouts, 2);
  assert.equal(result.summary.stalls, 1);
  assert.equal(result.stalls[0].attempts, 3);
  assert.equal(result.stalls[0].defeats, 1);
  assert.equal(result.stalls[0].completed, false);
  assert.equal(result.stalls[0].long, false);
});

test('multiple runs aggregate defeats without merging their independent frontiers', () => {
  const reports = [
    report([[9, 'defeat'], [8, 'victory'], [9, 'victory'], [10, 'defeat'], [9, 'victory'], [10, 'victory']]),
    { ...report([[11, 'defeat'], [10, 'victory'], [11, 'victory']]), seed: 4, speed: 1 },
  ];
  const saved = JSON.stringify(reports);
  const result = analyzeCampaignStalls(reports);
  assert.equal(JSON.stringify(reports), saved, 'input journals stay unchanged');
  assert.equal(result.summary.defeats, 3);
  assert.equal(result.summary.lateWaveDefeatShare, 2 / 3);
  assert.equal(result.summary.completedStalls, 3);
  assert.equal(result.summary.longStalls, 0);
  assert.deepEqual(result.stalls.map(stall => [stall.run, stall.frontierWave, stall.attempts]),
    [[1, 9, 3], [1, 10, 3], [2, 11, 3]]);
  assert.deepEqual(result.defeatsByRound.map(row => [row.round, row.defeats]), [[1, 2], [2, 1]]);
  assert.equal(result.runs[1].seed, 4);
  assert.equal(result.runs[1].speed, 1);
});

test('an already-cleared replay loss is counted but not labelled a new-frontier stall', () => {
  const result = analyzeCampaignStalls([report([[10, 'victory'], [9, 'defeat'], [9, 'victory']])]);
  assert.equal(result.summary.defeats, 1);
  assert.equal(result.summary.stalls, 0);
});

test('empty and invalid reports have explicit behavior', () => {
  assert.equal(analyzeCampaignStalls([]).summary.attempts, 0);
  assert.deepEqual(analyzeCampaignStalls([]).runs, []);
  assert.throws(() => analyzeCampaignStalls({}), TypeError);
  assert.throws(() => analyzeCampaignStalls([{}]), TypeError);
  assert.throws(() => analyzeCampaignStalls([report([[0, 'defeat']])]), TypeError);
  assert.throws(() => analyzeCampaignStalls([report([[1, 'unknown']])]), TypeError);
});
