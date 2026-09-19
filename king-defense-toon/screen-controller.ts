export type GameScreen = 'campaign' | 'dungeons' | 'dungeon-battle';

export interface ScreenController {
  readonly active: GameScreen;
  show(screen: GameScreen): void;
}

/** Owns covering-screen visibility only; simulation, saving and modals have separate lifecycles. */
export function createScreenController({ app, dungeons, background, onChange }: {
  app: HTMLElement;
  dungeons: HTMLElement;
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
      if (screen === 'dungeons') {
        for (const element of background) {
          previousInert.set(element, element.inert);
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
