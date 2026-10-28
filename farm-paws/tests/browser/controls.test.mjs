import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.FARM_PAWS_PLAYWRIGHT_PATH || "playwright");
let server, browser, baseUrl;

before(async () => {
  baseUrl = process.env.FARM_PAWS_BROWSER_URL;
  if (!baseUrl) {
    server = await createServer({
      root: fileURLToPath(new URL("../../", import.meta.url)), configFile: false, logLevel: "silent",
      cacheDir: fileURLToPath(new URL("../../../.tmp/controls-vite", import.meta.url)),
      server: { host: "127.0.0.1", port: 5173, strictPort: true }
    });
    await server.listen();
    baseUrl = server.resolvedUrls.local[0];
    console.log(JSON.stringify({ pid: process.pid, baseUrl, startedAt: new Date().toISOString() }));
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function gamePage(t, game) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  t.after(() => context.close());
  const page = await context.newPage();
  const requests = { starts: 0, finishes: 0 };
  await page.clock.install();
  await page.route("https://telegram.org/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("**/api/farm-paws/start", route => {
    requests.starts++;
    return route.fulfill({ json: { ok: true, runId: "controls-qa", lang: "ru", dailyLimit: 5, dailyStarts: 1 } });
  });
  await page.route("**/api/farm-paws/finish", route => {
    requests.finishes++;
    return route.fulfill({ json: { ok: true, xpReward: 0 } });
  });
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.Telegram = { WebApp: { initData: "controls-qa", ready() {}, expand() {}, setHeaderColor() {},
      setBackgroundColor() {}, disableVerticalSwipes() {}, enableClosingConfirmation() {}, disableClosingConfirmation() {} } };
    window.__tetrisCells = [];
    window.__pointerLog = [];
    for (const name of ["pointerdown", "pointerup", "pointercancel"]) {
      window.addEventListener(name, event => window.__pointerLog.push({
        type: name, id: event.pointerId, trusted: event.isTrusted,
        action: event.target.closest?.("[data-tetris-control]")?.dataset.tetrisControl
      }));
    }
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const fill = CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.hasAttribute("data-tetris-board")) window.__tetrisCells = [];
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillRect = function (...args) {
      if (this.canvas.hasAttribute("data-tetris-board") &&
          ["#79c7ad", "#6f9bd1", "#e99061", "#f7cf72", "#9bc75d", "#ad8bd4", "#d783a5"].includes(this.fillStyle)) {
        window.__tetrisCells.push({ x: args[0], y: args[1] });
      }
      return fill.apply(this, args);
    };
  });
  await page.goto(baseUrl);
  await page.locator(`[data-action='open-${game}']`).click();
  await page.locator(game === "tetris" ? "[data-tetris-action='primary']" : "[data-action='start']").click();
  await page.waitForSelector(game === "tetris" ? "[data-tetris-screen][data-phase='playing']" : ".status-line");
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
  return { page, context, requests };
}

test("Tetris keeps repeating the held control after a second finger releases rotate", async t => {
  const { page, context, requests } = await gamePage(t, "tetris");
  const cdp = await context.newCDPSession(page);
  const point = async (action, id) => {
    const box = await page.locator(`[data-tetris-control='${action}']`).boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2, id };
  };
  const down = await point("down", 1), rotate = await point("rotate", 2);
  const y = () => page.evaluate(() => Math.min(...window.__tetrisCells.map(cell => cell.y)));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [down] });
  await page.clock.runFor(200);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [down, rotate] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [rotate] });
  const release = await page.evaluate(() => window.__pointerLog.at(-1));
  assert.equal(release.type, "pointerup");
  assert.equal(release.action, "rotate");
  assert.equal(release.trusted, true);
  const heldY = await y();
  await page.clock.runFor(250);
  const continuedY = await y();
  assert.ok(continuedY > heldY, JSON.stringify({ heldY, continuedY,
    pointers: await page.evaluate(() => window.__pointerLog), cells: await page.evaluate(() => window.__tetrisCells) }));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const releasedY = await y();
  await page.clock.runFor(100);
  assert.equal(await y(), releasedY, "releasing the owner stops repetition");
  assert.deepEqual(requests, { starts: 1, finishes: 0 });
});

test("Memory game preserves keyboard focus after each answer", async t => {
  const { page, requests } = await gamePage(t, "farm-paws");
  await page.clock.runFor(4500);
  await page.locator("[data-cell='0']").focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator(".score-pill > span").innerText(), "1");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("data-cell")), "0");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  assert.equal(await page.locator(".score-pill > span").innerText(), "2");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("data-cell")), "1");
  assert.deepEqual(requests, { starts: 1, finishes: 0 });
});

test("Memory game suspends the sequence in background and resumes the same attempt", async t => {
  const { page, requests } = await gamePage(t, "farm-paws");
  await page.clock.runFor(500);
  const active = await page.locator(".plot-button.is-active").getAttribute("data-cell");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(10000);
  assert.equal(await page.locator("[data-cell]:not([disabled])").count(), 0);
  assert.equal(await page.locator(".plot-button.is-active").getAttribute("data-cell"), active);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(4000);
  assert.equal(await page.locator("[data-cell]:not([disabled])").count(), 9);
  assert.equal(await page.locator(".score-pill > span").innerText(), "0");
  assert.equal(await page.locator(".heart-row > strong").innerText(), "❤️❤️❤️");
  assert.deepEqual(requests, { starts: 1, finishes: 0 });
});
