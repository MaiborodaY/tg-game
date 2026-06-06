import {
  BODY_ANIMATION_KEYS,
  DEFAULT_BODY_ANIMATIONS,
  debugTuning,
  defaultDebugTuning,
  defaultFacePartTuning,
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
type CharacterPreviewControlKey = "characterPreviewScale" | "characterPreviewFeetX" | "characterPreviewFeetY";
type FaceNumericControlKey = keyof FacePartTuning;
type RigNudgeAction = "left" | "right" | "up" | "down" | "rotateLeft" | "rotateRight" | "scaleDown" | "scaleUp";
type RigLimbKey = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
type AnimationApplyScope = "selected" | "checked" | "all";

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

interface RigLimbRotateConfig {
  key: RigLimbKey;
  label: string;
  anchor: RigPartKey;
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
  { key: "x", label: "x", min: -240, max: 240, step: 1 },
  { key: "y", label: "y", min: -240, max: 240, step: 1 },
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
  { key: "characterPreviewFeetX", label: "feet X", min: 0, max: 430, step: 1 },
  { key: "characterPreviewFeetY", label: "feet Y", min: 560, max: 740, step: 1 },
];

const faceNumericControls: FaceNumericControlConfig[] = [
  { key: "x", label: "x", min: -40, max: 40, step: 0.5 },
  { key: "y", label: "y", min: -40, max: 40, step: 0.5 },
  { key: "scaleX", label: "scaleX", min: 0.1, max: 3, step: 0.01 },
  { key: "scaleY", label: "scaleY", min: 0.1, max: 3, step: 0.01 },
];

const rigLimbRotateConfigs: RigLimbRotateConfig[] = [
  { key: "leftArm", label: "Left arm", anchor: "backUpperArm", parts: ["backUpperArm", "backForearm", "backHand"] },
  { key: "rightArm", label: "Right arm", anchor: "frontUpperArm", parts: ["frontUpperArm", "frontForearm", "frontHand"] },
  { key: "leftLeg", label: "Left leg", anchor: "backThigh", parts: ["backThigh", "backShin", "backFoot"] },
  { key: "rightLeg", label: "Right leg", anchor: "frontThigh", parts: ["frontThigh", "frontShin", "frontFoot"] },
];

const rigPartRootPivots: Record<RigPartKey, { x: number; y: number }> = {
  head: { x: 0, y: -205 },
  torso: { x: 0, y: -84 },
  backUpperArm: { x: -43, y: -180 },
  backForearm: { x: -58, y: -115 },
  backHand: { x: -64, y: -55 },
  frontUpperArm: { x: 43, y: -180 },
  frontForearm: { x: 58, y: -115 },
  frontHand: { x: 64, y: -55 },
  backThigh: { x: -25, y: -78 },
  backShin: { x: -31, y: -40 },
  backFoot: { x: -38, y: -7 },
  frontThigh: { x: 25, y: -78 },
  frontShin: { x: 31, y: -40 },
  frontFoot: { x: 38, y: -7 },
};

let activeNudgeStep = 5;
let activeAnimationCaptureScope: AnimationApplyScope = "selected";
let activeAnimationApplyScope: AnimationApplyScope = "selected";

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
        <label class="debug-rig-editor__part">
          <span>Part</span>
          <select class="debug-rig-editor__select"></select>
        </label>
        <div class="debug-rig-editor__controls"></div>
        <div class="debug-rig-editor__actions">
          <button class="debug-panel__reset debug-rig-editor__copy-opposite" type="button">Copy opposite</button>
          <button class="debug-panel__reset debug-rig-editor__reset" type="button">Reset selected</button>
        </div>
        <button class="debug-panel__reset debug-rig-editor__reset-all-parts" type="button">Reset all parts</button>
        <fieldset class="debug-rig-editor__limbs">
          <legend>Limb rotate</legend>
          <div class="debug-rig-editor__limb-grid"></div>
        </fieldset>
        <fieldset class="debug-rig-editor__face" hidden>
          <legend>Head face</legend>
          <div class="debug-rig-editor__face-controls"></div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__face-reset" type="button">Reset eyes</button>
          </div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__capture-face-base" type="button">Capture face base</button>
            <button class="debug-panel__reset debug-rig-editor__capture-face-breath" type="button">Capture face breath</button>
          </div>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__apply-face-base" type="button">Apply face base</button>
            <button class="debug-panel__reset debug-rig-editor__apply-face-breath" type="button">Apply face breath</button>
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
          <fieldset class="debug-rig-editor__capture-scope">
            <legend>Capture to</legend>
            <div class="debug-rig-editor__capture-scope-options" role="group" aria-label="Animation capture scope">
              <button class="debug-panel__reset" type="button" data-animation-capture-scope="selected">Selected</button>
              <button class="debug-panel__reset" type="button" data-animation-capture-scope="checked">Checked</button>
              <button class="debug-panel__reset" type="button" data-animation-capture-scope="all">All</button>
            </div>
          </fieldset>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__capture-base" type="button">Capture base</button>
            <button class="debug-panel__reset debug-rig-editor__capture-breath" type="button">Capture breath</button>
          </div>
          <fieldset class="debug-rig-editor__apply-scope">
            <legend>Apply to</legend>
            <div class="debug-rig-editor__apply-scope-options" role="group" aria-label="Animation apply scope">
              <button class="debug-panel__reset" type="button" data-animation-apply-scope="selected">Selected</button>
              <button class="debug-panel__reset" type="button" data-animation-apply-scope="checked">Checked</button>
              <button class="debug-panel__reset" type="button" data-animation-apply-scope="all">All</button>
            </div>
          </fieldset>
          <div class="debug-rig-editor__actions">
            <button class="debug-panel__reset debug-rig-editor__apply-base" type="button">Apply base</button>
            <button class="debug-panel__reset debug-rig-editor__apply-breath" type="button">Apply breath</button>
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

  const previewToolbar = createPreviewToolbar();
  const nudgeToolbar = createNudgeToolbar();
  const previewTools = createPreviewTools(previewToolbar, nudgeToolbar);
  const previewColumn = document.querySelector<HTMLElement>(".debug-preview-column");

  if (previewColumn) {
    previewColumn.prepend(previewTools);
  } else {
    previewTools.classList.add("debug-preview-tools--inline");
    rigEditor.prepend(previewTools);
  }

  mountPreviewToolbar(previewToolbar);
  mountRigEditor(rigEditor);
  mountNudgeToolbar(nudgeToolbar);
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

function createPreviewTools(...items: HTMLElement[]): HTMLElement {
  const tools = document.createElement("div");
  tools.className = "debug-preview-tools";
  tools.append(...items);

  return tools;
}

function createPreviewToolbar(): HTMLElement {
  const toolbar = document.createElement("aside");
  toolbar.className = "debug-preview-toolbar";
  toolbar.setAttribute("aria-label", "Rig preview controls");
  toolbar.innerHTML = `
    <fieldset class="debug-preview-toolbar__group">
      <legend>Preview</legend>
      <div class="debug-preview-toolbar__controls"></div>
      <div class="debug-preview-toolbar__actions">
        <button class="debug-panel__reset debug-preview-toolbar__rotate-left" type="button">Rot doll -</button>
        <button class="debug-panel__reset debug-preview-toolbar__rotate-right" type="button">Rot doll +</button>
      </div>
    </fieldset>
  `;

  return toolbar;
}

function mountPreviewToolbar(toolbar: HTMLElement): void {
  const controls = toolbar.querySelector<HTMLElement>(".debug-preview-toolbar__controls");
  const rotateLeft = toolbar.querySelector<HTMLButtonElement>(".debug-preview-toolbar__rotate-left");
  const rotateRight = toolbar.querySelector<HTMLButtonElement>(".debug-preview-toolbar__rotate-right");

  if (!controls || !rotateLeft || !rotateRight) {
    return;
  }

  characterPreviewControls.forEach((control) => controls.append(createCharacterPreviewRangeControl(control)));

  rotateLeft.addEventListener("click", () => {
    rotatePaperDoll(-5);
  });

  rotateRight.addEventListener("click", () => {
    rotatePaperDoll(5);
  });
}

function createNudgeToolbar(): HTMLElement {
  const toolbar = document.createElement("aside");
  toolbar.className = "debug-nudge-toolbar";
  toolbar.setAttribute("aria-label", "Rig nudge controls");
  toolbar.innerHTML = `
    <fieldset class="debug-nudge-toolbar__group">
      <legend>Nudge</legend>
      <div class="debug-nudge-toolbar__steps" role="group" aria-label="Nudge step">
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-step="1">1</button>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-step="5">5</button>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-step="10">10</button>
      </div>
      <div class="debug-nudge-toolbar__grid" role="group" aria-label="Nudge selected part position">
        <span class="debug-nudge-toolbar__empty"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="up">&uarr;</button>
        <span class="debug-nudge-toolbar__empty"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="left">&larr;</button>
        <span class="debug-nudge-toolbar__center"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="right">&rarr;</button>
        <span class="debug-nudge-toolbar__empty"></span>
        <button class="debug-panel__reset debug-nudge-toolbar__button" type="button" data-nudge-action="down">&darr;</button>
        <span class="debug-nudge-toolbar__empty"></span>
      </div>
      <div class="debug-nudge-toolbar__actions">
        <button class="debug-panel__reset" type="button" data-nudge-action="rotateLeft">Rot -</button>
        <button class="debug-panel__reset" type="button" data-nudge-action="rotateRight">Rot +</button>
      </div>
      <div class="debug-nudge-toolbar__actions">
        <button class="debug-panel__reset" type="button" data-nudge-action="scaleDown">Scl -</button>
        <button class="debug-panel__reset" type="button" data-nudge-action="scaleUp">Scl +</button>
      </div>
    </fieldset>
  `;

  return toolbar;
}

function mountNudgeToolbar(toolbar: HTMLElement): void {
  toolbar.querySelectorAll<HTMLButtonElement>("button[data-nudge-step]").forEach((button) => {
    button.addEventListener("click", () => {
      activeNudgeStep = Number(button.dataset.nudgeStep) || activeNudgeStep;
      syncNudgeControls();
    });
  });

  toolbar.querySelectorAll<HTMLButtonElement>("button[data-nudge-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.nudgeAction;

      if (isRigNudgeAction(action)) {
        nudgeSelectedRigPart(action);
      }
    });
  });
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
  const select = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__select");
  const controls = editor.querySelector<HTMLElement>(".debug-rig-editor__controls");
  const limbGrid = editor.querySelector<HTMLElement>(".debug-rig-editor__limb-grid");
  const faceControls = editor.querySelector<HTMLElement>(".debug-rig-editor__face-controls");
  const copyOpposite = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const resetAllParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__reset-all-parts");
  const resetFace = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__face-reset");
  const captureFaceBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-face-base");
  const captureFaceBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-face-breath");
  const applyFaceBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-face-base");
  const applyFaceBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-face-breath");
  const animationSelect = editor.querySelector<HTMLSelectElement>(".debug-rig-editor__animation-select");
  const animationEnabled = editor.querySelector<HTMLInputElement>("input[data-animation-enabled]");
  const animationDuration = editor.querySelector<HTMLInputElement>("input[data-animation-duration]");
  const animationDurationNumber = editor.querySelector<HTMLInputElement>("input[data-animation-duration-number]");
  const animationParts = editor.querySelector<HTMLElement>("[data-animation-parts]");
  const idleAllParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-all");
  const idleNoParts = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__idle-none");
  const captureScopeButtons = [...editor.querySelectorAll<HTMLButtonElement>("button[data-animation-capture-scope]")];
  const captureBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-base");
  const captureBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__capture-breath");
  const applyScopeButtons = [...editor.querySelectorAll<HTMLButtonElement>("button[data-animation-apply-scope]")];
  const applyBase = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-base");
  const applyBreath = editor.querySelector<HTMLButtonElement>(".debug-rig-editor__apply-breath");

  if (
    !select ||
    !controls ||
    !limbGrid ||
    !faceControls ||
    !copyOpposite ||
    !reset ||
    !resetAllParts ||
    !resetFace ||
    !captureFaceBase ||
    !captureFaceBreath ||
    !applyFaceBase ||
    !applyFaceBreath ||
    !animationSelect ||
    !animationEnabled ||
    !animationDuration ||
    !animationDurationNumber ||
    !animationParts ||
    !idleAllParts ||
    !idleNoParts ||
    captureScopeButtons.length === 0 ||
    !captureBase ||
    !captureBreath ||
    applyScopeButtons.length === 0 ||
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

  BODY_ANIMATION_KEYS.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    animationSelect.append(option);
  });

  rigNumericControls.forEach((control) => controls.append(createRigRangeControl(control)));
  rigToggleControls.forEach((control) => controls.append(createRigToggleControl(control)));
  rigLimbRotateConfigs.forEach((config) => limbGrid.append(createLimbRotateControl(config)));
  FACE_PART_KEYS.forEach((key) => faceControls.append(createFacePartEditor(key)));
  RIG_PART_KEYS.forEach((key) => animationParts.append(createAnimationPartToggle(key)));

  select.addEventListener("change", () => {
    updateDebugTuning({ selectedRigPart: select.value as RigPartKey });
  });

  reset.addEventListener("click", () => {
    resetSelectedRigPart();
  });

  resetAllParts.addEventListener("click", () => {
    resetAllRigParts();
  });

  resetFace.addEventListener("click", () => {
    resetFaceParts();
  });

  captureFaceBase.addEventListener("click", () => {
    updateAnimationFacePose("base");
  });

  captureFaceBreath.addEventListener("click", () => {
    updateAnimationFacePose("breath");
  });

  applyFaceBase.addEventListener("click", () => {
    applyAnimationFacePose("base");
  });

  applyFaceBreath.addEventListener("click", () => {
    applyAnimationFacePose("breath");
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

  captureScopeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const scope = button.dataset.animationCaptureScope;

      if (isAnimationApplyScope(scope)) {
        activeAnimationCaptureScope = scope;
        syncAnimationCaptureScopeControls();
      }
    });
  });

  captureBase.addEventListener("click", () => {
    updateAnimationPose("base");
  });

  captureBreath.addEventListener("click", () => {
    updateAnimationPose("breath");
  });

  applyScopeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const scope = button.dataset.animationApplyScope;

      if (isAnimationApplyScope(scope)) {
        activeAnimationApplyScope = scope;
        syncAnimationApplyScopeControls();
      }
    });
  });

  applyBase.addEventListener("click", () => {
    applyAnimationPose("base");
  });

  applyBreath.addEventListener("click", () => {
    applyAnimationPose("breath");
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

function createLimbRotateControl(config: RigLimbRotateConfig): HTMLElement {
  const row = document.createElement("div");
  row.className = "debug-rig-editor__limb-row";
  row.innerHTML = `
    <span>${config.label}</span>
    <button class="debug-panel__reset" type="button" data-limb-rotate="${config.key}" data-limb-direction="-1">-</button>
    <button class="debug-panel__reset" type="button" data-limb-rotate="${config.key}" data-limb-direction="1">+</button>
  `;

  row.querySelectorAll<HTMLButtonElement>("button[data-limb-rotate]").forEach((button) => {
    button.addEventListener("click", () => {
      const limbKey = button.dataset.limbRotate;
      const direction = button.dataset.limbDirection === "-1" ? -1 : 1;

      if (isRigLimbKey(limbKey)) {
        rotateRigLimb(limbKey, activeNudgeStep * direction);
      }
    });
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
  updateRigPartTuning(debugTuning.selectedRigPart, { [key]: clampRigNumericValue(key, value) } as Partial<RigPartTuning>);
}

function updateRigToggleTuning(key: RigToggleControlKey, value: boolean): void {
  updateRigPartTuning(debugTuning.selectedRigPart, { [key]: value } as Partial<RigPartTuning>);
}

function nudgeSelectedRigPart(action: RigNudgeAction): void {
  const step = activeNudgeStep;

  if (action === "left") {
    updateSelectedRigPart((current) => ({ x: clampRigNumericValue("x", current.x - step) }));
    return;
  }

  if (action === "right") {
    updateSelectedRigPart((current) => ({ x: clampRigNumericValue("x", current.x + step) }));
    return;
  }

  if (action === "up") {
    updateSelectedRigPart((current) => ({ y: clampRigNumericValue("y", current.y - step) }));
    return;
  }

  if (action === "down") {
    updateSelectedRigPart((current) => ({ y: clampRigNumericValue("y", current.y + step) }));
    return;
  }

  if (action === "rotateLeft") {
    updateSelectedRigPart((current) => ({ angle: clampRigNumericValue("angle", current.angle - step) }));
    return;
  }

  if (action === "rotateRight") {
    updateSelectedRigPart((current) => ({ angle: clampRigNumericValue("angle", current.angle + step) }));
    return;
  }

  const scaleDelta = step / 100;

  if (action === "scaleDown") {
    updateSelectedRigPart((current) => ({
      scaleX: clampRigNumericValue("scaleX", current.scaleX - scaleDelta),
      scaleY: clampRigNumericValue("scaleY", current.scaleY - scaleDelta),
    }));
    return;
  }

  updateSelectedRigPart((current) => ({
    scaleX: clampRigNumericValue("scaleX", current.scaleX + scaleDelta),
    scaleY: clampRigNumericValue("scaleY", current.scaleY + scaleDelta),
  }));
}

function updateSelectedRigPart(getPatch: (current: RigPartTuning, partKey: RigPartKey) => Partial<RigPartTuning>): void {
  const partKey = debugTuning.selectedRigPart;
  const current = debugTuning.rigParts[partKey];

  updateRigPartTuning(partKey, {
    ...getPatch(current, partKey),
  });
}

function rotatePaperDoll(degrees: number): void {
  const radians = (degrees * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const nextRigParts = { ...debugTuning.rigParts };

  RIG_PART_KEYS.forEach((partKey) => {
    const current = debugTuning.rigParts[partKey];
    const pivot = rigPartRootPivots[partKey];
    const localX = pivot.x + current.x;
    const localY = pivot.y + current.y;
    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;

    nextRigParts[partKey] = {
      ...current,
      x: clampRigNumericValue("x", rotatedX - pivot.x),
      y: clampRigNumericValue("y", rotatedY - pivot.y),
      angle: clampRigNumericValue("angle", current.angle + degrees),
    };
  });

  updateDebugTuning({ rigParts: nextRigParts });
}

function rotateRigLimb(limbKey: RigLimbKey, degrees: number): void {
  const config = rigLimbRotateConfigs.find((item) => item.key === limbKey);

  if (!config) {
    return;
  }

  const radians = (degrees * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const anchorPivot = rigPartRootPivots[config.anchor];
  const anchorTuning = debugTuning.rigParts[config.anchor];
  const originX = anchorPivot.x + anchorTuning.x;
  const originY = anchorPivot.y + anchorTuning.y;
  const nextRigParts = { ...debugTuning.rigParts };

  config.parts.forEach((partKey) => {
    const current = debugTuning.rigParts[partKey];
    const pivot = rigPartRootPivots[partKey];
    const localX = pivot.x + current.x;
    const localY = pivot.y + current.y;
    const offsetX = localX - originX;
    const offsetY = localY - originY;
    const rotatedX = originX + offsetX * cos - offsetY * sin;
    const rotatedY = originY + offsetX * sin + offsetY * cos;

    nextRigParts[partKey] = {
      ...current,
      x: clampRigNumericValue("x", rotatedX - pivot.x),
      y: clampRigNumericValue("y", rotatedY - pivot.y),
      angle: clampRigNumericValue("angle", current.angle + degrees),
    };
  });

  updateDebugTuning({ rigParts: nextRigParts });
}

function resetSelectedRigPart(): void {
  updateRigPartTuning(debugTuning.selectedRigPart, { ...getNeutralRigPartDefaults()[debugTuning.selectedRigPart] });
}

function resetAllRigParts(): void {
  updateDebugTuning({
    rigParts: getNeutralRigPartDefaults(),
    selectedBodyAnimation: "idle",
  });
}

function getNeutralRigPartDefaults(): Record<RigPartKey, RigPartTuning> {
  const neutralParts = DEFAULT_BODY_ANIMATIONS.idle.base;

  return Object.fromEntries(RIG_PART_KEYS.map((partKey) => [partKey, { ...neutralParts[partKey] }])) as Record<RigPartKey, RigPartTuning>;
}

function isRigNudgeAction(value: string | undefined): value is RigNudgeAction {
  return (
    value === "left" ||
    value === "right" ||
    value === "up" ||
    value === "down" ||
    value === "rotateLeft" ||
    value === "rotateRight" ||
    value === "scaleDown" ||
    value === "scaleUp"
  );
}

function isRigLimbKey(value: string | undefined): value is RigLimbKey {
  return rigLimbRotateConfigs.some((config) => config.key === value);
}

function isAnimationApplyScope(value: string | undefined): value is AnimationApplyScope {
  return value === "selected" || value === "checked" || value === "all";
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

  return clampNumber(value, -240, 240);
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

function updateAnimationPose(poseKey: "base" | "breath"): void {
  const animation = getSelectedBodyAnimation();
  const pose = animation[poseKey];
  const nextPose = { ...pose };

  getAnimationCaptureParts(animation).forEach((partKey) => {
    nextPose[partKey] = { ...debugTuning.rigParts[partKey] };
  });

  if (poseKey === "base") {
    updateSelectedBodyAnimation({ base: nextPose });
    return;
  }

  updateSelectedBodyAnimation({ breath: nextPose });
}

function applyAnimationPose(poseKey: "base" | "breath"): void {
  const animation = getSelectedBodyAnimation();
  const pose = animation[poseKey];
  const nextRigParts = { ...debugTuning.rigParts };

  getAnimationApplyParts(animation).forEach((partKey) => {
    nextRigParts[partKey] = { ...pose[partKey] };
  });

  updateDebugTuning({ rigParts: nextRigParts });
}

function updateAnimationFacePose(poseKey: "base" | "breath"): void {
  const facePoseKey = getAnimationFacePoseKey(poseKey);

  updateSelectedBodyAnimation({
    [facePoseKey]: cloneCurrentFaceParts(),
  });
}

function applyAnimationFacePose(poseKey: "base" | "breath"): void {
  const facePoseKey = getAnimationFacePoseKey(poseKey);

  updateDebugTuning({
    faceParts: cloneFaceParts(getSelectedBodyAnimation()[facePoseKey]),
  });
}

function getAnimationFacePoseKey(poseKey: "base" | "breath"): "faceBase" | "faceBreath" {
  return poseKey === "base" ? "faceBase" : "faceBreath";
}

function cloneCurrentFaceParts(): Record<FacePartKey, FacePartTuning> {
  return cloneFaceParts(debugTuning.faceParts);
}

function cloneFaceParts(source: Record<FacePartKey, FacePartTuning>): Record<FacePartKey, FacePartTuning> {
  return Object.fromEntries(FACE_PART_KEYS.map((key) => [key, { ...source[key] }])) as Record<FacePartKey, FacePartTuning>;
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

function getAnimationCaptureParts(animation: BodyAnimationTuning): RigPartKey[] {
  if (activeAnimationCaptureScope === "all") {
    return [...RIG_PART_KEYS];
  }

  if (activeAnimationCaptureScope === "checked") {
    return RIG_PART_KEYS.filter((partKey) => animation.activeParts[partKey]);
  }

  return [debugTuning.selectedRigPart];
}

function getAnimationApplyParts(animation: BodyAnimationTuning): RigPartKey[] {
  if (activeAnimationApplyScope === "all") {
    return [...RIG_PART_KEYS];
  }

  if (activeAnimationApplyScope === "checked") {
    return RIG_PART_KEYS.filter((partKey) => animation.activeParts[partKey]);
  }

  return [debugTuning.selectedRigPart];
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
  syncInputs();
  syncRigEditor(panel);
  syncFaceEditor(panel);
  syncAnimationEditor(panel);
  syncAnimationCaptureScopeControls();
  syncAnimationApplyScopeControls();
  syncNudgeControls();
  syncGrid();
}

function syncModeTabs(panel: HTMLElement): void {
  const mode: DebugMode = document.body.classList.contains("debug-mode-arena") ? "arena" : "character";

  panel.querySelectorAll<HTMLButtonElement>("button[data-debug-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.debugMode === mode}`);
  });
}

function syncInputs(): void {
  document.querySelectorAll<HTMLInputElement>("input[data-debug-key]").forEach((input) => {
    const key = input.dataset.debugKey as keyof ArenaDebugTuning;
    const value = debugTuning[key];

    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = `${value}`;
    }
  });

  document.querySelectorAll<HTMLInputElement>("input[data-debug-number-key]").forEach((input) => {
    const key = input.dataset.debugNumberKey as keyof ArenaDebugTuning;
    const value = debugTuning[key];

    input.value = typeof value === "number" && !Number.isInteger(value) ? value.toFixed(2) : `${value}`;
  });
}

function syncRigEditor(panel: HTMLElement): void {
  const select = panel.querySelector<HTMLSelectElement>(".debug-rig-editor__select");
  const copyOpposite = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__copy-opposite");
  const reset = panel.querySelector<HTMLButtonElement>(".debug-rig-editor__reset");
  const selectedPart = debugTuning.selectedRigPart;
  const selectedTuning = debugTuning.rigParts[selectedPart];

  if (!select || !selectedTuning) {
    return;
  }

  select.value = selectedPart;

  if (reset) {
    reset.textContent = "Reset selected";
  }

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

function syncAnimationCaptureScopeControls(): void {
  document.querySelectorAll<HTMLButtonElement>("button[data-animation-capture-scope]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.animationCaptureScope === activeAnimationCaptureScope}`);
  });
}

function syncAnimationApplyScopeControls(): void {
  document.querySelectorAll<HTMLButtonElement>("button[data-animation-apply-scope]").forEach((button) => {
    button.setAttribute("aria-pressed", `${button.dataset.animationApplyScope === activeAnimationApplyScope}`);
  });
}

function syncNudgeControls(): void {
  document.querySelectorAll<HTMLButtonElement>("button[data-nudge-step]").forEach((button) => {
    button.setAttribute("aria-pressed", `${Number(button.dataset.nudgeStep) === activeNudgeStep}`);
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
