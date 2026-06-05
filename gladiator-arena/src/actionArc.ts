import { GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";
import { actionOrder, canUseAction, type ActionId, type CombatState } from "./combat";
import { getActionArcLayout } from "./actionArcLayout";
import { getStageLayout } from "./stageLayout";

type StageLayoutTuning = Parameters<typeof getStageLayout>[1];
type TuningProvider = () => StageLayoutTuning;

export interface ActionArcApi {
  sync: (state: CombatState) => void;
  destroy: () => void;
}

export function mountActionArc(host: HTMLElement, onAction: (actionId: ActionId) => void, getTuning?: TuningProvider): ActionArcApi {
  const overlay = host;
  const root = document.createElement("div");
  const centerMarker = document.createElement("div");
  const buttons = new Map<ActionId, HTMLButtonElement>();
  let lastState: CombatState | undefined;

  root.className = "action-arc";
  root.setAttribute("aria-label", "Available combat actions");
  centerMarker.className = "action-arc__center";
  centerMarker.setAttribute("aria-hidden", "true");
  root.append(centerMarker);

  for (const actionId of actionOrder) {
    const button = document.createElement("button");
    const title = document.createElement("strong");
    const detail = document.createElement("span");

    button.type = "button";
    button.className = "action-arc__button";
    button.dataset.action = actionId;
    button.hidden = true;
    button.append(title, detail);
    button.addEventListener("click", () => {
      button.dispatchEvent(new CustomEvent("arena-action-click", { bubbles: true, detail: { actionId, disabled: button.disabled } }));

      if (!button.disabled) {
        onAction(actionId);
      }
    });

    buttons.set(actionId, button);
    root.append(button);
  }

  overlay.append(root);

  function sync(state: CombatState): void {
    lastState = state;
    const layout = getActionArcLayout(state, getTuning?.());
    centerMarker.style.left = `${(layout.centerX / GAME_WIDTH) * 100}%`;
    centerMarker.style.top = `${(layout.centerY / GAME_HEIGHT) * 100}%`;
    const visibleButtons = new Map(layout.buttons.map((buttonLayout) => [buttonLayout.actionId, buttonLayout]));

    for (const [actionId, button] of buttons) {
      const buttonLayout = visibleButtons.get(actionId);

      if (!buttonLayout) {
        button.hidden = true;
        continue;
      }

      const [title, detail] = button.children;

      button.hidden = false;
      button.disabled = !canUseAction(state, actionId, "player");
      button.style.left = `${(buttonLayout.x / GAME_WIDTH) * 100}%`;
      button.style.top = `${(buttonLayout.y / GAME_HEIGHT) * 100}%`;
      button.style.setProperty("--action-button-scale", `${buttonLayout.scale}`);
      button.dataset.angle = `${Math.round(buttonLayout.angle)}`;
      button.title = `${buttonLayout.label} angle ${Math.round(buttonLayout.angle)} deg`;
      title.textContent = buttonLayout.label;
      detail.textContent = buttonLayout.detail;
    }
  }

  function syncFromDebugTuning(): void {
    if (lastState) {
      sync(lastState);
    }
  }

  if (getTuning) {
    window.addEventListener("arena-debug-tuning-change", syncFromDebugTuning);
  }

  return {
    sync,
    destroy() {
      window.removeEventListener("arena-debug-tuning-change", syncFromDebugTuning);
      root.remove();
    },
  };
}