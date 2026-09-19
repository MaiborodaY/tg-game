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
  root.innerHTML = `<header class="dungeon-run-heading"><button type="button" class="dungeon-icon-button" data-run-exit aria-label="Leave cave and return to dungeons">‹</button>
    <div><strong data-run-title></strong><span data-run-progress></span></div>
    <button type="button" class="dungeon-run-speed" data-run-speed aria-label="Change battle speed">×1</button></header>
    <div class="dungeon-run-controls"><p data-run-status role="status" aria-live="polite"></p>
    <button type="button" class="battle-button" data-run-start>Start</button></div>`;
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
  const write = (element: HTMLElement, text: string) => { if (element.textContent !== text) element.textContent = text; };
  exitButton.addEventListener('click', onExit);
  startButton.addEventListener('click', onStart);
  speedButton.addEventListener('click', onSpeed);
  return {
    refresh(run: DungeonRun | null, forge: Readonly<ForgeState>, ready: boolean, paused: boolean, speed: number) {
      root.hidden = !run;
      startButton.hidden = !run || run.battle?.phase === 'running';
      if (!run) return;
      const battle = run.battle;
      write(title, `Goblin Cave ${run.level.numeral}`);
      write(progress, `Wave 1${battle ? ` · ${battle.kills} / ${battle.total}` : ' · 4 guards'}`);
      write(speedButton, `×${speed}`);
      speedButton.disabled = !battle || battle.phase !== 'running';
      startButton.disabled = !ready || !run.units.length;
      write(startButton, battle ? 'Prepare again' : 'Start');
      const selected = run.units.find(unit => unit.id === run.selectedId);
      const stats = selected ? getForgedUnitStats(selected.type, selected.level, forge) : null;
      write(status, !ready ? 'Loading cave…' : paused ? 'Paused'
        : battle?.phase === 'victory' ? 'Wave 1 cleared! More waves and rewards are coming later.'
        : battle?.phase === 'defeat' ? 'Defeated. Your main army is safe.'
        : battle ? 'Defend the entrance'
        : selected && stats ? `${UNIT_TYPE_BY_ID[selected.type].name} · Lv. ${selected.level} · ${Math.round(stats.hp)} HP\nTap a tile to move or swap.`
        : run.units.length ? 'Army ready · Tap a fighter below to rearrange.' : 'Deploy fighters in your main army first.');
    },
    focus() { exitButton.focus({ preventScroll: true }); },
    destroy() { root.remove(); startButton.remove(); },
  };
}
