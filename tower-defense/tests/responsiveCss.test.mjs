import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BUILD_PAD_HIT_SIZE } from "../src/game/config.ts";

const css = readFileSync(new globalThis.URL("../src/styles.css", import.meta.url), "utf8");
const html = readFileSync(new globalThis.URL("../index.html", import.meta.url), "utf8");

test("short Telegram viewports keep controls and modals vertically reachable", () => {
  const shortViewport = css.match(/@media \(max-height: 519px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(shortViewport, /html \{ height: auto; min-height: 100%; overflow-y: auto;/);
  assert.match(shortViewport, /body \{ height: auto; min-height: 100%; overflow: visible;/);
  assert.match(shortViewport, /\.game-root canvas \{ touch-action: pan-y !important;/);
  assert.match(shortViewport, /\.app-shell \{ height: auto; min-height: 720px; grid-template-rows: auto minmax\(430px, 1fr\) auto;/);
  assert.match(shortViewport, /\.modal-layer \{ display: block; overflow-y: auto;/);
});

test("canvas build pads retain generous touch hit slop after scaling", () => {
  assert.ok(BUILD_PAD_HIT_SIZE >= 84);
});

test("compact match controls retain 44px touch targets", () => {
  assert.match(css, /\.language-control \{[^}]*width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.icon-button \{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(css, /\.language-control--modal \{[^}]*position:\s*absolute;[^}]*top:\s*10px;[^}]*left:\s*10px;/s);
});

test("tall portrait viewports match the battlefield to the Phaser scene aspect ratio", () => {
  const tallPortrait = css.match(/@media \(min-height: 800px\) and \(max-aspect-ratio: 47 \/ 100\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  assert.doesNotMatch(css, /\.game-root canvas \{[^}]*width:\s*100%\s*!important[^}]*height:\s*100%\s*!important/s);
  assert.match(css, /\.game-root canvas \{[^}]*max-width:\s*100%;[^}]*max-height:\s*100%;/s);
  assert.match(tallPortrait, /\.app-shell \{ grid-template-rows:\s*auto auto minmax\(164px, 1fr\);/);
  assert.match(tallPortrait, /\.battle-shell \{[^}]*width:\s*100%;[^}]*aspect-ratio:\s*390 \/ 560;[^}]*justify-self:\s*center;/s);
  assert.match(tallPortrait, /\.command-panel \{[^}]*--tower-controls-height:\s*94px;[^}]*min-height:\s*164px;/s);
  assert.match(tallPortrait, /\.tower-deck \{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[^}]*grid-template-rows:\s*repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.match(tallPortrait, /\.tower-card \{[^}]*flex-direction:\s*row;[^}]*text-align:\s*left;/s);
  assert.match(css, /@media \(min-height: 800px\) and \(max-aspect-ratio: 47 \/ 100\) and \(max-width: 360px\) \{[\s\S]*?\.tower-card strong \{ display:\s*block; \}/);
  assert.match(css, /\.brand \{ display:\s*none;/);
  assert.match(css, /\.enemy-list \{[^}]*overflow-x:\s*auto;/s);
});

test("build and selected tower states share one stable controls height", () => {
  assert.match(css, /\.command-panel \{[^}]*--tower-controls-height:\s*52px;/s);
  assert.match(css, /\.command-panel \{[^}]*grid-template-rows:\s*var\(--tower-controls-height\) 44px;/s);
  assert.match(css, /\.build-panel \{[^}]*min-height:\s*var\(--tower-controls-height\);[^}]*height:\s*100%;/s);
  assert.match(css, /\.tower-panel \{[^}]*min-height:\s*var\(--tower-controls-height\);[^}]*height:\s*100%;/s);
  assert.match(css, /\.panel-close \{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);

  const compactViewport = css.match(/@media \(max-height: 700px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(compactViewport, /\.command-panel \{ --tower-controls-height:\s*48px;/);
  assert.match(compactViewport, /\.tower-card \{ min-height:\s*48px; height:\s*48px;/);
  assert.match(css, /\.tower-deck \{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/s);
});

test("tower guide and fullscreen actions remain reachable without increasing compact rows", () => {
  assert.match(css, /\.tower-guide-button \{[^}]*width:\s*28px;[^}]*height:\s*28px;/s);
  assert.match(css, /\.tower-guide-button::after \{[^}]*inset:\s*-8px;/s);
  assert.match(css, /\.fullscreen-button \{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(css, /\.fullscreen-button\[aria-pressed="true"\] \{/);
  assert.match(css, /\.panel-heading \{[^}]*position:\s*absolute;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.panel-heading-actions \{[^}]*display:\s*flex;[^}]*gap:\s*8px;/s);
  assert.match(css, /\.tower-deck \{[^}]*padding-right:\s*34px;/s);
  assert.match(css, /\.build-panel\.has-fullscreen-control \.tower-deck \{ padding-right:\s*84px; \}/);
  assert.match(css, /\.guide-card \{[^}]*max-height:\s*100%;/s);
  assert.match(css, /\.guide-card \{[^}]*overflow-y:\s*auto;/s);
});

test("phase, boss health, and pulse controls stay outside the battlefield", () => {
  const battleStart = html.indexOf('<main class="battle-shell">');
  const battleEnd = html.indexOf("</main>", battleStart);
  const bossHud = css.match(/\.boss-hud \{([^}]*)\}/s)?.[1] ?? "";
  const phaseBadge = css.match(/\.phase-badge \{([^}]*)\}/s)?.[1] ?? "";
  const pulseButton = css.match(/\.pulse-button \{([^}]*)\}/s)?.[1] ?? "";

  assert.ok(html.indexOf('id="boss-hud"') < battleStart);
  assert.ok(html.indexOf('id="phase-badge"') < battleStart);
  assert.ok(html.indexOf('id="pulse-button"') > battleEnd);
  assert.doesNotMatch(bossHud, /position:\s*absolute/);
  assert.doesNotMatch(phaseBadge, /position:\s*absolute/);
  assert.match(pulseButton, /position:\s*static/);
  assert.match(css, /\.encounter-strip \{[^}]*grid-column:\s*1 \/ -1;/s);
  assert.match(css, /\.boss-bars > span \{[^}]*height:\s*3px;/s);
});

test("browser, Telegram, and fullscreen safe areas participate in app padding", () => {
  assert.match(css, /--td-content-safe-area-inset-top:\s*0px;/);
  assert.match(css, /--td-safe-area-inset-top:\s*0px;/);
  assert.match(css, /--td-fullscreen-top-reserve:\s*0px;/);
  assert.match(css, /:root\.is-telegram-fullscreen \{ --td-fullscreen-top-reserve:\s*64px; \}/);
  assert.match(css, /\.app-shell \{[^}]*env\(safe-area-inset-top\)[^}]*var\(--tg-safe-area-inset-top, 0px\)[^}]*var\(--tg-content-safe-area-inset-top, 0px\)[^}]*var\(--td-safe-area-inset-top\)[^}]*var\(--td-content-safe-area-inset-top\)[^}]*var\(--td-fullscreen-top-reserve\)/s);
  assert.match(css, /\.app-shell \{[^}]*var\(--tg-safe-area-inset-right, 0px\)[^}]*var\(--tg-content-safe-area-inset-right, 0px\)[^}]*var\(--td-safe-area-inset-right\)[^}]*var\(--td-content-safe-area-inset-right\)/s);
  assert.match(css, /\.app-shell \{[^}]*var\(--tg-safe-area-inset-bottom, 0px\)[^}]*var\(--tg-content-safe-area-inset-bottom, 0px\)[^}]*var\(--td-safe-area-inset-bottom\)[^}]*var\(--td-content-safe-area-inset-bottom\)/s);
  assert.match(css, /\.app-shell \{[^}]*var\(--tg-safe-area-inset-left, 0px\)[^}]*var\(--tg-content-safe-area-inset-left, 0px\)[^}]*var\(--td-safe-area-inset-left\)[^}]*var\(--td-content-safe-area-inset-left\)/s);
  assert.match(css, /\.modal-layer \{[^}]*var\(--td-safe-area-inset-top\)[^}]*var\(--td-content-safe-area-inset-top\)[^}]*var\(--td-fullscreen-top-reserve\)[^}]*var\(--td-safe-area-inset-bottom\)[^}]*var\(--td-content-safe-area-inset-bottom\)/s);
  assert.match(css, /\.toast \{[^}]*bottom:\s*calc\(max\([^;]*var\(--td-safe-area-inset-bottom\)[^;]*var\(--td-content-safe-area-inset-bottom\)[^;]*\) \+ 18px\);/s);
});
