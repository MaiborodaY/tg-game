import { getDungeonExitState, getNextDungeonWave } from './dungeon-run.ts';
import type { DungeonRun } from './dungeon-run.ts';
import type { ForgeState } from './forge.ts';
import { getForgedUnitStats } from './forge.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';

/** Controls for the shared battlefield; no second canvas or animation loop. */
export function createDungeonRunUI({ battlefield, armyDock, onExit, onStart, onPrepare, onRetry, onSpeed }: {
  battlefield: HTMLElement; armyDock: HTMLElement; onExit: () => void; onStart: () => void;
  onPrepare: () => void; onRetry: () => void; onSpeed: () => void;
}) {
  const root = document.createElement('div');
  root.className = 'dungeon-run-ui';
  root.hidden = true;
  root.innerHTML = `<header class="dungeon-run-heading"><button type="button" class="battle-button dungeon-run-exit" data-run-exit aria-label="Return to Dungeons">Dungeons</button>
    <div><strong data-run-title></strong><span data-run-progress></span></div>
    <button type="button" class="dungeon-run-speed" data-run-speed aria-label="Change battle speed">×1</button></header>
    <div class="dungeon-run-controls"><p data-run-status role="status" aria-live="polite"></p>
    <button type="button" class="battle-button" data-run-start>Start</button></div>
    <section class="dungeon-result" data-run-result aria-labelledby="dungeon-result-title" hidden>
      <span class="dungeon-result-eyebrow" data-result-eyebrow></span>
      <span class="dungeon-art dungeon-art-1 dungeon-result-art" aria-hidden="true"></span>
      <h3 id="dungeon-result-title" data-result-title></h3>
      <p data-result-description></p>
      <div class="dungeon-result-rewards" data-result-rewards>
        <span><span class="coin-icon" aria-hidden="true"></span><b data-result-gold></b><small>gold</small></span>
        <span><span class="slave-icon" aria-hidden="true"></span><b data-result-slaves></b><small>slaves</small></span>
      </div>
      <p class="dungeon-result-note" data-result-note role="status" aria-live="polite"></p>
      <div class="dungeon-result-actions"><button type="button" class="battle-button" data-run-retry>Run again</button>
        <button type="button" class="battle-button" data-result-exit>Dungeons</button></div>
    </section>
    <dialog class="dungeon-exit-dialog" data-run-confirm aria-labelledby="dungeon-exit-title" aria-describedby="dungeon-exit-description">
      <h3 id="dungeon-exit-title">Leave this run?</h3>
      <p id="dungeon-exit-description">Your dungeon progress will be lost. Next time you enter, you will start from wave 1. Your main army is safe.</p>
      <div><button type="button" class="battle-button" data-run-stay autofocus>Stay</button>
      <button type="button" class="battle-button danger-button" data-run-leave>Leave run</button></div>
    </dialog>`;
  battlefield.append(root);
  const exitButton = root.querySelector<HTMLButtonElement>('[data-run-exit]')!;
  const startButton = root.querySelector<HTMLButtonElement>('[data-run-start]')!;
  startButton.classList.add('dungeon-run-start');
  startButton.hidden = true;
  armyDock.append(startButton);
  const speedButton = root.querySelector<HTMLButtonElement>('[data-run-speed]')!;
  const title = root.querySelector<HTMLElement>('[data-run-title]')!;
  const progress = root.querySelector<HTMLElement>('[data-run-progress]')!;
  const status = root.querySelector<HTMLElement>('[data-run-status]')!;
  const confirmation = root.querySelector<HTMLDialogElement>('[data-run-confirm]')!;
  const resultPanel = root.querySelector<HTMLElement>('[data-run-result]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-result-title]')!;
  const resultEyebrow = root.querySelector<HTMLElement>('[data-result-eyebrow]')!;
  const resultDescription = root.querySelector<HTMLElement>('[data-result-description]')!;
  const resultNote = root.querySelector<HTMLElement>('[data-result-note]')!;
  const rewards = root.querySelector<HTMLElement>('[data-result-rewards]')!;
  const gold = root.querySelector<HTMLElement>('[data-result-gold]')!;
  const slaves = root.querySelector<HTMLElement>('[data-result-slaves]')!;
  const retryButton = root.querySelector<HTMLButtonElement>('[data-run-retry]')!;
  const resultExit = root.querySelector<HTMLButtonElement>('[data-result-exit]')!;
  let currentRun: DungeonRun | null = null;
  const write = (element: HTMLElement, text: string) => { if (element.textContent !== text) element.textContent = text; };
  exitButton.addEventListener('click', () => {
    if (!currentRun) return;
    const state = getDungeonExitState(currentRun);
    if (state === 'blocked') return;
    if (state === 'confirm') { if (!confirmation.open) confirmation.showModal(); }
    else onExit();
  });
  root.querySelector('[data-run-stay]')!.addEventListener('click', () => confirmation.close());
  root.querySelector('[data-run-leave]')!.addEventListener('click', () => {
    if (!currentRun || getDungeonExitState(currentRun) === 'blocked') return;
    confirmation.close(); onExit();
  });
  startButton.addEventListener('click', () => {
    if (confirmation.open) return;
    if (currentRun?.stage === 'wave-cleared') onPrepare(); else onStart();
  });
  retryButton.addEventListener('click', onRetry);
  resultExit.addEventListener('click', onExit);
  speedButton.addEventListener('click', onSpeed);
  return {
    refresh(run: DungeonRun | null, forge: Readonly<ForgeState>, ready: boolean, paused: boolean, speed: number) {
      currentRun = run;
      if (confirmation.open && (!run || !ready || paused || getDungeonExitState(run) !== 'confirm')) confirmation.close();
      root.hidden = !run;
      const nextWave = run && getNextDungeonWave(run);
      startButton.hidden = !nextWave;
      if (!run) return;
      const battle = run.battle;
      const finished = run.stage === 'complete' || run.stage === 'defeat';
      exitButton.hidden = getDungeonExitState(run) === 'blocked' || finished;
      write(title, `Goblin Cave ${run.level.numeral}`);
      write(progress, `Wave ${run.wave.number} / ${run.waves.length} · ${battle?.kills ?? 0} / ${run.wave.total}`);
      write(speedButton, `×${speed}`);
      speedButton.disabled = !battle || battle.phase !== 'running';
      startButton.disabled = !ready || paused || !run.units.length;
      write(startButton, !ready ? 'Loading…' : run.stage === 'wave-cleared' ? 'Prepare'
        : !battle ? 'Start' : nextWave?.hasBoss ? 'Start boss' : `Start wave ${nextWave?.number ?? ''}`);
      resultPanel.hidden = !finished;
      if (finished) {
        const won = run.stage === 'complete';
        const rewarded = won && run.reward !== null;
        root.querySelector<HTMLElement>('.dungeon-result-art')!.className = `dungeon-art dungeon-art-${run.level.tier} dungeon-result-art`;
        write(resultEyebrow, `Goblin Cave ${run.level.numeral} · ${won ? run.waves.length : run.waveIndex} / ${run.waves.length} waves cleared`);
        write(resultTitle, won ? run.level.tier === 1 ? 'Cave conquered!' : 'Preview complete' : 'Run ended');
        write(resultDescription, won ? run.level.tier === 1 ? 'The Goblin Chief is defeated. Your spoils:'
          : 'The full dungeon is coming later.' : 'Your main army is safe. Return with a new plan.');
        rewards.hidden = !rewarded;
        if (run.reward) { write(gold, `+${run.reward.gold}`); write(slaves, `+${run.reward.slaves}`); }
        write(resultNote, rewarded ? ready ? 'Rewards received · Earn them again on every clear.' : 'Saving rewards…'
          : won ? run.level.tier === 1 ? 'Rewards need attention.' : 'No rewards in this preview.' : 'Defeat the final boss to earn rewards.');
        retryButton.disabled = resultExit.disabled = !ready || paused;
      }
      const selected = run.units.find(unit => unit.id === run.selectedId);
      const stats = selected ? getForgedUnitStats(selected.type, selected.level, forge) : null;
      write(status, !ready ? 'Loading cave…' : paused ? 'Paused'
        : run.stage === 'wave-cleared' ? 'Wave cleared · Tap Prepare to return survivors to formation.'
        : finished ? ''
        : run.stage === 'combat' ? 'Defend the entrance'
        : battle ? 'Survivors ready · HP and losses carry over. Tap Start when ready.'
        : selected && stats ? `${UNIT_TYPE_BY_ID[selected.type].name} · Lv. ${selected.level} · ${Math.round(stats.hp)} HP\nTap a tile to move or swap.`
        : run.units.length ? 'Army ready · Tap a fighter below to rearrange.' : 'Deploy fighters in your main army first.');
      status.hidden = finished;
    },
    focus() { exitButton.focus({ preventScroll: true }); },
    dismissConfirmation() { if (confirmation.open) confirmation.close(); },
    destroy() { confirmation.close(); root.remove(); startButton.remove(); },
  };
}
