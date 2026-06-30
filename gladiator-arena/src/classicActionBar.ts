import { DEFAULT_ACTION_BUTTON_SCALE } from "./arenaLayout";
import {
  createActionCostBadgeElement,
  getActionHitChanceLabel,
  getActionTokenIconUrl,
  pressActionTokenButton,
  syncActionTokenButton,
  type ActionTokenTuning,
} from "./actionArc";
import {
  actionOrder,
  canUseAction,
  canFighterSwitchWeapon,
  distanceBand,
  doesLungeReachTarget,
  isActionTargetRestVulnerable,
  getFighterSpellbookScrollCount,
  getFighterShurikenCount,
  getFighterClinchRange,
  getActionPreviewDamage,
  getActionDetail,
  getActionStaminaCost,
  getActionTitle,
  isFighterInClinchRange,
  isPlayerExhausted,
  isRangedFighter,
  isStaffFighter,
  type ActionId,
  type CombatActor,
  type CombatState,
  type FighterState,
} from "./combat";
import type { ActionButtonOffsetKey, ClassicActionButtonSlotTuning, ClassicActionWheelMode } from "./debugTuning";
import {
  createSpellbookMenu,
  getSpellbookButtonDetail,
  getSpellbookButtonTitle,
  isSpellbookButtonAction,
  shouldEnableSpellbookButton,
  shouldShowSpellbookButton,
} from "./spellbookMenu";
import { getPlayerSettings, setPlayerActionDamagePreviewEnabled, subscribePlayerSettings } from "./settingsMenu";

type ClassicActionSlotTuning = Record<ClassicActionWheelMode, Record<ActionButtonOffsetKey, ClassicActionButtonSlotTuning>>;
type TuningProvider = () => ActionTokenTuning & { classicActionButtonSlots?: ClassicActionSlotTuning };
type ClassicWheelMode = "distance" | "clinch" | "bow-distance";
type ClassicWheelRangeMode = "far" | "near" | "melee" | "clinch" | "bow";

interface ClassicActionBarOptions {
  getPreviewWheelMode?: () => ClassicActionWheelMode | undefined;
  getControlledActor?: () => CombatActor;
}

const CLASSIC_WHEEL_TURN_MS = 520;
const CLASSIC_WHEEL_BASE_DIAMETER = 420;
const CLASSIC_WHEEL_SCREEN_PADDING_X = 12;
const CLASSIC_CHANCE_BADGE_SCREEN_OFFSET_Y = -40;
const CLASSIC_DAMAGE_BADGE_SCREEN_OFFSET_Y = -20;
const CLASSIC_COST_BADGE_SCREEN_OFFSET_Y = 32;
const CLASSIC_WHEEL_RANGE_MODES: ClassicWheelRangeMode[] = ["far", "near", "melee", "clinch", "bow"];
const classicElementRenderCache = new WeakMap<HTMLElement, ClassicElementRenderCache>();

interface ClassicActionSlot {
  actionId: ActionId;
  x: number;
  y: number;
  rotation: number;
}

interface ClassicButtonRefs {
  button: HTMLButtonElement;
  icon: HTMLElement;
  chanceBadge: HTMLSpanElement;
  damageBadge: HTMLSpanElement;
  costBadge: HTMLSpanElement;
  costValue: HTMLSpanElement | undefined;
  tokenSignature?: string;
}

interface ClassicElementRenderCache {
  attrs: Map<string, string>;
  classes: Map<string, boolean>;
  styles: Map<string, string>;
  disabled?: boolean;
  hidden?: boolean;
  tabIndex?: number;
  text?: string;
  title?: string;
}

interface ClassicButtonLayer {
  element: HTMLDivElement;
  buttons: Map<ActionId, HTMLButtonElement>;
  buttonRefs: Map<ActionId, ClassicButtonRefs>;
  chanceBadges: Map<ActionId, HTMLSpanElement>;
  damageBadges: Map<ActionId, HTMLSpanElement>;
  costBadges: Map<ActionId, HTMLSpanElement>;
  mode?: ClassicWheelMode;
  angle: number;
}

const CLASSIC_DISTANCE_SLOTS: ClassicActionSlot[] = [
  { actionId: "forward", x: -44, y: -104, rotation: -10 },
  { actionId: "lunge", x: 44, y: -104, rotation: 10 },
  { actionId: "back", x: -88, y: -38, rotation: -12 },
  { actionId: "switchWeapon", x: -104, y: -96, rotation: -16 },
  { actionId: "shuriken", x: 88, y: -92, rotation: 12 },
  { actionId: "scroll", x: 102, y: -150, rotation: 14 },
  { actionId: "taunt", x: 0, y: -54, rotation: 0 },
  { actionId: "rest", x: 88, y: -38, rotation: 12 },
];

const CLASSIC_CLINCH_SLOTS: ClassicActionSlot[] = [
  { actionId: "light", x: -76, y: -112, rotation: -14 },
  { actionId: "medium", x: 0, y: -128, rotation: 0 },
  { actionId: "heavy", x: 76, y: -112, rotation: 14 },
  { actionId: "back", x: -90, y: -38, rotation: -12 },
  { actionId: "shuriken", x: 90, y: -88, rotation: 12 },
  { actionId: "scroll", x: 102, y: -150, rotation: 14 },
  { actionId: "taunt", x: 0, y: -50, rotation: 0 },
  { actionId: "rest", x: 90, y: -38, rotation: 12 },
];

const CLASSIC_BOW_DISTANCE_SLOTS: ClassicActionSlot[] = [
  { actionId: "light", x: -78, y: -116, rotation: -14 },
  { actionId: "medium", x: 0, y: -132, rotation: 0 },
  { actionId: "heavy", x: 78, y: -116, rotation: 14 },
  { actionId: "back", x: -118, y: -36, rotation: -14 },
  { actionId: "switchWeapon", x: -130, y: -78, rotation: -16 },
  { actionId: "shuriken", x: 78, y: -58, rotation: 10 },
  { actionId: "scroll", x: 108, y: -96, rotation: 12 },
  { actionId: "taunt", x: 40, y: -52, rotation: 6 },
  { actionId: "rest", x: 118, y: -36, rotation: 14 },
];

const classicWheelModeTuningKey: Record<ClassicWheelMode, ClassicActionWheelMode> = {
  distance: "distance",
  clinch: "clinch",
  "bow-distance": "bowDistance",
};

export interface ClassicActionBarApi {
  sync: (state: CombatState) => void;
  destroy: () => void;
}

export function mountClassicActionBar(
  host: HTMLElement,
  onAction: (actionId: ActionId) => void,
  getTuning?: TuningProvider,
  options: ClassicActionBarOptions = {},
): ClassicActionBarApi | undefined {
  const root = host.querySelector<HTMLElement>("[data-classic-action-bar]");

  if (!root) {
    return undefined;
  }
  const actionBarRoot = root;

  const wheel = document.createElement("div");
  const wheelShadow = document.createElement("div");
  let lastState: CombatState | undefined;
  const getControlledActor = (): CombatActor => options.getControlledActor?.() ?? "player";
  const spellbookMenu = createSpellbookMenu(host, () => lastState, onAction, getControlledActor);
  const damagePreviewToggle = createClassicDamagePreviewToggle();
  const handleActionButtonClick = (actionId: ActionId, button: HTMLButtonElement): void => {
    button.dispatchEvent(new CustomEvent("arena-action-click", { bubbles: true, detail: { actionId, disabled: button.disabled } }));

    if (button.disabled) {
      return;
    }

    pressActionTokenButton(button);

    if (lastState && isSpellbookButtonAction(actionId) && shouldShowSpellbookButton(lastState, getControlledActor())) {
      spellbookMenu.toggle(button);
      return;
    }

    spellbookMenu.close();
    onAction(actionId);
  };
  const layers = [createClassicButtonLayer(handleActionButtonClick), createClassicButtonLayer(handleActionButtonClick)];
  let activeLayer = layers[0];
  let wheelRotationAngle = 0;
  let isWheelTurning = false;
  let wheelTurnTimer: number | undefined;
  const syncWheelFitScale = () => syncClassicWheelFitScale(actionBarRoot);

  actionBarRoot.replaceChildren();
  wheelShadow.className = "classic-action-bar__wheel-shadow";
  wheel.className = "classic-action-bar__wheel";
  layers.forEach((layer) => wheel.append(layer.element));
  actionBarRoot.append(wheelShadow, wheel, damagePreviewToggle);
  syncWheelFitScale();
  syncDamagePreviewToggle();
  window.addEventListener("resize", syncWheelFitScale);
  const unsubscribePlayerSettings = subscribePlayerSettings(() => {
    syncDamagePreviewToggle();

    if (lastState) {
      sync(lastState);
    }
  });

  damagePreviewToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setPlayerActionDamagePreviewEnabled(!getPlayerSettings().showActionDamagePreview);
  });

  function sync(state: CombatState): void {
    const tuning = getTuning?.();
    const buttonScale = tuning?.actionButtonScale ?? DEFAULT_ACTION_BUTTON_SCALE;
    const previewWheelMode = options.getPreviewWheelMode?.();
    const controlledActor = getControlledActor();
    const wheelMode = getClassicWheelMode(state, controlledActor, previewWheelMode);
    const isBattleActive = state.result === "playing";
    const hasPlayerControl = isBattleActive && isControlledActorTurn(state, controlledActor);
    const showDamagePreview = getPlayerSettings().showActionDamagePreview;

    syncDamagePreviewToggle(isBattleActive, showDamagePreview);

    if (!activeLayer.mode) {
      activeLayer.mode = wheelMode;
      activeLayer.angle = wheelRotationAngle;
    }

    if (hasPlayerControl && !isWheelTurning && activeLayer.mode !== wheelMode) {
      startWheelTransition(wheelMode);
    }

    const activeWheelMode = activeLayer.mode ?? wheelMode;
    const activeWheelRangeMode = getClassicWheelRangeMode(state, controlledActor, wheelMode, previewWheelMode);

    setCachedDataset(actionBarRoot, "classicWheelMode", activeWheelMode);
    setCachedDataset(actionBarRoot, "classicWheelRange", activeWheelRangeMode);
    setCachedClass(actionBarRoot, "classic-action-bar--distance", activeWheelMode === "distance");
    setCachedClass(actionBarRoot, "classic-action-bar--clinch", activeWheelMode === "clinch");
    setCachedClass(actionBarRoot, "classic-action-bar--bow-distance", activeWheelMode === "bow-distance");
    CLASSIC_WHEEL_RANGE_MODES.forEach((mode) => {
      setCachedClass(actionBarRoot, `classic-action-bar--range-${mode}`, activeWheelRangeMode === mode);
    });
    setCachedClass(actionBarRoot, "classic-action-bar--turning", isWheelTurning);
    setCachedStyle(wheel, "--classic-wheel-angle", `${wheelRotationAngle}deg`);

    const layersToRender = isWheelTurning ? layers : [activeLayer];

    layersToRender.forEach((layer) => {
      renderButtonLayer(
        layer,
        state,
        tuning,
        buttonScale,
        isBattleActive,
        showDamagePreview,
        layer === activeLayer && hasPlayerControl && !isWheelTurning,
        controlledActor,
      );
    });
    spellbookMenu.sync();
  }

  function renderButtonLayer(
    layer: ClassicButtonLayer,
    state: CombatState,
    tuning: ReturnType<TuningProvider> | undefined,
    buttonScale: number,
    shouldShowButtons: boolean,
    showDamagePreview: boolean,
    isInteractiveLayer: boolean,
    controlledActor: CombatActor,
  ): void {
    const visibleSlots = new Map(
      layer.mode ? getClassicActionSlots(layer.mode, state, controlledActor, tuning?.classicActionButtonSlots).map((slot) => [slot.actionId, slot]) : [],
    );

    setCachedClass(layer.element, "classic-action-bar__layer--active", Boolean(layer.mode));

    for (const [actionId, refs] of layer.buttonRefs) {
      const { button, icon, chanceBadge, damageBadge, costBadge, costValue } = refs;
      const slot = visibleSlots.get(actionId);
      const isVisible = shouldShowButtons && Boolean(slot);
      const isDimmed = isVisible && !isInteractiveLayer;
      const projectedSlot = slot ? projectSlotForWheelAngle(slot, layer.angle) : undefined;
      const dynamicIconUrl = getActionTokenIconUrl(actionId, state, controlledActor);
      const tokenSignature = getClassicActionTokenSignature(actionId, tuning, buttonScale, dynamicIconUrl);

      setCachedStyle(button, "--classic-slot-x", `${formatCssNumber(projectedSlot?.x ?? 0)}px`);
      setCachedStyle(button, "--classic-slot-y", `${formatCssNumber(projectedSlot?.y ?? 18)}px`);
      setCachedStyle(button, "--classic-slot-rotation", `${formatCssNumber(projectedSlot?.rotation ?? 0)}deg`);
      if (refs.tokenSignature !== tokenSignature) {
        syncActionTokenButton(button, icon, actionId, tuning, buttonScale, dynamicIconUrl);
        refs.tokenSignature = tokenSignature;
      }
      const hitChanceLabel = syncClassicActionChanceBadge(chanceBadge, actionId, state, controlledActor, projectedSlot, isVisible, wheelRotationAngle);
      const damageLabel = syncClassicActionDamageBadge(
        damageBadge,
        actionId,
        state,
        controlledActor,
        projectedSlot,
        isVisible,
        isDimmed,
        showDamagePreview,
        wheelRotationAngle,
      );
      const costLabel = syncClassicActionCostBadge(
        costBadge,
        costValue,
        actionId,
        state,
        controlledActor,
        projectedSlot,
        isVisible,
        isDimmed,
        wheelRotationAngle,
        buttonScale,
      );
      const isDisabled = !isInteractiveLayer || !isVisible || !isClassicActionButtonEnabled(state, actionId, controlledActor);
      setCachedDisabled(button, isDisabled);
      setCachedTabIndex(button, isVisible && isInteractiveLayer ? 0 : -1);
      setCachedAttribute(button, "aria-hidden", isVisible ? "false" : "true");
      setCachedClass(button, "classic-action-bar__button--visible", isVisible);
      setCachedClass(button, "classic-action-bar__button--hidden", !isVisible);
      setCachedClass(button, "classic-action-bar__button--dimmed", isDimmed);
      setCachedClass(button, "action-arc__button--exhausted-rest", isVisible && actionId === "rest" && isClassicActorExhausted(state, controlledActor));
      setCachedClass(
        button,
        "action-arc__button--lunge-reaches",
        isVisible && isInteractiveLayer && actionId === "lunge" && !isDisabled && doesLungeReachTarget(state, controlledActor),
      );
      setCachedClass(chanceBadge, "classic-action-bar__chance--dimmed", isDimmed);
      setCachedClass(damageBadge, "classic-action-bar__damage--dimmed", isDimmed);

      const controlledFighter = getClassicActorFighter(state, controlledActor) ?? state.player;
      const showSpellbook = isSpellbookButtonAction(actionId) && shouldShowSpellbookButton(state, controlledActor);
      const title = showSpellbook ? getSpellbookButtonTitle() : getActionTitle(actionId, controlledFighter);
      const detail =
        showSpellbook ? getSpellbookButtonDetail() : getActionDetail(actionId, controlledFighter);

      const actionLabel = `${title} ${detail}${costLabel ? ` stamina ${costLabel}` : ""}${hitChanceLabel ? ` hit ${hitChanceLabel}` : ""}${damageLabel ? ` damage ${damageLabel}` : ""}`;

      setCachedAttribute(button, "aria-label", actionLabel);
      setCachedTitle(button, actionLabel);
    }
  }

  function startWheelTransition(nextWheelMode: ClassicWheelMode): void {
    const outgoingLayer = activeLayer;
    const incomingLayer = getStandbyLayer();
    const nextWheelAngle = wheelRotationAngle + 180;

    incomingLayer.mode = nextWheelMode;
    incomingLayer.angle = nextWheelAngle;
    activeLayer = incomingLayer;
    wheelRotationAngle = nextWheelAngle;
    beginWheelTurn();

    if (wheelTurnTimer !== undefined) {
      window.clearTimeout(wheelTurnTimer);
    }

    wheelTurnTimer = window.setTimeout(() => {
      wheelTurnTimer = undefined;
      isWheelTurning = false;
      outgoingLayer.mode = undefined;
      clearButtonLayer(outgoingLayer);

      if (lastState) {
        sync(lastState);
      }
    }, CLASSIC_WHEEL_TURN_MS);
  }

  function beginWheelTurn(): void {
    isWheelTurning = true;
  }

  function getStandbyLayer(): ClassicButtonLayer {
    return layers.find((layer) => layer !== activeLayer) ?? layers[0];
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
      if (wheelTurnTimer !== undefined) {
        window.clearTimeout(wheelTurnTimer);
      }

      window.removeEventListener("arena-debug-tuning-change", syncFromDebugTuning);
      window.removeEventListener("resize", syncWheelFitScale);
      unsubscribePlayerSettings();
      spellbookMenu.destroy();
      actionBarRoot.replaceChildren();
    },
  };

  function syncDamagePreviewToggle(isBattleActive = lastState?.result === "playing", showDamagePreview = getPlayerSettings().showActionDamagePreview): void {
    setCachedClass(actionBarRoot, "classic-action-bar--damage-preview", showDamagePreview);
    setCachedHidden(damagePreviewToggle, !isBattleActive);
    setCachedClass(damagePreviewToggle, "classic-action-bar__damage-toggle--active", showDamagePreview);
    setCachedAttribute(damagePreviewToggle, "aria-pressed", String(showDamagePreview));
    setCachedTitle(damagePreviewToggle, showDamagePreview ? "Hide damage numbers" : "Show damage numbers");
  }
}

function syncClassicWheelFitScale(root: HTMLElement): void {
  const hostWidth = getClassicWheelHostWidth(root);
  const fitScale = clamp((hostWidth - CLASSIC_WHEEL_SCREEN_PADDING_X) / CLASSIC_WHEEL_BASE_DIAMETER, 0.1, 1);

  setCachedStyle(root, "--classic-wheel-fit-scale", formatCssNumber(fitScale));
}

function getClassicWheelHostWidth(root: HTMLElement): number {
  const battleScreen = root.closest<HTMLElement>(".battle-screen");
  const width = battleScreen?.getBoundingClientRect().width ?? (typeof window === "undefined" ? CLASSIC_WHEEL_BASE_DIAMETER : window.innerWidth);

  return typeof width === "number" && Number.isFinite(width) && width > 0 ? width : CLASSIC_WHEEL_BASE_DIAMETER;
}

function isControlledActorTurn(state: CombatState, actor: CombatActor): boolean {
  return state.activeTurn === (actor === "helper" ? "enemy" : actor);
}

function getClassicActorFighter(state: CombatState, actor: CombatActor): FighterState | undefined {
  if (actor === "helper") {
    return state.helper;
  }

  return actor === "enemy" ? state.enemy : state.player;
}

function isClassicActorExhausted(state: CombatState, actor: CombatActor): boolean {
  if (actor === "player") {
    return isPlayerExhausted(state);
  }

  const fighter = getClassicActorFighter(state, actor);

  return Boolean(fighter && fighter.stamina <= 0);
}

function getClassicWheelMode(state: CombatState, actor: CombatActor, previewWheelMode?: ClassicActionWheelMode): ClassicWheelMode {
  const forcedWheelMode = getClassicWheelModeFromTuningMode(previewWheelMode);

  if (forcedWheelMode) {
    return forcedWheelMode;
  }

  const fighter = getClassicActorFighter(state, actor) ?? state.player;
  const isPlayerInClinch = isFighterInClinchRange(state, actor);

  if ((isRangedFighter(fighter) || isStaffFighter(fighter)) && !isPlayerInClinch) {
    return "bow-distance";
  }

  return isPlayerInClinch ? "clinch" : "distance";
}

function getClassicWheelModeFromTuningMode(mode?: ClassicActionWheelMode): ClassicWheelMode | undefined {
  if (mode === "bowDistance") {
    return "bow-distance";
  }

  return mode;
}

function getClassicWheelRangeMode(
  state: CombatState,
  actor: CombatActor,
  wheelMode: ClassicWheelMode,
  previewWheelMode?: ClassicActionWheelMode,
): ClassicWheelRangeMode {
  const forcedRangeMode = getClassicWheelRangeModeFromTuningMode(previewWheelMode);

  if (forcedRangeMode) {
    return forcedRangeMode;
  }

  if (wheelMode === "bow-distance") {
    return "bow";
  }

  const fighter = getClassicActorFighter(state, actor) ?? state.player;
  const band = distanceBand(state.distance, getFighterClinchRange(fighter));

  return band === "very-far" ? "far" : band;
}

function getClassicWheelRangeModeFromTuningMode(mode?: ClassicActionWheelMode): ClassicWheelRangeMode | undefined {
  if (mode === "bowDistance") {
    return "bow";
  }

  if (mode === "clinch") {
    return "clinch";
  }

  if (mode === "distance") {
    return "far";
  }

  return undefined;
}

function getClassicActionSlots(wheelMode: ClassicWheelMode, state: CombatState, actor: CombatActor, slotsTuning?: ClassicActionSlotTuning): ClassicActionSlot[] {
  const modeSlots = slotsTuning?.[classicWheelModeTuningKey[wheelMode]];
  const slots = getDefaultClassicActionSlots(wheelMode).filter((slot) => shouldShowClassicActionSlot(state, slot.actionId, actor));

  if (!modeSlots) {
    return slots;
  }

  return slots.map((slot) => ({ ...slot, ...(modeSlots[slot.actionId] ?? {}) }));
}

function shouldShowClassicActionSlot(state: CombatState, actionId: ActionId, actor: CombatActor): boolean {
  const fighter = getClassicActorFighter(state, actor) ?? state.player;

  if (actionId === "switchWeapon") {
    return canFighterSwitchWeapon(fighter);
  }

  if (actionId === "shuriken") {
    return getFighterShurikenCount(fighter) > 0;
  }

  if (actionId === "scroll") {
    return getFighterSpellbookScrollCount(fighter) > 0;
  }

  return true;
}

function isClassicActionButtonEnabled(state: CombatState, actionId: ActionId, actor: CombatActor): boolean {
  if (isSpellbookButtonAction(actionId) && shouldShowSpellbookButton(state, actor)) {
    return shouldEnableSpellbookButton(state, actor);
  }

  return canUseAction(state, actionId, actor);
}

function getDefaultClassicActionSlots(wheelMode: ClassicWheelMode): ClassicActionSlot[] {
  if (wheelMode === "bow-distance") {
    return CLASSIC_BOW_DISTANCE_SLOTS;
  }

  return wheelMode === "clinch" ? CLASSIC_CLINCH_SLOTS : CLASSIC_DISTANCE_SLOTS;
}

function createClassicButtonLayer(onAction: (actionId: ActionId, button: HTMLButtonElement) => void): ClassicButtonLayer {
  const element = document.createElement("div");
  const buttons = new Map<ActionId, HTMLButtonElement>();
  const buttonRefs = new Map<ActionId, ClassicButtonRefs>();
  const chanceBadges = new Map<ActionId, HTMLSpanElement>();
  const damageBadges = new Map<ActionId, HTMLSpanElement>();
  const costBadges = new Map<ActionId, HTMLSpanElement>();

  element.className = "classic-action-bar__layer";

  for (const actionId of actionOrder) {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    const chanceBadge = document.createElement("span");
    const damageBadge = document.createElement("span");
    const costBadge = createActionCostBadgeElement();
    const costValue = costBadge.querySelector<HTMLSpanElement>(".action-arc__cost-value") ?? undefined;

    button.type = "button";
    button.className = "action-arc__button classic-action-bar__button classic-action-bar__button--hidden";
    button.dataset.action = actionId;
    icon.className = "action-arc__icon";
    icon.setAttribute("aria-hidden", "true");
    chanceBadge.className = "action-arc__chance classic-action-bar__chance";
    chanceBadge.hidden = true;
    chanceBadge.setAttribute("aria-hidden", "true");
    damageBadge.className = "classic-action-bar__damage";
    damageBadge.hidden = true;
    damageBadge.setAttribute("aria-hidden", "true");
    costBadge.classList.add("classic-action-bar__cost");
    button.append(icon);
    button.addEventListener("click", () => onAction(actionId, button));
    buttons.set(actionId, button);
    chanceBadges.set(actionId, chanceBadge);
    damageBadges.set(actionId, damageBadge);
    costBadges.set(actionId, costBadge);
    buttonRefs.set(actionId, { button, icon, chanceBadge, damageBadge, costBadge, costValue });
    element.append(button);
    element.append(chanceBadge);
    element.append(damageBadge);
    element.append(costBadge);
  }

  return {
    element,
    buttons,
    buttonRefs,
    chanceBadges,
    damageBadges,
    costBadges,
    angle: 0,
  };
}

function clearButtonLayer(layer: ClassicButtonLayer): void {
  setCachedClass(layer.element, "classic-action-bar__layer--active", false);

  for (const { button, chanceBadge, damageBadge, costBadge, costValue } of layer.buttonRefs.values()) {
    setCachedDisabled(button, true);
    setCachedTabIndex(button, -1);
    setCachedAttribute(button, "aria-hidden", "true");
    setCachedClass(button, "classic-action-bar__button--visible", false);
    setCachedClass(button, "classic-action-bar__button--dimmed", false);
    setCachedClass(button, "classic-action-bar__button--hidden", true);
    setCachedClass(button, "action-arc__button--exhausted-rest", false);
    setCachedClass(button, "action-arc__button--lunge-reaches", false);
    setCachedHidden(chanceBadge, true);
    setCachedHidden(damageBadge, true);
    setCachedHidden(costBadge, true);
    setCachedText(chanceBadge, "");
    setCachedText(damageBadge, "");
    setCachedText(costValue, "");
    setCachedClass(chanceBadge, "classic-action-bar__chance--dimmed", false);
    setCachedClass(damageBadge, "classic-action-bar__damage--dimmed", false);
    setCachedClass(costBadge, "classic-action-bar__cost--dimmed", false);
    setCachedClass(costBadge, "action-arc__cost--exhausts", false);
  }
}

function createClassicDamagePreviewToggle(): HTMLButtonElement {
  const button = document.createElement("button");
  const icon = document.createElement("span");

  button.type = "button";
  button.className = "classic-action-bar__damage-toggle";
  button.setAttribute("aria-label", "Toggle action damage numbers");
  button.setAttribute("aria-pressed", "false");
  icon.className = "classic-action-bar__damage-toggle-icon";
  icon.setAttribute("aria-hidden", "true");
  button.append(icon);

  return button;
}

function syncClassicActionChanceBadge(
  badge: HTMLSpanElement,
  actionId: ActionId,
  state: CombatState,
  actor: CombatActor,
  slot: ClassicActionSlot | undefined,
  isVisible: boolean,
  wheelRotationAngle: number,
): string | undefined {
  const label = getActionHitChanceLabel(actionId, state, actor);

  if (!label || !slot || !isVisible) {
    setCachedHidden(badge, true);
    setCachedText(badge, "");
    setCachedClass(badge, "action-arc__chance--target-vulnerable", false);
    setCachedClass(badge, "classic-action-bar__chance--target-vulnerable", false);
    return undefined;
  }

  setCachedHidden(badge, false);
  setCachedText(badge, label);
  const isTargetVulnerable = isActionTargetRestVulnerable(state, actionId, actor);

  setCachedClass(badge, "action-arc__chance--target-vulnerable", isTargetVulnerable);
  setCachedClass(badge, "classic-action-bar__chance--target-vulnerable", isTargetVulnerable);
  const screenOffset = projectPointForWheelAngle(0, CLASSIC_CHANCE_BADGE_SCREEN_OFFSET_Y, wheelRotationAngle);

  setCachedStyle(badge, "--classic-chance-x", `${formatCssNumber(slot.x + screenOffset.x)}px`);
  setCachedStyle(badge, "--classic-chance-y", `${formatCssNumber(slot.y + screenOffset.y)}px`);
  setCachedStyle(badge, "--classic-chance-counter-rotation", `${formatCssNumber(-wheelRotationAngle)}deg`);
  return label;
}

function syncClassicActionCostBadge(
  badge: HTMLSpanElement,
  valueElement: HTMLSpanElement | undefined,
  actionId: ActionId,
  state: CombatState,
  actor: CombatActor,
  slot: ClassicActionSlot | undefined,
  isVisible: boolean,
  isDimmed: boolean,
  wheelRotationAngle: number,
  buttonScale: number,
): string | undefined {
  const fighter = getClassicActorFighter(state, actor) ?? state.player;
  const cost = getActionStaminaCost(actionId, fighter);

  if (cost <= 0 || !slot || !isVisible) {
    setCachedHidden(badge, true);
    setCachedClass(badge, "action-arc__cost--exhausts", false);
    setCachedText(valueElement, "");
    setCachedClass(badge, "classic-action-bar__cost--dimmed", false);
    return undefined;
  }

  const activeTurn = actor === "helper" ? "enemy" : actor;
  const exhausts = state.result === "playing" && state.activeTurn === activeTurn && fighter.stamina - cost <= 0;
  const label = String(cost);
  const screenOffset = projectPointForWheelAngle(0, CLASSIC_COST_BADGE_SCREEN_OFFSET_Y * buttonScale, wheelRotationAngle);

  setCachedHidden(badge, false);
  setCachedClass(badge, "action-arc__cost--exhausts", exhausts);
  setCachedText(valueElement, label);
  setCachedStyle(badge, "--classic-cost-x", `${formatCssNumber(slot.x + screenOffset.x)}px`);
  setCachedStyle(badge, "--classic-cost-y", `${formatCssNumber(slot.y + screenOffset.y)}px`);
  setCachedStyle(badge, "--classic-cost-counter-rotation", `${formatCssNumber(-wheelRotationAngle)}deg`);
  setCachedClass(badge, "classic-action-bar__cost--dimmed", isDimmed);
  return label;
}

function syncClassicActionDamageBadge(
  badge: HTMLSpanElement,
  actionId: ActionId,
  state: CombatState,
  actor: CombatActor,
  slot: ClassicActionSlot | undefined,
  isVisible: boolean,
  isDimmed: boolean,
  showDamagePreview: boolean,
  wheelRotationAngle: number,
): string | undefined {
  const damage = showDamagePreview ? getActionPreviewDamage(state, actionId, actor) : undefined;

  if (!damage || !slot || !isVisible) {
    setCachedHidden(badge, true);
    setCachedText(badge, "");
    setCachedClass(badge, "classic-action-bar__damage--dimmed", false);
    return undefined;
  }

  const label = String(damage);
  const screenOffset = projectPointForWheelAngle(0, CLASSIC_DAMAGE_BADGE_SCREEN_OFFSET_Y, wheelRotationAngle);

  setCachedHidden(badge, false);
  setCachedText(badge, label);
  setCachedStyle(badge, "--classic-damage-x", `${formatCssNumber(slot.x + screenOffset.x)}px`);
  setCachedStyle(badge, "--classic-damage-y", `${formatCssNumber(slot.y + screenOffset.y)}px`);
  setCachedStyle(badge, "--classic-damage-counter-rotation", `${formatCssNumber(-wheelRotationAngle)}deg`);
  setCachedClass(badge, "classic-action-bar__damage--dimmed", isDimmed);
  return label;
}

function getClassicActionTokenSignature(
  actionId: ActionId,
  tuning: ReturnType<TuningProvider> | undefined,
  buttonScale: number,
  dynamicIconUrl: string | undefined,
): string {
  return [
    actionId,
    dynamicIconUrl ?? "",
    buttonScale,
    tuning?.actionIconScale ?? "",
    tuning?.actionAttackIconScale ?? "",
    tuning?.actionLightIconScale ?? "",
    tuning?.actionLightIconRotation ?? "",
    tuning?.actionLightIconBrightness ?? "",
    tuning?.actionMediumIconScale ?? "",
    tuning?.actionMediumIconRotation ?? "",
    tuning?.actionMediumIconBrightness ?? "",
    tuning?.actionHeavyIconScale ?? "",
    tuning?.actionHeavyIconRotation ?? "",
    tuning?.actionHeavyIconBrightness ?? "",
    tuning?.actionTokenRingWidth ?? "",
    tuning?.actionTokenFaceInset ?? "",
    tuning?.actionTokenRimShine ?? "",
    tuning?.actionTokenOuterShine ?? "",
    tuning?.actionTokenFaceShine ?? "",
    tuning?.actionTokenInnerShine ?? "",
    tuning?.actionTokenStripeShine ?? "",
  ].join("|");
}

function getClassicElementRenderCache(element: HTMLElement): ClassicElementRenderCache {
  const existing = classicElementRenderCache.get(element);

  if (existing) {
    return existing;
  }

  const next: ClassicElementRenderCache = {
    attrs: new Map(),
    classes: new Map(),
    styles: new Map(),
  };

  classicElementRenderCache.set(element, next);
  return next;
}

function setCachedStyle(element: HTMLElement, name: string, value: string): void {
  const cache = getClassicElementRenderCache(element);

  if (cache.styles.get(name) === value) {
    return;
  }

  element.style.setProperty(name, value);
  cache.styles.set(name, value);
}

function setCachedClass(element: HTMLElement, className: string, enabled: boolean): void {
  const cache = getClassicElementRenderCache(element);

  if (cache.classes.get(className) === enabled) {
    return;
  }

  element.classList.toggle(className, enabled);
  cache.classes.set(className, enabled);
}

function setCachedHidden(element: HTMLElement | undefined, hidden: boolean): void {
  if (!element) {
    return;
  }

  const cache = getClassicElementRenderCache(element);

  if (cache.hidden === hidden) {
    return;
  }

  element.hidden = hidden;
  cache.hidden = hidden;
}

function setCachedText(element: HTMLElement | undefined, text: string): void {
  if (!element) {
    return;
  }

  const cache = getClassicElementRenderCache(element);

  if (cache.text === text) {
    return;
  }

  element.textContent = text;
  cache.text = text;
}

function setCachedAttribute(element: HTMLElement, name: string, value: string): void {
  const cache = getClassicElementRenderCache(element);

  if (cache.attrs.get(name) === value) {
    return;
  }

  element.setAttribute(name, value);
  cache.attrs.set(name, value);
}

function setCachedDataset(element: HTMLElement, name: string, value: string): void {
  if (element.dataset[name] === value) {
    return;
  }

  element.dataset[name] = value;
}

function setCachedDisabled(button: HTMLButtonElement, disabled: boolean): void {
  const cache = getClassicElementRenderCache(button);

  if (cache.disabled === disabled) {
    return;
  }

  button.disabled = disabled;
  cache.disabled = disabled;
}

function setCachedTabIndex(element: HTMLElement, tabIndex: number): void {
  const cache = getClassicElementRenderCache(element);

  if (cache.tabIndex === tabIndex) {
    return;
  }

  element.tabIndex = tabIndex;
  cache.tabIndex = tabIndex;
}

function setCachedTitle(element: HTMLElement, title: string): void {
  const cache = getClassicElementRenderCache(element);

  if (cache.title === title) {
    return;
  }

  element.title = title;
  cache.title = title;
}

function projectPointForWheelAngle(x: number, y: number, wheelAngle: number): { x: number; y: number } {
  const radians = (-wheelAngle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function projectSlotForWheelAngle(slot: ClassicActionSlot, wheelAngle: number): ClassicActionSlot {
  const radians = (-wheelAngle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    ...slot,
    x: slot.x * cos - slot.y * sin,
    y: slot.x * sin + slot.y * cos,
    rotation: slot.rotation - wheelAngle,
  };
}

function formatCssNumber(value: number): string {
  return `${Math.round(value * 1000) / 1000}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
