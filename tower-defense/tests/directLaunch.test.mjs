import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new globalThis.URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new globalThis.URL("../src/main.ts", import.meta.url), "utf8");
const viteConfig = readFileSync(new globalThis.URL("../vite.config.ts", import.meta.url), "utf8");
const pagesHeaders = readFileSync(new globalThis.URL("../../public/_headers", import.meta.url), "utf8");
const renderUiSource = mainSource.slice(
  mainSource.indexOf("function renderUi"),
  mainSource.indexOf("function renderWavePreview"),
);

test("Tower Defense opens its own intro without a game chooser", () => {
  assert.match(html, /id="intro-overlay" class="modal-layer">/);
  assert.doesNotMatch(html, /game-choice-overlay|choose-bridge|intro-back-to-games/);
  assert.match(mainSource, /elements\.introStart\.focus\(\);/);
});

test("Tower Defense has no client-side route into the separate Bridge app", () => {
  assert.doesNotMatch(mainSource, /gameChoice\.ts|buildBridgeLaunchUrl|VITE_BRIDGE_APP_URL|location\.assign/);
  assert.doesNotMatch(html, /Дворовый Бридж|Tavern Bridge/);
});

test("removing Bridge navigation keeps unfinished reward protection", () => {
  assert.match(mainSource, /reward\.mode === "server" && !finishSettled/);
  assert.match(mainSource, /telegram\.setClosingConfirmation\(reward\.mode === "server" && !finishSettled\)/);
});

test("manual language controls are available before and during a match", () => {
  assert.equal(html.match(/data-role="language"/g)?.length, 2);
  assert.match(mainSource, /readStoredLocale\(storage\) \?\? detectLocale/);
  assert.match(mainSource, /writeStoredLocale\(storage, locale\)/);
  assert.match(mainSource, /renderedPreviewWave = -1;/);
  assert.match(mainSource, /if \(latestUi\) renderUi\(latestUi\);/);
});

test("fullscreen remains an explicit player choice", () => {
  assert.match(html, /id="fullscreen-button" class="game-menu-action"[^>]*aria-pressed="false"[^>]*hidden/);
  assert.equal(mainSource.match(/telegram\.requestFullscreen\(\)/g)?.length, 1);
  assert.equal(mainSource.match(/telegram\.exitFullscreen\(\)/g)?.length, 1);
  assert.doesNotMatch(mainSource, /restorePendingFinish\(\);\s*if \(elements\.introOverlay\.hidden\) telegram\.requestFullscreen\(\);/);
  assert.doesNotMatch(mainSource, /function dismissIntro\(\): void \{[\s\S]*telegram\.requestFullscreen\(\);/);
  assert.match(mainSource, /elements\.fullscreenButton\.addEventListener\("click", \(\) => \{\s*if \(telegram\.isFullscreen\) telegram\.exitFullscreen\(\);\s*else telegram\.requestFullscreen\(\);/);
});

test("fullscreen control follows Telegram support and confirmed state", () => {
  assert.match(mainSource, /telegram\.onFullscreenChange\(syncFullscreenUi\);/);
  assert.match(mainSource, /document\.documentElement\.classList\.toggle\("is-telegram-fullscreen", isFullscreen\);/);
  assert.doesNotMatch(mainSource, /elements\.buildPanel\.classList\.toggle\("has-fullscreen-control"/);
  assert.match(mainSource, /elements\.fullscreenButton\.hidden = !supportsFullscreen;/);
  assert.match(mainSource, /elements\.fullscreenButton\.setAttribute\("aria-pressed", String\(isFullscreen\)\);/);
  assert.match(mainSource, /text\(isFullscreen \? "fullscreen_exit" : "fullscreen_enter"\)/);
  assert.match(mainSource, /function applyStaticTranslations\(\): void \{[\s\S]*syncFullscreenUi\(telegram\.isFullscreen\);/);
});

test("practice exposes content selection while rewarded runs stay pinned", () => {
  assert.match(html, /id="session-picker"/);
  assert.match(html, /id="level-select"/);
  assert.match(html, /id="mode-select"/);
  assert.match(mainSource, /resolveServerSessionSelection\(miniAppBootstrap\.binding\)/);
  assert.match(mainSource, /resolveSessionSelection\("server", null\)/);
  assert.match(mainSource, /readSessionSelection\(storage, "local"\)/);
  assert.match(mainSource, /loadCampaign\(storage, saveKey, selectedSession\.selection\)/);
  assert.match(mainSource, /elements\.sessionPicker\.hidden = selectedSession\.locked/);
  assert.match(mainSource, /if \(reward\.mode === "server" \|\| elements\.introOverlay\.hidden \|\| sessionSwitching \|\| gameStarting\) return/);
  assert.match(mainSource, /elements\.gameMenuSession\.addEventListener\("click", \(\) => \{[\s\S]*openSessionMenu\(\);/);
  assert.match(mainSource, /elements\.gameMenuSession\.hidden = reward\.mode === "server"/);
});

test("Phaser and the renderer load behind one retry-safe runtime boundary", () => {
  assert.doesNotMatch(mainSource, /^import Phaser from "phaser";/m);
  assert.match(mainSource, /import type \{[\s\S]*TowerDefenseScene[\s\S]*\} from "\.\/rendering\/TowerDefenseScene\.ts";/);
  assert.match(
    mainSource,
    /createLazyRuntimeController\(\s*\(\) => import\("\.\/rendering\/TowerDefenseScene\.ts"\)/,
  );
  assert.match(mainSource, /const pendingFinishRestored = restorePendingFinish\(\);/);
  assert.doesNotMatch(mainSource, /scheduleRuntimePreload|runtimeController\.preload\(\)/);
  assert.match(mainSource, /const ready = await ensureGameMounted\(\);[\s\S]*if \(!ready\)[\s\S]*dismissIntro\(\);/);
  assert.match(mainSource, /launchError === "miniapp_start_failed" \|\| runtimeLoadFailed\) reloadPage\(\)/);
  assert.doesNotMatch(renderUiSource, /currentScene|getCurrentWavePlan/);
  assert.match(renderUiSource, /const plan = ui\.nextWavePlan/);
});

test("pending results and launch errors do not require the gameplay runtime", () => {
  assert.match(mainSource, /function restorePendingFinish\(\): boolean/);
  assert.match(mainSource, /showResult\(pending\.outcome[\s\S]*void finishReward\(\);\s*return true/);
  assert.match(mainSource, /if \(!pendingFinishRestored\) \{\s*if \(elements\.introOverlay\.hidden\) \{\s*await mountRestoredGame\(\);/);
  assert.match(mainSource, /runtimeLoadFailed = true;[\s\S]*elements\.appShell\.inert = true;[\s\S]*elements\.introOverlay\.hidden = false/);
});

test("intentional runtime recovery reload keeps unfinished-run protection for other exits", () => {
  assert.match(mainSource, /if \(reward\.mode === "server" && !finishSettled && !reloadRequested\)/);
  assert.match(mainSource, /function reloadPage\(\): void \{\s*\/\/[^\r\n]+\s*reloadRequested = true;\s*window\.location\.reload\(\);/);
  assert.equal(mainSource.match(/window\.location\.reload\(\)/g)?.length, 1);
});

test("fingerprinted Tower Defense assets keep a stable Phaser cache boundary", () => {
  assert.match(viteConfig, /name: "phaser",[\s\S]*node_modules[\s\S]*phaser/);
  assert.match(pagesHeaders, /^\/td\/assets\/\*\s*$/m);
  assert.match(pagesHeaders, /^\s+Cache-Control:\s*public,\s*max-age=31536000,\s*immutable\s*$/mi);
  assert.doesNotMatch(pagesHeaders, /^\/td\/?\*?\s*\r?\n\s+Cache-Control:[^\r\n]*immutable/im);
});

test("Mini App bootstrap cache preserves the server run binding without durable token storage", () => {
  assert.match(mainSource, /const cachedBootstrap = loadMiniAppBootstrap\(session\)/);
  assert.match(mainSource, /const started = await startMiniAppReward\(launchDecision\.initData\)/);
  assert.match(mainSource, /saveMiniAppBootstrap\(session, started\.bootstrap\)/);
  assert.doesNotMatch(mainSource, /saveMiniAppBootstrap\(storage/);
});

test("rewarded checkpoints resume visibly and blocked local saves warn only once", () => {
  assert.match(mainSource, /const restoredCheckpoint = savedCampaign \|\| migrated/);
  assert.match(mainSource, /restoredCheckpoint && hasRunProgress\(restoredCheckpoint\)/);
  assert.match(mainSource, /showToast\(text\("run_resumed", \{ wave: nextWave \}\)\)/);
  assert.match(mainSource, /miniAppBootstrap\?\.resumed[\s\S]*showToast\(text\("run_resume_unavailable"\), true\)/);
  assert.match(mainSource, /!saveCampaign\(storage, saveKey, campaign\) && !localSaveWarningShown/);
  assert.match(mainSource, /localSaveWarningShown = true;[\s\S]*text\("local_save_unavailable"\)/);
});

test("fresh, pending and reauthorized terminal submissions keep immutable metadata", () => {
  assert.equal(mainSource.match(/captureFinishSubmission\(/g)?.length, 3);
  assert.match(mainSource, /outcome === "victory" \? "victory" : "defeat",\s*completedWaves/);
  assert.match(mainSource, /pending\.outcome === "victory" \? "victory" : "defeat",\s*pending\.waves/);
  assert.match(mainSource, /result\.profileSync === "pending"[\s\S]*"profile_sync_pending"/);
  assert.match(mainSource, /result\.profileSync === "pending"[\s\S]*text\("profile_sync_retry"\)[\s\S]*rewardRetry\.hidden = false/);
  assert.match(mainSource, /result\.error === "http_403"[\s\S]*refreshFinishAuthorization\(\)/);
  assert.match(mainSource, /startMiniAppReward\(launchDecision\.initData, \{ resumeRunId: currentRunId \}\)/);
  assert.match(mainSource, /bootstrapCached = replaceMiniAppBootstrap\(session, refreshed\.bootstrap\)/);
  assert.match(mainSource, /refreshed\.reward\.runId !== currentRunId[\s\S]*finishRunReplaced = true;[\s\S]*replacementBootstrapCached = bootstrapCached;[\s\S]*return false/);
  assert.match(mainSource, /if \(finishRunReplaced\) \{[\s\S]*finishSettled = true;[\s\S]*"run_replaced"[\s\S]*restartButton\.hidden = false/);
  assert.match(mainSource, /rewardRetry\.addEventListener\("click", \(\) => \{\s*if \(finishRunReplaced\) return/);
  assert.match(mainSource, /removePendingResult\(storage, reward\.runId\);[\s\S]*isMiniAppLaunch && !replacementBootstrapCached[\s\S]*clearMiniAppReward\(session\)/);
  assert.match(mainSource, /if \(finishSettled\)[\s\S]*"profile_sync_retry_failed"[\s\S]*restartButton\.hidden = false[\s\S]*setClosingConfirmation\(false\)/);
});
