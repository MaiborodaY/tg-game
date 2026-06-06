import {
  debugTuning,
  defaultDebugTuning,
  defaultRigPartTuning,
  resetDebugTuning,
  RIG_PART_KEYS,
  subscribeDebugTuning,
  updateDebugTuning,
  type ArenaDebugTuning,
  type RigPartKey,
  type RigPartTuning,
} from "./debugTuning";
import { saveProdDefaults } from "./prodDefaultsSaver";

interface DebugRangeControlConfig {
  type: "range";
  key: keyof ArenaDebugTuning;
  label: string;
  min: number;
  max: number;
  step: number;
  resetValue: number;
}

interface DebugToggleControlConfig {
  type: "toggle";
  key: keyof ArenaDebugTuning;
  label: string;
  resetValue: boolean;
}

type DebugControlConfig = DebugRangeControlConfig | DebugToggleControlConfig;
type RigNumericControlKey = "x" | "y" | "angle" | "scaleX" | "scaleY";
type RigToggleControlKey = "flipX" | "flipY";

interface DebugControlGroup {
  title: string;
  controls: DebugControlConfig[];
}

interface RigNumericControlConfig {
  key: RigNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface RigToggleControlConfig {
  key: RigToggleControlKey;
  label: string;
}

const controlGroups: DebugControlGroup[] = [
  {
    title: "Grid",
    controls: [
      { type: "toggle", key: "showGrid", label: "Show grid", resetValue: defaultDebugTuning.showGrid },
      { type: "range", key: "gridStep", label: "Grid step", min: 10, max: 100, step: 1, resetValue: defaultDebugTuning.gridStep },
      { type: "range", key: "gridOpacity", label: "Grid alpha", min: 0.1, max: 1, step: 0.05, resetValue: defaultDebugTuning.gridOpacity },
    ],
  },
  {
    title: "Origin",
    controls: [
      { type: "range", key: "originX", label: "Origin X", min: 0, max: 430, step: 1, resetValue: defaultDebugTuning.originX },
      { type: "range", key: "originY", label: "Origin Y", min: 0, max: 764, step: 1, resetValue: defaultDebugTuning.originY },
    ],
  },
  {
    title: "Fighters from origin",
    controls: [
      { type: "range", key: "playerStageX", label: "Player X", min: -600, max: 600, step: 1, resetValue: defaultDebugTuning.playerStageX },
      { type: "range", key: "playerStageY", label: "Player Y", min: -500, max: 500, step: 1, resetValue: defaultDebugTuning.playerStageY },
      { type: "range", key: "enemyStageX", label: "Enemy X", min: -600, max: 600, step: 1, resetValue: defaultDebugTuning.enemyStageX },
      { type: "range", key: "enemyStageY", label: "Enemy Y", min: -500, max: 500, step: 1, resetValue: defaultDebugTuning.enemyStageY },
      { type: "range", key: "playerScale", label: "Player scale", min: 0.1, max: 6, step: 0.01, resetValue: defaultDebugTuning.playerScale },
      { type: "range", key: "enemyScale", label: "Enemy scale", min: 0.1, max: 6, step: 0.01, resetValue: defaultDebugTuning.enemyScale },
    ],
  },
  {
    title: "Action arc",
    controls: [
      { type: "range", key: "actionArcRotation", label: "Arc rotation", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionArcRotation },
      { type: "range", key: "actionArcRadius", label: "Arc radius", min: 24, max: 150, step: 1, resetValue: defaultDebugTuning.actionArcRadius },
      { type: "range", key: "actionButtonScale", label: "Button scale", min: 0.5, max: 2, step: 0.01, resetValue: defaultDebugTuning.actionButtonScale },
    ],
  },
  {
    title: "Action button angles",
    controls: [
      { type: "range", key: "actionForwardArcAngle", label: "FWD angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionForwardArcAngle },
      { type: "range", key: "actionBackArcAngle", label: "BACK angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionBackArcAngle },
      { type: "range", key: "actionLungeArcAngle", label: "LUNGE angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionLungeArcAngle },
      { type: "range", key: "actionLightArcAngle", label: "WEAK angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionLightArcAngle },
      { type: "range", key: "actionMediumArcAngle", label: "MED angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionMediumArcAngle },
      { type: "range", key: "actionHeavyArcAngle", label: "STRONG angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionHeavyArcAngle },
      { type: "range", key: "actionTauntArcAngle", label: "TAUNT angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionTauntArcAngle },
      { type: "range", key: "actionRestArcAngle", label: "REST angle", min: -180, max: 180, step: 1, resetValue: defaultDebugTuning.actionRestArcAngle },
    ],
  },
];

const rigNumericControls: RigNumericControlConfig[] = [
  { key: "x", label: "x", min: -120, max: 120, step: 1 },
  { key: "y", label: "y", min: -120, max: 120, step: 1 },
  { key: "angle", label: "angle", min: -180, max: 180, step: 1 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const rigToggleControls: RigToggleControlConfig[] = [
  { key: "flipX", label: "mirror X" },
  { key: "flipY", label: "mirror Y" },
];

const oppositeRigPartMap: Partial<Record<RigPartKey, RigPartKey>> = {
  backUpperArm: "frontUpperArm",
  frontUpperArm: "backUpperArm",
  backForearm: "frontForearm",
  frontForearm: "backForearm",
  backHand: "frontHand",
  frontHand: "backHand",
  backThigh: "frontThigh",
  frontThigh: "backThigh",
  backShin: "frontShin",
  frontShin: "backShin",
  backFoot: "frontFoot",
  frontFoot: "backFoot",
};

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
      <button class="debug-panel__reset debug-panel__rig-toggle" type="button" aria-expanded="false">Rig editor</button>
      <div class="debug-rig-editor" hidden>
        <label class="debug-rig-editor__part">
          <span>Part</span>
          <select class="debug-rig-editor__select"></select>
        </label>
        <div class="debug-rig-editor__controls"></div>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-rig-editor__copy-opposite" type="button">Copy opposite</button>
          <button class="debug-panel__reset debug-rig-editor__reset" type="button">Reset selected</button>
        </div>
        <fieldset class="debug-rig-editor__idle">
          <legend>Idle</legend>
          <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
            <span>Play idle</span>
            <input type="checkbox" data-idle-enabled />
          </label>
          <label class="debug-panel__row debug-rig-editor__row">
            <span>duration</span>
            <input class="debug-panel__range" type="range" min="240" max="2400" step="10" data-idle-duration />
            <input class="debug-panel__number" type="number" min="240" max="2400" step="10" data-idle-duration-number />
          </label>
          <div class="debug-rig-editor__idle-parts" data-idle-parts></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__idle-all" type="button">All parts</button>
            <button class="debug-panel__reset debug-rig-editor__idle-none" type="button">No parts</button>
          </div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__capture-base" type="button">Capture part base</button>
            <button class="debug-panel__reset debug-rig-editor__capture-breath" type="button">Capture part breath</button>
          </div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__apply-base" type="button">Apply part base</button>
            <button class="debug-panel__reset debug-rig-editor__apply-breath" type="button">Apply part breath</button>
          </div>
        </fieldset>
      </div>
      <button class="debug-panel__reset debug-panel__save-prod" type="button">Save as prod defaults</button>
      <button class="debug-panel__reset debug-panel__reset-all" type="button">Reset all tuning</button>
      <p class="debug-panel__status" aria-live="polite"></p>
    </details>
  `;

  const body = panel.querySelector<HTMLElement>(".debug-panel__body");
  const rigToggle = panel.querySelector<HTMLButtonElement>(".debug-panel__rig-toggle");
  const rigEditor = panel.querySelector<HTMLElement>(".debug-rig-editor");
  const saveButton = panel.querySelector<HTMLButtonElement>(".debug-panel__save-prod");
  const resetButton = panel.querySelector<HTMLButtonElement>(".debug-panel__reset-all");
  const status = panel.querySelector<HTMLElement>(".debug-panel__status");

  if (!body || !rigToggle || !rigEditor || !saveButton || !resetButton || !status) {
    return;
  }

  for (const group of controlGroups) {
    body.append(createControlGroup(group));
  }
  mountRigEditor(rigEditor);

  rigToggle.addEventListener("click", () => {
    rigEditor.hidden = !rigEditor.hidden;
    rigToggle.setAttribute("aria-expanded", `${!rigEditor.hidden}`);
  });

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    status.textContent = "Saving prod defaults...";

    try {
      status.textContent = await saveProdDefaults(debugTuning);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not save prod defaults.";
    } finally {
      saveButton.disabled = false;
    }
  });

  resetButton.addEventListener("click", () => {
    resetDebugTuning();
    syncDebugTools(panel);
  });

  root.append(panel);
  mountDebugGrid();
  subscribeDebugTuning(() => syncDebugTools(panel));
  syncDebugTools(panel);
}

function createControlGroup(group: DebugControlGroup): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "debug-panel__group";

  const legend = document.createElement("legend");
  legend.textContent = group.title;
  fieldset.append(legend);

  for (const control of group.controls) {
    fieldset.append(createControl(control));
  }

  return fieldset;
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
    <button class="debug-panel__control-reset" type="button" data-debug-reset-key="${control.key}" data-debug-reset-value="${control.resetValue}">Reset</button>
  `;

  const input = row.querySelector<HTMLInputElement>("input");
  const reset = row.querySelector<HTMLButtonElement>(".debug-panel__control-reset");

  input?.addEventListener("change", () => {
    updateDebugTuning({ [control.key]: input.checked });
  });

  reset?.addEventListener("click", (event) => {
    event.preventDefault();
    updateDebugTuning({ [control.key]: control.resetValue });
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
    <button class="debug-panel__control-reset" type="button" data-debug-reset-key="${control.key}" data-debug-reset-value="${control.resetValue}">Reset</button>
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");
  const reset = row.querySelector<HTMLButtonElement>(".debug-panel__control-reset");

  range?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(range.value) });
  });

  number?.addEventListener("input", () => {
    updateDebugTuning({ [control.key]: Number(number.value) });
  });

  reset?.addEventListener("click", (event) => {
    event.preventDefault();
    updateDebugTuning({ [control.key]: control.resetValue });
  });

  return row;
}

function mountRigEditor(editor: HTMLElement): void {
  const select = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__select");
  const controls = editor.querySelector<HTMLElement>(".debug-rig-editor__controls");
  const copyOpposite = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const idleEnabled = editor.querySelector<HTMLInputElement>("input[data-idle-enabled]");
  const idleDuration = editor.querySelector<HTMLInputElement>("input[data-idle-duration]");
  const idleDurationNumber = editor.querySelector<HTMLInputElement>("input[data-idle-duration-number]");
  const idleParts = editor.querySelector<HTMLElement>("[data-idle-parts]");
  const idleAllParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-all");
  const idleNoParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-none");
  const captureBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-base");
  const captureBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-breath");
  const applyBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-base");
  const applyBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-breath");

  if (
    !select ||
    !controls ||
    !copyOpposite ||
    !reset ||
    !idleEnabled ||
    !idleDuration ||
    !idleDurationNumber ||
    !idleParts ||
    !idleAllParts ||
    !idleNoParts ||
    !captureBase ||
    !captureBreath ||
    !applyBase ||
    !applyBreath
  ) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    select.append(option);
  });

  rigNumericControls.forEach((control) => controls.append(createRigRangeControl(control)));
  rigToggleControls.forEach((control) => controls.append(createRigToggleControl(control)));
  RIG_PART_KEYS.forEach((key) => idleParts.append(createIdlePartToggle(key)));

  select.addEventListener("change", () => {
    updateDebugTuning({ selectedRigPart: select.value as RigPartKey });
  });

  reset.addEventListener("click", () => {
    updateRigPartTuning(debugTuning.selectedRigPart, { ...defaultRigPartTuning });
  });

  copyOpposite.addEventListener("click", () => {
    const selectedPart = debugTuning.selectedRigPart;
    const oppositePart = oppositeRigPartMap[selectedPart];

    if (!oppositePart) {
      return;
    }

    updateRigPartTuning(selectedPart, { ...debugTuning.rigParts[oppositePart] });
  });

  idleEnabled.addEventListener("change", () => {
    updateIdleAnimation({ enabled: idleEnabled.checked });
  });

  idleDuration.addEventListener("input", () => {
    updateIdleAnimation({ duration: Number(idleDuration.value) });
  });

  idleDurationNumber.addEventListener("input", () => {
    updateIdleAnimation({ duration: Number(idleDurationNumber.value) });
  });

  idleAllParts.addEventListener("click", () => {
    updateIdleAnimation({ activeParts: createIdleActiveParts(true) });
  });

  idleNoParts.addEventListener("click", () => {
    updateIdleAnimation({ activeParts: createIdleActiveParts(false) });
  });

  captureBase.addEventListener("click", () => {
    updateIdlePosePart("base", debugTuning.selectedRigPart);
  });

  captureBreath.addEventListener("click", () => {
    updateIdlePosePart("breath", debugTuning.selectedRigPart);
  });

  applyBase.addEventListener("click", () => {
    applyIdlePosePart("base", debugTuning.selectedRigPart);
  });

  applyBreath.addEventListener("click", () => {
    applyIdlePosePart("breath", debugTuning.selectedRigPart);
  });
}

function createRigRangeControl(control: RigNumericControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input
      class="debug-panel__range"
      type="range"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-rig-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-rig-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateRigPartTuning(debugTuning.selectedRigPart, { [control.key]: Number(range.value) });
  });

  number?.addEventListener("input", () => {
    updateRigPartTuning(debugTuning.selectedRigPart, { [control.key]: Number(number.value) });
  });

  return row;
}

function createRigToggleControl(control: RigToggleControlConfig): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-panel__row debug-panel__row--toggle debug-rig-editor__row";
  row.innerHTML = `
    <span>${control.label}</span>
    <input type="checkbox" data-rig-toggle-key="${control.key}" />
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateRigPartTuning(debugTuning.selectedRigPart, { [control.key]: input.checked });
  });

  return row;
}

function createIdlePartToggle(partKey: RigPartKey): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-rig-editor__idle-part";
  row.innerHTML = `
    <input type="checkbox" data-idle-part-key="${partKey}" />
    <span>${partKey}</span>
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateIdleActivePart(partKey, input.checked);
  });

  return row;
}

function updateRigPartTuning(partKey: RigPartKey, patch: Partial<RigPartTuning>): void {
  updateDebugTuning({
    rigParts: {
      ...debugTuning.rigParts,
      [partKey]: {
        ...debugTuning.rigParts[partKey],
        ...patch,
      },
    },
  });
}

function updateIdleActivePart(partKey: RigPartKey, enabled: boolean): void {
  updateIdleAnimation({
    activeParts: {
      ...debugTuning.idleAnimation.activeParts,
      [partKey]: enabled,
    },
  });
}

function updateIdlePosePart(poseKey: "base" | "breath", partKey: RigPartKey): void {
  const pose = debugTuning.idleAnimation[poseKey];
  const nextPose = {
    ...pose,
    [partKey]: {
      ...debugTuning.rigParts[partKey],
    },
  };

  if (poseKey === "base") {
    updateIdleAnimation({ base: nextPose });
    return;
  }

  updateIdleAnimation({ breath: nextPose });
}

function applyIdlePosePart(poseKey: "base" | "breath", partKey: RigPartKey): void {
  updateRigPartTuning(partKey, { ...debugTuning.idleAnimation[poseKey][partKey] });
}

function updateIdleAnimation(patch: Partial<ArenaDebugTuning["idleAnimation"]>): void {
  updateDebugTuning({
    idleAnimation: {
      ...debugTuning.idleAnimation,
      ...patch,
    },
  });
}

function createIdleActiveParts(enabled: boolean): Record<RigPartKey, boolean> {
  return Object.fromEntries(RIG_PART_KEYS.map((key) => [key, enabled])) as Record<RigPartKey, boolean>;
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
    <div class="debug-grid__origin">0,0</div>
  `;
  battleScreen.append(grid);
}

function syncDebugTools(panel: HTMLElement): void {
  syncInputs(panel);
  syncRigEditor(panel);
  syncIdleEditor(panel);
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

function syncRigEditor(panel: HTMLElement): void {
  const select = panel.querySelector<HTMLSelectElement>(".debug-rig-editor__select");
  const copyOpposite = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const selectedPart = debugTuning.selectedRigPart;
  const selectedTuning = debugTuning.rigParts[selectedPart];

  if (!select || !selectedTuning) {
    return;
  }

  select.value = selectedPart;

  if (copyOpposite) {
    const oppositePart = oppositeRigPartMap[selectedPart];

    copyOpposite.disabled = !oppositePart;
    copyOpposite.textContent = oppositePart ? `Copy ${oppositePart}` : "No opposite";
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-key]").forEach((input) => {
    const key = input.dataset.rigKey as RigNumericControlKey;

    input.value = `${selectedTuning[key]}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-number-key]").forEach((input) => {
    const key = input.dataset.rigNumberKey as RigNumericControlKey;
    const value = selectedTuning[key];

    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-toggle-key]").forEach((input) => {
    const key = input.dataset.rigToggleKey as RigToggleControlKey;

    input.checked = selectedTuning[key];
  });
}

function syncIdleEditor(panel: HTMLElement): void {
  const idle = debugTuning.idleAnimation;
  const enabled = panel.querySelector<HTMLInputElement>("input[data-idle-enabled]");
  const duration = panel.querySelector<HTMLInputElement>("input[data-idle-duration]");
  const durationNumber = panel.querySelector<HTMLInputElement>("input[data-idle-duration-number]");

  if (enabled) {
    enabled.checked = idle.enabled;
  }

  if (duration) {
    duration.value = `${idle.duration}`;
  }

  if (durationNumber) {
    durationNumber.value = `${idle.duration}`;
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-idle-part-key]").forEach((input) => {
    const partKey = input.dataset.idlePartKey as RigPartKey;

    input.checked = idle.activeParts[partKey];
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
  grid.style.setProperty("--debug-origin-x", `${debugTuning.originX}px`);
  grid.style.setProperty("--debug-origin-y", `${debugTuning.originY}px`);
}
