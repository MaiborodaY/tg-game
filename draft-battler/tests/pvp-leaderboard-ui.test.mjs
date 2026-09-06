import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const i18n = await readFile(new URL("../src/i18n.ts", import.meta.url), "utf8");

test("online lobby exposes a modal weekly leaderboard with a personal row", () => {
  assert.match(main, /createPvpLeaderboardButton/);
  assert.match(main, /fetchPvpLeaderboard\(PVP_API_ORIGIN/);
  assert.match(main, /pvp-leaderboard-entry--viewer/);
  assert.match(main, /aria-labelledby", "draft-battler-pvp-leaderboard-title/);
  assert.match(styles, /\.pvp-leaderboard-panel/);
  assert.match(styles, /\.pvp-leaderboard-entry--viewer/);
  assert.match(i18n, /pvpLeaderboardTelegramRequired/);
  assert.match(i18n, /pvpLeaderboardMissingProfile/);
});

test("main menu exposes separate ranking modes with a bounded scrollable list", () => {
  assert.match(main, /createPvpLeaderboardButton\("strong_bot"\)/);
  assert.match(main, /\["pvp", "strong_bot"\] as const/);
  assert.match(main, /setAttribute\("aria-pressed"/);
  assert.match(styles, /\.pvp-leaderboard-panel\s*\{[^}]*grid-template-rows: auto auto minmax\(0, 1fr\)/s);
  assert.match(styles, /\.main-menu__ranking-button\s*\{[^}]*grid-column: 1 \/ -1/s);
  assert.match(main, /notice.className = "solo-ranking-notice"/);
});
