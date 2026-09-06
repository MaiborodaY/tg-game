import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import {
  BATTLE_UNIT_ART_GROUND_Y,
  DRAFT_UNIT_ART_GROUND_Y,
  UNIT_ART_ALPHA_THRESHOLD,
  getGroundedRangedAttackTiming,
  getGroundedUnitArtBounds,
  getGroundedUnitArtPlacement,
  hasGroundedProjectilePose,
} from "../src/unitArtGrounding.ts";

const groundedIds = ["battle_alchemist", "siege_engineer", "night_warden", "moon_priestess", "plague_rat"];
const sceneSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("grounding is explicitly restricted to the five redrawn units", () => {
  const optedIn = CARD_DEFINITIONS.filter((card) => getGroundedUnitArtBounds(card.id)).map((card) => card.id);
  assert.deepEqual(optedIn.sort(), [...groundedIds].sort());
  for (const card of CARD_DEFINITIONS.filter((card) => !groundedIds.includes(card.id))) {
    assert.equal(getGroundedUnitArtPlacement(card.id, 96, 108, DRAFT_UNIT_ART_GROUND_Y), undefined);
    assert.equal(getGroundedRangedAttackTiming(card.id, true), undefined);
    assert.equal(getGroundedRangedAttackTiming(card.id, false), undefined);
  }
});

test("grounding metadata matches the visible bounds of the actual runtime illustrations", async () => {
  for (const cardId of groundedIds) {
    const unitPath = fileURLToPath(new URL(`../src/assets/units/${cardId}/unit.webp`, import.meta.url));
    const { data, info } = await sharp(unitPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let left = info.width;
    let top = info.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        if (data[(y * info.width + x) * info.channels + 3] <= UNIT_ART_ALPHA_THRESHOLD) {
          continue;
        }
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    assert.deepEqual(getGroundedUnitArtBounds(cardId), {
      sourceWidth: info.width,
      sourceHeight: info.height,
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1,
    }, `${cardId}: refresh grounding metadata if its illustration changes`);
  }
});

test("humanoids, rat, and ballista fit their visible box proportionally and touch the baseline", () => {
  for (const cardId of groundedIds) {
    const bounds = getGroundedUnitArtBounds(cardId);
    for (const [maxWidth, maxHeight, groundY] of [[96, 108, DRAFT_UNIT_ART_GROUND_Y], [56, 68, BATTLE_UNIT_ART_GROUND_Y]]) {
      const placement = getGroundedUnitArtPlacement(cardId, maxWidth, maxHeight, groundY);
      const scale = placement.width / bounds.sourceWidth;
      approximatelyEqual(placement.height / bounds.sourceHeight, scale);
      approximatelyEqual(placement.x + (bounds.left + bounds.width / 2) * scale, 0);
      approximatelyEqual(placement.y + (bounds.top + bounds.height) * scale, groundY);
      assert.ok(bounds.width * scale <= maxWidth + 1e-9, `${cardId} visible width`);
      assert.ok(bounds.height * scale <= maxHeight + 1e-9, `${cardId} visible height`);
      assert.ok(placement.y + bounds.top * scale >= groundY - maxHeight - 1e-9, `${cardId} visible top`);
    }
  }
});

test("grounded geometry rejects invalid dimensions instead of emitting NaN transforms", () => {
  for (const values of [[0, 108, 107], [96, -1, 107], [NaN, 108, 107], [96, Infinity, 107], [96, 108, NaN]]) {
    assert.throws(() => getGroundedUnitArtPlacement("plague_rat", ...values), RangeError);
  }
});

test("grounded ranged poses preserve prior windup and total animation duration", () => {
  for (const cardId of groundedIds) {
    const atlasTiming = getGroundedRangedAttackTiming(cardId, true);
    const fallbackTiming = getGroundedRangedAttackTiming(cardId, false);
    assert.deepEqual(atlasTiming, { windupMs: 90, recoveryMs: 125 });
    assert.deepEqual(fallbackTiming, { windupMs: 90, recoveryMs: 90 });
    assert.equal(atlasTiming.windupMs + atlasTiming.recoveryMs, 90 + 70 + 55);
    assert.equal(fallbackTiming.windupMs + fallbackTiming.recoveryMs, 90 + 90);
  }
});

test("the alchemist throws from its existing short range while melee units keep lunging", () => {
  assert.deepEqual(CARD_DEFINITIONS.filter((card) => hasGroundedProjectilePose(card.id)).map((card) => card.id).sort(),
    ["battle_alchemist", "moon_priestess", "siege_engineer"]);
  assert.equal(CARD_DEFINITIONS.find((card) => card.id === "battle_alchemist").stats.range, 2);
  assert.match(sceneSource, /attacker\.sprite && hasGroundedProjectilePose\(attacker\.unit\.cardId\)/);
});

test("only opt-in draft art and fallback images use grounded placement without changing slot hitboxes", () => {
  assert.match(mainSource, /getGroundedUnitArtPlacement\(card\.id, 96, 108, DRAFT_UNIT_ART_GROUND_Y\)/);
  assert.match(mainSource, /if \(groundedArt\) \{\s*unit\.classList\.add\("field-unit--grounded"\)/);
  assert.match(styles, /\.field-unit--grounded \{\s*display: block;\s*pointer-events: none;/);
  assert.match(styles, /\.field-unit--grounded::after \{[\s\S]*?top: var\(--unit-ground-y\)/);
  assert.match(styles, /\.field-slot \{[^}]*width: 82px;\s*height: 108px;/);
  assert.match(sceneSource, /if \(groundedArt\) \{\s*sprite\.setOrigin\(0, 0\)\.setPosition\(groundedArt\.x, groundedArt\.y\)/);
});

test("grounded ranged attack uses its authored pose without jumping the sprite or shadow", () => {
  const rangedMethod = sceneSource.slice(sceneSource.indexOf("private async playRangedUnitAttack"), sceneSource.indexOf("private async playCastleAssault"));
  const groundedBranch = rangedMethod.match(/if \(groundedTiming\) \{([\s\S]*?)\} else if \(attacker\.sprite\)/)?.[1];
  assert.ok(groundedBranch);
  assert.match(rangedMethod, /this\.setUnitPose\(attacker, "attack", attackFacing\)/);
  assert.match(groundedBranch, /await this\.delay\(groundedTiming\.windupMs\)/);
  assert.match(groundedBranch, /this\.drawStrike\(/);
  assert.match(groundedBranch, /await this\.delay\(groundedTiming\.recoveryMs\)/);
  assert.doesNotMatch(groundedBranch, /this\.tween|setPosition|\by:/);
  assert.match(rangedMethod, /y: startY - 5/);
  assert.match(rangedMethod, /this\.setUnitPose\(attacker, "idle", attackFacing\)/);
});

function approximatelyEqual(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);
}
