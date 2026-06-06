import {
  BODY_ANIMATION_KEYS,
  debugTuning,
  defaultDebugTuning,
  defaultFacePartTuning,
  defaultRigPartTuning,
  FACE_PART_KEYS,
  resetDebugTuning,
  RIG_PART_KEYS,
  subscribeDebugTuning,
  updateDebugTuning,
  type ArenaDebugTuning,
  type BodyAnimationKey,
  type BodyAnimationTuning,
  type FacePartKey,
  type FacePartTuning,
  type RigPartKey,
  type RigPartTuning,
} from "./debugTuning";
import { saveProdAnimation, saveProdDefaults } from "./prodDefaultsSaver";

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
type CharacterPreviewControlKey = "characterPreviewScale" | "characterPreviewFeetY";
type FaceNumericControlKey = keyof FacePartTuning;
type RigEditTargetKey =
  | "selected"
  | "frontForearmHand"
  | "backForearmHand"
  | "frontArm"
  | "backArm"
  | "frontArmHand"
  | "backArmHand"
  | "bothForearmsHands"
  | "bothArms"
  | "frontLeg"
  | "backLeg"
  | "bothLegs"
  | "upperBody"
  | "fullBody";

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

interface CharacterPreviewControlConfig {
  key: CharacterPreviewControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface FaceNumericControlConfig {
  key: FaceNumericControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface RigEditTargetConfig {
  key: RigEditTargetKey;
  label: string;
  parts: RigPartKey[];
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

const characterPreviewControls: CharacterPreviewControlConfig[] = [
  { key: "characterPreviewScale", label: "zoom", min: 1, max: 2.6, step: 0.01 },
  { key: "characterPreviewFeetY", label: "feet Y", min: 560, max: 740, step: 1 },
];

const faceNumericControls: FaceNumericControlConfig[] = [
  { key: "x", label: "x", min: -40, max: 40, step: 0.5 },
  { key: "y", label: "y", min: -40, max: 40, step: 0.5 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const rigEditTargets: RigEditTargetConfig[] = [
  { key: "selected", label: "selected only", parts: [] },
  { key: "frontForearmHand", label: "front forearm + hand", parts: ["frontForearm", "frontHand"] },
  { key: "backForearmHand", label: "back forearm + hand", parts: ["backForearm", "backHand"] },
  { key: "frontArm", label: "front upper + forearm", parts: ["frontUpperArm", "frontForearm"] },
  { key: "backArm", label: "back upper + forearm", parts: ["backUpperArm", "backForearm"] },
  { key: "frontArmHand", label: "front arm + hand", parts: ["frontUpperArm", "frontForearm", "frontHand"] },
  { key: "backArmHand", label: "back arm + hand", parts: ["backUpperArm", "backForearm", "backHand"] },
  { key: "bothForearmsHands", label: "both forearms + hands", parts: ["backForearm", "backHand", "frontForearm", "frontHand"] },
  { key: "bothArms", label: "both arms + hands", parts: ["backUpperArm", "backForearm", "backHand", "frontUpperArm", "frontForearm", "frontHand"] },
  { key: "frontLeg", label: "front leg", parts: ["frontThigh", "frontShin", "frontFoot"] },
  { key: "backLeg", label: "back leg", parts: ["backThigh", "backShin", "backFoot"] },
  { key: "bothLegs", label: "both legs", parts: ["backThigh", "backShin", "backFoot", "frontThigh", "frontShin", "frontFoot"] },
  { key: "upperBody", label: "upper body", parts: ["head", "torso", "backUpperArm", "backForearm", "backHand", "frontUpperArm", "frontForearm", "frontHand"] },
  { key: "fullBody", label: "full body", parts: [...RIG_PART_KEYS] },
];

let activeRigEditTarget: RigEditTargetKey = "selected";

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
    <nav class="debug-panel__mode-tabs" aria-label="Debug mode">
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="character" aria-pressed="true">Character</button>
      <button class="debug-panel__mode-tab" type="button" data-debug-mode="arena" aria-pressed="false">Arena</button>
    </nav>
    <details class="debug-rig-panel" open>
      <summary>Rig editor</summary>
      <div class="debug-rig-editor">
        <fieldset class="debug-rig-editor__preview">
          <legend>Preview</legend>
          <div class="debug-rig-editor__preview-controls"></div>
        </fieldset>
        <label class="debug-rig-editor__part">
          <span>Part</span>
          <select class="debug-rig-editor__select"></select>
        </label>
        <label class="debug-rig-editor__part">
          <span>Target</span>
          <select class="debug-rig-editor__target-select"></select>
        </label>
        <div class="debug-rig-editor__controls"></div>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-rig-editor__copy-opposite" type="button">Copy opposite</button>
          <button class="debug-panel__reset debug-rig-editor__reset" type="button">Reset selected</button>
        </div>
        <fieldset class="debug-rig-editor__face" hidden>
          <legend>Head face</legend>
          <div class="debug-rig-editor__face-controls"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__face-reset" type="button">Reset eyes</button>
          </div>
        </fieldset>
        <fieldset class="debug-rig-editor__idle">
          <legend>Animation</legend>
          <label class="debug-rig-editor__part">
            <span>Animation</span>
            <select class="debug-rig-editor__animation-select"></select>
          </label>
          <label class="debug-panel__row debug-panel__row--toggle debug-rig-editor__row">
            <span>Play selected</span>
            <input type="checkbox" data-animation-enabled />
          </label>
          <label class="debug-panel__row debug-rig-editor__row">
            <span>duration</span>
            <input class="debug-panel__range" type="range" min="240" max="2400" step="10" data-animation-duration />
            <input class="debug-panel__number" type="number" min="240" max="2400" step="10" data-animation-duration-number />
          </label>
          <div class="debug-rig-editor__idle-parts" data-animation-parts></div>
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
    </details>
    <details class="debug-arena-panel">
      <summary>Arena tuning</summary>
      <div class="debug-panel__body"></div>
    </details>
    <div class="debug-panel__prod-actions">
      <button class="debug-panel__reset debug-panel__save-prod" type="button">Save as prod defaults</button>
      <button class="debug-panel__reset debug-panel__save-prod-animation" type="button">Save animation as prod</button>
      <button class="debug-panel__reset debug-panel__reset-all" type="button">Reset all tuning</button>
      <p class="debug-panel__status" aria-live="polite"></p>
    </div>
  `;

  const body = panel.querySelector<HTMLElement>(".debug-panel__body");
  const rigEditor = panel.querySelector<HTMLElement>(".debug-rig-editor");
  const saveButton = panel.querySelector<HTMLButtonElement>(".debug-panel__save-prod");
  const saveAnimationButton = panel.querySelector<HTMLButtonElement>(".debug-panel__save-prod-animation");
  const resetButton = panel.querySelector<HTMLButtonElement>(".debug-panel__reset-all");
  const status = panel.querySelector<HTMLElement>(".debug-panel__status");

  if (!body || !rigEditor || !saveButton || !saveAnimationButton || !resetButton || !status) {
    return;
  }

  for (const group of controlGroups) {
    body.append(createControlGroup(group));
  }
  mountRigEditor(rigEditor);
  mountModeTabs(panel);

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

  saveAnimationButton.addEventListener("click", async () => {
    saveAnimationButton.disabled = true;
    status.textContent = `Saving prod ${debugTuning.selectedBodyAnimation}...`;

    try {
      status.textContent = await saveProdAnimation(debugTuning);
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not save prod animation.";
    } finally {
      saveAnimationButton.disabled = false;
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

type DebugMode = "character" | "arena";

function mountModeTabs(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLButtonElement>("button[data-debug-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.debugMode === "arena" ? "arena" : "character";

      setDebugMode(mode);
      syncModeTabs(panel);
    });
  });

  syncModeTabs(panel);
}

function setDebugMode(mode: DebugMode): void {
  document.body.classList.toggle("debug-mode-character", mode === "character");
  document.body.classList.toggle("debug-mode-arena", mode === "arena");
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
  const previewControls = editor.querySelector<HTMLElement>(".debug-rig-editor__preview-controls");
  const select = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__select");
  const targetSelect = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__target-select");
  const controls = editor.querySelector<HTMLElement>(".debug-rig-editor__controls");
  const faceControls = editor.querySelector<HTMLElement>(".debug-rig-editor__face-controls");
  const copyOpposite = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const resetFace = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__face-reset");
  const animationSelect = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__animation-select");
  const animationEnabled = editor.querySelector<HTMLInputElement>("input[data-animation-enabled]");
  const animationDuration = editor.querySelector<HTMLInputElement>("input[data-animation-duration]");
  const animationDurationNumber = editor.querySelector<HTMLInputElement>("input[data-animation-duration-number]");
  const animationParts = editor.querySelector<HTMLElement>("[data-animation-parts]");
  const idleAllParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-all");
  const idleNoParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-none");
  const captureBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-base");
  const captureBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-breath");
  const applyBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-base");
  const applyBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-breath");

  if (
    !select ||
    !targetSelect ||
    !previewControls ||
    !controls ||
    !faceControls ||
    !copyOpposite ||
    !reset ||
    !resetFace ||
    !animationSelect ||
    !animationEnabled ||
    !animationDuration ||
    !animationDurationNumber ||
    !animationParts ||
    !idleAllParts ||
    !idleNoParts ||
    !captureBase ||
    !captureBreath ||
    !applyBase ||
    !applyBreath
  ) {
    return;
  }

  characterPreviewControls.forEach((control) => previewControls.append(createCharacterPreviewRangeControl(control)));
  RIG_PART_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    select.append(option);
  });

  rigEditTargets.forEach((target) => {
    const option = document.createElement("option");
    option.value = target.key;
    option.textContent = target.label;
    targetSelect.append(option);
  });

  BODY_ANIMATION_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    animationSelect.append(option);
  });

  rigNumericControls.forEach((control) => controls.append(createRigRangeControl(control)));
  rigToggleControls.forEach((control) => controls.append(createRigToggleControl(control)));
  FACE_PART_KEYS.forEach((key) => faceControls.append(createFacePartEditor(key)));
  RIG_PART_KEYS.forEach((key) => animationParts.append(createAnimationPartToggle(key)));

  select.addEventListener("change", () => {
    const selectedPart = select.value as RigPartKey;

    if (activeRigEditTarget !== "selected" && !getRigEditTargetParts(selectedPart).includes(selectedPart)) {
      activeRigEditTarget = "selected";
    }

    updateDebugTuning({ selectedRigPart: selectedPart });
  });

  targetSelect.addEventListener("change", () => {
    activeRigEditTarget = isRigEditTargetKey(targetSelect.value) ? targetSelect.value : "selected";

    const targetParts = getRigEditTargetParts();

    if (!targetParts.includes(debugTuning.selectedRigPart)) {
      updateDebugTuning({ selectedRigPart: targetParts[0] ?? debugTuning.selectedRigPart });
      return;
    }

    syncRigEditor(editor);
  });

  reset.addEventListener("click", () => {
    resetRigEditTarget();
  });

  resetFace.addEventListener("click", () => {
    resetFaceParts();
  });

  copyOpposite.addEventListener("click", () => {
    const selectedPart = debugTuning.selectedRigPart;
    const oppositePart = oppositeRigPartMap[selectedPart];

    if (!oppositePart) {
      return;
    }

    updateRigPartTuning(selectedPart, { ...debugTuning.rigParts[oppositePart] });
  });

  animationSelect.addEventListener("change", () => {
    updateDebugTuning({
      selectedBodyAnimation: isBodyAnimationKey(animationSelect.value) ? animationSelect.value : "idle",
    });
  });

  animationEnabled.addEventListener("change", () => {
    updateSelectedBodyAnimation({ enabled: animationEnabled.checked });
  });

  animationDuration.addEventListener("input", () => {
    updateSelectedBodyAnimation({ duration: Number(animationDuration.value) });
  });

  animationDurationNumber.addEventListener("input", () => {
    updateSelectedBodyAnimation({ duration: Number(animationDurationNumber.value) });
  });

  idleAllParts.addEventListener("click", () => {
    updateSelectedBodyAnimation({ activeParts: createAnimationActiveParts(true) });
  });

  idleNoParts.addEventListener("click", () => {
    updateSelectedBodyAnimation({ activeParts: createAnimationActiveParts(false) });
  });

  captureBase.addEventListener("click", () => {
    updateAnimationPosePart("base", debugTuning.selectedRigPart);
  });

  captureBreath.addEventListener("click", () => {
    updateAnimationPosePart("breath", debugTuning.selectedRigPart);
  });

  applyBase.addEventListener("click", () => {
    applyAnimationPosePart("base", debugTuning.selectedRigPart);
  });

  applyBreath.addEventListener("click", () => {
    applyAnimationPosePart("breath", debugTuning.selectedRigPart);
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
    updateRigNumericTuning(control.key, Number(range.value));
  });

  number?.addEventListener("input", () => {
    updateRigNumericTuning(control.key, Number(number.value));
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
    updateRigToggleTuning(control.key, input.checked);
  });

  return row;
}

function createCharacterPreviewRangeControl(control: CharacterPreviewControlConfig): HTMLElement {
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
      data-debug-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
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

function createAnimationPartToggle(partKey: RigPartKey): HTMLElement {
  const row = document.createElement("label");
  row.className = "debug-rig-editor__idle-part";
  row.innerHTML = `
    <input type="checkbox" data-animation-part-key="${partKey}" />
    <span>${partKey}</span>
  `;

  const input = row.querySelector<HTMLInputElement>("input");

  input?.addEventListener("change", () => {
    updateAnimationActivePart(partKey, input.checked);
  });

  return row;
}

function createFacePartEditor(partKey: FacePartKey): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "debug-rig-editor__face-part";
  fieldset.innerHTML = `<legend>${partKey}</legend>`;

  faceNumericControls.forEach((control) => {
    fieldset.append(createFaceRangeControl(partKey, control));
  });

  return fieldset;
}

function createFaceRangeControl(partKey: FacePartKey, control: FaceNumericControlConfig): HTMLElement {
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
      data-face-part="${partKey}"
      data-face-key="${control.key}"
    />
    <input
      class="debug-panel__number"
      type="number"
      min="${control.min}"
      max="${control.max}"
      step="${control.step}"
      data-face-part="${partKey}"
      data-face-number-key="${control.key}"
    />
  `;

  const range = row.querySelector<HTMLInputElement>(".debug-panel__range");
  const number = row.querySelector<HTMLInputElement>(".debug-panel__number");

  range?.addEventListener("input", () => {
    updateFacePartTuning(partKey, control.key, Number(range.value));
  });

  number?.addEventListener("input", () => {
    updateFacePartTuning(partKey, control.key, Number(number.value));
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

function updateFacePartTuning(partKey: FacePartKey, key: FaceNumericControlKey, value: number): void {
  updateDebugTuning({
    faceParts: {
      ...debugTuning.faceParts,
      [partKey]: {
        ...debugTuning.faceParts[partKey],
        [key]: clampFaceNumericValue(key, value),
      },
    },
  });
}

function resetFaceParts(): void {
  updateDebugTuning({
    faceParts: Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...defaultFacePartTuning }])) as Record<FacePartKey, FacePartTuning>,
  });
}

function updateRigNumericTuning(key: RigNumericControlKey, value: number): void {
  const targetParts = getRigEditTargetParts();
  const anchorPart = getRigEditAnchorPart(targetParts);
  const anchorTuning = debugTuning.rigParts[anchorPart];

  if (!anchorTuning) {
    return;
  }

  const nextRigParts = { ...debugTuning.rigParts };

  if (key === "scaleX" || key === "scaleY") {
    const ratio = anchorTuning[key] === 0 ? 1 : value / anchorTuning[key];

    targetParts.forEach((partKey) => {
      const current = debugTuning.rigParts[partKey];
      nextRigParts[partKey] = {
        ...current,
        [key]: clampRigNumericValue(key, current[key] * ratio),
      };
    });
  } else {
    const delta = value - anchorTuning[key];

    targetParts.forEach((partKey) => {
      const current = debugTuning.rigParts[partKey];
      nextRigParts[partKey] = {
        ...current,
        [key]: clampRigNumericValue(key, current[key] + delta),
      };
    });
  }

  updateDebugTuning({ rigParts: nextRigParts });
}

function updateRigToggleTuning(key: RigToggleControlKey, value: boolean): void {
  const nextRigParts = { ...debugTuning.rigParts };

  getRigEditTargetParts().forEach((partKey) => {
    nextRigParts[partKey] = {
      ...debugTuning.rigParts[partKey],
      [key]: value,
    };
  });

  updateDebugTuning({ rigParts: nextRigParts });
}

function resetRigEditTarget(): void {
  const nextRigParts = { ...debugTuning.rigParts };

  getRigEditTargetParts().forEach((partKey) => {
    nextRigParts[partKey] = { ...defaultRigPartTuning };
  });

  updateDebugTuning({ rigParts: nextRigParts });
}

function getRigEditTargetParts(selectedPart = debugTuning.selectedRigPart): RigPartKey[] {
  if (activeRigEditTarget === "selected") {
    return [selectedPart];
  }

  return getRigEditTarget(activeRigEditTarget)?.parts ?? [selectedPart];
}

function getRigEditAnchorPart(targetParts: RigPartKey[]): RigPartKey {
  return targetParts.includes(debugTuning.selectedRigPart) ? debugTuning.selectedRigPart : targetParts[0] ?? debugTuning.selectedRigPart;
}

function getRigEditTarget(key: RigEditTargetKey): RigEditTargetConfig | undefined {
  return rigEditTargets.find((target) => target.key === key);
}

function isRigEditTargetKey(value: string): value is RigEditTargetKey {
  return rigEditTargets.some((target) => target.key === value);
}

function isBodyAnimationKey(value: string): value is BodyAnimationKey {
  return BODY_ANIMATION_KEYS.includes(value as BodyAnimationKey);
}

function isFacePartKey(value: string | undefined): value is FacePartKey {
  return typeof value === "string" && FACE_PART_KEYS.includes(value as FacePartKey);
}

function clampRigNumericValue(key: RigNumericControlKey, value: number): number {
  if (key === "angle") {
    return clampNumber(value, -180, 180);
  }

  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -120, 120);
}

function clampFaceNumericValue(key: FaceNumericControlKey, value: number): number {
  if (key === "scaleX" || key === "scaleY") {
    return clampNumber(value, 0.1, 3);
  }

  return clampNumber(value, -40, 40);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function updateAnimationActivePart(partKey: RigPartKey, enabled: boolean): void {
  const animation = getSelectedBodyAnimation();

  updateSelectedBodyAnimation({
    activeParts: {
      ...animation.activeParts,
      [partKey]: enabled,
    },
  });
}

function updateAnimationPosePart(poseKey: "base" | "breath", partKey: RigPartKey): void {
  const animation = getSelectedBodyAnimation();
  const pose = animation[poseKey];
  const nextPose = {
    ...pose,
    [partKey]: {
      ...debugTuning.rigParts[partKey],
    },
  };

  if (poseKey === "base") {
    updateSelectedBodyAnimation({ base: nextPose });
    return;
  }

  updateSelectedBodyAnimation({ breath: nextPose });
}

function applyAnimationPosePart(poseKey: "base" | "breath", partKey: RigPartKey): void {
  updateRigPartTuning(partKey, { ...getSelectedBodyAnimation()[poseKey][partKey] });
}

function updateSelectedBodyAnimation(patch: Partial<BodyAnimationTuning>): void {
  const key = debugTuning.selectedBodyAnimation;
  const animation = getSelectedBodyAnimation();

  updateDebugTuning({
    bodyAnimations: {
      ...debugTuning.bodyAnimations,
      [key]: {
        ...animation,
        ...patch,
      },
    },
  });
}

function getSelectedBodyAnimation(): BodyAnimationTuning {
  return debugTuning.bodyAnimations[debugTuning.selectedBodyAnimation] ?? debugTuning.bodyAnimations.idle;
}

function createAnimationActiveParts(enabled: boolean): Record<RigPartKey, boolean> {
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
  syncModeTabs(panel);
  syncInputs(panel);
  syncRigEditor(panel);
  syncFaceEditor(panel);
  syncAnimationEditor(panel);
  syncGrid();
}

function syncModeTabs(panel: HTMLElement): void {
  const mode: DebugMode = document.body.classList.contains("debug-mode-arena") ? "arena" : "character";

  panel.querySelectorAll<HTMLButtonElement>("button[data-debug-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.debugMode === mode}`);
  });
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
  const targetSelect = panel.querySelector<HTMLSelectElement>(".debug-rig-editor__target-select");
  const copyOpposite = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const selectedPart = debugTuning.selectedRigPart;
  const targetParts = getRigEditTargetParts();
  const anchorPart = getRigEditAnchorPart(targetParts);
  const anchorTuning = debugTuning.rigParts[anchorPart];

  if (!select || !targetSelect || !anchorTuning) {
    return;
  }

  select.value = selectedPart;
  targetSelect.value = activeRigEditTarget;

  if (reset) {
    reset.textContent = activeRigEditTarget === "selected" ? "Reset selected" : "Reset target";
  }

  if (copyOpposite) {
    const oppositePart = oppositeRigPartMap[selectedPart];

    copyOpposite.disabled = !oppositePart;
    copyOpposite.textContent = oppositePart ? `Copy ${oppositePart}` : "No opposite";
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-key]").forEach((input) => {
    const key = input.dataset.rigKey as RigNumericControlKey;

    input.value = `${anchorTuning[key]}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-number-key]").forEach((input) => {
    const key = input.dataset.rigNumberKey as RigNumericControlKey;
    const value = anchorTuning[key];

    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-rig-toggle-key]").forEach((input) => {
    const key = input.dataset.rigToggleKey as RigToggleControlKey;

    input.checked = anchorTuning[key];
  });
}

function syncFaceEditor(panel: HTMLElement): void {
  const faceEditor = panel.querySelector<HTMLElement>(".debug-rig-editor__face");

  if (faceEditor) {
    faceEditor.hidden = debugTuning.selectedRigPart !== "head";
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-face-key]").forEach((input) => {
    const partKey = input.dataset.facePart;
    const key = input.dataset.faceKey as FaceNumericControlKey;

    if (!isFacePartKey(partKey)) {
      return;
    }

    input.value = `${debugTuning.faceParts[partKey][key]}`;
  });

  panel.querySelectorAll<HTMLInputElement>("input[data-face-number-key]").forEach((input) => {
    const partKey = input.dataset.facePart;
    const key = input.dataset.faceNumberKey as FaceNumericControlKey;

    if (!isFacePartKey(partKey)) {
      return;
    }

    const value = debugTuning.faceParts[partKey][key];
    input.value = !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });
}

function syncAnimationEditor(panel: HTMLElement): void {
  const animation = getSelectedBodyAnimation();
  const animationSelect = panel.querySelector<HTMLSelectElement>(".debug-rig-editor__animation-select");
  const enabled = panel.querySelector<HTMLInputElement>("input[data-animation-enabled]");
  const duration = panel.querySelector<HTMLInputElement>("input[data-animation-duration]");
  const durationNumber = panel.querySelector<HTMLInputElement>("input[data-animation-duration-number]");

  if (animationSelect) {
    animationSelect.value = debugTuning.selectedBodyAnimation;
  }

  if (enabled) {
    enabled.checked = animation.enabled;
  }

  if (duration) {
    duration.value = `${animation.duration}`;
  }

  if (durationNumber) {
    durationNumber.value = `${animation.duration}`;
  }

  panel.querySelectorAll<HTMLInputElement>("input[data-animation-part-key]").forEach((input) => {
    const partKey = input.dataset.animationPartKey as RigPartKey;

    input.checked = animation.activeParts[partKey];
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
