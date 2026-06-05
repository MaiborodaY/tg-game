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
  const overlay = host.querySelector<HTMLElement>(".battle-ui") ?? host;
  const root = document.createElement("div");
  const buttons = new Map<ActionId, HTMLButtonElement>();

  root.className = "action-arc";
  root.setAttribute("aria-label", "Available combat actions");

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
      if (!button.disabled) {
        onAction(actionId);
      }
    });

    buttons.set(actionId, button);
    root.append(button);
  }

  overlay.append(root);

  return {
    sync(state) {
      const layout = getActionArcLayout(state, getTuning?.());
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
        title.textContent = buttonLayout.label;
        detail.textContent = buttonLayout.detail;
      }
    },
    destroy() {
      root.remove();
    },
  };
}