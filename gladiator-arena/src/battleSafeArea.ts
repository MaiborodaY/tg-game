import { GAME_HEIGHT } from "./arenaLayout";

export interface BattleSafeArea {
  bottom: number;
}

const BATTLE_SAFE_GAP_RATIO = 0.18;
const BATTLE_SAFE_MIN_GAP = 24;

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
  const visualClearance = Math.max(BATTLE_SAFE_MIN_GAP, hudRect.height * BATTLE_SAFE_GAP_RATIO);
  const safeBottom = (hudRect.top - battleRect.top - visualClearance) * screenToViewportY;

  return clamp(safeBottom, 0, viewportHeight);
}

function getBattleScreen(root?: HTMLElement | null): HTMLElement | null {
  return root?.closest<HTMLElement>(".battle-screen") ?? document.querySelector<HTMLElement>(".battle-screen");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
