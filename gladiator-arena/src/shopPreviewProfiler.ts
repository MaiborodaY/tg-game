import { HERO_ITEM_CATALOG, type HeroEquipmentSlotKey, type HeroItemId } from "./hero";

interface ArmoryPreviewProfileProduct {
  id: string;
  name: string;
  itemIds: readonly HeroItemId[];
}

interface ActiveArmoryPreviewProfile {
  id: number;
  productId: string;
  productName: string;
  itemIds: HeroItemId[];
  startedAt: number;
  spans: ArmoryPreviewProfileSpan[];
}

interface ArmoryPreviewProfileSpan {
  label: string;
  elapsedMs: number;
  durationMs: number;
  details?: Record<string, unknown>;
}

interface CompletedArmoryPreviewProfile {
  id: number;
  productId: string;
  productName: string;
  itemIds: HeroItemId[];
  reason: string;
  totalMs: number;
  spans: ArmoryPreviewProfileSpan[];
}

interface ArmoryPreviewProfilerOverlayElements {
  root: HTMLElement;
  list: HTMLElement;
  clearButton: HTMLButtonElement;
}

const ARMORY_PREVIEW_PROFILE_SLOT_PAIRS: Array<readonly [HeroEquipmentSlotKey, HeroEquipmentSlotKey]> = [
  ["backShoulderguard", "frontShoulderguard"],
  ["backWrist", "frontWrist"],
  ["backGlove", "frontGlove"],
];

const ARMORY_PREVIEW_PROFILE_PREFIX = "[armory paired profiler]";
const ARMORY_PREVIEW_PROFILE_HISTORY_LIMIT = 3;
const ARMORY_PREVIEW_PROFILE_VISIBLE_SPANS = 6;
const ARMORY_PREVIEW_PROFILE_WARN_MS = 24;
const ARMORY_PREVIEW_PROFILE_HOT_MS = 80;
let nextArmoryPreviewProfileId = 0;
let activeArmoryPreviewProfile: ActiveArmoryPreviewProfile | undefined;
let completedArmoryPreviewProfiles: CompletedArmoryPreviewProfile[] = [];
let overlayElements: ArmoryPreviewProfilerOverlayElements | undefined;

export function isArmoryPreviewProfileTarget(product: ArmoryPreviewProfileProduct): boolean {
  if (product.itemIds.length !== 2) {
    return false;
  }

  const items = product.itemIds.map((itemId) => HERO_ITEM_CATALOG[itemId]);

  if (items.some((item) => !item || item.kind !== "armor" || item.armorCategory !== "cloth")) {
    return false;
  }

  const slots = new Set(items.map((item) => item?.equipmentSlot));

  return ARMORY_PREVIEW_PROFILE_SLOT_PAIRS.some(([backSlot, frontSlot]) => slots.has(backSlot) && slots.has(frontSlot));
}

export function profileArmoryPreviewClick(product: ArmoryPreviewProfileProduct, callback: () => void): void {
  if (!isArmoryPreviewProfileTarget(product)) {
    callback();
    return;
  }

  ensureArmoryPreviewProfile(product, "ui.click");
  profileArmoryPreviewSpan("ui.click handler", callback);
}

export function ensureArmoryPreviewProfile(product: ArmoryPreviewProfileProduct, source: string): boolean {
  if (!isArmoryPreviewProfileTarget(product)) {
    return false;
  }

  if (activeArmoryPreviewProfile?.productId === product.id) {
    markArmoryPreviewProfile("profile.reuse", { source });
    return true;
  }

  finishArmoryPreviewProfile("interrupted by new profile");

  activeArmoryPreviewProfile = {
    id: ++nextArmoryPreviewProfileId,
    productId: product.id,
    productName: product.name,
    itemIds: [...product.itemIds],
    startedAt: performance.now(),
    spans: [],
  };

  console.groupCollapsed(`${ARMORY_PREVIEW_PROFILE_PREFIX} #${activeArmoryPreviewProfile.id} ${product.name}`);
  markArmoryPreviewProfile("profile.start", {
    source,
    itemIds: activeArmoryPreviewProfile.itemIds,
  });
  renderArmoryPreviewProfilerOverlay();

  return true;
}

export function profileArmoryPreviewSpan<T>(label: string, callback: () => T, details?: Record<string, unknown>): T {
  if (!activeArmoryPreviewProfile) {
    return callback();
  }

  const startedAt = performance.now();

  try {
    return callback();
  } finally {
    logArmoryPreviewSpan(label, startedAt, details);
  }
}

export function startArmoryPreviewSpan(label: string, details?: Record<string, unknown>): () => void {
  if (!activeArmoryPreviewProfile) {
    return () => undefined;
  }

  const startedAt = performance.now();

  return () => logArmoryPreviewSpan(label, startedAt, details);
}

export function markArmoryPreviewProfile(label: string, details?: Record<string, unknown>): void {
  if (!activeArmoryPreviewProfile) {
    return;
  }

  const elapsedMs = performance.now() - activeArmoryPreviewProfile.startedAt;

  console.log(formatArmoryPreviewProfileLine(label, elapsedMs), details ?? "");
  renderArmoryPreviewProfilerOverlay();
}

export function finishArmoryPreviewProfile(reason: string): void {
  if (!activeArmoryPreviewProfile) {
    return;
  }

  const elapsedMs = performance.now() - activeArmoryPreviewProfile.startedAt;
  const completedProfile: CompletedArmoryPreviewProfile = {
    id: activeArmoryPreviewProfile.id,
    productId: activeArmoryPreviewProfile.productId,
    productName: activeArmoryPreviewProfile.productName,
    itemIds: activeArmoryPreviewProfile.itemIds,
    reason,
    totalMs: elapsedMs,
    spans: [...activeArmoryPreviewProfile.spans],
  };

  console.log(formatArmoryPreviewProfileLine(`profile.end: ${reason}`, elapsedMs), {
    productId: activeArmoryPreviewProfile.productId,
    itemIds: activeArmoryPreviewProfile.itemIds,
    totalMs: roundArmoryPreviewProfileMs(elapsedMs),
  });
  console.groupEnd();
  activeArmoryPreviewProfile = undefined;
  completedArmoryPreviewProfiles = [completedProfile, ...completedArmoryPreviewProfiles].slice(0, ARMORY_PREVIEW_PROFILE_HISTORY_LIMIT);
  renderArmoryPreviewProfilerOverlay();
}

function logArmoryPreviewSpan(label: string, startedAt: number, details?: Record<string, unknown>): void {
  if (!activeArmoryPreviewProfile) {
    return;
  }

  const endedAt = performance.now();
  const elapsedMs = endedAt - activeArmoryPreviewProfile.startedAt;
  const durationMs = endedAt - startedAt;

  activeArmoryPreviewProfile.spans.push({
    label,
    elapsedMs,
    durationMs,
    details,
  });
  console.log(formatArmoryPreviewProfileLine(label, elapsedMs, durationMs), details ?? "");
  renderArmoryPreviewProfilerOverlay();
}

function formatArmoryPreviewProfileLine(label: string, elapsedMs: number, durationMs?: number): string {
  const elapsed = `${roundArmoryPreviewProfileMs(elapsedMs)}ms`;

  if (typeof durationMs !== "number") {
    return `${elapsed} ${label}`;
  }

  return `${elapsed} +${roundArmoryPreviewProfileMs(durationMs)}ms ${label}`;
}

function roundArmoryPreviewProfileMs(value: number): number {
  return Math.round(value * 100) / 100;
}

function renderArmoryPreviewProfilerOverlay(): void {
  const elements = ensureArmoryPreviewProfilerOverlay();

  if (!elements) {
    return;
  }

  const profiles = [
    ...(activeArmoryPreviewProfile ? [createLiveArmoryPreviewProfile(activeArmoryPreviewProfile)] : []),
    ...completedArmoryPreviewProfiles,
  ].slice(0, ARMORY_PREVIEW_PROFILE_HISTORY_LIMIT);

  elements.root.hidden = profiles.length === 0;
  elements.clearButton.disabled = profiles.length === 0;
  elements.list.replaceChildren(...profiles.map(createArmoryPreviewProfileElement));
}

function ensureArmoryPreviewProfilerOverlay(): ArmoryPreviewProfilerOverlayElements | undefined {
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

  root.className = "armory-preview-profiler";
  root.hidden = true;
  root.setAttribute("aria-live", "polite");
  header.className = "armory-preview-profiler__header";
  title.textContent = "ARM PROFILER";
  actions.className = "armory-preview-profiler__actions";
  clearButton.type = "button";
  clearButton.textContent = "CLEAR";
  clearButton.addEventListener("click", () => {
    completedArmoryPreviewProfiles = [];
    if (!activeArmoryPreviewProfile) {
      root.hidden = true;
    }
    renderArmoryPreviewProfilerOverlay();
  });
  closeButton.type = "button";
  closeButton.textContent = "X";
  closeButton.setAttribute("aria-label", "Hide arm profiler");
  closeButton.addEventListener("click", () => {
    root.hidden = true;
  });
  list.className = "armory-preview-profiler__list";

  actions.append(clearButton, closeButton);
  header.append(title, actions);
  root.append(header, list);
  document.body.append(root);

  overlayElements = { root, list, clearButton };

  return overlayElements;
}

function createLiveArmoryPreviewProfile(profile: ActiveArmoryPreviewProfile): CompletedArmoryPreviewProfile {
  return {
    id: profile.id,
    productId: profile.productId,
    productName: profile.productName,
    itemIds: profile.itemIds,
    reason: "running",
    totalMs: performance.now() - profile.startedAt,
    spans: [...profile.spans],
  };
}

function createArmoryPreviewProfileElement(profile: CompletedArmoryPreviewProfile): HTMLElement {
  const item = document.createElement("article");
  const title = document.createElement("div");
  const name = document.createElement("strong");
  const total = document.createElement("span");
  const reason = document.createElement("span");
  const spans = document.createElement("div");
  const topSpans = getTopArmoryPreviewProfileSpans(profile.spans);

  item.className = "armory-preview-profiler__profile";
  title.className = "armory-preview-profiler__profile-title";
  name.textContent = normalizeArmoryPreviewProfileName(profile.productName);
  total.className = `armory-preview-profiler__total ${getArmoryPreviewProfileSeverityClass(profile.totalMs)}`;
  total.textContent = `${roundArmoryPreviewProfileMs(profile.totalMs)}ms`;
  reason.className = "armory-preview-profiler__reason";
  reason.textContent = profile.reason;
  spans.className = "armory-preview-profiler__spans";
  spans.append(
    ...(topSpans.length > 0
      ? topSpans.map(createArmoryPreviewSpanElement)
      : [createArmoryPreviewEmptySpanElement(profile.reason === "running" ? "waiting..." : "no spans")]),
  );
  title.append(name, total);
  item.append(title, reason, spans);

  return item;
}

function createArmoryPreviewSpanElement(span: ArmoryPreviewProfileSpan): HTMLElement {
  const row = document.createElement("div");
  const label = document.createElement("span");
  const value = document.createElement("strong");

  row.className = `armory-preview-profiler__span ${getArmoryPreviewProfileSeverityClass(span.durationMs)}`;
  label.textContent = simplifyArmoryPreviewProfileLabel(span.label);
  value.textContent = `${roundArmoryPreviewProfileMs(span.durationMs)}ms`;
  row.append(label, value);

  return row;
}

function createArmoryPreviewEmptySpanElement(text: string): HTMLElement {
  const empty = document.createElement("div");

  empty.className = "armory-preview-profiler__empty";
  empty.textContent = text;

  return empty;
}

function getTopArmoryPreviewProfileSpans(spans: readonly ArmoryPreviewProfileSpan[]): ArmoryPreviewProfileSpan[] {
  return [...spans]
    .filter((span) => span.durationMs > 0)
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, ARMORY_PREVIEW_PROFILE_VISIBLE_SPANS);
}

function getArmoryPreviewProfileSeverityClass(durationMs: number): string {
  if (durationMs >= ARMORY_PREVIEW_PROFILE_HOT_MS) {
    return "armory-preview-profiler__value--hot";
  }

  if (durationMs >= ARMORY_PREVIEW_PROFILE_WARN_MS) {
    return "armory-preview-profiler__value--warn";
  }

  return "";
}

function normalizeArmoryPreviewProfileName(value: string): string {
  return value
    .replace(/\s+01\b/gu, "")
    .replace(/\bshoulderguards?\b/giu, "Shoulders")
    .trim();
}

function simplifyArmoryPreviewProfileLabel(label: string): string {
  return label
    .replace(/^paperDoll\./u, "")
    .replace(/^city\./u, "")
    .replace(/^main\./u, "")
    .replace(/^syncPlayerEquipment\./u, "")
    .replace(/^syncEquipmentVisibility\./u, "")
    .replace(/^syncEquipmentState\./u, "")
    .replace(/^previewPlayerEquipment\./u, "")
    .replace(/^previewShopEquipment\./u, "")
    .replace(/^slot\./u, "")
    .replace(/\.syncVisibleSlot$/u, " visible")
    .replace(/\.getTextureKey$/u, " key")
    .replace(/\.applyCityHeroLighting$/u, " lighting")
    .replace(/\.syncPaperDollEquipmentState$/u, " sync rig")
    .replace(/paired\./u, "")
    .replace(/[._]/gu, " ");
}
