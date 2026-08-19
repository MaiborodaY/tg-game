import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");

test("daily challenge resolves the current UTC identity at click time and always uses the strong bot", () => {
  assert.match(
    mainSource,
    /function startDailyChallenge\(\): void \{\s*const challenge = createTodayDailyChallenge\(\);[\s\S]*?botDifficulty: "strong"[\s\S]*?dailyDateKey: challenge\.dateKey/,
  );
  assert.match(
    mainSource,
    /document\.addEventListener\("visibilitychange", \(\) => \{[\s\S]*?document\.visibilityState === "visible"[\s\S]*?uiState\.mode === "menu"[\s\S]*?render\(\)/,
  );
});

test("solo completion persists its stable receipt before idempotent history recording", () => {
  assert.match(
    mainSource,
    /completeSoloRunSession\(currentSoloSession,[\s\S]*?soloSession,[\s\S]*?persistSoloRun\(\);\s*if \(nextRun\.status === "finished"\) \{\s*ensureFinishedSoloRunRecorded\(\)/,
  );
  assert.match(
    mainSource,
    /if \(restoredSoloRun\?\.checkpoint === "finished"\) \{\s*ensureFinishedSoloRunRecorded\(\)/,
  );
  assert.match(
    mainSource,
    /function ensureFinishedSoloRunRecorded\(\): boolean \{[\s\S]*?uiState\.playMode !== "solo"[\s\S]*?recordSoloRunSummary\(runHistoryStorage, summary\)[\s\S]*?queueSoloRunSummary\(runHistoryStorage, summary\)[\s\S]*?return false/,
  );
  assert.match(
    mainSource,
    /saveSoloRunSnapshot\(soloRunStorage, \{\s*session,/,
  );
});

test("history replay keeps the deterministic setup but start creates a fresh run receipt", () => {
  assert.match(
    mainSource,
    /function replaySoloRun\(summary: SoloRunSummary\): void \{[\s\S]*?seed: summary\.seed[\s\S]*?botDifficulty: summary\.botDifficulty[\s\S]*?source: summary\.source[\s\S]*?dailyDateKey: summary\.dailyDateKey/,
  );
  assert.match(
    mainSource,
    /function startSoloRun\(request: SoloRunStartRequest\): void \{\s*if \(!confirmFinishedSoloRunDiscard\(\)\) \{\s*return;\s*\}[\s\S]*?clearPersistedSoloRun\(\)[\s\S]*?createSoloRunSession\(\{[\s\S]*?source: request\.source[\s\S]*?dailyDateKey: request\.dailyDateKey/,
  );
  assert.match(
    mainSource,
    /function returnToMainMenu\(\): void \{\s*if \(!confirmFinishedSoloRunDiscard\(\)\) \{\s*return;\s*\}[\s\S]*?clearPersistedSoloRun\(\)/,
  );
  assert.match(
    mainSource,
    /function confirmFinishedSoloRunDiscard\(\): boolean \{\s*if \(ensureFinishedSoloRunRecorded\(\)\) \{\s*return true;\s*\}\s*if \(window\.confirm\(getCopy\(\)\.runHistoryDiscardConfirm\)\) \{\s*return true;\s*\}[\s\S]*?showSoloHistorySaveFailure\(\);\s*return false/,
  );
});

test("history is an accessible modal and sharing uses guarded Telegram, native, and clipboard adapters", () => {
  assert.match(mainSource, /panel\.setAttribute\("role", "dialog"\)/);
  assert.match(mainSource, /panel\.setAttribute\("aria-modal", "true"\)/);
  assert.match(mainSource, /panel\.addEventListener\("keydown", \(event\) => trapModalFocus\(panel, event\)\)/);
  assert.match(mainSource, /function trapModalFocus\(panel: HTMLElement, event: KeyboardEvent\): void/);
  assert.match(mainSource, /stageUi\.querySelector<HTMLElement>\("\.main-menu-overlay"\)\?\.setAttribute\("inert", ""\)/);
  assert.match(mainSource, /runHistoryOpen[\s\S]*?closeRunHistory\(\)/);
  assert.match(mainSource, /telegramShare: \(sharedText, sharedUrl\) => telegram\.share\(sharedText, sharedUrl\)/);
  assert.match(mainSource, /nativeShare: typeof navigator\.share === "function"/);
  assert.match(mainSource, /writeClipboard: navigator\.clipboard\?\.writeText/);
  assert.match(mainSource, /shareStatus\.setAttribute\("aria-live", "polite"\)/);
  assert.match(mainSource, /replayButton\.setAttribute\([\s\S]*?"aria-label"/);
  assert.match(
    mainSource,
    /const restoreButtonFocus = button\.matches\(":focus"\);\s*button\.disabled = true;[\s\S]*?button\.focus\(\{ preventScroll: true \}\)/,
  );
});
