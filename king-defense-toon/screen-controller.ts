export type GameScreen = 'campaign' | 'dungeons' | 'dungeon-intro' | 'dungeon-battle';

export interface ScreenController {
  readonly active: GameScreen;
  show(screen: GameScreen): void;
}

/** Owns covering-screen visibility only; simulation, saving and modals have separate lifecycles. */
export function createScreenController({ app, dungeons, intro, background, onChange }: {
  app: HTMLElement;
  dungeons: HTMLElement;
  intro?: HTMLElement;
  background: readonly HTMLElement[];
  onChange: (screen: GameScreen) => void;
}): ScreenController {
  let active: GameScreen = 'campaign';
  const previousInert = new Map<HTMLElement, boolean>();
  app.dataset.screen = active;
  return {
    get active() { return active; },
    show(screen) {
      if (screen === active) return;
      active = screen;
      app.dataset.screen = screen;
      dungeons.hidden = screen !== 'dungeons';
      if (intro) intro.hidden = screen !== 'dungeon-intro';
      if (screen === 'dungeons' || screen === 'dungeon-intro') {
        for (const element of background) {
          if (!previousInert.has(element)) previousInert.set(element, element.inert);
          element.inert = true;
        }
      } else {
        for (const [element, inert] of previousInert) element.inert = inert;
        previousInert.clear();
      }
      onChange(screen);
    },
  };
}
