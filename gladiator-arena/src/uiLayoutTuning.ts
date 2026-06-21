export const UI_LAYOUT_TUNING_STORAGE_KEY = "dust-arena-ui-layout-tuning";
export const UI_LAYOUT_TUNING_STORAGE_VERSION = 1;

export const UI_LAYOUT_VIEWPORTS = ["desktop", "compact"] as const;
export type UiLayoutViewport = (typeof UI_LAYOUT_VIEWPORTS)[number];

export interface UiLayoutControlConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: "px" | "number";
  runtimeCssVar: string;
  cssVars: Record<UiLayoutViewport, string>;
  defaultValues: Record<UiLayoutViewport, number>;
}

export interface UiLayoutBlockConfig {
  id: string;
  label: string;
  targetSelector: string;
  controls: readonly UiLayoutControlConfig[];
}

export interface UiLayoutScreenConfig {
  id: string;
  label: string;
  rootSelector: string;
  blocks: readonly UiLayoutBlockConfig[];
}

export interface UiLayoutTuningState {
  uiLayoutTuningVersion: number;
  selectedScreenId: string;
  selectedBlockId: string;
  selectedViewport: UiLayoutViewport;
  values: Record<string, number>;
}

type UiLayoutTuningListener = () => void;

export const UI_LAYOUT_SCREENS: readonly UiLayoutScreenConfig[] = [
  {
    id: "magicShop",
    label: "Magic shop",
    rootSelector: ".magic-shop.armory-shop--city-mode",
    blocks: [
      {
        id: "screen",
        label: "Screen panel",
        targetSelector: ".magic-shop.armory-shop--city-mode",
        controls: [
          createControl("productsHeight", "Lower panel height", 240, 390, 1, "px", 306, 266, "--shop-city-products-height", "--ui-magic-shop-products-height", "--ui-magic-shop-compact-products-height"),
        ],
      },
      {
        id: "title",
        label: "Title frame",
        targetSelector: ".magic-shop.armory-shop--city-mode",
        controls: [
          createControl("top", "Top", 0, 64, 1, "px", 9, 7, "--magic-shop-title-top", "--ui-magic-shop-title-top", "--ui-magic-shop-compact-title-top"),
          createControl("width", "Width", 180, 360, 1, "px", 300, 260, "--magic-shop-title-width", "--ui-magic-shop-title-width", "--ui-magic-shop-compact-title-width"),
          createControl("height", "Height", 40, 96, 1, "px", 72, 49, "--magic-shop-title-height", "--ui-magic-shop-title-height", "--ui-magic-shop-compact-title-height"),
        ],
      },
      {
        id: "preview",
        label: "Preview card",
        targetSelector: ".magic-shop__preview-card",
        controls: [
          createControl("titleGap", "Gap under title", 0, 64, 1, "px", 10, 19, "--magic-shop-title-preview-gap", "--ui-magic-shop-title-preview-gap", "--ui-magic-shop-compact-title-preview-gap"),
          createControl("bottomGap", "List gap", 0, 80, 1, "px", 24, 18, "--magic-shop-preview-bottom-gap", "--ui-magic-shop-preview-bottom-gap", "--ui-magic-shop-compact-preview-bottom-gap"),
          createControl("width", "Width", 160, 300, 1, "px", 244, 210, "--magic-shop-preview-width", "--ui-magic-shop-preview-width", "--ui-magic-shop-compact-preview-width"),
          createControl("height", "Height", 190, 340, 1, "px", 288, 236, "--magic-shop-preview-height", "--ui-magic-shop-preview-height", "--ui-magic-shop-compact-preview-height"),
          createControl("paddingTop", "Padding top", 24, 80, 1, "px", 50, 39, "--magic-shop-preview-padding-top", "--ui-magic-shop-preview-padding-top", "--ui-magic-shop-compact-preview-padding-top"),
          createControl("paddingX", "Padding X", 10, 44, 1, "px", 26, 22, "--magic-shop-preview-padding-x", "--ui-magic-shop-preview-padding-x", "--ui-magic-shop-compact-preview-padding-x"),
          createControl("paddingBottom", "Padding bottom", 12, 48, 1, "px", 29, 23, "--magic-shop-preview-padding-bottom", "--ui-magic-shop-preview-padding-bottom", "--ui-magic-shop-compact-preview-padding-bottom"),
          createControl("iconSize", "Icon size", 64, 136, 1, "px", 104, 84, "--magic-shop-preview-icon-size", "--ui-magic-shop-preview-icon-size", "--ui-magic-shop-compact-preview-icon-size"),
        ],
      },
      {
        id: "list",
        label: "Scroll list",
        targetSelector: ".magic-shop__list",
        controls: [
          createControl("width", "Width", 260, 430, 1, "px", 390, 372, "--magic-shop-list-width", "--ui-magic-shop-list-width", "--ui-magic-shop-compact-list-width"),
          createControl("rowHeight", "Row height", 30, 60, 1, "px", 44, 38, "--magic-shop-list-row-height", "--ui-magic-shop-list-row-height", "--ui-magic-shop-compact-list-row-height"),
          createControl("visibleRows", "Visible rows", 3, 7, 1, "number", 5, 5, "--magic-shop-list-visible-items", "--ui-magic-shop-list-visible-rows", "--ui-magic-shop-compact-list-visible-rows"),
        ],
      },
      {
        id: "buttons",
        label: "Buttons",
        targetSelector: ".magic-shop__preview-footer, .magic-shop__preview-price, .magic-shop__buy, .magic-shop__list-price",
        controls: [
          createControl("scale", "All scale", 0.75, 1.25, 0.01, "number", 1, 1, "--magic-shop-button-scale", "--ui-magic-shop-button-scale", "--ui-magic-shop-compact-button-scale"),
          createControl("previewGap", "Preview gap", 2, 20, 1, "px", 7, 6, "--magic-shop-preview-footer-gap", "--ui-magic-shop-preview-footer-gap", "--ui-magic-shop-compact-preview-footer-gap"),
          createControl("previewPriceWidth", "Preview price W", 44, 120, 1, "px", 74, 64, "--magic-shop-preview-price-min-width", "--ui-magic-shop-preview-price-min-width", "--ui-magic-shop-compact-preview-price-min-width"),
          createControl("previewPriceHeight", "Preview price H", 20, 44, 1, "px", 30, 26, "--magic-shop-preview-price-height", "--ui-magic-shop-preview-price-height", "--ui-magic-shop-compact-preview-price-height"),
          createControl("previewPriceFont", "Preview price font", 8, 18, 0.5, "px", 13, 11, "--magic-shop-preview-price-font-size", "--ui-magic-shop-preview-price-font-size", "--ui-magic-shop-compact-preview-price-font-size"),
          createControl("previewCoinSize", "Preview coin", 10, 28, 1, "px", 20, 20, "--magic-shop-preview-price-coin-size", "--ui-magic-shop-preview-price-coin-size", "--ui-magic-shop-compact-preview-price-coin-size"),
          createControl("buyWidth", "Buy W", 70, 170, 1, "px", 102, 86, "--magic-shop-buy-min-width", "--ui-magic-shop-buy-min-width", "--ui-magic-shop-compact-buy-min-width"),
          createControl("buyHeight", "Buy H", 24, 56, 1, "px", 34, 30, "--magic-shop-buy-height", "--ui-magic-shop-buy-height", "--ui-magic-shop-compact-buy-height"),
          createControl("buyFont", "Buy font", 8, 18, 0.5, "px", 13, 11, "--magic-shop-buy-font-size", "--ui-magic-shop-buy-font-size", "--ui-magic-shop-compact-buy-font-size"),
          createControl("listPriceWidth", "List price W", 38, 100, 1, "px", 56, 50, "--magic-shop-list-price-min-width", "--ui-magic-shop-list-price-min-width", "--ui-magic-shop-compact-list-price-min-width"),
          createControl("listPriceHeight", "List price H", 18, 42, 1, "px", 27, 24, "--magic-shop-list-price-height", "--ui-magic-shop-list-price-height", "--ui-magic-shop-compact-list-price-height"),
          createControl("listPriceFont", "List price font", 8, 16, 0.5, "px", 11.5, 10.5, "--magic-shop-list-price-font-size", "--ui-magic-shop-list-price-font-size", "--ui-magic-shop-compact-list-price-font-size"),
          createControl("listCoinSize", "List coin", 10, 24, 1, "px", 16, 14, "--magic-shop-list-price-coin-size", "--ui-magic-shop-list-price-coin-size", "--ui-magic-shop-compact-list-price-coin-size"),
        ],
      },
      {
        id: "wallet",
        label: "Wallet",
        targetSelector: ".magic-shop__wallet",
        controls: [
          createControl("marginTop", "Top gap", 0, 24, 1, "px", 5, 4, "--magic-shop-wallet-margin-top", "--ui-magic-shop-wallet-margin-top", "--ui-magic-shop-compact-wallet-margin-top"),
          createControl("minWidth", "Min width", 120, 260, 1, "px", 210, 180, "--magic-shop-wallet-min-width", "--ui-magic-shop-wallet-min-width", "--ui-magic-shop-compact-wallet-min-width"),
          createControl("gap", "Item gap", 2, 20, 1, "px", 8, 8, "--magic-shop-wallet-gap", "--ui-magic-shop-wallet-gap", "--ui-magic-shop-compact-wallet-gap"),
          createControl("height", "Height", 22, 52, 1, "px", 32, 28, "--magic-shop-wallet-height", "--ui-magic-shop-wallet-height", "--ui-magic-shop-compact-wallet-height"),
          createControl("font", "Font", 8, 18, 0.5, "px", 11.5, 11, "--magic-shop-wallet-font-size", "--ui-magic-shop-wallet-font-size", "--ui-magic-shop-compact-wallet-font-size"),
          createControl("iconSize", "Icon size", 10, 28, 1, "px", 15, 15, "--magic-shop-wallet-icon-size", "--ui-magic-shop-wallet-icon-size", "--ui-magic-shop-compact-wallet-icon-size"),
        ],
      },
    ],
  },
] as const;

export const DEFAULT_UI_LAYOUT_TUNING: UiLayoutTuningState = {
  uiLayoutTuningVersion: UI_LAYOUT_TUNING_STORAGE_VERSION,
  selectedScreenId: "magicShop",
  selectedBlockId: "preview",
  selectedViewport: "compact",
  values: {
    "magicShop.list.rowHeight.compact": 51,
    "magicShop.list.rowHeight.desktop": 44,
    "magicShop.list.visibleRows.compact": 6,
    "magicShop.list.visibleRows.desktop": 5,
    "magicShop.list.width.compact": 300,
    "magicShop.list.width.desktop": 390,
    "magicShop.buttons.buyFont.compact": 11,
    "magicShop.buttons.buyFont.desktop": 13,
    "magicShop.buttons.buyHeight.compact": 30,
    "magicShop.buttons.buyHeight.desktop": 34,
    "magicShop.buttons.buyWidth.compact": 86,
    "magicShop.buttons.buyWidth.desktop": 102,
    "magicShop.buttons.listCoinSize.compact": 14,
    "magicShop.buttons.listCoinSize.desktop": 16,
    "magicShop.buttons.listPriceFont.compact": 10.5,
    "magicShop.buttons.listPriceFont.desktop": 11.5,
    "magicShop.buttons.listPriceHeight.compact": 24,
    "magicShop.buttons.listPriceHeight.desktop": 27,
    "magicShop.buttons.listPriceWidth.compact": 50,
    "magicShop.buttons.listPriceWidth.desktop": 56,
    "magicShop.buttons.previewCoinSize.compact": 20,
    "magicShop.buttons.previewCoinSize.desktop": 20,
    "magicShop.buttons.previewGap.compact": 6,
    "magicShop.buttons.previewGap.desktop": 7,
    "magicShop.buttons.previewPriceFont.compact": 11,
    "magicShop.buttons.previewPriceFont.desktop": 13,
    "magicShop.buttons.previewPriceHeight.compact": 26,
    "magicShop.buttons.previewPriceHeight.desktop": 30,
    "magicShop.buttons.previewPriceWidth.compact": 64,
    "magicShop.buttons.previewPriceWidth.desktop": 74,
    "magicShop.buttons.scale.compact": 1,
    "magicShop.buttons.scale.desktop": 1,
    "magicShop.preview.bottomGap.compact": 7,
    "magicShop.preview.bottomGap.desktop": 24,
    "magicShop.preview.height.compact": 300,
    "magicShop.preview.height.desktop": 288,
    "magicShop.preview.iconSize.compact": 95,
    "magicShop.preview.iconSize.desktop": 104,
    "magicShop.preview.paddingBottom.compact": 12,
    "magicShop.preview.paddingBottom.desktop": 29,
    "magicShop.preview.paddingTop.compact": 64,
    "magicShop.preview.paddingTop.desktop": 50,
    "magicShop.preview.paddingX.compact": 15,
    "magicShop.preview.paddingX.desktop": 26,
    "magicShop.preview.titleGap.compact": 19,
    "magicShop.preview.titleGap.desktop": 10,
    "magicShop.preview.width.compact": 200,
    "magicShop.preview.width.desktop": 244,
    "magicShop.screen.productsHeight.compact": 380,
    "magicShop.screen.productsHeight.desktop": 306,
    "magicShop.title.height.compact": 51,
    "magicShop.title.height.desktop": 72,
    "magicShop.title.top.compact": 15,
    "magicShop.title.top.desktop": 9,
    "magicShop.title.width.compact": 240,
    "magicShop.title.width.desktop": 300,
    "magicShop.wallet.marginTop.compact": 4,
    "magicShop.wallet.marginTop.desktop": 5,
    "magicShop.wallet.font.compact": 11,
    "magicShop.wallet.font.desktop": 11.5,
    "magicShop.wallet.gap.compact": 8,
    "magicShop.wallet.gap.desktop": 8,
    "magicShop.wallet.height.compact": 28,
    "magicShop.wallet.height.desktop": 32,
    "magicShop.wallet.iconSize.compact": 15,
    "magicShop.wallet.iconSize.desktop": 15,
    "magicShop.wallet.minWidth.compact": 180,
    "magicShop.wallet.minWidth.desktop": 210,
  },
} as const;

export const uiLayoutTuning: UiLayoutTuningState = loadUiLayoutTuning();

const listeners = new Set<UiLayoutTuningListener>();

export function subscribeUiLayoutTuning(listener: UiLayoutTuningListener): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function getUiLayoutScreen(screenId = uiLayoutTuning.selectedScreenId): UiLayoutScreenConfig {
  return UI_LAYOUT_SCREENS.find((screen) => screen.id === screenId) ?? UI_LAYOUT_SCREENS[0]!;
}

export function getUiLayoutBlock(screenId = uiLayoutTuning.selectedScreenId, blockId = uiLayoutTuning.selectedBlockId): UiLayoutBlockConfig {
  const screen = getUiLayoutScreen(screenId);

  return screen.blocks.find((block) => block.id === blockId) ?? screen.blocks[0]!;
}

export function getUiLayoutStorageKey(screenId: string, blockId: string, controlId: string, viewport: UiLayoutViewport): string {
  return `${screenId}.${blockId}.${controlId}.${viewport}`;
}

export function getUiLayoutControlValue(
  screenId: string,
  blockId: string,
  control: UiLayoutControlConfig,
  viewport: UiLayoutViewport,
  tuning: UiLayoutTuningState = uiLayoutTuning,
): number {
  const key = getUiLayoutStorageKey(screenId, blockId, control.id, viewport);
  const value = tuning.values[key];

  return clampUiLayoutValue(value, control, viewport);
}

export function selectUiLayoutTuning(patch: Partial<Pick<UiLayoutTuningState, "selectedScreenId" | "selectedBlockId" | "selectedViewport">>): void {
  const next = normalizeUiLayoutTuning({ ...uiLayoutTuning, ...patch });

  Object.assign(uiLayoutTuning, next);
  persistUiLayoutTuning();
  notifyUiLayoutTuningChange();
}

export function updateUiLayoutControlValue(screenId: string, blockId: string, control: UiLayoutControlConfig, viewport: UiLayoutViewport, value: number): void {
  const key = getUiLayoutStorageKey(screenId, blockId, control.id, viewport);

  uiLayoutTuning.values[key] = clampUiLayoutValue(value, control, viewport);
  persistUiLayoutTuning();
  notifyUiLayoutTuningChange();
}

export function resetUiLayoutControlValue(screenId: string, blockId: string, control: UiLayoutControlConfig, viewport: UiLayoutViewport): void {
  updateUiLayoutControlValue(screenId, blockId, control, viewport, getDefaultUiLayoutControlValue(screenId, blockId, control.id, viewport));
}

export function resetUiLayoutBlock(screenId: string, blockId: string, viewport: UiLayoutViewport): void {
  const block = getUiLayoutBlock(screenId, blockId);

  block.controls.forEach((control) => {
    uiLayoutTuning.values[getUiLayoutStorageKey(screenId, blockId, control.id, viewport)] = getDefaultUiLayoutControlValue(screenId, blockId, control.id, viewport);
  });
  persistUiLayoutTuning();
  notifyUiLayoutTuningChange();
}

export function resetUiLayoutScreen(screenId: string, viewport: UiLayoutViewport): void {
  const screen = getUiLayoutScreen(screenId);

  screen.blocks.forEach((block) => {
    block.controls.forEach((control) => {
      uiLayoutTuning.values[getUiLayoutStorageKey(screen.id, block.id, control.id, viewport)] = getDefaultUiLayoutControlValue(screen.id, block.id, control.id, viewport);
    });
  });
  persistUiLayoutTuning();
  notifyUiLayoutTuningChange();
}

export function applyUiLayoutTuning(root: ParentNode = document): void {
  for (const screen of UI_LAYOUT_SCREENS) {
    const screenTargets = getUiLayoutTargets(root, screen.rootSelector);

    for (const target of screenTargets) {
      for (const block of screen.blocks) {
        for (const control of block.controls) {
          for (const viewport of UI_LAYOUT_VIEWPORTS) {
            target.style.setProperty(control.cssVars[viewport], formatUiLayoutCssValue(getUiLayoutControlValue(screen.id, block.id, control, viewport), control));
          }
          target.style.removeProperty(control.runtimeCssVar);
        }
      }
    }
  }

  syncUiLayoutTargetHighlight(root);
}

export function syncUiLayoutTargetHighlight(root: ParentNode = document): void {
  getUiLayoutTargets(root, ".ui-layout-tuner__target--selected").forEach((target) => {
    target.classList.remove("ui-layout-tuner__target--selected");
  });

  for (const screen of UI_LAYOUT_SCREENS) {
    getUiLayoutTargets(root, screen.rootSelector).forEach((target) => {
      target.removeAttribute("data-ui-layout-viewport");
    });
  }

  const screen = getUiLayoutScreen();
  const block = getUiLayoutBlock(screen.id);

  getUiLayoutTargets(root, screen.rootSelector).forEach((target) => {
    target.dataset.uiLayoutViewport = uiLayoutTuning.selectedViewport;
  });

  getUiLayoutTargets(root, block.targetSelector).forEach((target) => {
    target.classList.add("ui-layout-tuner__target--selected");
  });
}

export function clearUiLayoutTuningStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(UI_LAYOUT_TUNING_STORAGE_KEY);
}

export function cloneUiLayoutTuningState(tuning: UiLayoutTuningState): UiLayoutTuningState {
  return {
    uiLayoutTuningVersion: UI_LAYOUT_TUNING_STORAGE_VERSION,
    selectedScreenId: tuning.selectedScreenId,
    selectedBlockId: tuning.selectedBlockId,
    selectedViewport: tuning.selectedViewport,
    values: { ...tuning.values },
  };
}

function createControl(
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  unit: UiLayoutControlConfig["unit"],
  desktopDefault: number,
  compactDefault: number,
  runtimeCssVar: string,
  desktopCssVar: string,
  compactCssVar: string,
): UiLayoutControlConfig {
  return {
    id,
    label,
    min,
    max,
    step,
    unit,
    runtimeCssVar,
    cssVars: {
      desktop: desktopCssVar,
      compact: compactCssVar,
    },
    defaultValues: {
      desktop: desktopDefault,
      compact: compactDefault,
    },
  };
}

function getDefaultUiLayoutControlValue(screenId: string, blockId: string, controlId: string, viewport: UiLayoutViewport): number {
  return DEFAULT_UI_LAYOUT_TUNING.values[getUiLayoutStorageKey(screenId, blockId, controlId, viewport)] ?? 0;
}

function normalizeUiLayoutTuning(input: Partial<UiLayoutTuningState>): UiLayoutTuningState {
  const screen = UI_LAYOUT_SCREENS.find((candidate) => candidate.id === input.selectedScreenId) ?? UI_LAYOUT_SCREENS[0]!;
  const block = screen.blocks.find((candidate) => candidate.id === input.selectedBlockId) ?? screen.blocks[0]!;
  const viewport = UI_LAYOUT_VIEWPORTS.includes(input.selectedViewport as UiLayoutViewport) ? input.selectedViewport as UiLayoutViewport : DEFAULT_UI_LAYOUT_TUNING.selectedViewport;
  const values = { ...DEFAULT_UI_LAYOUT_TUNING.values };

  if (input.values && typeof input.values === "object") {
    for (const [key, value] of Object.entries(input.values)) {
      if (typeof value === "number" && Number.isFinite(value) && key in values) {
        values[key] = value;
      }
    }
  }

  return {
    uiLayoutTuningVersion: UI_LAYOUT_TUNING_STORAGE_VERSION,
    selectedScreenId: screen.id,
    selectedBlockId: block.id,
    selectedViewport: viewport,
    values,
  };
}

function loadUiLayoutTuning(): UiLayoutTuningState {
  if (typeof window === "undefined") {
    return cloneUiLayoutTuningState(DEFAULT_UI_LAYOUT_TUNING);
  }

  const raw = window.localStorage.getItem(UI_LAYOUT_TUNING_STORAGE_KEY);

  if (!raw) {
    return cloneUiLayoutTuningState(DEFAULT_UI_LAYOUT_TUNING);
  }

  try {
    return normalizeUiLayoutTuning(JSON.parse(raw) as Partial<UiLayoutTuningState>);
  } catch {
    return cloneUiLayoutTuningState(DEFAULT_UI_LAYOUT_TUNING);
  }
}

function persistUiLayoutTuning(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(UI_LAYOUT_TUNING_STORAGE_KEY, JSON.stringify(uiLayoutTuning));
}

function notifyUiLayoutTuningChange(): void {
  applyUiLayoutTuning();
  listeners.forEach((listener) => listener());

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("arena-ui-layout-tuning-change"));
  }
}

function clampUiLayoutValue(value: unknown, control: UiLayoutControlConfig, viewport: UiLayoutViewport): number {
  const fallback = control.defaultValues[viewport];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(control.min, Math.min(control.max, value));
}

function formatUiLayoutCssValue(value: number, control: UiLayoutControlConfig): string {
  return control.unit === "px" ? `${value}px` : `${value}`;
}

function getUiLayoutTargets(root: ParentNode, selector: string): HTMLElement[] {
  const targets: HTMLElement[] = [];

  if (root instanceof HTMLElement && root.matches(selector)) {
    targets.push(root);
  }

  root.querySelectorAll<HTMLElement>(selector).forEach((target) => targets.push(target));

  return targets;
}
