import { DEFAULT_HUD_SAFE_GAP_RATIO, DEFAULT_HUD_SAFE_MIN_GAP, GAME_HEIGHT } from "./arenaLayout";

export interface BattleSafeArea {
  bottom: number;
}

export function getBattleSafeArea(root?: HTMLElement | null, viewportHeight = GAME_HEIGHT): BattleSafeArea {
  return {
    bottom: getBattleSafeBottom(root, viewportHeight),
  };
}

export function getBattleSafeBottom(root?: HTMLElement | null, viewportHeight = GAME_HEIGHT): number {
  if (typeof document === "undefined") {
    return viewportHeight;
  }

  const battleScreen = getBattleScreen(root);
  const hud = battleScreen?.querySelector<HTMLElement>(".arena-fighters-strip");

  if (!battleScreen || !hud) {
    return viewportHeight;
  }

  const battleRect = battleScreen.getBoundingClientRect();
  const hudRect = hud.getBoundingClientRect();

  if (battleRect.height <= 0 || hudRect.height <= 0) {
    return viewportHeight;
  }

  const screenToViewportY = viewportHeight / battleRect.height;
  const styles = typeof window === "undefined" ? undefined : window.getComputedStyle(battleScreen);
  const safeGapRatio = getCssNumber(styles?.getPropertyValue("--hud-safe-gap-ratio") ?? "", DEFAULT_HUD_SAFE_GAP_RATIO);
  const safeMinGap = getCssPixelNumber(styles?.getPropertyValue("--hud-safe-min-gap") ?? "", DEFAULT_HUD_SAFE_MIN_GAP);
  const visualClearance = Math.max(safeMinGap, hudRect.height * safeGapRatio);
  const safeBottom = (hudRect.top - battleRect.top - visualClearance) * screenToViewportY;

  return clamp(safeBottom, 0, viewportHeight);
}

function getBattleScreen(root?: HTMLElement | null): HTMLElement | null {
  return root?.closest<HTMLElement>(".battle-screen") ?? document.querySelector<HTMLElement>(".battle-screen");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getCssNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function getCssPixelNumber(value: string, fallback: number): number {
  return getCssNumber(value, fallback);
}
