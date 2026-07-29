import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BUILD_PAD_HIT_SIZE } from "../src/game/config.ts";

const css = readFileSync(new globalThis.URL("../src/styles.css", import.meta.url), "utf8");
const html = readFileSync(new globalThis.URL("../index.html", import.meta.url), "utf8");

function elementMarkupById(source, id) {
  const idIndex = source.indexOf(`id="${id}"`);
  if (idIndex < 0) return "";
  const start = source.lastIndexOf("<", idIndex);
  const openingTag = source.slice(start).match(/^<([a-z][a-z0-9-]*)\b[^>]*>/i);
  if (!openingTag) return "";
  const tagName = openingTag[1];
  const tokens = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tokens.lastIndex = start;
  let depth = 0;
  for (let token = tokens.exec(source); token; token = tokens.exec(source)) {
    depth += token[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return source.slice(start, tokens.lastIndex);
  }
  return "";
}

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
  assert.match(css, /\.game-menu-action[^\{]*\{[^}]*min-height:\s*44px;/s);
});

test("HUD and build controls keep readable hierarchy without growing the shell", () => {
  const mainSource = readFileSync(new globalThis.URL("../src/main.ts", import.meta.url), "utf8");
  const narrowViewport = css.match(/@media \(max-width: 360px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  assert.match(css, /\.phase-badge \{[^}]*font-size:\s*9px;/s);
  assert.match(css, /\.hud-progress \{[^}]*height:\s*3px;/s);
  assert.match(css, /\.hud-progress span \{[^}]*transform-origin:\s*left center;[^}]*transition:\s*transform 180ms linear;/s);
  assert.match(css, /\.tower-card small \{[^}]*background:\s*rgba\(4, 20, 17, 0\.34\);/s);
  assert.doesNotMatch(narrowViewport, /\.tower-card strong \{[^}]*display:\s*none/);
  assert.match(mainSource, /waveProgress\.style\.transform = `scaleX\(/);
  assert.match(mainSource, /card\.setAttribute\("aria-pressed", String\(selected\)\)/);
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
  assert.match(css, /@media \(min-height: 800px\) and \(max-aspect-ratio: 47 \/ 100\) and \(max-width: 360px\) \{[\s\S]*?\.tower-card strong \{[^}]*display:\s*block;[^}]*font-size:\s*10px;/);
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

test("selected heroes reuse the stable controls height without a fifth build card", () => {
  assert.match(css, /\.hero-panel \{[^}]*min-height:\s*var\(--tower-controls-height\);[^}]*height:\s*100%;/s);
  assert.match(css, /\.hero-panel\[hidden\] \{ display:\s*none; \}/);
  assert.match(css, /\.hero-actions button \{[^}]*min-height:\s*44px;/s);
  assert.equal(html.match(/data-tower=/g)?.length, 4);
  assert.match(html, /id="hero-panel" class="hero-panel" hidden/);
});

test("the game menu keeps auxiliary actions reachable without reserving command-panel space", () => {
  const topActions = html.match(/<div class="top-actions">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const menuMarkup = elementMarkupById(html, "game-menu-overlay");

  assert.match(topActions, /id="game-menu-button"/);
  assert.match(topActions, /id="speed-button"/);
  if (/data-role="language"/.test(topActions)) {
    assert.match(topActions, /<(?:label|div)[^>]*(?:\bhidden\b|aria-hidden="true"|is-hidden)[^>]*>[\s\S]*data-role="language"/);
  }
  assert.match(menuMarkup, /data-role="language"/);
  assert.match(menuMarkup, /id="fullscreen-button"/);
  assert.match(menuMarkup, /id="tower-guide-button"/);
  assert.doesNotMatch(css, /\.build-panel\.has-fullscreen-control \.tower-deck/);
  assert.match(css, /\.guide-card \{[^}]*max-height:\s*100%;/s);
  assert.match(css, /\.guide-card \{[^}]*overflow-y:\s*auto;/s);
});

test("the game menu is a safe-area-aware bottom sheet that remains scrollable on mobile", () => {
  const overlayTag = html.match(/<div[^>]*id="game-menu-overlay"[^>]*>/)?.[0] ?? "";
  const menuLayer = css.match(/\.game-menu-layer \{([^}]*)\}/s)?.[1] ?? "";
  const menuCard = css.match(/\.game-menu-card \{([^}]*)\}/s)?.[1] ?? "";
  const shortViewport = css.match(/@media \(max-height: 519px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  assert.match(overlayTag, /class="[^"]*\bmodal-layer\b[^"]*\bgame-menu-layer\b[^"]*"/);
  assert.match(menuLayer, /(?:align-items|place-items):\s*(?:end|flex-end)/);
  assert.match(menuCard, /max-height:/);
  assert.match(menuCard, /overflow-y:\s*auto/);
  assert.match(menuCard, /overscroll-behavior:\s*contain/);
  assert.match(css, /\.modal-layer \{[^}]*env\(safe-area-inset-bottom\)[^}]*var\(--tg-safe-area-inset-bottom, 0px\)[^}]*var\(--tg-content-safe-area-inset-bottom, 0px\)[^}]*var\(--td-safe-area-inset-bottom\)[^}]*var\(--td-content-safe-area-inset-bottom\)/s);
  assert.match(shortViewport, /\.modal-layer \{ display:\s*block; overflow-y:\s*auto;/);
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
  assert.match(pulseButton, /position:\s*relative/);
  assert.match(css, /\.pulse-charges \{[^}]*position:\s*absolute;/s);
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
