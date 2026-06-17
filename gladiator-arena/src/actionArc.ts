import {
  DEFAULT_ACTION_ATTACK_ICON_SCALE,
  DEFAULT_ACTION_HEAVY_ICON_BRIGHTNESS,
  DEFAULT_ACTION_HEAVY_ICON_ROTATION,
  DEFAULT_ACTION_HEAVY_ICON_SCALE,
  DEFAULT_ACTION_ICON_SCALE,
  DEFAULT_ACTION_LIGHT_ICON_BRIGHTNESS,
  DEFAULT_ACTION_LIGHT_ICON_ROTATION,
  DEFAULT_ACTION_LIGHT_ICON_SCALE,
  DEFAULT_ACTION_MEDIUM_ICON_BRIGHTNESS,
  DEFAULT_ACTION_MEDIUM_ICON_ROTATION,
  DEFAULT_ACTION_MEDIUM_ICON_SCALE,
  DEFAULT_ACTION_TOKEN_FACE_INSET,
  DEFAULT_ACTION_TOKEN_FACE_SHINE,
  DEFAULT_ACTION_TOKEN_INNER_SHINE,
  DEFAULT_ACTION_TOKEN_OUTER_SHINE,
  DEFAULT_ACTION_TOKEN_RING_WIDTH,
  DEFAULT_ACTION_TOKEN_RIM_SHINE,
  DEFAULT_ACTION_TOKEN_STRIPE_SHINE,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "./arenaLayout";
import { SHOP_CATEGORY_BOW_ICON_ASSET_URL, SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL, SHOP_CATEGORY_SWORD_ICON_ASSET_URL } from "./assets";
import { getBattleSafeArea } from "./battleSafeArea";
import {
  actionOrder,
  actions,
  canUseAction,
  getActionBlockChanceForState,
  getActionStaminaCost,
  isActionHitChanceRestBoosted,
  isBowFighter,
  isPlayerExhausted,
  type ActionId,
  type CombatState,
} from "./combat";
import { getActionArcLayout } from "./actionArcLayout";
import { getStageLayout } from "./stageLayout";
import { getShopProductIconUrl } from "./shopItemIcons";

type StageLayoutTuning = Parameters<typeof getStageLayout>[1];
export type ActionTokenTuning = StageLayoutTuning;
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
  switchWeapon: "S",
  shuriken: "*",
  taunt: "!",
  rest: "*",
};

const ACTION_ATTACK_ICON_URLS: Partial<Record<ActionId, string>> = {
  light: new URL("./assets/ui/action-icons/attack-light.webp", import.meta.url).href,
  medium: new URL("./assets/ui/action-icons/attack-medium.webp", import.meta.url).href,
  heavy: new URL("./assets/ui/action-icons/attack-heavy.webp", import.meta.url).href,
};

const ACTION_UTILITY_ICON_URLS: Partial<Record<ActionId, string>> = {
  forward: new URL("./assets/ui/action-icons/move-forward.webp", import.meta.url).href,
  back: new URL("./assets/ui/action-icons/move-forward.webp", import.meta.url).href,
  lunge: new URL("./assets/ui/action-icons/lunge.webp", import.meta.url).href,
  switchWeapon: SHOP_CATEGORY_SWORD_ICON_ASSET_URL,
  taunt: new URL("./assets/ui/action-icons/taunt.webp", import.meta.url).href,
  rest: new URL("./assets/ui/action-icons/rest.webp", import.meta.url).href,
};
const ACTION_BUTTON_PRESS_MS = 140;
const pressedButtonTimers = new WeakMap<HTMLButtonElement, number>();

interface AttackIconStyleTuning {
  scale: number;
  rotation: number;
  brightness: number;
}

function getAttackIconStyleTuning(actionId: ActionId, tuning?: StageLayoutTuning): AttackIconStyleTuning {
  const globalScale = tuning?.actionAttackIconScale ?? DEFAULT_ACTION_ATTACK_ICON_SCALE;

  switch (actionId) {
    case "light":
      return {
        scale: globalScale * (tuning?.actionLightIconScale ?? DEFAULT_ACTION_LIGHT_ICON_SCALE),
        rotation: tuning?.actionLightIconRotation ?? DEFAULT_ACTION_LIGHT_ICON_ROTATION,
        brightness: tuning?.actionLightIconBrightness ?? DEFAULT_ACTION_LIGHT_ICON_BRIGHTNESS,
      };
    case "medium":
      return {
        scale: globalScale * (tuning?.actionMediumIconScale ?? DEFAULT_ACTION_MEDIUM_ICON_SCALE),
        rotation: tuning?.actionMediumIconRotation ?? DEFAULT_ACTION_MEDIUM_ICON_ROTATION,
        brightness: tuning?.actionMediumIconBrightness ?? DEFAULT_ACTION_MEDIUM_ICON_BRIGHTNESS,
      };
    case "heavy":
      return {
        scale: globalScale * (tuning?.actionHeavyIconScale ?? DEFAULT_ACTION_HEAVY_ICON_SCALE),
        rotation: tuning?.actionHeavyIconRotation ?? DEFAULT_ACTION_HEAVY_ICON_ROTATION,
        brightness: tuning?.actionHeavyIconBrightness ?? DEFAULT_ACTION_HEAVY_ICON_BRIGHTNESS,
      };
    default:
      return {
        scale: globalScale,
        rotation: 0,
        brightness: 1,
      };
  }
}

function renderActionIcon(button: HTMLButtonElement, icon: HTMLElement, actionId: ActionId, dynamicIconUrl?: string): void {
  const attackIconUrl = ACTION_ATTACK_ICON_URLS[actionId];
  const utilityIconUrl = ACTION_UTILITY_ICON_URLS[actionId];
  const imageIconUrl = dynamicIconUrl ?? attackIconUrl ?? utilityIconUrl;
  const iconClassName = attackIconUrl ? "action-arc__attack-icon" : "action-arc__image-icon";
  const iconSignature = imageIconUrl ? `image:${iconClassName}:${imageIconUrl}` : `text:${ACTION_ICONS[actionId] ?? ""}`;

  button.classList.toggle("action-arc__button--attack-token", Boolean(attackIconUrl));
  button.classList.toggle("action-arc__button--image-token", Boolean(imageIconUrl));

  if (button.dataset.icon === iconSignature) {
    return;
  }

  button.dataset.icon = iconSignature;

  if (imageIconUrl) {
    const imageIcon = document.createElement("img");

    imageIcon.className = attackIconUrl ? "action-arc__attack-icon" : "action-arc__image-icon";
    imageIcon.src = imageIconUrl;
    imageIcon.alt = "";
    imageIcon.draggable = false;
    icon.replaceChildren();
    icon.append(imageIcon);
    return;
  }

  icon.replaceChildren();
  icon.textContent = ACTION_ICONS[actionId];
}

export function syncActionTokenButton(
  button: HTMLButtonElement,
  icon: HTMLElement,
  actionId: ActionId,
  tuning: ActionTokenTuning,
  buttonScale: number,
  dynamicIconUrl?: string,
): void {
  const attackIconStyle = getAttackIconStyleTuning(actionId, tuning);

  button.style.setProperty("--action-button-scale", `${buttonScale}`);
  button.style.setProperty("--action-icon-scale", `${tuning?.actionIconScale ?? DEFAULT_ACTION_ICON_SCALE}`);
  button.style.setProperty("--action-attack-icon-scale", `${attackIconStyle.scale}`);
  button.style.setProperty("--action-attack-icon-rotation", `${attackIconStyle.rotation}deg`);
  button.style.setProperty("--action-attack-icon-brightness", `${attackIconStyle.brightness}`);
  button.style.setProperty("--token-ring-width", `${tuning?.actionTokenRingWidth ?? DEFAULT_ACTION_TOKEN_RING_WIDTH}px`);
  button.style.setProperty("--token-face-inset", `${tuning?.actionTokenFaceInset ?? DEFAULT_ACTION_TOKEN_FACE_INSET}px`);
  button.style.setProperty("--token-rim-shine-opacity", `${tuning?.actionTokenRimShine ?? DEFAULT_ACTION_TOKEN_RIM_SHINE}`);
  button.style.setProperty("--token-outer-shine-opacity", `${tuning?.actionTokenOuterShine ?? DEFAULT_ACTION_TOKEN_OUTER_SHINE}`);
  button.style.setProperty("--token-face-shine-opacity", `${tuning?.actionTokenFaceShine ?? DEFAULT_ACTION_TOKEN_FACE_SHINE}`);
  button.style.setProperty("--token-inner-shine-opacity", `${tuning?.actionTokenInnerShine ?? DEFAULT_ACTION_TOKEN_INNER_SHINE}`);
  button.style.setProperty("--token-stripe-shine-opacity", `${tuning?.actionTokenStripeShine ?? DEFAULT_ACTION_TOKEN_STRIPE_SHINE}`);
  renderActionIcon(button, icon, actionId, dynamicIconUrl);
}

export function syncActionChanceBadge(button: HTMLButtonElement, actionId: ActionId, state: CombatState): string | undefined {
  const label = getActionHitChanceLabel(actionId, state);
  const badge = getActionChanceBadge(button);

  if (!label) {
    badge.hidden = true;
    badge.textContent = "";
    badge.classList.remove("action-arc__chance--rest-boosted");
    button.classList.remove("action-arc__button--has-chance");
    return undefined;
  }

  badge.hidden = false;
  badge.textContent = label;
  badge.classList.toggle("action-arc__chance--rest-boosted", isActionHitChanceRestBoosted(state, actionId, "player"));
  button.classList.add("action-arc__button--has-chance");
  return label;
}

export function syncActionCostBadge(button: HTMLButtonElement, actionId: ActionId, state: CombatState): string | undefined {
  return syncActionCostBadgeElement(getActionCostBadge(button), actionId, state);
}

export function syncActionCostBadgeElement(
  badge: HTMLSpanElement,
  actionId: ActionId,
  state: CombatState,
  isVisible = true,
): string | undefined {
  const cost = getActionStaminaCost(actionId, state.player);

  if (cost <= 0 || !isVisible) {
    badge.hidden = true;
    badge.classList.remove("action-arc__cost--exhausts");
    setActionCostValue(badge, "");
    return undefined;
  }

  const exhausts = state.result === "playing" && state.activeTurn === "player" && state.player.stamina - cost <= 0;

  badge.hidden = false;
  badge.classList.toggle("action-arc__cost--exhausts", exhausts);
  setActionCostValue(badge, String(cost));
  return String(cost);
}

function getActionChanceBadge(button: HTMLButtonElement): HTMLSpanElement {
  const existing = button.querySelector<HTMLSpanElement>(".action-arc__chance");

  if (existing) {
    return existing;
  }

  const badge = document.createElement("span");

  badge.className = "action-arc__chance";
  badge.setAttribute("aria-hidden", "true");
  button.append(badge);
  return badge;
}

function getActionCostBadge(button: HTMLButtonElement): HTMLSpanElement {
  const existing = button.querySelector<HTMLSpanElement>(".action-arc__cost");

  if (existing) {
    return existing;
  }

  const badge = createActionCostBadgeElement();

  button.append(badge);
  return badge;
}

export function createActionCostBadgeElement(): HTMLSpanElement {
  const badge = document.createElement("span");
  const icon = document.createElement("span");
  const value = document.createElement("span");

  badge.className = "action-arc__cost";
  badge.hidden = true;
  badge.setAttribute("aria-hidden", "true");
  icon.className = "action-arc__cost-icon";
  value.className = "action-arc__cost-value";
  badge.append(icon, value);
  return badge;
}

function setActionCostValue(badge: HTMLSpanElement, value: string): void {
  const valueElement = badge.querySelector<HTMLSpanElement>(".action-arc__cost-value");

  if (valueElement) {
    valueElement.textContent = value;
  }
}

export function getActionHitChanceLabel(actionId: ActionId, state: CombatState): string | undefined {
  const action = actions[actionId];

  if (action.blockChance === undefined) {
    return undefined;
  }

  const blockChance = getActionBlockChanceForState(state, actionId, "player");
  const hitChance = Math.round((1 - blockChance) * 100);

  return `${hitChance}%`;
}

export function pressActionTokenButton(button: HTMLButtonElement): void {
  if (button.disabled) {
    return;
  }

  const currentTimer = pressedButtonTimers.get(button);

  if (currentTimer !== undefined) {
    window.clearTimeout(currentTimer);
  }

  button.classList.remove("action-arc__button--pressed");
  void button.offsetWidth;
  button.classList.add("action-arc__button--pressed");

  const nextTimer = window.setTimeout(() => {
    button.classList.remove("action-arc__button--pressed");
    pressedButtonTimers.delete(button);
  }, ACTION_BUTTON_PRESS_MS);

  pressedButtonTimers.set(button, nextTimer);
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
        pressActionTokenButton(button);
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
        button.classList.remove("action-arc__button--exhausted-rest");
        continue;
      }

      if (!icon) {
        continue;
      }

      button.hidden = false;
      button.disabled = !editMode && !canUseAction(state, actionId, "player");
      button.classList.toggle("action-arc__button--exhausted-rest", actionId === "rest" && isPlayerExhausted(state));
      button.style.left = `${(buttonLayout.x / viewport.width) * 100}%`;
      button.style.top = `${(buttonLayout.y / viewport.height) * 100}%`;
      syncActionTokenButton(button, icon, actionId, tuning, buttonLayout.scale, getActionTokenIconUrl(actionId, state));
      const hitChanceLabel = syncActionChanceBadge(button, actionId, state);
      const costLabel = syncActionCostBadge(button, actionId, state);
      button.dataset.angle = `${Math.round(buttonLayout.angle)}`;
      button.setAttribute(
        "aria-label",
        `${buttonLayout.label} ${buttonLayout.detail}${costLabel ? ` stamina ${costLabel}` : ""}${hitChanceLabel ? ` hit ${hitChanceLabel}` : ""}`,
      );
      button.title = `${buttonLayout.label} ${buttonLayout.detail}${costLabel ? ` stamina ${costLabel}` : ""}${hitChanceLabel ? ` hit ${hitChanceLabel}` : ""} angle ${Math.round(buttonLayout.angle)} deg`;
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

export function getActionTokenIconUrl(actionId: ActionId, state: CombatState): string | undefined {
  if (actionId === "switchWeapon") {
    const targetItemId = isBowFighter(state.player) ? state.player.equipment?.weaponMain : state.player.equipment?.weaponBow;

    return targetItemId
      ? getShopProductIconUrl([targetItemId]) ?? (isBowFighter(state.player) ? SHOP_CATEGORY_SWORD_ICON_ASSET_URL : SHOP_CATEGORY_BOW_ICON_ASSET_URL)
      : isBowFighter(state.player)
        ? SHOP_CATEGORY_SWORD_ICON_ASSET_URL
        : SHOP_CATEGORY_BOW_ICON_ASSET_URL;
  }

  if (actionId !== "shuriken") {
    return undefined;
  }

  return state.player.shurikenItemId
    ? getShopProductIconUrl([state.player.shurikenItemId]) ?? SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL
    : SHOP_CATEGORY_SHURIKEN_ICON_ASSET_URL;
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
