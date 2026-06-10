import { GAME_HEIGHT, GAME_WIDTH } from "./arenaLayout";
import { getBattleSafeArea } from "./battleSafeArea";
import { actionOrder, canUseAction, type ActionId, type CombatState } from "./combat";
import { getActionArcLayout } from "./actionArcLayout";
import { getStageLayout } from "./stageLayout";

type StageLayoutTuning = Parameters<typeof getStageLayout>[1];
type TuningProvider = () => StageLayoutTuning;

interface ScreenOffset {
  x: number;
  y: number;
}

interface ActionArcDebugEditor {
  isEnabled: () => boolean;
  beginEdit: () => void;
  endEdit: () => void;
  setArcOffset: (offset: ScreenOffset) => void;
  setButtonOffset: (actionId: ActionId, offset: ScreenOffset) => void;
}

type SelectedActionArcTarget = { type: "arc" } | { type: "button"; actionId: ActionId };

interface ActionArcDragState {
  pointerId: number;
  target: SelectedActionArcTarget;
  lastX: number;
  lastY: number;
}

const ACTION_ICONS: Record<ActionId, string> = {
  forward: ">",
  back: "<",
  lunge: "/",
  light: "",
  medium: "",
  heavy: "",
  taunt: "!",
  rest: "*",
};

const ACTION_ATTACK_ICON_URLS: Partial<Record<ActionId, string>> = {
  light: new URL("./assets/ui/action-icons/attack-light.webp", import.meta.url).href,
  medium: new URL("./assets/ui/action-icons/attack-medium.webp", import.meta.url).href,
  heavy: new URL("./assets/ui/action-icons/attack-heavy.webp", import.meta.url).href,
};

const LUNGE_ICON_LAYERS = [
  { className: "action-arc__icon-layer action-arc__icon-layer--bolt", text: "/" },
  { className: "action-arc__icon-layer action-arc__icon-layer--sword", text: "|" },
] as const;

function renderActionIcon(button: HTMLButtonElement, icon: HTMLElement, actionId: ActionId): void {
  const attackIconUrl = ACTION_ATTACK_ICON_URLS[actionId];

  icon.replaceChildren();
  delete button.dataset.icon;
  delete button.dataset.iconAlt;
  button.classList.toggle("action-arc__button--attack-token", Boolean(attackIconUrl));

  if (attackIconUrl) {
    const attackIcon = document.createElement("img");

    attackIcon.className = "action-arc__attack-icon";
    attackIcon.src = attackIconUrl;
    attackIcon.alt = "";
    attackIcon.draggable = false;
    icon.append(attackIcon);
    return;
  }

  if (actionId === "lunge") {
    LUNGE_ICON_LAYERS.forEach((layerConfig) => {
      const layer = document.createElement("span");

      layer.className = layerConfig.className;
      layer.textContent = layerConfig.text;
      icon.append(layer);
    });
    return;
  }

  icon.textContent = ACTION_ICONS[actionId];
}
export interface ActionArcApi {
  sync: (state: CombatState) => void;
  destroy: () => void;
}

export function mountActionArc(
  host: HTMLElement,
  onAction: (actionId: ActionId) => void,
  getTuning?: TuningProvider,
  debugEditor?: ActionArcDebugEditor,
): ActionArcApi {
  const overlay = host;
  const root = document.createElement("div");
  const centerMarker = document.createElement("div");
  const buttons = new Map<ActionId, HTMLButtonElement>();
  let lastState: CombatState | undefined;
  let lastLayout: ReturnType<typeof getActionArcLayout> | undefined;
  let selectedTarget: SelectedActionArcTarget | undefined;
  let dragState: ActionArcDragState | undefined;

  root.className = "action-arc";
  root.setAttribute("aria-label", "Available combat actions");
  centerMarker.className = "action-arc__center";
  centerMarker.setAttribute("aria-hidden", "true");
  centerMarker.addEventListener("pointerdown", (event) => startPointerEdit(event, { type: "arc" }));
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
    button.addEventListener("pointerdown", (event) => startPointerEdit(event, { type: "button", actionId }));
    button.addEventListener("click", (event) => {
      if (isDebugEditEnabled()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      button.dispatchEvent(new CustomEvent("arena-action-click", { bubbles: true, detail: { actionId, disabled: button.disabled } }));

      if (!button.disabled) {
        onAction(actionId);
      }
    });

    buttons.set(actionId, button);
    root.append(button);
  }

  overlay.append(root);
  overlay.addEventListener("pointerdown", handleOverlayPointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", finishPointerEdit);
  root.addEventListener("pointercancel", finishPointerEdit);

  function sync(state: CombatState): void {
    lastState = state;
    const viewport = getActionArcViewport(overlay);
    const tuning = getTuning?.();
    const layout = getActionArcLayout(state, tuning, viewport);
    const editMode = isDebugEditEnabled();

    lastLayout = layout;
    updateEditClasses();
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
      button.disabled = !editMode && !canUseAction(state, actionId, "player");
      button.style.left = `${(buttonLayout.x / viewport.width) * 100}%`;
      button.style.top = `${(buttonLayout.y / viewport.height) * 100}%`;
      button.style.setProperty("--action-button-scale", `${buttonLayout.scale}`);
      button.style.setProperty("--action-icon-scale", `${tuning?.actionIconScale ?? 1}`);
      button.style.setProperty("--action-attack-icon-scale", `${tuning?.actionAttackIconScale ?? 1}`);
      button.dataset.angle = `${Math.round(buttonLayout.angle)}`;
      button.setAttribute("aria-label", `${buttonLayout.label} ${buttonLayout.detail}`);
      button.title = `${buttonLayout.label} ${buttonLayout.detail} angle ${Math.round(buttonLayout.angle)} deg`;
      renderActionIcon(button, icon, actionId);
    }

    updateEditClasses();
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
      overlay.removeEventListener("pointerdown", handleOverlayPointerDown);
      root.remove();
    },
  };

  function isDebugEditEnabled(): boolean {
    return Boolean(debugEditor?.isEnabled());
  }

  function startPointerEdit(event: PointerEvent, target: SelectedActionArcTarget): void {
    if (!debugEditor || !isDebugEditEnabled() || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectedTarget = target;
    dragState = {
      pointerId: event.pointerId,
      target,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    debugEditor.beginEdit();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    updateEditClasses();
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!debugEditor || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.lastX;
    const deltaY = event.clientY - dragState.lastY;

    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      return;
    }

    moveTargetBy(deltaX, deltaY, dragState.target);
    dragState.lastX = event.clientX;
    dragState.lastY = event.clientY;
  }

  function finishPointerEdit(event: PointerEvent): void {
    if (!debugEditor || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState = undefined;
    debugEditor.endEdit();
  }

  function handleOverlayPointerDown(event: PointerEvent): void {
    if (!debugEditor || !isDebugEditEnabled() || event.button !== 0 || !selectedTarget || isActionArcElement(event.target)) {
      return;
    }

    if (event.target instanceof HTMLElement && event.target.closest(".battle-ui, .debug-panel")) {
      return;
    }

    event.preventDefault();
    debugEditor.beginEdit();
    placeTargetAt(getOverlayPoint(event), selectedTarget);
    debugEditor.endEdit();
  }

  function moveTargetBy(deltaX: number, deltaY: number, target: SelectedActionArcTarget): void {
    if (!debugEditor) {
      return;
    }

    if (target.type === "arc") {
      const offset = getArcOffset();

      debugEditor.setArcOffset({ x: offset.x + deltaX, y: offset.y + deltaY });
      return;
    }

    const offset = getButtonOffset(target.actionId);

    debugEditor.setButtonOffset(target.actionId, { x: offset.x + deltaX, y: offset.y + deltaY });
  }

  function placeTargetAt(point: ScreenOffset, target: SelectedActionArcTarget): void {
    if (!lastLayout || !debugEditor) {
      return;
    }

    if (target.type === "arc") {
      const offset = getArcOffset();

      debugEditor.setArcOffset({ x: offset.x + point.x - lastLayout.centerX, y: offset.y + point.y - lastLayout.centerY });
      return;
    }

    const buttonLayout = lastLayout.buttons.find((button) => button.actionId === target.actionId);

    if (!buttonLayout) {
      return;
    }

    const offset = getButtonOffset(target.actionId);

    debugEditor.setButtonOffset(target.actionId, { x: offset.x + point.x - buttonLayout.x, y: offset.y + point.y - buttonLayout.y });
  }

  function getArcOffset(): ScreenOffset {
    const tuning = getTuning?.();

    return {
      x: tuning?.actionArcOffsetX ?? 0,
      y: tuning?.actionArcOffsetY ?? 0,
    };
  }

  function getButtonOffset(actionId: ActionId): ScreenOffset {
    const tuning = getTuning?.();
    const offset = tuning?.actionButtonOffsets?.[actionId];

    return {
      x: offset?.x ?? 0,
      y: offset?.y ?? 0,
    };
  }

  function getOverlayPoint(event: PointerEvent): ScreenOffset {
    const rect = overlay.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function isActionArcElement(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && Boolean(target.closest(".action-arc"));
  }

  function updateEditClasses(): void {
    const editMode = isDebugEditEnabled();

    if (!editMode) {
      selectedTarget = undefined;
      dragState = undefined;
    }

    root.classList.toggle("action-arc--editing", editMode);
    centerMarker.classList.toggle("action-arc__center--selected", editMode && selectedTarget?.type === "arc");

    for (const [actionId, button] of buttons) {
      button.classList.toggle(
        "action-arc__button--selected",
        editMode && selectedTarget?.type === "button" && selectedTarget.actionId === actionId,
      );
    }
  }
}

function getActionArcViewport(host: HTMLElement): { width: number; height: number; safeBottom: number } {
  const rect = host.getBoundingClientRect();
  const height = getPositiveNumber(rect.height, GAME_HEIGHT);

  return {
    width: getPositiveNumber(rect.width, GAME_WIDTH),
    height,
    safeBottom: getBattleSafeArea(host, height).bottom,
  };
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
