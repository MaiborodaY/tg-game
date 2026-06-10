import { DEFAULT_CLASSIC_HUD_SAFE_OFFSET, DEFAULT_HUD_SAFE_GAP_RATIO, DEFAULT_HUD_SAFE_MIN_GAP, GAME_HEIGHT } from "./arenaLayout";

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

  if (!battleScreen) {
    return viewportHeight;
  }

  const battleRect = battleScreen.getBoundingClientRect();
  const hud = getActiveBottomHud(battleScreen);

  if (!hud || battleRect.height <= 0 || hud.rect.height <= 0) {
    return viewportHeight;
  }

  const screenToViewportY = viewportHeight / battleRect.height;
  const styles = typeof window === "undefined" ? undefined : window.getComputedStyle(battleScreen);
  const safeGapRatio = getCssNumber(styles?.getPropertyValue("--hud-safe-gap-ratio") ?? "", DEFAULT_HUD_SAFE_GAP_RATIO);
  const safeMinGap = getCssPixelNumber(styles?.getPropertyValue("--hud-safe-min-gap") ?? "", DEFAULT_HUD_SAFE_MIN_GAP);
  const classicSafeOffset = hud.isClassic
    ? getCssPixelNumber(styles?.getPropertyValue("--classic-hud-safe-offset") ?? "", DEFAULT_CLASSIC_HUD_SAFE_OFFSET)
    : 0;
  const visualClearance = Math.max(safeMinGap, hud.rect.height * safeGapRatio);
  const safeBottom = (hud.rect.top + classicSafeOffset - battleRect.top - visualClearance) * screenToViewportY;

  return clamp(safeBottom, 0, viewportHeight);
}

function getBattleScreen(root?: HTMLElement | null): HTMLElement | null {
  return root?.closest<HTMLElement>(".battle-screen") ?? document.querySelector<HTMLElement>(".battle-screen");
}

interface ActiveBottomHud {
  rect: Pick<DOMRect, "top" | "height">;
  isClassic: boolean;
}

function getActiveBottomHud(battleScreen: HTMLElement): ActiveBottomHud | undefined {
  for (const hud of getBottomHudCandidates(battleScreen)) {
    const rect = hud.element.getBoundingClientRect();

    if (rect.height > 0) {
      return { rect, isClassic: hud.isClassic };
    }
  }

  return undefined;
}

interface BottomHudCandidate {
  element: HTMLElement;
  isClassic: boolean;
}

function getBottomHudCandidates(battleScreen: HTMLElement): BottomHudCandidate[] {
  const standardHud = battleScreen.querySelector<HTMLElement>(".arena-fighters-strip");
  const classicHud = battleScreen.querySelector<HTMLElement>(".classic-action-bar");
  const isClassicHud = typeof document !== "undefined" && document.body?.classList.contains("arena-hud-classic");
  const classicCandidate = classicHud ? { element: classicHud, isClassic: true } : undefined;
  const standardCandidate = standardHud ? { element: standardHud, isClassic: false } : undefined;
  const candidates = isClassicHud ? [classicCandidate, standardCandidate] : [standardCandidate, classicCandidate];

  return candidates.filter(isBottomHudCandidate);
}

function isBottomHudCandidate(value: BottomHudCandidate | undefined): value is BottomHudCandidate {
  return Boolean(value);
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
