import { GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";
import { actionOrder, canUseAction, type ActionId, type CombatState } from "./combat";
import { getActionArcLayout } from "./actionArcLayout";
import { getStageLayout } from "./stageLayout";

type StageLayoutTuning = Parameters<typeof getStageLayout>[1];
type TuningProvider = () => StageLayoutTuning;

function renderActionIcon(button: HTMLButtonElement, icon: HTMLElement, _actionId: ActionId): void {
  icon.replaceChildren();
  delete button.dataset.icon;
  delete button.dataset.iconAlt;
}
export interface ActionArcApi {
  sync: (state: CombatState) => void;
  destroy: () => void;
}

export function mountActionArc(
  host: HTMLElement,
  onAction: (actionId: ActionId) => void,
  getTuning?: TuningProvider,
): ActionArcApi {
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
    const icon = document.createElement("span");

    button.type = "button";
    button.className = "action-arc__button";
    button.dataset.action = actionId;
    button.hidden = true;
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

  overlay.append(root);

  function sync(state: CombatState): void {
    lastState = state;
    const viewport = getActionArcViewport(overlay);
    const layout = getActionArcLayout(state, getTuning?.(), viewport);
    centerMarker.style.left = `${(layout.centerX / viewport.width) * 100}%`;
    centerMarker.style.top = `${(layout.centerY / viewport.height) * 100}%`;
    const visibleButtons = new Map(layout.buttons.map((buttonLayout) => [buttonLayout.actionId, buttonLayout]));

    for (const [actionId, button] of buttons) {
      const buttonLayout = visibleButtons.get(actionId);
      const icon = button.querySelector<HTMLElement>(".action-arc__icon");

      if (!buttonLayout) {
        button.hidden = true;
        continue;
      }

      if (!icon) {
        continue;
      }

      button.hidden = false;
      button.disabled = !canUseAction(state, actionId, "player");
      button.style.left = `${(buttonLayout.x / viewport.width) * 100}%`;
      button.style.top = `${(buttonLayout.y / viewport.height) * 100}%`;
      button.style.setProperty("--action-button-scale", `${buttonLayout.scale}`);
      button.dataset.angle = `${Math.round(buttonLayout.angle)}`;
      button.setAttribute("aria-label", `${buttonLayout.label} ${buttonLayout.detail}`);
      button.title = `${buttonLayout.label} ${buttonLayout.detail} angle ${Math.round(buttonLayout.angle)} deg`;
      renderActionIcon(button, icon, actionId);
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

function getActionArcViewport(host: HTMLElement): { width: number; height: number } {
  const rect = host.getBoundingClientRect();

  return {
    width: getPositiveNumber(rect.width, GAME_WIDTH),
    height: getPositiveNumber(rect.height, GAME_HEIGHT),
  };
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
