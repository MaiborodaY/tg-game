import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import postcss from "postcss";

const themeSource = await readFile(new URL("../src/draft-card-theme.css", import.meta.url), "utf8");
const baseSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const theme = postcss.parse(themeSource);
const rules = [];
theme.walkRules((rule) => rules.push(rule));
const scope = ".stage--draft .draft-grid--triple";

test("the draft-card redesign only affects the three live offers, not collection or detail art", () => {
  assert.ok(rules.length > 0);
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      assert.ok(selector === scope || selector.startsWith(`${scope} `) || selector.startsWith(`${scope}.draft-grid--`), `Unscoped draft presentation: ${selector}`);
      assert.doesNotMatch(selector, /compendium|card-info|main-menu|field-slot|:root/);
    }
  }
  theme.walkAtRules((rule) => assert.equal(rule.name, "media", "No global font, animation or asset effects"));
});

test("three offers stay comparable on 320px and 390px viewports with independent touch drag handles", () => {
  const grid = declarationsFor(scope);
  const card = declarationsFor(`${scope} .unit-card`);
  const handle = declarationsFor(`${scope} .unit-card__drag-handle`);
  assert.equal(grid.get("grid-template-columns"), "repeat(3, minmax(0, 1fr))");
  assert.equal(card.get("touch-action"), "pan-y");
  assert.equal(handle.get("width"), "44px");
  assert.equal(handle.get("height"), "44px");
  assert.equal(handle.get("touch-action"), "none");
  assert.equal(handle.get("pointer-events"), "auto");
  assert.match(baseSource, /\.draft-grid--triple \.unit-card\s*\{[^}]*min-width:\s*0/s);
  for (const width of [320, 390]) {
    const gap = resolveClamp(grid.get("gap"), width);
    const cardWidth = (width - gap * 2) / 3;
    assert.ok(cardWidth >= 100, `${width}px viewport must retain three usable card columns`);
    assert.ok(cardWidth > parseFloat(handle.get("width")) * 2, "The drag handle cannot consume most of the card");
  }
});

test("name and ability typography have readable minimums with sufficient allocated line height", () => {
  const grid = declarationsFor(scope);
  const name = declarationsFor(`${scope} .unit-card__name`);
  const header = declarationsFor(`${scope} .unit-card__header`);
  const rarity = declarationsFor(`${scope} .unit-card__rarity`);
  const footer = declarationsFor(`${scope} .unit-card__footer`);
  const ability = declarationsFor(`${scope} .unit-card__ability`);
  const abilityText = declarationsFor(`${scope} .unit-card__ability-text`);
  assert.equal(name.get("font-size"), "var(--draft-card-name-size)");
  assert.equal(ability.get("font-size"), "var(--draft-card-ability-size)");
  assert.equal(footer.get("height"), "var(--draft-card-footer-height)");
  assert.equal(footer.get("grid-template-rows"), "28px minmax(0, 1fr)");

  for (const width of [320, 390, 430]) {
    const nameSize = resolveClamp(grid.get("--draft-card-name-size"), width);
    const abilitySize = resolveClamp(grid.get("--draft-card-ability-size"), width);
    assert.ok(nameSize >= 11.5, `Name text is too small at ${width}px`);
    assert.ok(abilitySize >= 10, `Ability text is too small at ${width}px`);
    const titleHeight = nameSize * Number(name.get("line-height")) * Number(name.get("-webkit-line-clamp"));
    const rarityHeight = parseFloat(rarity.get("font-size")) * Number(rarity.get("line-height"));
    assert.ok(titleHeight + rarityHeight + parseFloat(header.get("gap")) <= parseFloat(header.get("height")),
      "A three-line name and non-common rarity must fit before the tag row");

    const abilityHeight = abilitySize * Number(ability.get("line-height")) * Number(abilityText.get("-webkit-line-clamp"));
    const footerHeight = parseFloat(grid.get("--draft-card-footer-height"));
    const abilityPadding = parseFloat(ability.get("padding")) * 2;
    assert.ok(abilityHeight + abilityPadding <= footerHeight - 28 - parseFloat(footer.get("gap")),
      "All five declared ability lines must fit instead of silently clipping their bottom");
  }
});

test("art has its own bounded viewport and badges cannot cover the silhouette", () => {
  const body = declarationsFor(`${scope} .unit-card__body`);
  const art = declarationsFor(`${scope} .unit-card > .unit-card__body > .unit-card__art`);
  const sprite = declarationsFor(`${scope} .unit-card__sprite`);
  const forecast = declarationsFor(`${scope} .unit-card__synergy-forecast`);
  const status = declarationsFor(`${scope} .unit-card__board-status`);
  const footer = declarationsFor(`${scope} .unit-card__footer`);
  assert.equal(sprite.get("object-fit"), "contain");
  assert.equal(sprite.get("object-position"), "center");
  assert.equal(sprite.get("position"), "absolute");
  assert.equal(sprite.get("inset"), "0");
  assert.equal(sprite.get("width"), "100%");
  assert.equal(sprite.get("height"), "100%");
  assert.equal(sprite.get("min-height"), "0");
  assert.equal(art.get("display"), "block", "No intrinsic Grid row may grow behind the footer");
  assert.equal(art.get("position"), "relative");
  assert.equal(art.get("inset"), "auto");
  assert.equal(body.get("display"), "grid");
  assert.match(body.get("grid-template-rows"), /minmax\(56px, 1fr\)/);
  assert.equal(status.get("grid-row"), "3");
  assert.equal(art.get("grid-row"), "4");
  assert.equal(forecast.get("grid-row"), "5");
  assert.equal(footer.get("grid-row"), "6");
  assert.equal(status.get("position"), "static");
  assert.equal(forecast.get("position"), "static");
  assert.equal(footer.get("position"), "static");
  assert.equal(declarationsFor(`${scope} .unit-card__ability-icon`).get("display"), "none",
    "Redundant ability decoration must not steal a text column on narrow cards");
  assert.equal(declarationsFor(`${scope} .unit-card__stat-value`).get("font-size"), "13px");
});

test("the shortest card can hold both badge rows and a nonzero full-silhouette area", () => {
  const body = declarationsFor(`${scope} .unit-card__body`);
  const header = declarationsFor(`${scope} .unit-card__header`);
  const footer = declarationsFor(scope).get("--draft-card-footer-height");
  const status = declarationsFor(`${scope}.draft-grid--with-status`).get("--draft-card-status-height");
  const forecast = declarationsFor(`${scope}.draft-grid--with-forecast`).get("--draft-card-forecast-height");
  const padding = body.get("padding").split(" ").map(parseFloat);
  const occupied = 12 + padding[0] + padding[2] + parseFloat(header.get("height")) + 14 +
    parseFloat(status) + parseFloat(forecast) + parseFloat(footer) + 5 * parseFloat(body.get("gap"));
  assert.ok(330 - occupied >= 56, "Image space must not depend on hiding a status or ability");
  assert.match(mainSource, /body\.append\(createDraftCardBoardStatus/);
  assert.match(mainSource, /grid\.classList\.toggle\("draft-grid--with-forecast"/);
});

test("common rarity stays accessible while uncommon and rare labels remain visible", () => {
  const common = declarationsFor(`${scope} .unit-card__rarity--common`);
  assert.equal(common.get("clip-path"), "inset(50%)");
  assert.equal(common.get("position"), "absolute");
  assert.equal(common.get("width"), "1px");
  assert.equal(common.get("height"), "1px");
  assert.ok(!common.has("display") && !common.has("visibility"));
  assert.match(mainSource, /function createCardHeader[\s\S]*?header\.append\(createCardName\(card\), createCardRarity\(meta\)\)/);
  assert.match(mainSource, /rarity\.textContent = meta\.rarityLabel/);
  assert.equal(declarationsFor(`${scope} .unit-card__archetype`).get("background"),
    "var(--card-medallion-image) center / contain no-repeat");
});

function declarationsFor(selector) {
  const declarations = new Map();
  for (const rule of rules) {
    if (!rule.selectors.includes(selector)) continue;
    rule.walkDecls((declaration) => declarations.set(declaration.prop, declaration.value));
  }
  return declarations;
}

function resolveClamp(value, containerWidth) {
  const parts = value?.match(/^clamp\(([\d.]+)px, ([\d.]+)cqw, ([\d.]+)px\)$/);
  assert.ok(parts, `Expected a bounded container-relative value, got ${value}`);
  return Math.max(Number(parts[1]), Math.min(Number(parts[3]), Number(parts[2]) * containerWidth / 100));
}
