import {
  debugTuning,
  defaultDebugTuning,
  resetDebugTuning,
  subscribeDebugTuning,
  updateDebugTuning,
  type ArenaDebugTuning,
} from "./debugTuning";

interface DebugRangeControlConfig {
  type: "range";
  key: keyof ArenaDebugTuning;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface DebugToggleControlConfig {
  type: "toggle";
  key: keyof ArenaDebugTuning;
  label: string;
}

type DebugControlConfig = DebugRangeControlConfig | DebugToggleControlConfig;

const controls: DebugControlConfig[] = [
  { type: "toggle", key: "showGrid", label: "Show grid" },
  { type: "range", key: "gridStep", label: "Grid step", min: 10, max: 100, step: 1 },
  { type: "range", key: "gridOpacity", label: "Grid alpha", min: 0.1, max: 1, step: 0.05 },
  { type: "range", key: "playerScale", label: "Player scale", min: 0.1, max: 6, step: 0.01 },
  { type: "range", key: "enemyScale", label: "Enemy scale", min: 0.1, max: 6, step: 0.01 },
  { type: "range", key: "playerXOffset", label: "Player X", min: -320, max: 320, step: 1 },
  { type: "range", key: "playerYOffset", label: "Player Y", min: -240, max: 240, step: 1 },
  { type: "range", key: "enemyXOffset", label: "Enemy X", min: -320, max: 320, step: 1 },
  { type: "range", key: "enemyYOffset", label: "Enemy Y", min: -240, max: 240, step: 1 },
  { type: "range", key: "fighterYOffset", label: "Both Y", min: -320, max: 320, step: 1 },
  { type: "range", key: "actionWheelScale", label: "Wheel scale", min: 0.2, max: 4, step: 0.01 },
  { type: "range", key: "actionWheelOffsetX", label: "Wheel X", min: -260, max: 260, step: 1 },
  { type: "range", key: "actionWheelOffsetY", label: "Wheel Y", min: -260, max: 260, step: 1 },
];

export function mountDebugPanel(root: HTMLElement): void {
  if (document.querySelector(".debug-panel")) {
    return;
  }

  const panel = document.createElement("section");
  panel.className = "debug-panel";
  panel.innerHTML = `
    <details open>
      <summary>Debug tuning</summary>
      <div class="debug-panel__body"></div>
      <button class="debug-panel__reset" type="button">Reset tuning</button>
    </details>
  `;

  const body = panel.querySelector<HTMLElement>(".debug-panel__body");
  const resetButton = panel.querySelector<HTMLButtonElement>(".debug-panel__reset");

  if (!body || !resetButton) {
    return;
  }

  for (const control of controls) {
    body.append(createControl(control));
  }

  resetButton.addEventListener("click", () => {
    resetDebugTuning();
    syncDebugTools(panel);
  });

  root.append(panel);
  mountDebugGrid();
  subscribeDebugTuning(() => syncDebugTools(panel));
  syncDebugTools(panel);
}

function createControl(control: DebugControlConfig): HTMLElement {
  if (control.type === "toggle") {
    return createToggleControl(control);
  }

  return createRangeControl(control);
}

function createToggleControl(control: DebugToggleControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-panel__row--toggle";
  row.innerHTML = `
    <span>${control.label}</span>
    <input type="checkbox" data-debug-key="${control.key}" />
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateDebugTuning({ [control.key]: input.checked });
  });

  return row;
}

function createRangeControl(control: DebugRangeControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      value="${defaultDebugTuning[control.key]}"
      data-debug-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      value="${defaultDebugTuning[control.key]}"
      data-debug-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(range.value) });
  });

  number?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(number.value) });
  });

  return row;
}

function mountDebugGrid(): void {
  const battleScreen = document.querySelector<HTMLElement>(".battle-screen");

  if (!battleScreen || battleScreen.querySelector(".debug-grid")) {
    return;
  }

  const grid = document.createElement("div");
  grid.className = "debug-grid";
  grid.setAttribute("aria-hidden", "true");
  grid.innerHTML = `
    <div class="debug-grid__center-x"></div>
    <div class="debug-grid__center-y"></div>
    <div class="debug-grid__label debug-grid__label--top">x/y screen grid</div>
    <div class="debug-grid__label debug-grid__label--bottom">430 x 764</div>
  `;
  battleScreen.append(grid);
}

function syncDebugTools(panel: HTMLElement): void {
  syncInputs(panel);
  syncGrid();
}

function syncInputs(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLInputElement>("input[data-debug-key]").forEach((input) => {
    const key = input.dataset.debugKey as keyof ArenaDebugTuning;
    const value = debugTuning[key];

    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = `${value}`;
    }
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-debug-number-key]").forEach((input) => {
    const key = input.dataset.debugNumberKey as keyof ArenaDebugTuning;
    const value = debugTuning[key];

    input.value = typeof value === "number" && !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });
}

function syncGrid(): void {
  const grid = document.querySelector<HTMLElement>(".debug-grid");

  if (!grid) {
    return;
  }

  grid.hidden = !debugTuning.showGrid;
  grid.style.setProperty("--debug-grid-step", `${debugTuning.gridStep}px`);
  grid.style.setProperty("--debug-grid-opacity", `${debugTuning.gridOpacity}`);
}