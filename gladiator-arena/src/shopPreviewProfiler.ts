import { HERO_ITEM_CATALOG, type HeroEquipmentSlotKey, type HeroItemId } from "./hero";

interface ArmoryPreviewProfileProduct {
  id: string;
  name: string;
  itemIds: readonly HeroItemId[];
}

interface ArmoryFrameProfileStep {
  label: string;
  elapsedMs: number;
  durationMs: number;
}

interface ArmoryFrameProfileLongTask {
  elapsedMs: number;
  durationMs: number;
}

interface ActiveArmoryFrameProfile {
  id: number;
  productId: string;
  productName: string;
  itemIds: HeroItemId[];
  startedAt: number;
  lastMeasuredAt: number;
  steps: ArmoryFrameProfileStep[];
  longTasks: ArmoryFrameProfileLongTask[];
}

interface CompletedArmoryFrameProfile extends ActiveArmoryFrameProfile {
  reason: string;
  totalMs: number;
}

interface ArmoryFrameProfilerOverlayElements {
  root: HTMLElement;
  list: HTMLElement;
  clearButton: HTMLButtonElement;
}

const ARMORY_FRAME_PROFILE_SLOT_PAIRS: Array<readonly [HeroEquipmentSlotKey, HeroEquipmentSlotKey]> = [
  ["backShoulderguard", "frontShoulderguard"],
  ["backWrist", "frontWrist"],
  ["backGlove", "frontGlove"],
];

const ARMORY_FRAME_PROFILE_HISTORY_LIMIT = 3;
const ARMORY_FRAME_PROFILE_SAMPLE_COUNT = 4;
const ARMORY_FRAME_PROFILE_WARN_MS = 24;
const ARMORY_FRAME_PROFILE_HOT_MS = 45;
const ARMORY_FRAME_PROFILE_LONG_TASK_MIN_MS = 30;
const ARMORY_FRAME_PROFILE_PREFIX = "[armory frame profiler]";

let nextArmoryFrameProfileId = 0;
let armoryFrameProfileToken = 0;
let activeArmoryFrameProfile: ActiveArmoryFrameProfile | undefined;
let completedArmoryFrameProfiles: CompletedArmoryFrameProfile[] = [];
let overlayElements: ArmoryFrameProfilerOverlayElements | undefined;
let longTaskObserver: PerformanceObserver | undefined;

export function isArmoryPreviewProfileTarget(product: ArmoryPreviewProfileProduct): boolean {
  if (product.itemIds.length !== 2) {
    return false;
  }

  const items = product.itemIds.map((itemId) => HERO_ITEM_CATALOG[itemId]);

  if (items.some((item) => !item || item.kind !== "armor" || item.armorCategory !== "cloth")) {
    return false;
  }

  const slots = new Set(items.map((item) => item?.equipmentSlot));

  return ARMORY_FRAME_PROFILE_SLOT_PAIRS.some(([backSlot, frontSlot]) => slots.has(backSlot) && slots.has(frontSlot));
}

export function profileArmoryPreviewClick(product: ArmoryPreviewProfileProduct, callback: () => void): void {
  if (!isArmoryPreviewProfileTarget(product) || typeof performance === "undefined") {
    callback();
    return;
  }

  const profile = startArmoryFrameProfile(product);
  const logicStartedAt = performance.now();

  try {
    callback();
  } finally {
    const logicEndedAt = performance.now();

    pushArmoryFrameProfileStep(profile, "logic", logicStartedAt, logicEndedAt);
    scheduleArmoryFrameProfileSamples(profile, logicEndedAt);
  }
}

function startArmoryFrameProfile(product: ArmoryPreviewProfileProduct): ActiveArmoryFrameProfile {
  const startedAt = performance.now();

  if (activeArmoryFrameProfile) {
    finishArmoryFrameProfile(activeArmoryFrameProfile, "interrupted", startedAt);
  }

  armoryFrameProfileToken += 1;
  activeArmoryFrameProfile = {
    id: ++nextArmoryFrameProfileId,
    productId: product.id,
    productName: product.name,
    itemIds: [...product.itemIds],
    startedAt,
    lastMeasuredAt: startedAt,
    steps: [],
    longTasks: [],
  };

  ensureArmoryFrameLongTaskObserver();
  renderArmoryFrameProfilerOverlay();
  console.groupCollapsed(`${ARMORY_FRAME_PROFILE_PREFIX} #${activeArmoryFrameProfile.id} ${product.name}`);

  return activeArmoryFrameProfile;
}

function scheduleArmoryFrameProfileSamples(profile: ActiveArmoryFrameProfile, previousMeasuredAt: number, sampleIndex = 1): void {
  const token = armoryFrameProfileToken;

  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    finishArmoryFrameProfile(profile, "no raf", previousMeasuredAt);
    return;
  }

  window.requestAnimationFrame((frameStartedAt) => {
    if (token !== armoryFrameProfileToken || activeArmoryFrameProfile?.id !== profile.id) {
      return;
    }

    pushArmoryFrameProfileStep(profile, sampleIndex === 1 ? "to raf 1" : `raf ${sampleIndex - 1} -> ${sampleIndex}`, previousMeasuredAt, frameStartedAt);
    renderArmoryFrameProfilerOverlay();

    if (sampleIndex >= ARMORY_FRAME_PROFILE_SAMPLE_COUNT) {
      finishArmoryFrameProfile(profile, "frame profile complete", frameStartedAt);
      return;
    }

    scheduleArmoryFrameProfileSamples(profile, frameStartedAt, sampleIndex + 1);
  });
}

function pushArmoryFrameProfileStep(
  profile: ActiveArmoryFrameProfile,
  label: string,
  startedAt: number,
  endedAt: number,
): void {
  const durationMs = Math.max(0, endedAt - startedAt);

  profile.lastMeasuredAt = endedAt;
  profile.steps.push({
    label,
    elapsedMs: endedAt - profile.startedAt,
    durationMs,
  });
  console.log(`${label}: ${roundArmoryFrameProfileMs(durationMs)}ms`);
  renderArmoryFrameProfilerOverlay();
}

function finishArmoryFrameProfile(profile: ActiveArmoryFrameProfile, reason: string, endedAt = performance.now()): void {
  if (activeArmoryFrameProfile?.id === profile.id) {
    activeArmoryFrameProfile = undefined;
  }

  const completedProfile: CompletedArmoryFrameProfile = {
    ...profile,
    reason,
    totalMs: Math.max(0, endedAt - profile.startedAt),
  };

  console.log(`total: ${roundArmoryFrameProfileMs(completedProfile.totalMs)}ms`, {
    productId: profile.productId,
    itemIds: profile.itemIds,
    longTasks: profile.longTasks,
    reason,
  });
  console.groupEnd();

  completedArmoryFrameProfiles = [completedProfile, ...completedArmoryFrameProfiles].slice(0, ARMORY_FRAME_PROFILE_HISTORY_LIMIT);
  renderArmoryFrameProfilerOverlay();
}

function ensureArmoryFrameLongTaskObserver(): void {
  if (longTaskObserver || typeof PerformanceObserver === "undefined") {
    return;
  }

  try {
    longTaskObserver = new PerformanceObserver((list) => {
      const profile = activeArmoryFrameProfile;

      if (!profile) {
        return;
      }

      list.getEntries().forEach((entry) => {
        if (entry.duration < ARMORY_FRAME_PROFILE_LONG_TASK_MIN_MS) {
          return;
        }

        const elapsedMs = entry.startTime - profile.startedAt;

        if (elapsedMs < -1 || entry.startTime > profile.lastMeasuredAt + 200) {
          return;
        }

        profile.longTasks.push({ elapsedMs, durationMs: entry.duration });
      });
      renderArmoryFrameProfilerOverlay();
    });
    longTaskObserver.observe({ entryTypes: ["longtask"] });
  } catch {
    longTaskObserver = undefined;
  }
}

function renderArmoryFrameProfilerOverlay(): void {
  const elements = ensureArmoryFrameProfilerOverlay();

  if (!elements) {
    return;
  }

  const profiles = [
    ...(activeArmoryFrameProfile ? [createLiveArmoryFrameProfile(activeArmoryFrameProfile)] : []),
    ...completedArmoryFrameProfiles,
  ].slice(0, ARMORY_FRAME_PROFILE_HISTORY_LIMIT);

  elements.root.hidden = profiles.length === 0;
  elements.clearButton.disabled = profiles.length === 0;
  elements.list.replaceChildren(...profiles.map(createArmoryFrameProfileElement));
}

function ensureArmoryFrameProfilerOverlay(): ArmoryFrameProfilerOverlayElements | undefined {
  if (overlayElements || typeof document === "undefined") {
    return overlayElements;
  }

  const root = document.createElement("section");
  const header = document.createElement("div");
  const title = document.createElement("strong");
  const actions = document.createElement("div");
  const clearButton = document.createElement("button");
  const closeButton = document.createElement("button");
  const list = document.createElement("div");

  root.className = "armory-frame-profiler";
  root.hidden = true;
  root.setAttribute("aria-live", "polite");
  header.className = "armory-frame-profiler__header";
  title.textContent = "FRAME PROFILER";
  actions.className = "armory-frame-profiler__actions";
  clearButton.type = "button";
  clearButton.textContent = "CLEAR";
  clearButton.addEventListener("click", () => {
    completedArmoryFrameProfiles = [];
    if (!activeArmoryFrameProfile) {
      root.hidden = true;
    }
    renderArmoryFrameProfilerOverlay();
  });
  closeButton.type = "button";
  closeButton.textContent = "X";
  closeButton.setAttribute("aria-label", "Hide frame profiler");
  closeButton.addEventListener("click", () => {
    root.hidden = true;
  });
  list.className = "armory-frame-profiler__list";

  actions.append(clearButton, closeButton);
  header.append(title, actions);
  root.append(header, list);
  document.body.append(root);

  overlayElements = { root, list, clearButton };

  return overlayElements;
}

function createLiveArmoryFrameProfile(profile: ActiveArmoryFrameProfile): CompletedArmoryFrameProfile {
  return {
    ...profile,
    reason: "running",
    totalMs: performance.now() - profile.startedAt,
  };
}

function createArmoryFrameProfileElement(profile: CompletedArmoryFrameProfile): HTMLElement {
  const item = document.createElement("article");
  const title = document.createElement("div");
  const name = document.createElement("strong");
  const total = document.createElement("span");
  const reason = document.createElement("span");
  const steps = document.createElement("div");

  item.className = "armory-frame-profiler__profile";
  title.className = "armory-frame-profiler__profile-title";
  name.textContent = normalizeArmoryFrameProfileName(profile.productName);
  total.className = `armory-frame-profiler__total ${getArmoryFrameProfileSeverityClass(getWorstArmoryFrameProfileStep(profile))}`;
  total.textContent = `${roundArmoryFrameProfileMs(profile.totalMs)}ms`;
  reason.className = "armory-frame-profiler__reason";
  reason.textContent = getArmoryFrameProfileSummary(profile);
  steps.className = "armory-frame-profiler__steps";
  steps.append(
    ...(profile.steps.length > 0
      ? profile.steps.map(createArmoryFrameProfileStepElement)
      : [createArmoryFrameProfileEmptyStepElement("waiting for frames")]),
    ...profile.longTasks.map(createArmoryFrameProfileLongTaskElement),
  );
  title.append(name, total);
  item.append(title, reason, steps);

  return item;
}

function createArmoryFrameProfileStepElement(step: ArmoryFrameProfileStep): HTMLElement {
  const row = document.createElement("div");
  const label = document.createElement("span");
  const value = document.createElement("strong");

  row.className = `armory-frame-profiler__step ${getArmoryFrameProfileSeverityClass(step.durationMs)}`;
  label.textContent = step.label;
  value.textContent = `${roundArmoryFrameProfileMs(step.durationMs)}ms`;
  row.append(label, value);

  return row;
}

function createArmoryFrameProfileLongTaskElement(longTask: ArmoryFrameProfileLongTask): HTMLElement {
  const row = document.createElement("div");
  const label = document.createElement("span");
  const value = document.createElement("strong");

  row.className = `armory-frame-profiler__step ${getArmoryFrameProfileSeverityClass(longTask.durationMs)}`;
  label.textContent = `longtask +${roundArmoryFrameProfileMs(longTask.elapsedMs)}ms`;
  value.textContent = `${roundArmoryFrameProfileMs(longTask.durationMs)}ms`;
  row.append(label, value);

  return row;
}

function createArmoryFrameProfileEmptyStepElement(text: string): HTMLElement {
  const empty = document.createElement("div");

  empty.className = "armory-frame-profiler__empty";
  empty.textContent = text;

  return empty;
}

function getArmoryFrameProfileSummary(profile: CompletedArmoryFrameProfile): string {
  const worstStep = getWorstArmoryFrameProfileStep(profile);
  const longTaskTotal = profile.longTasks.reduce((total, longTask) => total + longTask.durationMs, 0);

  if (longTaskTotal > 0) {
    return `${profile.reason}, worst frame ${roundArmoryFrameProfileMs(worstStep)}ms, longtask ${roundArmoryFrameProfileMs(longTaskTotal)}ms`;
  }

  return `${profile.reason}, worst frame ${roundArmoryFrameProfileMs(worstStep)}ms`;
}

function getWorstArmoryFrameProfileStep(profile: CompletedArmoryFrameProfile): number {
  const frameSteps = profile.steps.filter((step) => step.label !== "logic");
  const stepDurations = frameSteps.length > 0 ? frameSteps.map((step) => step.durationMs) : profile.steps.map((step) => step.durationMs);
  const longTaskDurations = profile.longTasks.map((longTask) => longTask.durationMs);

  return Math.max(0, ...stepDurations, ...longTaskDurations);
}

function getArmoryFrameProfileSeverityClass(durationMs: number): string {
  if (durationMs >= ARMORY_FRAME_PROFILE_HOT_MS) {
    return "armory-frame-profiler__value--hot";
  }

  if (durationMs >= ARMORY_FRAME_PROFILE_WARN_MS) {
    return "armory-frame-profiler__value--warn";
  }

  return "";
}

function roundArmoryFrameProfileMs(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeArmoryFrameProfileName(value: string): string {
  return value
    .replace(/\s+01\b/gu, "")
    .replace(/\bshoulderguards?\b/giu, "Shoulders")
    .trim();
}
