import type { ArenaDebugTuning } from "./debugTuning";

type HudTuning = Pick<
  ArenaDebugTuning,
  | "hudEditMode"
  | "hudBottomOffset"
  | "hudSideInset"
  | "hudScale"
  | "hudFlaskGap"
  | "hudNameGap"
  | "hudSafeGapRatio"
  | "hudSafeMinGap"
>;

export function syncHudTuning(root: HTMLElement | null | undefined, tuning: HudTuning): void {
  const battleScreen = getBattleScreen(root);

  if (!battleScreen) {
    return;
  }

  battleScreen.style.setProperty("--hud-bottom-offset", `${tuning.hudBottomOffset}px`);
  battleScreen.style.setProperty("--hud-side-inset", `${tuning.hudSideInset}px`);
  battleScreen.style.setProperty("--hud-scale", `${tuning.hudScale}`);
  battleScreen.style.setProperty("--hud-flask-gap", `${tuning.hudFlaskGap}px`);
  battleScreen.style.setProperty("--hud-name-gap", `${tuning.hudNameGap}px`);
  battleScreen.style.setProperty("--hud-safe-gap-ratio", `${tuning.hudSafeGapRatio}`);
  battleScreen.style.setProperty("--hud-safe-min-gap", `${tuning.hudSafeMinGap}px`);
  battleScreen.classList.toggle("hud-editing", tuning.hudEditMode);
}

function getBattleScreen(root: HTMLElement | null | undefined): HTMLElement | null {
  return root?.closest<HTMLElement>(".battle-screen") ?? document.querySelector<HTMLElement>(".battle-screen");
}
