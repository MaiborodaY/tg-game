import type { ActionId, CombatState } from "./combat";

export type EnemyTimerStatus = "idle" | "scheduled" | "running";

export interface TurnProbeApi {
  sync: (state: CombatState, timerStatus: EnemyTimerStatus, lastClick?: string) => void;
}

export function shouldMountTurnProbe(): boolean {
  return document.body.classList.contains("debug-active") || new URLSearchParams(window.location.search).has("turnProbe");
}

export function mountTurnProbe(host: HTMLElement): TurnProbeApi {
  const root = document.createElement("output");

  root.className = "turn-probe";
  root.setAttribute("aria-label", "Turn debug state");
  host.append(root);

  return {
    sync(state, timerStatus, lastClick) {
      root.textContent = formatTurnProbe(state, timerStatus, lastClick);
    },
  };
}

export function formatTurnProbe(state: CombatState, timerStatus: EnemyTimerStatus, lastClick = "none"): string {
  const lastEnemyAction = state.lastEnemyAction ?? "none";
  const lastPlayerAction = state.lastPlayerAction ?? "none";

  return [
    `turn=${state.activeTurn}`,
    `timer=${timerStatus}`,
    `dist=${state.distance}`,
    `p=${state.playerPosition}`,
    `e=${state.enemyPosition}`,
    `click=${lastClick}`,
    `lastP=${lastPlayerAction}`,
    `lastE=${lastEnemyAction}`,
  ].join(" | ");
}

export function logTurnProbe(_event: string, _state: CombatState, _timerStatus: EnemyTimerStatus, _actionId?: ActionId): void {
  // Intentionally silent in production.
}
