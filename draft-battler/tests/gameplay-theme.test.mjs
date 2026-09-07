import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import postcss from "postcss";

const themeSource = await readFile(new URL("../src/gameplay-theme.css", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const theme = postcss.parse(themeSource);
const gameplayStages = new Set([".stage--draft", ".stage--battle", ".stage--finished"]);
const rules = [];
theme.walkRules((rule) => rules.push(rule));

test("the gameplay theme loads after the base stylesheet and cannot target the main menu", () => {
  assert.match(mainSource, /import\s+["']\.\/styles\.css["'];\s*import\s+["']\.\/gameplay-theme\.css["'];/);
  assert.match(mainSource, /stage\.className = `stage stage--\$\{uiState\.mode\}`/);
  assert.ok(rules.length > 0, "The theme must contain actual scoped presentation rules");
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      const scope = selector.match(/^:where\(([^)]+)\)(?:\s|$)/);
      assert.ok(scope, `Unscoped gameplay selector: ${selector}`);
      const stages = scope[1].split(",").map((stage) => stage.trim());
      assert.ok(stages.length > 0 && stages.every((stage) => gameplayStages.has(stage)), selector);
      assert.doesNotMatch(selector, /main-menu|:root|(?:^|[\s>+~])(?:html|body|#app)(?:[\s.:#]|\[|$)/, selector);
    }
  }
  theme.walkAtRules((rule) => {
    assert.ok(["media", "supports"].includes(rule.name), `Global side effect is not part of the gameplay theme: @${rule.name}`);
  });
});

test("ornamental filtering never dulls the complete card, unit art or readable text", () => {
  theme.walkDecls((declaration) => {
    if (declaration.prop === "filter") {
      for (const selector of subjectsFor(declaration.parent)) {
        assert.match(selector, /\.unit-card::before$/, `Only the decorative card background may be filtered: ${selector}`);
      }
    }
    if (declaration.prop === "opacity") {
      for (const selector of subjectsFor(declaration.parent)) {
        if (selector.endsWith(".unit-card::before")) continue;
        assert.doesNotMatch(selector, /\.(?:unit-card|field-unit|card-info-panel__art)(?:[\s.:#]|\[|$|__|--)/,
          `Opacity must not fade complete cards, their text or unit illustrations: ${selector}`);
      }
    }
  });
});

test("the visual theme preserves field-slot hitbox geometry and pointer behavior", () => {
  const geometry = /^(?:position|top|right|bottom|left|inset(?:-.+)?|(?:min-|max-)?(?:width|height|inline-size|block-size)|transform(?:-origin)?|translate|scale|rotate|pointer-events|touch-action|z-index|display|padding(?:-.+)?|margin(?:-.+)?|overflow(?:-.+)?)$/;
  theme.walkDecls((declaration) => {
    assert.doesNotMatch(declaration.prop, /^--(?:slot-|unit-ground-|safe-)/, "Visual tokens cannot change field or safe-area coordinates");
    if (!geometry.test(declaration.prop)) return;
    for (const selector of subjectsFor(declaration.parent)) {
      if (selector.includes("::before") || selector.includes("::after")) continue;
      assert.doesNotMatch(selector, /\.field-slots?(?:--[\w-]+)?(?=[\s.:#]|\[|$)/,
        `The theme cannot change ${declaration.prop} on a field hitbox: ${selector}`);
    }
  });
});

test("gameplay text, state colors and the primary action retain readable contrast", () => {
  const tokens = new Map();
  theme.walkDecls(/^--game-/, (declaration) => tokens.set(declaration.prop, declaration.value));
  const backgrounds = ["--game-surface", "--game-control"];
  const foregrounds = ["--game-text", "--game-muted", "--game-gold", "--game-danger", "--game-success"];
  for (const foreground of foregrounds) {
    for (const background of backgrounds) {
      const ratio = contrast(token(tokens, foreground), token(tokens, background));
      assert.ok(ratio >= 4.5, `${foreground} on ${background} must have at least 4.5:1 contrast, got ${ratio.toFixed(2)}`);
    }
  }
  const primary = declarationsFor((selector) => selector.endsWith(".primary-button"));
  assert.ok(primary.has("color"), "The primary action needs an explicit foreground");
  const primaryText = resolveColor(primary.get("color"), tokens);
  assert.ok(contrast(primaryText, token(tokens, "--game-gold")) >= 4.5,
    "The gold primary action must keep a high-contrast dark label");
  const primaryBackground = primary.get("background") ?? primary.get("background-color") ?? "";
  const primaryColors = primaryBackground.startsWith("linear-gradient(")
    ? [...primaryBackground.matchAll(/#[\da-f]{6}\b/gi)].map((match) => match[0])
    : [resolveColor(primaryBackground, tokens)];
  assert.ok(primaryColors.length > 0, "The primary background must define actual readable colors");
  for (const background of primaryColors) {
    assert.ok(contrast(primaryText, background) >= 4.5,
      `The primary action label must stay readable across its actual background ${background}`);
  }
});

test("long round statistics scroll within their own region while the next action remains outside", () => {
  const summary = declarationsFor((selector) => selector.endsWith(".round-result-summary"));
  assert.match(summary.get("max-height") ?? "", /^min\(\s*42dvh\s*,\s*340px\s*\)$/);
  assert.equal(summary.get("overflow-y"), "auto");
  const actionPanel = mainSource.match(/function createBattleActionPanel\(\)[\s\S]*?\n\}/)?.[0] ?? "";
  const summaryFactory = mainSource.match(/function createRoundResultSummary\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(actionPanel, /panel\.append\(createRoundResultSummary\(lastRound\)\)/);
  assert.match(actionPanel, /panel\.append\(createActionBar\(\)\)/);
  assert.doesNotMatch(summaryFactory, /createActionBar/);
  assert.match(summaryFactory, /summary\.tabIndex = 0/);
  assert.match(summaryFactory, /summary\.setAttribute\("aria-labelledby", "round-result-title"\)/);
  assert.match(summaryFactory, /title\.id = "round-result-title"/);
});

test("card details align content at the top without stretching tag rows", () => {
  const panel = declarationsFor((selector) => selector.endsWith(".card-info-panel"));
  const tags = declarationsFor((selector) => selector.endsWith(".card-info-panel__tags"));
  assert.equal(panel.get("align-content"), "start");
  assert.ok(["start", "flex-start"].includes(tags.get("align-items")));
});

function declarationsFor(matches) {
  const result = new Map();
  for (const rule of rules) {
    if (!subjectsFor(rule).some(matches)) continue;
    rule.walkDecls((declaration) => result.set(declaration.prop, declaration.value));
  }
  return result;
}

function subjectsFor(rule) {
  // PostCSS splits selector lists safely; expand the theme's trailing :is()
  // groups so grouped and individual rules enforce the same subject contract.
  return rule.selectors.flatMap((selector) => {
    const group = selector.match(/^(.*)\s+:is\(([\s\S]+)\)$/);
    return group
      ? postcss.list.comma(group[2]).map((subject) => `${group[1]} ${subject}`)
      : [selector];
  });
}

function token(tokens, name) {
  assert.ok(tokens.has(name), `Missing gameplay token ${name}`);
  return resolveColor(tokens.get(name), tokens);
}

function resolveColor(value, tokens) {
  const reference = value.match(/^var\((--game-[\w-]+)\)$/);
  const color = reference ? tokens.get(reference[1]) : value;
  assert.match(color ?? "", /^#[\da-f]{6}$/i, `Expected a solid six-digit theme color, got ${color}`);
  return color;
}

function contrast(first, second) {
  const luminance = (hex) => {
    const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}
