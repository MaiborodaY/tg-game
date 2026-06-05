import {
  debugTuning,
  defaultDebugTuning,
  resetDebugTuning,
  subscribeDebugTuning,
  updateDebugTuning,
  type ArenaDebugTuning,
} from "./debugTuning";

interface DebugControlConfig {
  key: keyof ArenaDebugTuning;
  label: string;
  min: number;
  max: number;
  step: number;
}

const controls: DebugControlConfig[] = [
  { key: "playerScale", label: "Player scale", min: 0.35, max: 2.2, step: 0.05 },
  { key: "enemyScale", label: "Enemy scale", min: 0.35, max: 2.2, step: 0.05 },
  { key: "playerXOffset", label: "Player X", min: -180, max: 180, step: 2 },
  { key: "enemyXOffset", label: "Enemy X", min: -180, max: 180, step: 2 },
  { key: "fighterYOffset", label: "Fighters Y", min: -180, max: 180, step: 2 },
  { key: "actionWheelScale", label: "Wheel scale", min: 0.55, max: 1.8, step: 0.05 },
  { key: "actionWheelOffsetX", label: "Wheel X", min: -160, max: 160, step: 2 },
  { key: "actionWheelOffsetY", label: "Wheel Y", min: -160, max: 160, step: 2 },
];

export function mountDebugPanel(root: HTMLElement): void {
  if (document.querySelector(".debug-panel")) {
    return;
  }

  const panel = document.createElement("section");
  panel.className = "debug-panel";
  panel.innerHTML = `
    <details>
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
    syncInputs(panel);
  });

  root.append(panel);
  subscribeDebugTuning(() => syncInputs(panel));
  syncInputs(panel);
}

function createControl(control: DebugControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      value="${defaultDebugTuning[control.key]}"
      data-debug-key="${control.key}"
    />
    <output></output>
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(input.value) });
  });

  return row;
}

function syncInputs(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLInputElement>("input[data-debug-key]").forEach((input) => {
    const key = input.dataset.debugKey as keyof ArenaDebugTuning;
    const value = debugTuning[key];
    const output = input.nextElementSibling;

    input.value = `${value}`;

    if (output) {
      output.textContent = Number.isInteger(value) ? `${value}` : value.toFixed(2);
    }
  });
}