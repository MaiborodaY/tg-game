import type { PlayerProfileSnapshot } from "./profile.ts";
import type { SimulationPhase } from "./simulation.ts";
import type { CampaignState } from "./types.ts";

export const TUTORIAL_COMPLETION_STORAGE_KEY = "td-onboarding-v1";

export type TutorialStep = "choose_tower" | "place_tower" | "start_wave" | "done";

export type TutorialState = Readonly<{
  step: TutorialStep;
}>;

export type TutorialUiSnapshot = Readonly<{
  campaign: Pick<CampaignState, "completedWave" | "totalKills" | "activeDurationMs" | "towers">;
  phase: SimulationPhase;
}>;

export type TutorialInitialContext = TutorialUiSnapshot & Readonly<{
  profile: Pick<PlayerProfileSnapshot, "bestResults"> | null;
  tutorialCompleted: boolean;
}>;

export type TutorialEvent =
  | Readonly<{ type: "tower_selected" }>
  | Readonly<{ type: "ui_changed"; snapshot: TutorialUiSnapshot }>
  | Readonly<{ type: "skip" }>;

const DONE_STATE: TutorialState = Object.freeze({ step: "done" });
const CHOOSE_TOWER_STATE: TutorialState = Object.freeze({ step: "choose_tower" });
const PLACE_TOWER_STATE: TutorialState = Object.freeze({ step: "place_tower" });
const START_WAVE_STATE: TutorialState = Object.freeze({ step: "start_wave" });

export function createTutorialState(context: TutorialInitialContext): TutorialState {
  if (
    context.tutorialCompleted
    || hasPreviousResult(context.profile)
    || runHasStarted(context)
  ) return DONE_STATE;

  return context.campaign.towers.length > 0 ? START_WAVE_STATE : CHOOSE_TOWER_STATE;
}

export function reduceTutorial(state: TutorialState, event: TutorialEvent): TutorialState {
  if (state.step === "done") return state;
  if (event.type === "skip") return DONE_STATE;
  if (event.type === "tower_selected") {
    return state.step === "choose_tower" ? PLACE_TOWER_STATE : state;
  }
  if (runHasStarted(event.snapshot)) return DONE_STATE;
  if (event.snapshot.campaign.towers.length > 0) return START_WAVE_STATE;
  return state;
}

export function isTutorialDone(state: TutorialState): boolean {
  return state.step === "done";
}

function hasPreviousResult(profile: TutorialInitialContext["profile"]): boolean {
  return Boolean(profile?.bestResults.length);
}

function runHasStarted(snapshot: TutorialUiSnapshot): boolean {
  return snapshot.phase !== "setup"
    || snapshot.campaign.completedWave > 0
    || snapshot.campaign.totalKills > 0
    || snapshot.campaign.activeDurationMs > 0;
}
