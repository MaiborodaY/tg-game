import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { advanceSnake, snakeTickDuration, startSnakeGame } from "../../src/snakeState.ts";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.FARM_PAWS_PLAYWRIGHT_PATH || "playwright");
let server, browser;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL("../../", import.meta.url)), configFile: false, logLevel: "silent",
    cacheDir: fileURLToPath(new URL("../../../.tmp/snake-bonuses-vite", import.meta.url)),
    server: { host: "127.0.0.1", port: 5174, strictPort: true }
  });
  await server.listen();
  console.log(JSON.stringify({ pid: process.pid, baseUrl: server.resolvedUrls.local[0], startedAt: new Date().toISOString() }));
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test("Snake fields, portal travel and colour combos keep bonus pause and stored result identity", async t => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  t.after(() => context.close());
  const page = await context.newPage();
  const calls = [];
  await page.clock.install();
  await page.route("https://telegram.org/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("**/api/farm-paws/start", route => {
    calls.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true, runId: "snake-bonuses", mapId: calls.at(-1).mapId,
      bestScore: 0, lang: "ru", dailyLimit: 5, dailyStarts: 1 } });
  });
  await page.route("**/api/farm-paws/finish", route => {
    calls.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true, xpReward: calls.at(-1).score, bestScore: calls.at(-1).score } });
  });
  await page.addInitScript(() => {
    Math.random = () => 0;
    localStorage.setItem("farm-paws-snake-best-score-v1", "99");
    localStorage.setItem("farm-paws-snake-best-score-v3-courtyard", "17");
    window.Telegram = { WebApp: { initData: "snake-qa", ready() {}, expand() {}, setHeaderColor() {},
      setBackgroundColor() {}, disableVerticalSwipes() {}, enableClosingConfirmation() {}, disableClosingConfirmation() {} } };
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.locator("[data-action='open-snake']").click();
  assert.equal(await page.locator("[data-snake-best]").first().innerText(), "0");
  await page.locator("[data-snake-map='courtyard']").click();
  assert.equal(await page.locator("[data-snake-best]").first().innerText(), "17");
  assert.equal(await page.locator("[data-snake-screen]").getAttribute("data-map"), "courtyard");
  await page.screenshot({ path: fileURLToPath(new URL("../../../.tmp/snake-maps-lobby.png", import.meta.url)) });
  await page.locator("[data-snake-map='warehouse']").click();
  assert.equal(await page.locator("[data-snake-best]").first().innerText(), "0");
  await page.locator("[data-snake-map='garden']").click();
  await page.locator("[data-snake-action='primary']").click();
  await page.waitForSelector("[data-snake-screen][data-layout='game'][data-phase='idle']");
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
  await page.clock.runFor(10_000);
  assert.equal(await page.locator("[data-snake-screen]").getAttribute("data-phase"), "idle");
  assert.equal(calls[0].rulesVersion, 3);
  assert.equal(calls[0].mapId, "garden");
  assert.equal(calls[0].game, "snake");
  let model = startSnakeGame(0, () => 0, "up", "garden");
  const move = async direction => {
    const duration = snakeTickDuration(model.score);
    model = advanceSnake({ ...model, queuedDirection: direction }, () => 0);
    await page.keyboard.press(`Arrow${direction[0].toUpperCase()}${direction.slice(1)}`);
    await page.clock.runFor(duration);
  };
  for (let n = 0; n < 6; n++) await move("up");
  for (let n = 0; n < 6; n++) await move("left");
  assert.deepEqual(model.snake[0], { x: 13, y: 13 });
  const headColour = await page.locator("[data-snake-board]").evaluate(canvas => {
    const cell = canvas.width / 16;
    return [...canvas.getContext("2d").getImageData(Math.floor(13.5 * cell), Math.floor(13.5 * cell), 1, 1).data];
  });
  assert.deepEqual(headColour.slice(0, 3), [244, 207, 87], "the real canvas must draw the head at the portal exit");
  const collect = async target => {
    for (const direction of routeTo(model, target)) await move(direction);
    assert.equal(model.phase, "playing");
    assert.equal(await page.locator("[data-snake-score]").innerText(), String(model.score));
  };
  await collect(model.food);
  await collect(model.greenFood);
  await collect(model.food);
  assert.equal(model.score, 4);
  assert.match(await page.locator("[data-snake-combo]").innerText(), /3\/3.*🍏/);
  await page.screenshot({ path: fileURLToPath(new URL("../../../.tmp/snake-maps-combo.png", import.meta.url)) });
  await collect(model.goldFood);
  await collect(model.greenFood);
  await collect(model.food);
  await collect(model.greenFood);
  assert.equal(model.score, 11);
  const timers = page.locator("[data-snake-bonuses]");
  assert.equal(await timers.isVisible(), true);
  const beforePause = await timers.innerText();
  assert.match(beforePause, /🟡 \d+ с\n✂️ 12 с/);
  await page.screenshot({ path: fileURLToPath(new URL("../../../.tmp/snake-v2-mobile.png", import.meta.url)) });
  await page.locator("[data-snake-action='pause']").click();
  await page.clock.runFor(20_000);
  assert.equal(await timers.innerText(), beforePause);
  await page.locator("[data-snake-action='pause']").click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(20_000);
  assert.equal(await timers.innerText(), beforePause);
  assert.equal(await page.locator("[data-snake-screen]").getAttribute("data-phase"), "paused");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
  });
  await page.locator("[data-snake-action='pause']").click();
  while (model.phase === "playing") await move(model.direction);
  await page.waitForSelector("[data-snake-screen][data-phase='gameover']");
  await page.waitForFunction(score => document.querySelector("[data-snake-overlay-message]").textContent.includes(String(score)), model.score);
  assert.equal(calls.length, 2);
  assert.deepEqual({ game: calls[1].game, score: calls[1].score, round: calls[1].round, hpLeft: calls[1].hpLeft },
    { game: "snake", score: model.score, round: 0, hpLeft: 0 });
  assert.equal(await page.evaluate(() => localStorage.getItem("farm-paws-snake-best-score-v1")), "99");
  assert.equal(await page.evaluate(() => localStorage.getItem("farm-paws-snake-best-score-v3-garden")), String(model.score));
  assert.equal(await page.evaluate(() => localStorage.getItem("farm-paws-snake-best-score-v3-courtyard")), "17");
});

// Find a short route through the actual field, keeping other pickups for the next test step.
function routeTo(state, target) {
  assert.ok(target, "pickup must still be available");
  const key = point => `${point.x}:${point.y}`;
  const targetKey = key(target);
  const reserved = new Set([state.food, state.greenFood, state.goldFood, state.scissors]
    .filter(point => point && key(point) !== targetKey).map(key));
  const opposite = { up: "down", down: "up", left: "right", right: "left" };
  const queue = [{ state, path: [] }], visited = new Set();
  for (const item of queue) {
    for (const direction of Object.keys(opposite)) {
      if (direction === opposite[item.state.direction]) continue;
      const next = advanceSnake({ ...item.state, queuedDirection: direction }, () => 0);
      const id = key(next.snake[0]), path = [...item.path, direction];
      if (next.phase !== "playing" || reserved.has(id)) continue;
      if (id === targetKey) return path;
      const visitId = `${next.snake.map(key).join("|")}:${direction}`;
      if (visited.has(visitId)) continue;
      visited.add(visitId);
      queue.push({ state: next, path });
    }
  }
  assert.fail(`no route to ${targetKey}`);
}
