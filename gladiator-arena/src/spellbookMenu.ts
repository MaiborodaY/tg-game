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
  type CombatState,
} from "./combat";

export const SPELLBOOK_BUTTON_ACTION_ID: ActionId = "scroll";
export const SPELLBOOK_ACTION_IDS = ["scroll", "fireball", "ward", "preciseStrike", "doubleStrike", "poison"] as const;

export type SpellbookActionId = (typeof SPELLBOOK_ACTION_IDS)[number];

export interface SpellbookEntry {
  actionId: SpellbookActionId;
  title: string;
  detail: string;
  count: number;
  cost: number;
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
type SpellbookActionHandler = (actionId: SpellbookActionId) => void;

export function isSpellbookButtonAction(actionId: ActionId): boolean {
  return actionId === SPELLBOOK_BUTTON_ACTION_ID;
}

export function shouldShowSpellbookButton(state: CombatState): boolean {
  return getFighterSpellbookScrollCount(state.player) > 0;
}

export function shouldEnableSpellbookButton(state: CombatState): boolean {
  return shouldShowSpellbookButton(state) && state.result === "playing" && state.activeTurn === "player";
}

export function getSpellbookButtonTitle(): string {
  return "Spellbook";
}

export function getSpellbookButtonDetail(): string {
  return "Choose scroll";
}

export function getSpellbookEntries(state: CombatState): SpellbookEntry[] {
  return SPELLBOOK_ACTION_IDS.map((actionId) => {
    const cost = getActionStaminaCost(actionId, state.player);
    const disabled = !canUseAction(state, actionId, "player");

    return {
      actionId,
      title: getActionTitle(actionId, state.player),
      detail: actions[actionId].detail,
      count: getSpellbookActionCount(state, actionId),
      cost,
      disabled,
      disabledReason: disabled ? getSpellbookDisabledReason(state, actionId, cost) : undefined,
    };
  }).filter((entry) => entry.count > 0);
}

export function createSpellbookMenu(
  host: HTMLElement,
  getState: CombatStateProvider,
  onAction: SpellbookActionHandler,
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

    renderEntries(state);

    if (!shouldShowSpellbookButton(state)) {
      close();
      return;
    }

    if (!root.hidden && anchorElement) {
      placeMenu(anchorElement);
    }
  }

  function toggle(anchor: HTMLElement): void {
    const state = getState();

    if (!state || !shouldShowSpellbookButton(state)) {
      close();
      return;
    }

    if (!root.hidden && anchorElement === anchor) {
      close();
      return;
    }

    anchorElement = anchor;
    renderEntries(state);
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

  function renderEntries(state: CombatState): void {
    const entries = getSpellbookEntries(state);

    list.replaceChildren(...entries.map((entry) => createEntryButton(entry)));
    root.classList.toggle("spellbook-menu--empty", entries.length <= 0);
  }

  function createEntryButton(entry: SpellbookEntry): HTMLButtonElement {
    const button = document.createElement("button");
    const copy = document.createElement("span");
    const title = document.createElement("span");
    const detail = document.createElement("span");
    const meta = document.createElement("span");

    button.type = "button";
    button.className = "spellbook-menu__item";
    button.disabled = entry.disabled;
    button.dataset.action = entry.actionId;
    copy.className = "spellbook-menu__copy";
    title.className = "spellbook-menu__item-title";
    title.textContent = entry.title;
    detail.className = "spellbook-menu__item-detail";
    detail.textContent = entry.disabledReason ?? entry.detail;
    meta.className = "spellbook-menu__item-meta";
    meta.textContent = entry.cost > 0 ? `x${entry.count} / ${entry.cost}` : `x${entry.count}`;
    copy.append(title, detail);
    button.append(copy, meta);
    button.addEventListener("click", () => {
      const state = getState();
      const freshEntry = state ? getSpellbookEntries(state).find((candidate) => candidate.actionId === entry.actionId) : undefined;

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

  function placeMenu(anchor: HTMLElement): void {
    const hostRect = host.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = root.getBoundingClientRect();
    const hostWidth = getPositiveDimension(hostRect.width, window.innerWidth);
    const hostHeight = getPositiveDimension(hostRect.height, window.innerHeight);
    const menuWidth = getPositiveDimension(menuRect.width, 190);
    const menuHeight = getPositiveDimension(menuRect.height, 150);
    const anchorCenterX = anchorRect.left - hostRect.left + anchorRect.width / 2;
    const anchorTop = anchorRect.top - hostRect.top;
    const anchorBottom = anchorRect.bottom - hostRect.top;
    const left = clamp(anchorCenterX - menuWidth / 2, 8, Math.max(8, hostWidth - menuWidth - 8));
    const topAbove = anchorTop - menuHeight - 14;
    const topBelow = anchorBottom + 14;
    const top = topAbove >= 8 ? topAbove : clamp(topBelow, 8, Math.max(8, hostHeight - menuHeight - 8));

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

function getSpellbookActionCount(state: CombatState, actionId: SpellbookActionId): number {
  if (actionId === "scroll") {
    return getFighterScrollCount(state.player);
  }

  if (actionId === "fireball") {
    return getFighterFireballScrollCount(state.player);
  }

  if (actionId === "preciseStrike") {
    return getFighterPreciseStrikeScrollCount(state.player);
  }

  if (actionId === "doubleStrike") {
    return getFighterDoubleStrikeScrollCount(state.player);
  }

  if (actionId === "poison") {
    return getFighterPoisonScrollCount(state.player);
  }

  return getFighterWardScrollCount(state.player);
}

function getSpellbookDisabledReason(state: CombatState, actionId: SpellbookActionId, cost: number): string {
  if (state.result !== "playing") {
    return "Battle ended";
  }

  if (state.activeTurn !== "player") {
    return "Not your turn";
  }

  if (state.player.stamina < cost) {
    return "Need stamina";
  }

  if (actionId === "scroll") {
    return "No armor target";
  }

  if (actionId === "ward" && getFighterWardHits(state.player) > 0) {
    return "Ward active";
  }

  if (actionId === "preciseStrike" && getFighterPreciseStrikeHits(state.player) > 0) {
    return "Strike ready";
  }

  if (actionId === "doubleStrike" && getFighterDoubleStrikeHits(state.player) > 0) {
    return "Double ready";
  }

  return "Unavailable";
}

function getPositiveDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
