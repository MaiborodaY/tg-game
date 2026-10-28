export type OnboardingStep = 'market' | 'place' | 'start';

export function restoreOnboardingCompleted(saved: Record<string, unknown> | null): boolean {
  if (!saved) return false;
  // Only new campaigns opt in. Existing players must not repeat first-time guidance.
  return saved.onboardingCompleted !== false || Number(saved.clearedWaves) > 0;
}

export function getOnboardingStep(state: {
  completed: boolean;
  inBattle: boolean;
  received: number;
  slaves: number;
  army: number;
  reserve: number;
  hasEmptyCell: boolean;
}): OnboardingStep | null {
  if (state.completed || state.inBattle) return null;
  if (state.slaves > 0 && state.received < 3) return 'market';
  if (state.reserve > 0 && state.hasEmptyCell) return 'place';
  // Connecting or selling a starter should not leave an impossible three-unit step.
  if (state.army > 0) return 'start';
  if (state.slaves > 0) return 'market';
  return null;
}
