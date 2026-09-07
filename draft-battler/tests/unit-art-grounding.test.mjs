import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import { createBattleTimeline, resolveCombat } from "../src/game/index.ts";
import {
  BATTLE_UNIT_ART_GROUND_Y,
  DRAFT_UNIT_ART_GROUND_Y,
  UNIT_ART_ALPHA_THRESHOLD,
  getGroundedRangedAttackTiming,
  getGroundedUnitArtBounds,
  getGroundedUnitArtPlacement,
  hasGroundedProjectilePose,
} from "../src/unitArtGrounding.ts";

const groundedIds = [
  "battle_alchemist", "siege_engineer", "night_warden", "moon_priestess", "plague_rat",
  "phantom_duelist", "frost_wraith", "star_seer", "bronze_minotaur", "harpy_scout",
  "bone_archer", "rune_warden", "marsh_stalker", "ironhide_bear", "grave_bellringer",
  "forest_skirmisher", "crypt_keeper", "city_crossbowman", "smoke_trickster", "war_mastiff",
  "grave_raider", "soul_hunter", "headless_knight", "war_chaplain",
];
const sceneSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("grounding is explicitly restricted to the twenty-four redrawn units", () => {
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

test("redrawn units fit their visible box proportionally and touch the baseline", () => {
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

test("redrawn ranged units use projectile poses without changing ranges or melee lunges", () => {
  assert.deepEqual(CARD_DEFINITIONS.filter((card) => hasGroundedProjectilePose(card.id)).map((card) => card.id).sort(),
    ["battle_alchemist", "bone_archer", "city_crossbowman", "forest_skirmisher", "frost_wraith", "grave_bellringer", "harpy_scout", "marsh_stalker", "moon_priestess", "rune_warden", "siege_engineer", "smoke_trickster", "soul_hunter", "star_seer"]);
  assert.equal(CARD_DEFINITIONS.find((card) => card.id === "battle_alchemist").stats.range, 2);
  for (const cardId of ["frost_wraith", "star_seer", "harpy_scout", "bone_archer", "rune_warden", "forest_skirmisher", "city_crossbowman", "soul_hunter"]) {
    assert.equal(CARD_DEFINITIONS.find((card) => card.id === cardId).stats.range, 3, cardId);
  }
  for (const cardId of ["phantom_duelist", "bronze_minotaur", "ironhide_bear", "war_mastiff", "grave_raider", "headless_knight"]) {
    assert.equal(hasGroundedProjectilePose(cardId), false, cardId);
    assert.equal(CARD_DEFINITIONS.find((card) => card.id === cardId).stats.range, 1, cardId);
  }
  assert.match(sceneSource, /attacker\.sprite && hasGroundedProjectilePose\(attacker\.unit\.cardId\)/);
});

test("range-2 authored ranged poses attack in place while the chaplain keeps its melee lunge", () => {
  for (const cardId of ["marsh_stalker", "grave_bellringer", "smoke_trickster"]) {
    assert.equal(CARD_DEFINITIONS.find((card) => card.id === cardId).stats.range, 2, `${cardId}: preserve gameplay reach`);
    assert.equal(hasGroundedProjectilePose(cardId), true, `${cardId}: must bypass the melee lunge`);
    assert.deepEqual(getGroundedRangedAttackTiming(cardId, true), { windupMs: 90, recoveryMs: 125 });
  }
  assert.equal(CARD_DEFINITIONS.find((card) => card.id === "war_chaplain").stats.range, 2);
  assert.equal(hasGroundedProjectilePose("war_chaplain"), false, "The chaplain strikes with its scepter instead of casting");
  const attackMethod = sceneSource.slice(sceneSource.indexOf("private async playUnitAttack"), sceneSource.indexOf("private async playUnitBlock"));
  assert.match(attackMethod, /stats\.range >= 3 \|\| \(attacker\.sprite && hasGroundedProjectilePose\(attacker\.unit\.cardId\)\)\) \{\s*await this\.playRangedUnitAttack\(attacker, target, focusCamera\);\s*return;/);
  assert.match(attackMethod, /targets: attacker\.container,\s*x: strike\.x,\s*y: strike\.y,\s*duration: 115/);
  assert.match(attackMethod, /targets: attacker\.container,\s*x: start\.x,\s*y: start\.y,\s*duration: 130/);
});

test("the grounded war chaplain remains an offensive armor support rather than a healer", () => {
  const card = CARD_DEFINITIONS.find((entry) => entry.id === "war_chaplain");
  assert.equal(card.role, "support");
  assert.equal(card.abilityId, "thorn_guard");
  assert.equal(card.stats.range, 2);
  assert.ok(getGroundedUnitArtBounds(card.id));
  const chaplainId = "player-0-war_chaplain";
  const combat = resolveCombat(createBoard([card.id]), createBoard(["spear_recruit"]), 1);
  assert.ok(combat.events.some((event) => event.type === "unit_attacked" && event.attackerId === chaplainId));
  assert.ok(!combat.events.some((event) => event.type === "unit_healed" && event.source === chaplainId));
});

test("the crypt keeper keeps healing without attacks and plays its grounded cast on both timeline paths", () => {
  const card = CARD_DEFINITIONS.find((entry) => entry.id === "crypt_keeper");
  assert.equal(card.abilityId, "heal_only");
  assert.equal(card.stats.range, 2);
  assert.equal(hasGroundedProjectilePose(card.id), false, "Healing does not need an offensive projectile opt-in");
  assert.deepEqual(getGroundedRangedAttackTiming(card.id, true), { windupMs: 90, recoveryMs: 125 });
  const playerSlots = createBoard(["iron_guard", null, null, "crypt_keeper"]);
  const enemySlots = createBoard(["spear_recruit"]);
  const combat = resolveCombat(playerSlots, enemySlots, 1);
  const healerId = "player-3-crypt_keeper";
  assert.ok(combat.events.some((event) => event.type === "unit_healed" && event.source === healerId));
  assert.ok(!combat.events.some((event) => event.type === "unit_attacked" && event.attackerId === healerId));
  const timeline = createBattleTimeline({
    playerSlots, enemySlots, combat,
    playerCastleHpBefore: 20, playerCastleHpAfter: 20 - combat.playerCastleDamage,
    enemyCastleHpBefore: 20, enemyCastleHpAfter: 20 - combat.enemyCastleDamage,
  });
  const events = timeline.events.flatMap((event) => event.type === "combat_step" ? event.events : [event]);
  assert.ok(events.some((event) => event.type === "unit_heal" && event.sourceUnitId === healerId));
  assert.ok(!events.some((event) => event.type === "unit_attack" && event.attackerId === healerId));
  const healCastMethod = sceneSource.slice(sceneSource.indexOf("private async playCombatStepHealCast"), sceneSource.indexOf("private async playCombatStepResults"));
  assert.match(healCastMethod, /abilityId !== "heal_only"/);
  assert.match(healCastMethod, /await this\.playRangedUnitAttack\(source, view, false, "heal"\)/);
  assert.match(sceneSource, /abilityId === "heal_only"\) \{\s*await this\.playRangedUnitAttack\(source, view, focusCamera, "heal"\)/);
  assert.doesNotMatch(healCastMethod, /this\.tween|setPosition|\by:/);
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
  assert.match(groundedBranch, /await this\.delayCast\(groundedTiming\.windupMs, castSignal\)/);
  assert.match(groundedBranch, /this\.drawStrike\(/);
  assert.match(groundedBranch, /await this\.delayCast\(groundedTiming\.recoveryMs, castSignal\)/);
  assert.doesNotMatch(groundedBranch, /this\.tween|setPosition|\by:/);
  assert.match(rangedMethod, /y: startY - 5/);
  assert.match(rangedMethod, /this\.setUnitPose\(attacker, "idle", attackFacing\)/);
});

function approximatelyEqual(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);
}

function createBoard(cards) {
  return Array.from({ length: 6 }, (_, slotIndex) => ({
    slotIndex, cardId: cards[slotIndex] ?? null, upgradeLevel: 0,
  }));
}
