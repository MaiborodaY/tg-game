export type PlayerAnimationMode = "normal" | "half" | "off";
export type PlayerShadowMode = "high" | "low" | "off";
export type PlayerHudMode = "immersive" | "classic";
export const DEFAULT_PLAYER_HUD_MODE: PlayerHudMode = "classic";

export interface PlayerSettings {
  lowEffects: boolean;
  animationMode: PlayerAnimationMode;
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
  animationMode: "normal",
  vfxEnabled: true,
  shadowMode: "high",
  hudMode: DEFAULT_PLAYER_HUD_MODE,
  showFps: false,
};
let cachedSettings: PlayerSettings | undefined;
let fpsFrameId: number | undefined;
let fpsCounterElement: HTMLElement | undefined;
let fpsFrameCount = 0;
let fpsLastTime = 0;

export function mountSettingsMenu(root: ParentNode = document): void {
  const menu = root.querySelector<HTMLElement>("[data-settings-menu]");
  const button = root.querySelector<HTMLButtonElement>("[data-settings-button]");
  const panel = root.querySelector<HTMLElement>("[data-settings-panel]");
  const lowEffects = root.querySelector<HTMLInputElement>("[data-setting-low-effects]");
  const vfx = root.querySelector<HTMLInputElement>("[data-setting-vfx]");
  const fps = root.querySelector<HTMLInputElement>("[data-setting-fps]");
  const fpsCounter = root.querySelector<HTMLElement>("[data-fps-counter]");
  const animationInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-setting-animation]"));
  const shadowModeInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-setting-shadow-mode]"));
  const hudModeInputs = Array.from(root.querySelectorAll<HTMLInputElement>("[data-setting-hud-mode]"));

  if (
    !menu ||
    !button ||
    !panel ||
    !lowEffects ||
    !vfx ||
    !fps ||
    !fpsCounter ||
    animationInputs.length === 0 ||
    shadowModeInputs.length === 0 ||
    hudModeInputs.length === 0
  ) {
    return;
  }

  const settings = getPlayerSettings();
  lowEffects.checked = settings.lowEffects;
  vfx.checked = settings.vfxEnabled;
  fps.checked = settings.showFps;
  syncAnimationInputs(animationInputs, settings.animationMode);
  syncShadowModeInputs(shadowModeInputs, settings.shadowMode);
  syncHudModeInputs(hudModeInputs, settings.hudMode);
  applySettings(settings);
  syncFpsCounter(fpsCounter, settings.showFps);

  menu.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(button, panel, panel.hidden !== false);
  });

  lowEffects.addEventListener("change", () => {
    updateSettings({ lowEffects: lowEffects.checked });
  });

  vfx.addEventListener("change", () => {
    updateSettings({ vfxEnabled: vfx.checked });
  });

  fps.addEventListener("change", () => {
    updateSettings({ showFps: fps.checked });
    syncFpsCounter(fpsCounter, fps.checked);
  });

  animationInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked || !isPlayerAnimationMode(input.value)) {
        return;
      }

      updateSettings({ animationMode: input.value });
    });
  });

  shadowModeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked || !isPlayerShadowMode(input.value)) {
        return;
      }

      updateSettings({ shadowMode: input.value });
    });
  });

  hudModeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked || !isPlayerHudMode(input.value)) {
        return;
      }

      updateSettings({ hudMode: input.value });
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (panel.hidden || !(event.target instanceof Node) || menu.contains(event.target)) {
      return;
    }

    setMenuOpen(button, panel, false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(button, panel, false);
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

function applySettings(settings: PlayerSettings): void {
  document.body.classList.toggle("arena-low-effects", settings.lowEffects);
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
    animationMode: isPlayerAnimationMode(input.animationMode) ? input.animationMode : defaultSettings.animationMode,
    vfxEnabled: typeof input.vfxEnabled === "boolean" ? input.vfxEnabled : defaultSettings.vfxEnabled,
    shadowMode: normalizeShadowMode(input),
    hudMode: isPlayerHudMode(input.hudMode) ? input.hudMode : defaultSettings.hudMode,
    showFps: typeof input.showFps === "boolean" ? input.showFps : defaultSettings.showFps,
  };
}

function syncAnimationInputs(inputs: HTMLInputElement[], mode: PlayerAnimationMode): void {
  inputs.forEach((input) => {
    input.checked = input.value === mode;
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

function isPlayerAnimationMode(value: unknown): value is PlayerAnimationMode {
  return value === "normal" || value === "half" || value === "off";
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
