import "./styles.css";

import { playRollSound } from "./audio.ts";
import {
  countFaces,
  countSuccesses,
  formatTarget,
  isRollTarget,
  normalizeDiceCount,
  rollDice,
} from "./dice.ts";
import {
  clearHistory,
  createRollRecord,
  loadHistory,
  prependHistory,
  type RollRecord,
  type StorageLike,
} from "./history.ts";
import { loadPreferences, persistPreferences, type BroDicePreferences } from "./preferences.ts";
import {
  createSharedRollUrl,
  formatShareText,
  parseSharedRollUrl,
  shareRoll,
} from "./sharing.ts";
import { setupTelegramAdapter } from "./telegram.ts";

const FACE_GLYPHS = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const;
const TARGETS = [2, 3, 4, 5, 6] as const;
const PRESET_COUNTS = [1, 2, 5, 10, 20, 50, 100] as const;
const ROLL_ANIMATION_MS = 560;

type RollSource = "fresh" | "history" | "shared";

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("BroDice app root is missing.");
const app: HTMLDivElement = appRoot;
const storage = getLocalStorage();
const telegram = setupTelegramAdapter();
let preferences: BroDicePreferences = loadPreferences(storage);
let diceCount = preferences.diceCount;
let target = preferences.target;
let soundEnabled = preferences.soundEnabled;
let history = loadHistory(storage);
let activeRoll: RollRecord | null = parseSharedRollUrl(window.location.href);
let rollSource: RollSource = activeRoll ? "shared" : "fresh";
let rolling = false;
let historyOpen = false;
let clearConfirmationOpen = false;
let toastMessage = "";
let rollTimer: number | null = null;
let toastTimer: number | null = null;

if (activeRoll) {
  diceCount = activeRoll.faces.length;
  target = activeRoll.target;
} else if (hasSharedRollParameter()) {
  removeSharedRollParameter();
  window.setTimeout(() => showToast("This shared roll link is invalid."), 0);
}

function render(): void {
  const counts = activeRoll ? countFaces(activeRoll.faces) : null;
  const successes = activeRoll ? countSuccesses(activeRoll.faces, target) : null;
  const sharedMode = rollSource === "shared" && activeRoll !== null;

  app.innerHTML = `
    <main class="app-shell ${rolling ? "is-rolling" : ""}">
      <header class="brand-bar">
        <div class="brand-mark" aria-hidden="true"><span>VI</span></div>
        <div class="brand-copy">
          <p class="eyebrow">TABLETOP DICE TERMINAL</p>
          <h1>Bro<span>Dice</span></h1>
        </div>
        <div class="header-actions">
          <button class="icon-button ${soundEnabled ? "active" : ""}" type="button" data-action="toggle-sound" aria-label="${soundEnabled ? "Mute roll sound" : "Enable roll sound"}" title="${soundEnabled ? "Sound on" : "Sound off"}">
            <span aria-hidden="true">${soundEnabled ? "♫" : "♪̸"}</span>
          </button>
          <button class="icon-button" type="button" data-action="open-history" aria-label="Open roll history" title="Roll history">
            <span aria-hidden="true">≡</span>
            ${history.length > 0 ? `<span class="history-badge">${history.length}</span>` : ""}
          </button>
        </div>
      </header>

      ${sharedMode ? renderSharedBanner() : renderControls()}
      ${renderResults(activeRoll, counts, successes, sharedMode)}

      <footer><span>BRODICE // CLIENT-ONLY ROLL</span><span>v0.1</span></footer>
    </main>
    ${historyOpen ? renderHistorySheet() : ""}
    ${toastMessage ? `<div class="toast" role="status">${toastMessage}</div>` : ""}
  `;

  bindEvents();
}

function renderControls(): string {
  return `
    <section class="control-panel" aria-labelledby="roll-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">D6 ROLL PROTOCOL</p>
          <h2 id="roll-heading">Set your roll</h2>
        </div>
        <span class="status-light">SECURE LOCAL RNG</span>
      </div>

      <div class="field-group">
        <span class="field-label">NUMBER OF DICE</span>
        <div class="stepper">
          <button type="button" data-action="decrement" aria-label="Remove one die" ${rolling ? "disabled" : ""}>−</button>
          <label>
            <span class="sr-only">Number of dice</span>
            <input id="dice-count" inputmode="numeric" type="number" min="1" max="100" value="${diceCount}" ${rolling ? "disabled" : ""} />
          </label>
          <button type="button" data-action="increment" aria-label="Add one die" ${rolling ? "disabled" : ""}>+</button>
        </div>
        <div class="presets" aria-label="Quick dice amounts">
          ${PRESET_COUNTS.map((value) => `
            <button class="${value === diceCount ? "active" : ""}" type="button" data-count="${value}" ${rolling ? "disabled" : ""}>${value}</button>
          `).join("")}
        </div>
      </div>

      <div class="field-group">
        <span class="field-label">SUCCESS TARGET</span>
        <div class="targets" role="group" aria-label="Minimum successful die result">
          ${TARGETS.map((value) => `
            <button class="${value === target ? "active" : ""}" type="button" data-target="${value}" aria-pressed="${value === target}" ${rolling ? "disabled" : ""}>
              ${value === 6 ? "6" : `${value}+`}
            </button>
          `).join("")}
        </div>
      </div>

      <button class="roll-button" type="button" data-action="roll" ${rolling ? "disabled" : ""}>
        <span class="roll-icon" aria-hidden="true">⚄</span>
        <span>${rolling ? "ROLLING…" : `ROLL ${diceCount}D6`}</span>
      </button>
    </section>
  `;
}

function renderSharedBanner(): string {
  return `
    <aside class="shared-banner">
      <span class="shared-icon" aria-hidden="true">!</span>
      <div>
        <strong>SHARED ROLL</strong>
        <p>Client generated · Not independently verified</p>
      </div>
    </aside>
  `;
}

function renderResults(
  record: RollRecord | null,
  counts: ReturnType<typeof countFaces> | null,
  successes: number | null,
  sharedMode: boolean,
): string {
  const sourceLabel = sharedMode ? "SHARED ROLL" : rollSource === "history" ? "HISTORICAL ROLL" : "ROLL RESULT";
  return `
    <section class="results-panel ${record ? "has-result" : ""}" aria-live="polite" aria-busy="${rolling}">
      <div class="result-summary">
        <p class="eyebrow">${sourceLabel}</p>
        ${rolling
          ? `<div class="rolling-display" aria-label="Rolling dice"><span>⚀</span><span>⚂</span><span>⚄</span></div><p class="result-note">Randomizing ${diceCount} dice…</p>`
          : successes === null
            ? `<p class="awaiting">AWAITING ROLL</p><p class="result-note">Choose your dice and engage the roller.</p>`
            : `<p class="success-count"><strong>${successes}</strong> ${successes === 1 ? "SUCCESS" : "SUCCESSES"}</p>
               <p class="result-note">Target ${formatTarget(target)} · ${record?.faces.length ?? diceCount} dice · ${formatTime(record?.createdAt)}</p>`}
      </div>

      <div class="face-grid" aria-label="Counts for dice faces one through six">
        ${FACE_GLYPHS.map((glyph, index) => {
          const face = index + 1;
          return `<article class="face-card ${face >= target ? "qualifies" : ""}">
            <span class="face-glyph" aria-hidden="true">${glyph}</span>
            <span class="face-label">FACE ${face}</span>
            <strong>${counts && !rolling ? counts[index] : "—"}</strong>
          </article>`;
        }).join("")}
      </div>

      ${record && !rolling ? `
        <details class="individual-results">
          <summary>Individual dice <span>${record.faces.length}</span></summary>
          <div class="dice-list" aria-label="Individual dice results">
            ${record.faces.map((face, index) => `<span class="die-chip ${face >= target ? "qualifies" : ""}" title="Die ${index + 1}: ${face}">${FACE_GLYPHS[face - 1]}<span class="sr-only">${face}</span></span>`).join("")}
          </div>
        </details>
        <div class="result-actions">
          ${sharedMode
            ? `<button class="primary-action" type="button" data-action="roll-own">ROLL YOUR OWN</button>`
            : `<button class="secondary-action" type="button" data-action="share">SHARE RESULT</button>`}
        </div>
      ` : ""}
    </section>
  `;
}

function renderHistorySheet(): string {
  return `
    <div class="sheet-backdrop" data-action="dismiss-history">
      <section class="history-sheet" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header class="sheet-header">
          <div>
            <p class="eyebrow">DEVICE STORAGE</p>
            <h2 id="history-title">Roll history</h2>
          </div>
          <button class="icon-button" type="button" data-action="close-history" aria-label="Close roll history">×</button>
        </header>

        ${history.length === 0
          ? `<div class="empty-history"><span aria-hidden="true">⚅</span><strong>NO ROLLS RECORDED</strong><p>Your latest 20 rolls will stay on this device.</p></div>`
          : `<div class="history-list">
              ${history.map(renderHistoryItem).join("")}
            </div>
            <div class="history-clear">
              ${clearConfirmationOpen
                ? `<p>Erase all local roll history?</p>
                   <div><button class="danger-action" type="button" data-action="confirm-clear">ERASE</button><button class="secondary-action" type="button" data-action="cancel-clear">CANCEL</button></div>`
                : `<button class="text-action" type="button" data-action="request-clear">CLEAR HISTORY</button>`}
            </div>`}
      </section>
    </div>
  `;
}

function renderHistoryItem(record: RollRecord): string {
  const counts = countFaces(record.faces);
  const successes = countSuccesses(record.faces, record.target);
  return `
    <article class="history-item">
      <button class="history-main" type="button" data-history-open="${record.id}">
        <span class="history-success"><strong>${successes}</strong><small>${formatTarget(record.target)}</small></span>
        <span class="history-copy">
          <strong>${record.faces.length}D6 · ${formatHistoryTime(record.createdAt)}</strong>
          <small>${counts.map((count, index) => `${index + 1}:${count}`).join("  ")}</small>
        </span>
      </button>
      <button class="reroll-button" type="button" data-history-reroll="${record.id}" aria-label="Roll ${record.faces.length} dice again with target ${formatTarget(record.target)}">↻</button>
    </article>
  `;
}

function bindEvents(): void {
  app.querySelector<HTMLButtonElement>('[data-action="toggle-sound"]')?.addEventListener("click", toggleSound);
  app.querySelector<HTMLButtonElement>('[data-action="open-history"]')?.addEventListener("click", openHistory);
  app.querySelector<HTMLButtonElement>('[data-action="decrement"]')?.addEventListener("click", () => setDiceCount(diceCount - 1));
  app.querySelector<HTMLButtonElement>('[data-action="increment"]')?.addEventListener("click", () => setDiceCount(diceCount + 1));
  app.querySelector<HTMLInputElement>("#dice-count")?.addEventListener("change", (event) => {
    setDiceCount((event.currentTarget as HTMLInputElement).value);
  });
  app.querySelector<HTMLInputElement>("#dice-count")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") (event.currentTarget as HTMLInputElement).blur();
  });
  app.querySelectorAll<HTMLButtonElement>("[data-count]").forEach((button) => {
    button.addEventListener("click", () => setDiceCount(button.dataset.count));
  });
  app.querySelectorAll<HTMLButtonElement>("[data-target]").forEach((button) => {
    button.addEventListener("click", () => setTarget(Number(button.dataset.target)));
  });
  app.querySelector<HTMLButtonElement>('[data-action="roll"]')?.addEventListener("click", startRoll);
  app.querySelector<HTMLButtonElement>('[data-action="share"]')?.addEventListener("click", () => void shareActiveRoll());
  app.querySelector<HTMLButtonElement>('[data-action="roll-own"]')?.addEventListener("click", leaveSharedRoll);

  app.querySelector<HTMLButtonElement>('[data-action="close-history"]')?.addEventListener("click", closeHistory);
  app.querySelector<HTMLElement>('[data-action="dismiss-history"]')?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeHistory();
  });
  app.querySelector<HTMLButtonElement>('[data-action="request-clear"]')?.addEventListener("click", () => {
    clearConfirmationOpen = true;
    render();
  });
  app.querySelector<HTMLButtonElement>('[data-action="cancel-clear"]')?.addEventListener("click", () => {
    clearConfirmationOpen = false;
    render();
  });
  app.querySelector<HTMLButtonElement>('[data-action="confirm-clear"]')?.addEventListener("click", confirmClearHistory);
  app.querySelectorAll<HTMLButtonElement>("[data-history-open]").forEach((button) => {
    button.addEventListener("click", () => openHistoryRecord(button.dataset.historyOpen));
  });
  app.querySelectorAll<HTMLButtonElement>("[data-history-reroll]").forEach((button) => {
    button.addEventListener("click", () => rerollHistoryRecord(button.dataset.historyReroll));
  });
}

function setDiceCount(value: unknown): void {
  if (rolling || rollSource === "shared") return;
  diceCount = normalizeDiceCount(value, preferences.diceCount);
  savePreferences();
  telegram.haptic("light");
  render();
}

function setTarget(value: number): void {
  if (rolling || rollSource === "shared" || !isRollTarget(value)) return;
  target = value;
  savePreferences();
  telegram.haptic("light");
  render();
}

function toggleSound(): void {
  soundEnabled = !soundEnabled;
  savePreferences();
  telegram.haptic("light");
  if (soundEnabled) void playRollSound();
  render();
}

function startRoll(): void {
  if (rolling || rollSource === "shared") return;
  rolling = true;
  rollSource = "fresh";
  telegram.haptic("medium");
  if (!telegram.isTelegram) vibrate(18);
  if (soundEnabled) void playRollSound();
  render();

  if (rollTimer !== null) window.clearTimeout(rollTimer);
  rollTimer = window.setTimeout(() => {
    rollTimer = null;
    try {
      const record = createRollRecord(rollDice(diceCount), target);
      activeRoll = record;
      history = prependHistory(storage, record, history);
      rolling = false;
      telegram.haptic("success");
      render();
    } catch {
      rolling = false;
      telegram.haptic("error");
      render();
      showToast("Secure random generation is unavailable.");
    }
  }, ROLL_ANIMATION_MS);
}

async function shareActiveRoll(): Promise<void> {
  if (!activeRoll || rolling || rollSource === "shared") return;
  const sharedUrl = createSharedRollUrl(window.location.href, activeRoll, target);
  const text = formatShareText(activeRoll, target);
  const outcome = await shareRoll(
    { title: "BroDice roll", text, url: sharedUrl },
    {
      telegramShare: telegram.share,
      nativeShare: typeof navigator.share === "function" ? (data) => navigator.share(data) : undefined,
      writeClipboard: copyText,
    },
  );
  if (outcome === "clipboard") showToast("Result link copied.");
  else if (outcome === "failed") showToast("Could not share this roll.");
}

function leaveSharedRoll(): void {
  removeSharedRollParameter();
  activeRoll = null;
  rollSource = "fresh";
  preferences = loadPreferences(storage);
  diceCount = preferences.diceCount;
  target = preferences.target;
  soundEnabled = preferences.soundEnabled;
  telegram.haptic("light");
  render();
}

function openHistory(): void {
  historyOpen = true;
  clearConfirmationOpen = false;
  telegram.haptic("light");
  render();
  window.setTimeout(() => app.querySelector<HTMLButtonElement>('[data-action="close-history"]')?.focus(), 0);
}

function closeHistory(): void {
  historyOpen = false;
  clearConfirmationOpen = false;
  render();
}

function openHistoryRecord(id: string | undefined): void {
  const record = history.find((candidate) => candidate.id === id);
  if (!record) return;
  activeRoll = record;
  rollSource = "history";
  diceCount = record.faces.length;
  target = record.target;
  historyOpen = false;
  clearConfirmationOpen = false;
  telegram.haptic("light");
  render();
}

function rerollHistoryRecord(id: string | undefined): void {
  const record = history.find((candidate) => candidate.id === id);
  if (!record) return;
  diceCount = record.faces.length;
  target = record.target;
  historyOpen = false;
  clearConfirmationOpen = false;
  savePreferences();
  render();
  startRoll();
}

function confirmClearHistory(): void {
  clearHistory(storage);
  history = Object.freeze([]);
  clearConfirmationOpen = false;
  telegram.haptic("success");
  render();
  showToast("Roll history cleared.");
}

function savePreferences(): void {
  preferences = Object.freeze({ diceCount, target, soundEnabled });
  persistPreferences(storage, preferences);
}

function showToast(message: string): void {
  toastMessage = message.slice(0, 160);
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  render();
  toastTimer = window.setTimeout(() => {
    toastMessage = "";
    toastTimer = null;
    render();
  }, 3_000);
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard is unavailable.");
}

function getLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function hasSharedRollParameter(): boolean {
  try {
    return new URL(window.location.href).searchParams.has("roll");
  } catch {
    return false;
  }
}

function removeSharedRollParameter(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("roll");
    url.hash = "";
    window.history.replaceState(null, "", url);
  } catch {
    // A malformed host URL does not block local rolling.
  }
}

function formatTime(value: number | undefined): string {
  if (!value) return "just now";
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(value);
}

function formatHistoryTime(value: number): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function vibrate(duration: number): void {
  try { navigator.vibrate?.(duration); } catch { /* Optional browser API. */ }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && historyOpen) closeHistory();
});
window.addEventListener("beforeunload", () => {
  if (rollTimer !== null) window.clearTimeout(rollTimer);
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  telegram.destroy();
}, { once: true });

render();
