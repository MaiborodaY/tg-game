import { DEFAULT_ACTION_BUTTON_SCALE } from "./arenaLayout";
import { syncActionTokenButton, type ActionTokenTuning } from "./actionArc";
import { actionOrder, actions, canUseAction, type ActionId, type CombatState } from "./combat";

type TuningProvider = () => ActionTokenTuning;

export interface ClassicActionBarApi {
  sync: (state: CombatState) => void;
  destroy: () => void;
}

export function mountClassicActionBar(
  host: HTMLElement,
  onAction: (actionId: ActionId) => void,
  getTuning?: TuningProvider,
): ClassicActionBarApi | undefined {
  const root = host.querySelector<HTMLElement>("[data-classic-action-bar]");

  if (!root) {
    return undefined;
  }

  const buttons = new Map<ActionId, HTMLButtonElement>();
  let lastState: CombatState | undefined;

  root.replaceChildren();

  for (const actionId of actionOrder) {
    const button = document.createElement("button");
    const icon = document.createElement("span");

    button.type = "button";
    button.className = "action-arc__button classic-action-bar__button";
    button.dataset.action = actionId;
    icon.className = "action-arc__icon";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.addEventListener("click", () => {
      button.dispatchEvent(new CustomEvent("arena-action-click", { bubbles: true, detail: { actionId, disabled: button.disabled } }));

      if (!button.disabled) {
        onAction(actionId);
      }
    });
    buttons.set(actionId, button);
    root.append(button);
  }

  function sync(state: CombatState): void {
    const tuning = getTuning?.();
    const buttonScale = tuning?.actionButtonScale ?? DEFAULT_ACTION_BUTTON_SCALE;

    for (const [actionId, button] of buttons) {
      const icon = button.querySelector<HTMLElement>(".action-arc__icon");

      if (!icon) {
        continue;
      }

      syncActionTokenButton(button, icon, actionId, tuning, buttonScale);
      button.disabled = !canUseAction(state, actionId, "player");
      button.setAttribute("aria-label", `${actions[actionId].title} ${actions[actionId].detail}`);
      button.title = `${actions[actionId].title} ${actions[actionId].detail}`;
    }
  }

  function syncFromDebugTuning(): void {
    if (lastState) {
      sync(lastState);
    }
  }

  const syncWithState = (state: CombatState): void => {
    lastState = state;
    sync(state);
  };

  if (getTuning) {
    window.addEventListener("arena-debug-tuning-change", syncFromDebugTuning);
  }

  return {
    sync: syncWithState,
    destroy() {
      window.removeEventListener("arena-debug-tuning-change", syncFromDebugTuning);
      root.replaceChildren();
    },
  };
}
