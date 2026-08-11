import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const rendererSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");

test("battle HUD and playback controls stay wired to live renderer state", () => {
  assert.match(mainSource, /createGameHud\(\), createBattleOverlay\(\)/);
  assert.match(mainSource, /setBattleSpeed\(battlePlaybackSpeed\)/);
  assert.match(mainSource, /skipBattle\(\)/);
  assert.match(mainSource, /onCastleHpChanged:\s*handleBattleCastleHpChanged/);
  assert.match(mainSource, /dataset\.hudMetric = metricKey/);
  assert.match(styles, /\.battle-playback-controls\s*\{/);
  assert.match(styles, /\.round-result-summary\s*\{/);
});

test("a solo run can be abandoned from draft, round results, and active battle", () => {
  assert.match(mainSource, /controls\.append\(createAbandonRunButton\("battle-playback-controls__abandon"\)\)/);
  assert.match(mainSource, /actions\.append\(createAbandonRunButton\("action-bar__abandon"\)\)/);
  assert.match(
    mainSource,
    /function requestAbandonSoloRun\(\): void \{[\s\S]*?window\.confirm\(getCopy\(\)\.abandonRunConfirm\)[\s\S]*?returnToMainMenu\(\);\s*\}/,
  );
  assert.match(mainSource, /function returnToMainMenu\(\): void \{[\s\S]*?clearPersistedSoloRun\(\);/);
  assert.match(styles, /\.action-bar__abandon,[\s\S]*?\.battle-playback-controls__abandon\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.battle-playback-controls \.battle-playback-controls__abandon\s*\{[^}]*border-color:[^}]*color:/s);
});

test("draft UI prioritizes large card choices, synergy forecasts, and keyboard movement", () => {
  assert.doesNotMatch(mainSource, /hud\.append\(createEnemyArmyIntel\(\)\)/);
  assert.match(mainSource, /overlayClasses\.push\("draft-overlay--card-info-open"\)/);
  assert.match(mainSource, /getDraftOptionSynergyPresentation\(option, uiState\.draftBoardSlots\)/);
  assert.match(mainSource, /createCardDragHandle\(\)/);
  assert.match(mainSource, /startKeyboardBoardMove\(boardUnit\.slotIndex\)/);
  assert.match(mainSource, /canMoveBoardSlotUnit\(keyboardMoveSourceSlotIndex, slotIndex\)/);
  assert.match(mainSource, /handleFieldSlotClick\(getFieldSlotIndexForClick\(event, slotIndex\)\)/);
  assert.match(mainSource, /actions\.append\(caption, createRerollButton\(\), createDraftChoicesToggle\(\)\)/);
  assert.match(
    mainSource,
    /draftPanel\.className = draftChoicesCollapsed \? "draft-panel draft-panel--collapsed" : "draft-panel"/,
  );
  assert.match(mainSource, /const grid = createDraftGrid\(\);[\s\S]*?grid\.hidden = draftChoicesCollapsed;[\s\S]*?draftPanel\.append\(grid\)/);
  assert.match(mainSource, /grid\.className = "draft-grid draft-grid--triple"/);
  assert.match(mainSource, /grid\.id = "draft-options-grid"/);
  assert.match(mainSource, /grid\.setAttribute\("aria-label", getCopy\(\)\.chooseCard\)/);
  assert.doesNotMatch(mainSource, /grid\.append\(createRerollButton\(\)\)/);
  assert.match(
    mainSource,
    /const counterLabel = formatMessage\(copy\.rerollCounter,[\s\S]*?remaining: button\.disabled \? 0 : 1/,
  );
  assert.match(mainSource, /button\.setAttribute\("aria-label", `\$\{label\}\. \$\{counterLabel\}`\)/);
  assert.match(mainSource, /button\.setAttribute\("aria-expanded", String\(!draftChoicesCollapsed\)\)/);
  assert.match(mainSource, /button\.setAttribute\("aria-controls", "draft-options-grid"\)/);
  assert.match(
    mainSource,
    /function toggleDraftChoices\(\): void \{[\s\S]*?draftChoicesCollapsed = !draftChoicesCollapsed;[\s\S]*?render\(\)/,
  );
  assert.match(styles, /\.draft-overlay--card-info-open\s*\{[^}]*z-index:\s*4/s);
  assert.match(styles, /\.draft-panel--collapsed\s*\{[^}]*align-self:\s*start/s);
  assert.match(styles, /\.draft-grid--triple\[hidden\]\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /\.unit-card__synergy-forecast\s*\{/);
  assert.match(styles, /\.field-slot--move-target::before\s*\{/);
});

test("draft actions and card details communicate state without duplicate battle results", () => {
  assert.match(
    mainSource,
    /return uiState\.cardPickedThisRound \? getCopy\(\)\.fight : getCopy\(\)\.skipPickAndFight/,
  );
  assert.match(mainSource, /panel\.setAttribute\("aria-modal", "true"\)/);
  assert.match(mainSource, /art\.classList\.add\("card-info-panel__art"\)/);
  assert.match(mainSource, /if \(uiState\.mode === "draft" && isCardInfoOpen\(\)\)/);
  assert.match(mainSource, /child\.setAttribute\("inert", ""\)/);
  assert.match(mainSource, /blockLabel: getCopy\(\)\.blockFeedback/);
  assert.doesNotMatch(rendererSource, /showResult\(/);
  assert.doesNotMatch(rendererSource, /resultLabels/);
  assert.match(rendererSource, /emitText\(view, this\.blockLabel, "#86a8ff"\)/);
  assert.match(
    styles,
    /\.card-info-panel__art\s*\{[^}]*width:\s*min\(64vw, 240px\)[^}]*aspect-ratio:\s*2 \/ 3/s,
  );
  assert.match(
    styles,
    /\.card-info-panel__art \.unit-card__sprite\s*\{[^}]*width:\s*auto[^}]*height:\s*auto[^}]*max-width:\s*100%[^}]*max-height:\s*100%[^}]*object-fit:\s*contain/s,
  );
  assert.match(
    styles,
    /\.card-info-panel\s*\{[^}]*top:\s*max\(58px, calc\(var\(--safe-top\) \+ 50px\)\)[^}]*bottom:\s*max\(14px, calc\(var\(--safe-bottom\) \+ 14px\)\)[^}]*max-height:\s*none/s,
  );
  assert.doesNotMatch(styles, /\.card-info-panel\s*\{[^}]*max-height:\s*min\(/s);
});
