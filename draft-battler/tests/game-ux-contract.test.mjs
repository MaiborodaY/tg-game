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

test("main menu exposes fair standard and strong bot modes", () => {
  assert.match(mainSource, /createBotDifficultyButton\("standard"\)/);
  assert.match(mainSource, /createBotDifficultyButton\("strong"\)/);
  assert.match(mainSource, /duelButtons\.setAttribute\("role", "group"\)/);
  assert.match(mainSource, /button\.addEventListener\("click", \(\) => startSoloRun\(botDifficulty\)\)/);
  assert.match(mainSource, /createRun\(seed, botDifficulty\)/);
  assert.match(mainSource, /startSoloRun\(uiState\.run\.botDifficulty\)/);
  assert.match(mainSource, /snapshot\.run\.botDifficulty/);
  assert.match(styles, /\.main-menu__duel-buttons\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(styles, /\.main-menu__difficulty-button\s*\{[^}]*min-height:\s*68px/s);
  assert.match(styles, /\.main-menu__difficulty-button--strong\s*\{[^}]*border-color:/s);
});

test("PvP lobby and match actions use localized, explicit player states", () => {
  for (const key of [
    "onlineMode",
    "pvpLobbyTitle",
    "pvpLobbySubtitle",
    "pvpCreateRoom",
    "pvpJoinRoom",
    "pvpRoomCode",
    "pvpCopyCode",
    "pvpReady",
    "pvpWaitingForOpponent",
    "pvpReconnect",
    "pvpLeaveRoom",
    "pvpForfeit",
    "pvpReadyForNextRound",
    "pvpWaitingForNextRound",
    "pvpRematch",
    "pvpPlayer",
    "pvpOpponent",
  ]) {
    assert.match(mainSource, new RegExp(`\\.${key}\\b`), `main.ts uses ${key}`);
  }

  assert.doesNotMatch(mainSource, /textContent\s*=\s*"(?:PvP Room|Create|Join|Set Ready|Leave)"/);
  assert.match(styles, /\.pvp-panel__button--danger\s*\{[^}]*border-color:/s);
  assert.match(styles, /\.pvp-connection-banner--error\s*\{[^}]*border-color:/s);
  assert.match(styles, /\.pvp-match-wait\s*\{[^}]*text-align:\s*center/s);
});

test("PvP frontend is opt-in, authenticated, and sends only action intents", () => {
  assert.match(mainSource, /VITE_DRAFT_BATTLER_PVP_ENABLED === "true"/);
  assert.match(mainSource, /normalizePvpApiOrigin\(import\.meta\.env\.VITE_DRAFT_BATTLER_PVP_ORIGIN\)/);
  assert.doesNotMatch(mainSource, /draft-battler-pvp\.mr-maybik\.workers\.dev/);
  assert.match(mainSource, /connectPvpSocket\(session, bootstrap\.socketTicket\)/);
  assert.match(mainSource, /createPvpSocketUrl\(session\.roomId, socketTicket, PVP_API_ORIGIN, window\.location\.origin\)/);
  assert.doesNotMatch(mainSource, /createPvpSocketUrl\(session\.roomId, session\.seatToken/);
  assert.match(mainSource, /loadPvpSession\(pvpSessionStorage\)/);
  assert.match(mainSource, /savePvpSession\(pvpSessionStorage, session\)/);
  assert.match(mainSource, /clearPvpSession\(pvpSessionStorage\)/);

  for (const intent of ["set_ready", "pick", "move", "reroll", "lock", "next_ready", "forfeit", "leave", "rematch"]) {
    assert.match(mainSource, new RegExp(`type: "${intent}"`), `client sends ${intent}`);
  }
  assert.doesNotMatch(mainSource, /type:\s*"submit_board"/);
  assert.doesNotMatch(mainSource, /type:\s*"next_round"/);
  assert.match(mainSource, /draftOptions: match\.self\.draftOptions/);
  assert.match(mainSource, /match\.opponent\.boardSlots \?/);
  assert.match(mainSource, /const localSeed = `pvp:\$\{match\.matchId\}:\$\{match\.self\.role\}`/);
  assert.doesNotMatch(mainSource, /match\.seed/);
  assert.doesNotMatch(mainSource, /typeof match\.seed/);
  assert.match(mainSource, /type: "forfeit", matchId: match\.matchId, round: match\.round/);
  assert.match(mainSource, /type: "rematch", matchId: match\.matchId, round: match\.round/);
  assert.match(mainSource, /if \(uiState\.playMode === "online"\) \{\s*requestLeavePvpRoom\(\)/s);
  assert.match(mainSource, /const snapshot = readPvpRoomSnapshot\(message\.snapshot\)/);
  assert.match(
    mainSource,
    /function startOnlineLobby\(\): void \{[\s\S]*?if \(activePvpSession\) \{\s*void reconnectSavedPvpSession\(\);\s*\}\s*\}/,
  );
  const completeBattlePresentation = mainSource.match(/function completeBattlePresentation[\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(completeBattlePresentation, /reconnectSavedPvpSession/);
  assert.match(mainSource, /function applyPvpFinishedSnapshot[\s\S]*?outcome,\s*status: "finished"/);
  assert.match(mainSource, /const PVP_RULESET_VERSION = "draft-battler-pvp-v1"/);
  assert.match(mainSource, /payload\.rulesetVersion !== PVP_RULESET_VERSION/);
  assert.match(mainSource, /match\.rulesetVersion !== PVP_RULESET_VERSION/);
  assert.match(mainSource, /const combat = resolveCombat\(hostSlots, guestSlots, value\.round\)/);
  assert.match(mainSource, /hostHpAfter !== Math\.max\(0, hostHpBefore - combat\.playerCastleDamage\)/);
  assert.doesNotMatch(mainSource, /combat:\s*value\.combat as unknown as CombatResult/);
  assert.match(mainSource, /function isPvpBoardEditingLocked\(\): boolean/);
  assert.match(mainSource, /isPvpBoardEditingLocked\(\).*?getCurrentDraftOption/s);
  assert.match(mainSource, /isPvpBoardEditingLocked\(\).*?canRerollDraftCards/s);
  assert.match(mainSource, /isPvpBoardEditingLocked\(\).*?fromSlotIndex === toSlotIndex/s);
  assert.doesNotMatch(mainSource, /self:\s*\{\s*\.\.\.match\.self,\s*locked:\s*true/);
  assert.match(mainSource, /const shouldReconnect = Boolean\(activePvpSession\) && !pvpAutomaticReconnectUsed/);
  assert.match(mainSource, /void reconnectSavedPvpSession\(true\)/);
  assert.match(mainSource, /if \(message\.type === "error"\) \{\s*updatePvpState\(\{ error: getPvpErrorCopy\(message\.code\) \}\)/s);
});

test("draft UI prioritizes large card choices, synergy forecasts, and keyboard movement", () => {
  assert.doesNotMatch(mainSource, /hud\.append\(createEnemyArmyIntel\(\)\)/);
  assert.match(mainSource, /overlayClasses\.push\("draft-overlay--card-info-open"\)/);
  assert.match(mainSource, /getDraftOptionSynergyPresentation\(option, uiState\.draftBoardSlots\)/);
  assert.match(mainSource, /getDraftOptionBoardStatus\(option\.cardId, uiState\.draftBoardSlots\)/);
  assert.match(mainSource, /unit-card__board-status--\$\{status\}/);
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
  assert.match(styles, /\.unit-card__board-status--upgrade\s*\{/);
  assert.match(styles, /\.unit-card__board-status--maxed\s*\{/);
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
