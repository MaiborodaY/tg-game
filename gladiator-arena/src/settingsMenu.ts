export type PlayerRenderFps = 30 | 60;
export type PlayerShadowMode = "high" | "low" | "off";
export type PlayerHudMode = "immersive" | "classic";
export const DEFAULT_PLAYER_HUD_MODE: PlayerHudMode = "classic";

export interface PlayerSettings {
  lowEffects: boolean;
  statBarAnimations: boolean;
  smoothRendering: boolean;
  renderFps: PlayerRenderFps;
  vfxEnabled: boolean;
  shadowMode: PlayerShadowMode;
  hudMode: PlayerHudMode;
  showFps: boolean;
}

const storageKey = "dust-arena-player-settings";
const settingsChangedEvent = "dust-arena-player-settings-change";
const fpsUpdateIntervalMs = 500;
const hudModeDefaultVersion = 2;
const defaultSettings: PlayerSettings = {
  lowEffects: false,
  statBarAnimations: false,
  smoothRendering: true,
  renderFps: 30,
  vfxEnabled: true,
  shadowMode: "low",
  hudMode: DEFAULT_PLAYER_HUD_MODE,
  showFps: false,
};
let cachedSettings: PlayerSettings | undefined;
let fpsFrameId: number | undefined;
let fpsCounterElement: HTMLElement | undefined;
let fpsFrameCount = 0;
let fpsLastTime = 0;

export function mountSettingsMenu(root: ParentNode = document): void {
  const fpsCounter = root.querySelector<HTMLElement>("[data-fps-counter]");
  const menus = Array.from(root.querySelectorAll<HTMLElement>("[data-settings-menu]")).flatMap(createSettingsMenuRefs);

  if (!fpsCounter || menus.length <= 0) {
    return;
  }

  const syncControls = () => {
    const settings = getPlayerSettings();

    menus.forEach((menu) => syncSettingsMenuControls(menu, settings));
    syncFpsCounter(fpsCounter, settings.showFps);
  };

  applySettings(getPlayerSettings());
  syncControls();

  menus.forEach((menu) => {
    menu.root.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    menu.button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeSettingsMenus(menus, menu);
      setMenuOpen(menu.button, menu.panel, menu.panel.hidden !== false);
    });

    menu.lowEffects.addEventListener("change", () => {
      updateSettings({ lowEffects: menu.lowEffects.checked });
      syncControls();
    });

    menu.statBarAnimations.addEventListener("change", () => {
      updateSettings({ statBarAnimations: menu.statBarAnimations.checked });
      syncControls();
    });

    menu.smoothRendering.addEventListener("change", () => {
      const currentSettings = getPlayerSettings();
      const nextSmoothRendering = menu.smoothRendering.checked;

      if (currentSettings.smoothRendering === nextSmoothRendering) {
        return;
      }

      if (!confirmSmoothRenderingReload(nextSmoothRendering)) {
        syncControls();
        return;
      }

      updateSettings({ smoothRendering: nextSmoothRendering });
      window.location.reload();
    });

    menu.vfx.addEventListener("change", () => {
      updateSettings({ vfxEnabled: menu.vfx.checked });
      syncControls();
    });

    menu.fps.addEventListener("change", () => {
      updateSettings({ showFps: menu.fps.checked });
      syncControls();
    });

    menu.renderFpsInputs.forEach((input) => {
      input.addEventListener("change", () => {
        const nextRenderFps = parsePlayerRenderFps(input.value);

        if (!input.checked || !nextRenderFps) {
          return;
        }

        const currentSettings = getPlayerSettings();

        if (currentSettings.renderFps === nextRenderFps) {
          return;
        }

        if (!confirmRenderFpsReload(nextRenderFps)) {
          syncControls();
          return;
        }

        updateSettings({ renderFps: nextRenderFps });
        window.location.reload();
      });
    });

    menu.shadowModeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked || !isPlayerShadowMode(input.value)) {
          return;
        }

        updateSettings({ shadowMode: input.value });
        syncControls();
      });
    });

    menu.hudModeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked || !isPlayerHudMode(input.value)) {
          return;
        }

        updateSettings({ hudMode: input.value });
        syncControls();
      });
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Node)) {
      return;
    }

    menus.forEach((menu) => {
      if (!menu.panel.hidden && !menu.root.contains(event.target as Node)) {
        setMenuOpen(menu.button, menu.panel, false);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSettingsMenus(menus);
    }
  });
}

export function getPlayerSettings(): PlayerSettings {
  cachedSettings ??= loadSettings();

  return cachedSettings;
}

export function subscribePlayerSettings(listener: () => void): () => void {
  window.addEventListener(settingsChangedEvent, listener);

  return () => window.removeEventListener(settingsChangedEvent, listener);
}

function setMenuOpen(button: HTMLButtonElement, panel: HTMLElement, open: boolean): void {
  panel.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

interface SettingsMenuRefs {
  root: HTMLElement;
  button: HTMLButtonElement;
  panel: HTMLElement;
  lowEffects: HTMLInputElement;
  statBarAnimations: HTMLInputElement;
  smoothRendering: HTMLInputElement;
  vfx: HTMLInputElement;
  fps: HTMLInputElement;
  renderFpsInputs: HTMLInputElement[];
  shadowModeInputs: HTMLInputElement[];
  hudModeInputs: HTMLInputElement[];
}

function createSettingsMenuRefs(root: HTMLElement): SettingsMenuRefs[] {
  const button = root.querySelector<HTMLButtonElement>("[data-settings-button]");
  const panel = root.querySelector<HTMLElement>("[data-settings-panel]");
  const lowEffects = root.querySelector<HTMLInputElement>("[data-setting-low-effects]");
  const statBarAnimations = root.querySelector<HTMLInputElement>("[data-setting-stat-bar-animations]");
  const smoothRendering = root.querySelector<HTMLInputElement>("[data-setting-smooth-rendering]");
  const vfx = root.querySelector<HTMLInputElement>("[data-setting-vfx]");
  const fps = root.querySelector<HTMLInputElement>("[data-setting-fps]");
  const renderFpsInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-setting-render-fps]"));
  const shadowModeInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-setting-shadow-mode]"));
  const hudModeInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-setting-hud-mode]"));

  if (
    !button ||
    !panel ||
    !lowEffects ||
    !statBarAnimations ||
    !smoothRendering ||
    !vfx ||
    !fps ||
    renderFpsInputs.length === 0 ||
    shadowModeInputs.length === 0 ||
    hudModeInputs.length === 0
  ) {
    return [];
  }

  return [{ root, button, panel, lowEffects, statBarAnimations, smoothRendering, vfx, fps, renderFpsInputs, shadowModeInputs, hudModeInputs }];
}

function syncSettingsMenuControls(menu: SettingsMenuRefs, settings: PlayerSettings): void {
  menu.lowEffects.checked = settings.lowEffects;
  menu.statBarAnimations.checked = settings.statBarAnimations;
  menu.smoothRendering.checked = settings.smoothRendering;
  menu.vfx.checked = settings.vfxEnabled;
  menu.fps.checked = settings.showFps;
  syncRenderFpsInputs(menu.renderFpsInputs, settings.renderFps);
  syncShadowModeInputs(menu.shadowModeInputs, settings.shadowMode);
  syncHudModeInputs(menu.hudModeInputs, settings.hudMode);
}

function closeSettingsMenus(menus: readonly SettingsMenuRefs[], except?: SettingsMenuRefs): void {
  menus.forEach((menu) => {
    if (menu !== except) {
      setMenuOpen(menu.button, menu.panel, false);
    }
  });
}

function applySettings(settings: PlayerSettings): void {
  document.body.classList.toggle("arena-low-effects", settings.lowEffects);
  document.body.classList.toggle("arena-sharp-rendering", !settings.smoothRendering);
  document.body.classList.toggle("arena-stat-bars-animated", settings.statBarAnimations);
  document.body.classList.toggle("arena-hud-classic", settings.hudMode === "classic");
  document.body.classList.toggle("arena-hud-immersive", settings.hudMode === "immersive");
}

function updateSettings(patch: Partial<PlayerSettings>): void {
  const nextSettings = normalizeSettings({ ...getPlayerSettings(), ...patch });

  cachedSettings = nextSettings;
  saveSettings(nextSettings);
  applySettings(nextSettings);
  window.dispatchEvent(new CustomEvent(settingsChangedEvent));
}

function loadSettings(): PlayerSettings {
  if (typeof window === "undefined") {
    return { ...defaultSettings };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<PlayerSettings> & { hudModeDefaultVersion?: number; shadowsEnabled?: boolean }) : {};
    const nextSettings = normalizeSettings({
      ...parsed,
      hudMode: parsed.hudModeDefaultVersion === hudModeDefaultVersion ? parsed.hudMode : undefined,
    });

    if (raw && parsed.hudModeDefaultVersion !== hudModeDefaultVersion) {
      saveSettings(nextSettings);
    }

    return nextSettings;
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(settings: PlayerSettings): void {
  window.localStorage.setItem(storageKey, JSON.stringify({ ...settings, hudModeDefaultVersion }));
}

function normalizeSettings(input: Partial<PlayerSettings>): PlayerSettings {
  return {
    lowEffects: typeof input.lowEffects === "boolean" ? input.lowEffects : defaultSettings.lowEffects,
    statBarAnimations: typeof input.statBarAnimations === "boolean" ? input.statBarAnimations : defaultSettings.statBarAnimations,
    smoothRendering: typeof input.smoothRendering === "boolean" ? input.smoothRendering : defaultSettings.smoothRendering,
    renderFps: normalizeRenderFps(input.renderFps),
    vfxEnabled: typeof input.vfxEnabled === "boolean" ? input.vfxEnabled : defaultSettings.vfxEnabled,
    shadowMode: normalizeShadowMode(input),
    hudMode: isPlayerHudMode(input.hudMode) ? input.hudMode : defaultSettings.hudMode,
    showFps: typeof input.showFps === "boolean" ? input.showFps : defaultSettings.showFps,
  };
}

function syncRenderFpsInputs(inputs: HTMLInputElement[], renderFps: PlayerRenderFps): void {
  inputs.forEach((input) => {
    input.checked = input.value === `${renderFps}`;
  });
}

function syncShadowModeInputs(inputs: HTMLInputElement[], mode: PlayerShadowMode): void {
  inputs.forEach((input) => {
    input.checked = input.value === mode;
  });
}

function syncHudModeInputs(inputs: HTMLInputElement[], mode: PlayerHudMode): void {
  inputs.forEach((input) => {
    input.checked = input.value === mode;
  });
}

function isPlayerRenderFps(value: unknown): value is PlayerRenderFps {
  return value === 30 || value === 60;
}

function parsePlayerRenderFps(value: unknown): PlayerRenderFps | undefined {
  if (value === "30") {
    return 30;
  }

  if (value === "60") {
    return 60;
  }

  return undefined;
}

function normalizeRenderFps(value: unknown): PlayerRenderFps {
  return isPlayerRenderFps(value) ? value : parsePlayerRenderFps(value) ?? defaultSettings.renderFps;
}

function confirmRenderFpsReload(renderFps: PlayerRenderFps): boolean {
  return window.confirm(`Changing FPS to ${renderFps} requires restarting the game. Apply and reload now?`);
}

function confirmSmoothRenderingReload(smoothRendering: boolean): boolean {
  return window.confirm(`Changing smooth rendering ${smoothRendering ? "on" : "off"} requires restarting the game. Apply and reload now?`);
}

function isPlayerShadowMode(value: unknown): value is PlayerShadowMode {
  return value === "high" || value === "low" || value === "off";
}

function isPlayerHudMode(value: unknown): value is PlayerHudMode {
  return value === "immersive" || value === "classic";
}

function normalizeShadowMode(input: Partial<PlayerSettings> & { shadowsEnabled?: boolean }): PlayerShadowMode {
  if (isPlayerShadowMode(input.shadowMode)) {
    return input.shadowMode;
  }

  if (typeof input.shadowsEnabled === "boolean") {
    return input.shadowsEnabled ? "high" : "off";
  }

  return defaultSettings.shadowMode;
}

function syncFpsCounter(counter: HTMLElement, show: boolean): void {
  fpsCounterElement = counter;
  counter.hidden = !show;

  if (show) {
    startFpsCounter(counter);
    return;
  }

  stopFpsCounter();
}

function startFpsCounter(counter: HTMLElement): void {
  fpsCounterElement = counter;

  if (fpsFrameId !== undefined) {
    return;
  }

  fpsFrameCount = 0;
  fpsLastTime = performance.now();
  counter.textContent = "FPS --";
  fpsFrameId = window.requestAnimationFrame(updateFpsCounter);
}

function stopFpsCounter(): void {
  if (fpsFrameId !== undefined) {
    window.cancelAnimationFrame(fpsFrameId);
    fpsFrameId = undefined;
  }

  fpsFrameCount = 0;
  fpsLastTime = 0;
}

function updateFpsCounter(now: number): void {
  if (!fpsCounterElement) {
    fpsFrameId = undefined;
    return;
  }

  fpsFrameCount += 1;

  if (now - fpsLastTime >= fpsUpdateIntervalMs) {
    const fps = Math.round((fpsFrameCount * 1000) / Math.max(1, now - fpsLastTime));

    fpsCounterElement.textContent = `${fps}`;
    fpsFrameCount = 0;
    fpsLastTime = now;
  }

  fpsFrameId = window.requestAnimationFrame(updateFpsCounter);
}
