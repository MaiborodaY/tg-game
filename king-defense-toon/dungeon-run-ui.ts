import { getDungeonExitState, getNextDungeonWave } from './dungeon-run.ts';
import type { DungeonRun } from './dungeon-run.ts';
import type { ForgeState } from './forge.ts';
import { getForgedUnitStats } from './forge.ts';
import { UNIT_TYPE_BY_ID } from './units.ts';

/** Controls for the shared battlefield; no second canvas or animation loop. */
export function createDungeonRunUI({ battlefield, armyDock, onExit, onStart, onSpeed }: {
  battlefield: HTMLElement; armyDock: HTMLElement; onExit: () => void; onStart: () => void; onSpeed: () => void;
}) {
  const root = document.createElement('div');
  root.className = 'dungeon-run-ui';
  root.hidden = true;
  root.innerHTML = `<header class="dungeon-run-heading"><button type="button" class="battle-button dungeon-run-exit" data-run-exit aria-label="Return to Dungeons">Dungeons</button>
    <div><strong data-run-title></strong><span data-run-progress></span></div>
    <button type="button" class="dungeon-run-speed" data-run-speed aria-label="Change battle speed">×1</button></header>
    <div class="dungeon-run-controls"><p data-run-status role="status" aria-live="polite"></p>
    <button type="button" class="battle-button" data-run-start>Start</button></div>
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
  startButton.addEventListener('click', () => { if (!confirmation.open) onStart(); });
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
      exitButton.hidden = getDungeonExitState(run) === 'blocked';
      write(title, `Goblin Cave ${run.level.numeral}`);
      write(progress, `Wave ${run.wave.number} / ${run.waves.length}${battle ? ` · ${battle.kills} / ${battle.total}` : ' · 4 guards'}`);
      write(speedButton, `×${speed}`);
      speedButton.disabled = !battle || battle.phase !== 'running';
      startButton.disabled = !ready || !run.units.length;
      write(startButton, !ready ? 'Loading…' : !battle ? 'Start' : nextWave?.hasBoss ? 'Start boss' : `Wave ${nextWave?.number ?? ''}`);
      const selected = run.units.find(unit => unit.id === run.selectedId);
      const stats = selected ? getForgedUnitStats(selected.type, selected.level, forge) : null;
      write(status, !ready ? 'Loading cave…' : paused ? 'Paused'
        : battle?.phase === 'victory' ? nextWave ? 'Wave cleared · HP and losses carry over.'
          : run.level.tier === 1 ? 'Cave cleared! Reward collection is coming later.' : 'Opening wave cleared. Full runs for this tier are coming later.'
        : battle?.phase === 'defeat' ? 'Run ended · Your main army is safe.'
        : battle ? 'Defend the entrance'
        : selected && stats ? `${UNIT_TYPE_BY_ID[selected.type].name} · Lv. ${selected.level} · ${Math.round(stats.hp)} HP\nTap a tile to move or swap.`
        : run.units.length ? 'Army ready · Tap a fighter below to rearrange.' : 'Deploy fighters in your main army first.');
    },
    focus() { exitButton.focus({ preventScroll: true }); },
    dismissConfirmation() { if (confirmation.open) confirmation.close(); },
    destroy() { confirmation.close(); root.remove(); startButton.remove(); },
  };
}
