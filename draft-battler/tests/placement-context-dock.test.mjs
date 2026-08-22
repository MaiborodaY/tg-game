import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getUiCopy } from "../src/i18n.ts";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("placement and keyboard move modes replace the regular field action bar", () => {
  const createDraftOverlay = mainSource.match(/function createDraftOverlay[\s\S]*?\n\}/)?.[0] ?? "";
  const createTapPlacementPanel = mainSource.match(/function createTapPlacementPanel[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(createDraftOverlay, /overlay\.append\(createFieldSlotsLayer\(\)\)/);
  assert.match(
    createDraftOverlay,
    /if \(selectedDraftCardId && !uiState\.cardPickedThisRound\)[\s\S]*?createTapPlacementPanel\(selectedDraftCardId\)[\s\S]*?else if \(keyboardMoveSourceSlotIndex !== undefined\)[\s\S]*?createKeyboardMovePanel\(keyboardMoveSourceSlotIndex\)[\s\S]*?else \{\s*overlay\.append\(createFieldActionBar\(\)\)/,
  );
  assert.match(mainSource, /placement-context-dock placement-context-dock--selection/);
  assert.match(mainSource, /placement-context-dock placement-context-dock--move/);
  assert.match(mainSource, /copyContainer\.setAttribute\("aria-live", "polite"\)/);
  assert.match(mainSource, /infoButton\.setAttribute\("aria-label", copy\.cardInfo\)/);
  assert.doesNotMatch(createTapPlacementPanel, /createCardSynergyForecast|unit-card__synergy-forecast/);
  assert.match(createTapPlacementPanel, /panel\.append\(copyContainer, actions\)/);
});

test("short-height context docks keep 44px controls without covering the lower field row", () => {
  assert.match(
    styles,
    /@media\s*\(max-height:\s*600px\)[\s\S]*?\.placement-context-dock\s*\{[^}]*padding:\s*3px 6px[^}]*grid-template-columns:[^}]*align-items:\s*center/s,
  );
  assert.match(
    styles,
    /@media\s*\(max-height:\s*600px\)[\s\S]*?\.placement-context-dock__copy span\s*\{[^}]*position:\s*absolute[^}]*width:\s*1px[^}]*height:\s*1px/s,
  );
  assert.match(styles, /\.placement-context-dock__info,[\s\S]*?\.placement-context-dock__cancel\s*\{[^}]*height:\s*44px/s);
});

test("cancel controls explain their action and selection cancel restores the draft-card focus", () => {
  const expected = {
    ru: ["Отменить выбор", "Отменить перемещение"],
    uk: ["Скасувати вибір", "Скасувати переміщення"],
    en: ["Cancel selection", "Cancel move"],
  };

  Object.entries(expected).forEach(([locale, [cancelSelection, cancelMove]]) => {
    const copy = getUiCopy(locale);
    assert.equal(copy.cancelSelection, cancelSelection);
    assert.equal(copy.cancelMove, cancelMove);
  });

  const cancelSelection = mainSource.match(/function cancelDraftCardSelection[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(cancelSelection, /const selectedDraftCardId = getSelectedDraftCardId\(\)/);
  assert.match(cancelSelection, /requestFocusAfterRender\(`draft-card-\$\{selectedDraftCardId\}`\)/);

  const closeCardInfo = mainSource.match(/function closeCardInfo[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(closeCardInfo, /getSelectedDraftCardId\(\) === draftCardId \? "selected-card-info"/);
});

test("results trigger lives in the HUD utility row while the overlay renders only an open panel", () => {
  const createLogsOverlay = mainSource.match(/function createLogsOverlay[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(mainSource, /utilityRow\.className = "draft-hud__utility-row"/);
  assert.match(mainSource, /button\.className = uiState\.logsOpen \? "logs-button logs-button--active" : "logs-button"/);
  assert.match(mainSource, /setFocusKey\(button, "logs-toggle"\)/);
  assert.equal(mainSource.match(/requestFocusAfterRender\("logs-toggle"\)/g)?.length, 2);
  assert.match(mainSource, /overlayClasses\.push\("draft-overlay--has-logs"\)/);
  assert.match(createLogsOverlay, /if \(!uiState\.logsOpen \|\| visibleLogs\.length === 0\) \{\s*return undefined/);
  assert.match(createLogsOverlay, /overlay\.append\(createLogsPanel\(visibleLogs\)\)/);
  assert.doesNotMatch(createLogsOverlay, /createLogsButton/);
});

test("results stay hidden while battle playback controls are active", () => {
  assert.match(
    mainSource,
    /function canShowLogsInCurrentMode\(\): boolean \{\s*return uiState\.mode === "draft" \|\| uiState\.battleFinished;\s*\}/,
  );
  assert.equal(
    mainSource.match(/if \(!canShowLogsInCurrentMode\(\)\) \{\s*return undefined;\s*\}/g)?.length,
    2,
  );
  assert.match(
    mainSource,
    /if \(uiState\.battleFinished\) \{[\s\S]*?\} else \{\s*overlay\.append\(createBattlePlaybackControls\(\)\)/,
  );
});

test("opening card details closes results so the overlays cannot collide", () => {
  const openCardInfo = mainSource.match(/function openCardInfo[\s\S]*?\n\}/)?.[0] ?? "";
  const openBoardCardInfo = mainSource.match(/function openBoardCardInfo[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(openCardInfo, /selectedCardInfoId: cardId,[\s\S]*?logsOpen: false/);
  assert.match(openBoardCardInfo, /selectedCardInfoSlotIndex: slotIndex,[\s\S]*?logsOpen: false/);
});

test("replacement confirmation opens in the upper safe area away from field taps", () => {
  const overlayRule = styles.match(/\.draft-replacement-overlay\s*\{[^}]*\}/s)?.[0] ?? "";

  assert.match(overlayRule, /max\(82px, calc\(var\(--safe-top\) \+ 70px\)\)/);
  assert.match(overlayRule, /place-items:\s*start center/);
  assert.match(overlayRule, /overflow-y:\s*auto/);
});
