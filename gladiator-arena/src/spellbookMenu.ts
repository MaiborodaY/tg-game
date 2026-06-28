import {
  actions,
  canUseAction,
  getActionStaminaCost,
  getActionTitle,
  getFighterDoubleStrikeHits,
  getFighterDoubleStrikeScrollCount,
  getFighterFireballScrollCount,
  getFighterPoisonScrollCount,
  getFighterPreciseStrikeHits,
  getFighterPreciseStrikeScrollCount,
  getFighterScrollCount,
  getFighterSpellbookScrollCount,
  getFighterWardHits,
  getFighterWardScrollCount,
  type ActionId,
  type CombatActor,
  type CombatState,
  type FighterState,
} from "./combat";
import { SHOP_CATEGORY_SCROLL_ICON_ASSET_URL } from "./assets";
import { getShopProductIconUrl } from "./shopItemIcons";
import { getFighterSpellbookScrollEffectText } from "./scrollEffectText";
import type { HeroItemId } from "./hero";

export const SPELLBOOK_BUTTON_ACTION_ID: ActionId = "scroll";
export const SPELLBOOK_ACTION_IDS = ["scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison"] as const;

export type SpellbookActionId = (typeof SPELLBOOK_ACTION_IDS)[number];

export interface SpellbookEntry {
  actionId: SpellbookActionId;
  title: string;
  detail: string;
  count: number;
  iconUrl: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface SpellbookMenuApi {
  close: () => void;
  destroy: () => void;
  isOpen: () => boolean;
  sync: () => void;
  toggle: (anchor: HTMLElement) => void;
}

type CombatStateProvider = () => CombatState | undefined;
type CombatActorProvider = () => CombatActor;
type SpellbookActionHandler = (actionId: SpellbookActionId) => void;

export function isSpellbookButtonAction(actionId: ActionId): boolean {
  return actionId === SPELLBOOK_BUTTON_ACTION_ID;
}

export function shouldShowSpellbookButton(state: CombatState, actor: CombatActor = "player"): boolean {
  const fighter = getSpellbookActorFighter(state, actor);

  return Boolean(fighter && getFighterSpellbookScrollCount(fighter) > 0);
}

export function shouldEnableSpellbookButton(state: CombatState, actor: CombatActor = "player"): boolean {
  return shouldShowSpellbookButton(state, actor)
    && state.result === "playing"
    && state.activeTurn === getSpellbookActorActiveTurn(actor);
}

export function getSpellbookButtonTitle(): string {
  return "Spellbook";
}

export function getSpellbookButtonDetail(): string {
  return "Choose scroll";
}

export function getSpellbookEntries(state: CombatState, actor: CombatActor = "player"): SpellbookEntry[] {
  const fighter = getSpellbookActorFighter(state, actor);

  if (!fighter) {
    return [];
  }

  return SPELLBOOK_ACTION_IDS.map((actionId) => {
    const cost = getActionStaminaCost(actionId, fighter);
    const disabled = !canUseAction(state, actionId, actor);

    return {
      actionId,
      title: getActionTitle(actionId, fighter),
      detail: getFighterSpellbookScrollEffectText(fighter, actionId, actions[actionId].detail),
      count: getSpellbookActionCount(fighter, actionId),
      iconUrl: getSpellbookActionIconUrl(fighter, actionId),
      disabled,
      disabledReason: disabled ? getSpellbookDisabledReason(state, actor, actionId, cost) : undefined,
    };
  }).filter((entry) => entry.count > 0);
}

export function createSpellbookMenu(
  host: HTMLElement,
  getState: CombatStateProvider,
  onAction: SpellbookActionHandler,
  getActor: CombatActorProvider = () => "player",
): SpellbookMenuApi {
  const root = document.createElement("div");
  const title = document.createElement("div");
  const list = document.createElement("div");
  let anchorElement: HTMLElement | undefined;

  root.className = "spellbook-menu";
  root.hidden = true;
  root.setAttribute("role", "menu");
  root.setAttribute("aria-label", "Spellbook");
  title.className = "spellbook-menu__title";
  title.textContent = "Spellbook";
  list.className = "spellbook-menu__list";
  root.append(title, list);
  host.append(root);

  function sync(): void {
    const state = getState();

    if (!state) {
      close();
      return;
    }

    const actor = getActor();

    renderEntries(state, actor);

    if (!shouldShowSpellbookButton(state, actor)) {
      close();
      return;
    }

    if (!root.hidden && anchorElement) {
      placeMenu(anchorElement);
    }
  }

  function toggle(anchor: HTMLElement): void {
    const state = getState();
    const actor = getActor();

    if (!state || !shouldShowSpellbookButton(state, actor)) {
      close();
      return;
    }

    if (!root.hidden && anchorElement === anchor) {
      close();
      return;
    }

    anchorElement = anchor;
    renderEntries(state, actor);
    root.hidden = false;
    root.style.visibility = "hidden";
    placeMenu(anchor);
    root.style.visibility = "";
    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
  }

  function close(): void {
    root.hidden = true;
    anchorElement = undefined;
    document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  }

  function destroy(): void {
    close();
    root.remove();
  }

  function isOpen(): boolean {
    return !root.hidden;
  }

  function handleDocumentPointerDown(event: PointerEvent): void {
    const target = event.target;

    if (target instanceof Node && (root.contains(target) || anchorElement?.contains(target))) {
      return;
    }

    close();
  }

  function renderEntries(state: CombatState, actor: CombatActor): void {
    const entries = getSpellbookEntries(state, actor);

    list.replaceChildren(...entries.map((entry) => createEntryButton(entry)));
    root.setAttribute("aria-label", entries.length > 0 ? `Spellbook, ${entries.length} scrolls available` : "Spellbook");
    root.classList.toggle("spellbook-menu--empty", entries.length <= 0);
  }

  function createEntryButton(entry: SpellbookEntry): HTMLButtonElement {
    const button = document.createElement("button");
    const iconFrame = document.createElement("span");
    const icon = document.createElement("img");
    const copy = document.createElement("span");
    const title = document.createElement("span");
    const detail = document.createElement("span");
    const meta = document.createElement("span");

    button.type = "button";
    button.className = "spellbook-menu__item";
    button.disabled = entry.disabled;
    button.dataset.action = entry.actionId;
    button.setAttribute("aria-label", `${entry.title}. ${entry.disabledReason ?? entry.detail}. ${entry.count} available.`);
    iconFrame.className = "spellbook-menu__icon-frame";
    icon.className = "spellbook-menu__icon";
    icon.src = entry.iconUrl;
    icon.alt = "";
    icon.decoding = "async";
    icon.draggable = false;
    copy.className = "spellbook-menu__copy";
    title.className = "spellbook-menu__item-title";
    title.textContent = entry.title;
    detail.className = "spellbook-menu__item-detail";
    detail.textContent = entry.disabledReason ?? entry.detail;
    meta.className = "spellbook-menu__item-meta";
    meta.textContent = `x${entry.count}`;
    iconFrame.append(icon);
    copy.append(title, detail);
    button.append(iconFrame, copy, meta);
    button.addEventListener("click", () => {
      const state = getState();
      const freshEntry = state ? getSpellbookEntries(state, getActor()).find((candidate) => candidate.actionId === entry.actionId) : undefined;

      if (!freshEntry || freshEntry.disabled) {
        sync();
        return;
      }

      close();
      root.dispatchEvent(new CustomEvent("arena-action-click", { bubbles: true, detail: { actionId: entry.actionId, disabled: false } }));
      onAction(entry.actionId);
    });

    return button;
  }

  function placeMenu(_anchor: HTMLElement): void {
    const hostRect = host.getBoundingClientRect();
    const menuRect = root.getBoundingClientRect();
    const hostWidth = getPositiveDimension(hostRect.width, window.innerWidth);
    const hostHeight = getPositiveDimension(hostRect.height, window.innerHeight);
    const menuWidth = getPositiveDimension(menuRect.width, 286);
    const menuHeight = getPositiveDimension(menuRect.height, 300);
    const left = clamp(hostWidth / 2 - menuWidth / 2, 8, Math.max(8, hostWidth - menuWidth - 8));
    const top = clamp(hostHeight / 2 - menuHeight / 2, 8, Math.max(8, hostHeight - menuHeight - 8));

    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
  }

  return {
    close,
    destroy,
    isOpen,
    sync,
    toggle,
  };
}

function getSpellbookActionIconUrl(fighter: FighterState, actionId: SpellbookActionId): string {
  const itemId = getSpellbookActionItemId(fighter, actionId);

  return (itemId ? getShopProductIconUrl([itemId]) : undefined) ?? SHOP_CATEGORY_SCROLL_ICON_ASSET_URL;
}

function getSpellbookActionItemId(fighter: FighterState, actionId: SpellbookActionId): HeroItemId | undefined {
  if (actionId === "scroll") {
    return fighter.scrollItemId;
  }

  if (actionId === "fireball") {
    return fighter.fireballScrollItemId;
  }

  if (actionId === "preciseStrike") {
    return fighter.preciseStrikeScrollItemId;
  }

  if (actionId === "doubleStrike") {
    return fighter.doubleStrikeScrollItemId;
  }

  if (actionId === "poison") {
    return fighter.poisonScrollItemId;
  }

  return fighter.wardScrollItemId;
}

function getSpellbookActionCount(fighter: FighterState, actionId: SpellbookActionId): number {
  if (actionId === "scroll") {
    return getFighterScrollCount(fighter);
  }

  if (actionId === "fireball") {
    return getFighterFireballScrollCount(fighter);
  }

  if (actionId === "preciseStrike") {
    return getFighterPreciseStrikeScrollCount(fighter);
  }

  if (actionId === "doubleStrike") {
    return getFighterDoubleStrikeScrollCount(fighter);
  }

  if (actionId === "poison") {
    return getFighterPoisonScrollCount(fighter);
  }

  return getFighterWardScrollCount(fighter);
}

function getSpellbookDisabledReason(state: CombatState, actor: CombatActor, actionId: SpellbookActionId, cost: number): string {
  const fighter = getSpellbookActorFighter(state, actor);

  if (!fighter) {
    return "Unavailable";
  }

  if (state.result !== "playing") {
    return "Battle ended";
  }

  if (state.activeTurn !== getSpellbookActorActiveTurn(actor)) {
    return "Not your turn";
  }

  if (fighter.stamina < cost) {
    return "Need stamina";
  }

  if (actionId === "scroll") {
    return "No armor target";
  }

  if (actionId === "ward" && getFighterWardHits(fighter) > 0) {
    return "Ward active";
  }

  if (actionId === "preciseStrike" && getFighterPreciseStrikeHits(fighter) > 0) {
    return "Strike ready";
  }

  if (actionId === "doubleStrike" && getFighterDoubleStrikeHits(fighter) > 0) {
    return "Double ready";
  }

  return "Unavailable";
}

function getSpellbookActorFighter(state: CombatState, actor: CombatActor): FighterState | undefined {
  if (actor === "helper") {
    return state.helper;
  }

  return actor === "enemy" ? state.enemy : state.player;
}

function getSpellbookActorActiveTurn(actor: CombatActor): "player" | "enemy" {
  return actor === "helper" ? "enemy" : actor;
}

function getPositiveDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
