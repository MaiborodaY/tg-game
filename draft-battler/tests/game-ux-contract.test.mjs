import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("battle HUD and playback controls stay wired to live renderer state", () => {
  assert.match(mainSource, /createGameHud\(\), createBattleOverlay\(\)/);
  assert.match(mainSource, /setBattleSpeed\(battlePlaybackSpeed\)/);
  assert.match(mainSource, /skipBattle\(\)/);
  assert.match(mainSource, /onCastleHpChanged:\s*handleBattleCastleHpChanged/);
  assert.match(mainSource, /dataset\.hudMetric = metricKey/);
  assert.match(styles, /\.battle-playback-controls\s*\{/);
  assert.match(styles, /\.round-result-summary\s*\{/);
});

test("draft UI exposes enemy intelligence, synergy forecasts, and keyboard movement", () => {
  assert.match(mainSource, /getLastKnownEnemyArmy\(uiState\.run\)/);
  assert.match(mainSource, /getDraftOptionSynergyPresentation\(option, uiState\.draftBoardSlots\)/);
  assert.match(mainSource, /startKeyboardBoardMove\(boardUnit\.slotIndex\)/);
  assert.match(mainSource, /canMoveBoardSlotUnit\(keyboardMoveSourceSlotIndex, slotIndex\)/);
  assert.match(styles, /\.enemy-army-intel\s*\{/);
  assert.match(styles, /\.unit-card__synergy-forecast\s*\{/);
  assert.match(styles, /\.field-slot--move-target::before\s*\{/);
});
